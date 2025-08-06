import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useI18n } from 'vue-i18n'
import { useConfigManager, type ManagedEngine } from './useConfigManager' // Import new types

export interface EngineLine {
  text: string
  kind: 'sent' | 'recv'
}

// Platform detection utility
// const isAndroid = () => { // Removed unused function
//   // Check multiple ways to detect Android platform
//   if (typeof window !== 'undefined') {
//     // Check Tauri platform if available
//     const tauriPlatform = (window as any).__TAURI__?.platform
//     if (tauriPlatform === 'android') return true

//     // Check user agent
//     if (navigator.userAgent.includes('Android')) return true
//     if (/Android/i.test(navigator.userAgent)) return true
//   }

//   return false
// }

// function dbg(tag: string, ...m: any[]) { // console.log('[UCI]', tag, ...m) }

export function useUciEngine(generateFen: () => string, gameState: any) {
  const { t } = useI18n()
  const engineOutput = ref<EngineLine[]>([])
  const isEngineLoaded = ref(false)
  const isEngineLoading = ref(false) // Add a new state for engine loading
  const currentEngine = ref<ManagedEngine | null>(null) // Store the currently loaded engine object
  const uciOkReceived = ref(false) // For validation
  const bestMove = ref('')
  const analysis = ref('')
  const isThinking = ref(false)
  const isStopping = ref(false) // Flag to indicate that analysis is being manually stopped
  const playOnStop = ref(false) // Flag to determine if the best move should be played after stopping
  const pvMoves = ref<string[]>([]) // Real-time PV
  // MultiPV: store moves for each PV index (0-based)
  const multiPvMoves = ref<string[][]>([])
  // Cache of analysis lines for each PV
  const analysisLines: string[] = []
  const uciOptionsText = ref('') // cache UCI options raw text
  const currentEnginePath = ref('') // current engine path
  const currentSearchMoves = ref<string[]>([]) // Current searchmoves restriction for variation analysis
  const analysisStartTime = ref<number | null>(null) // Track when analysis started
  const lastAnalysisTime = ref<number>(0) // Store the last analysis time

  // Ponder-related state
  const isPondering = ref(false) // Whether engine is currently pondering
  const isInfinitePondering = ref(false) // Whether engine is currently pondering with infinite search
  const ponderMove = ref('') // The move engine is pondering on
  const ponderhit = ref(false) // Whether the pondered move was actually played
  const ignoreNextBestMove = ref(false) // Skip first bestmove after ponder stop

  // Android-specific state
  const bundleIdentifier = ref('')

  // Throttling mechanism for engine output processing
  let outputThrottleTimer: number | null = null
  let pendingOutputLines: string[] = []
  let lastProcessedTime = 0
  const OUTPUT_THROTTLE_DELAY = 50 // Process output every 50ms maximum
  const MATE_OUTPUT_THROTTLE_DELAY = 300 // Slower processing for mate situations

  let unlisten: (() => void) | null = null

  /* ---------- Helper Functions ---------- */
  const isDarkPieceMove = (uciMove: string): boolean => {
    // A move is a "dark piece move" if the piece at the starting square is unknown.
    if (!uciMove || uciMove.length < 2) {
      // An invalid or empty move string cannot be a dark piece move.
      return false
    }

    // Parse the UCI string to get the LOGICAL "from" coordinates.
    const logicalFromCol = uciMove.charCodeAt(0) - 'a'.charCodeAt(0)
    const logicalFromRow = 9 - parseInt(uciMove[1], 10)

    // Convert these logical coordinates to the current DISPLAY coordinates.
    let displayFromRow = logicalFromRow
    let displayFromCol = logicalFromCol

    // Access the flip state directly from the injected gameState.
    if (gameState.isBoardFlipped.value) {
      // If the board is flipped, we must invert both row and column to find the piece on the screen.
      displayFromRow = 9 - logicalFromRow
      displayFromCol = 8 - logicalFromCol
    }

    // Find the piece at the calculated DISPLAY coordinates.
    const piece = gameState.pieces.value.find(
      (p: any) => p.row === displayFromRow && p.col === displayFromCol
    )

    // The move is a "dark piece move" if a piece exists at the location
    // and its 'isKnown' property is false.
    const result = !!piece && !piece.isKnown

    console.log(
      `[DEBUG] isDarkPieceMove Check: uci='${uciMove}', logical=(${logicalFromRow},${logicalFromCol}), isFlipped=${gameState.isBoardFlipped.value}, display=(${displayFromRow},${displayFromCol}), pieceFound=${!!piece}, isKnown=${piece?.isKnown}, result=${result}`
    )

    return result
  }

  /* ---------- Output Throttling Functions ---------- */
  // Check if current analysis contains mate score
  const hasMateScore = () => {
    return analysisLines.some(line => line.includes('score mate'))
  }

  // Get appropriate throttle delay based on analysis content
  const getThrottleDelay = () => {
    return hasMateScore() ? MATE_OUTPUT_THROTTLE_DELAY : OUTPUT_THROTTLE_DELAY
  }

  // Process pending output lines with throttling
  const processPendingOutput = () => {
    if (pendingOutputLines.length === 0) return

    const currentTime = Date.now()
    const throttleDelay = getThrottleDelay()

    // Check if enough time has passed since last processing
    if (currentTime - lastProcessedTime < throttleDelay) {
      // Schedule processing for later
      if (outputThrottleTimer) {
        clearTimeout(outputThrottleTimer)
      }
      outputThrottleTimer = setTimeout(
        processPendingOutput,
        throttleDelay - (currentTime - lastProcessedTime)
      )
      return
    }

    // Process all pending lines with parsing logic
    pendingOutputLines.forEach(raw_ln => {
      engineOutput.value.push({ text: raw_ln, kind: 'recv' })

      // Aggressive cleanup: limit engine output to prevent memory issues
      if (engineOutput.value.length > 1000) {
        console.log(
          '[DEBUG] UCI_ENGINE: Clearing engine output to prevent memory issues'
        )
        engineOutput.value = engineOutput.value.slice(-500) // Keep last 500 lines
      }

      const ln = raw_ln.trim()
      if (!ln) return // Ignore empty lines after trimming

      // -------- MultiPV parsing helpers --------
      const mpvMatch = ln.match(/\bmultipv\s+(\d+)/)
      const mpvIndex = mpvMatch ? parseInt(mpvMatch[1], 10) - 1 : 0 // 0-based index

      /* --- Extract PV (using indexOf is more robust than regex) --- */
      const idx = ln.indexOf(' pv ')
      if (idx !== -1) {
        const mvStr = ln.slice(idx + 4).trim() // 4 = ' pv '.length
        const movesArr = mvStr.split(/\s+/)
        // Update primary pvMoves for backward compatibility
        if (mpvIndex === 0) {
          pvMoves.value = movesArr
        }
        // Store into multiPvMoves with reactive update
        if (mpvIndex >= multiPvMoves.value.length) {
          // Append
          multiPvMoves.value.push(movesArr)
        } else {
          // Replace existing index to keep order
          multiPvMoves.value.splice(mpvIndex, 1, movesArr)
        }
      }
      // ------ Aggregate analysis lines (show all PVs) ------
      if (ln.startsWith('info') && ln.includes('score')) {
        analysisLines[mpvIndex] = ln
        // Join available lines by newline
        analysis.value = analysisLines.filter(Boolean).join('\n')
      }

      if (ln.startsWith('bestmove')) {
        const parts = ln.split(' ')
        const mv = parts[1] ?? ''
        // Check if engine provided a ponder move
        let ponderMoveFromEngine = ''
        const ponderIndex = parts.indexOf('ponder')
        if (ponderIndex !== -1 && ponderIndex + 1 < parts.length) {
          ponderMoveFromEngine = parts[ponderIndex + 1]
        }

        console.log(
          `[DEBUG] BESTMOVE_RECEIVED: '${mv}' ponder='${ponderMoveFromEngine}'. isThinking=${isThinking.value}, isStopping=${isStopping.value}.`
        )

        // Refactored logic to handle stop confirmation as the highest priority.
        // This solves the race condition where 'ignoreNextBestMove' caused an early return,
        // leaving 'isStopping' permanently true.
        if (isStopping.value) {
          console.log(
            `[DEBUG] STOP_CONFIRMED: Engine acknowledged stop command.`
          )
          isThinking.value = false
          isStopping.value = false // Reset the lock first.

          if (ignoreNextBestMove.value) {
            // This was a ponder miss, so we discard the move value.
            console.log(
              `[DEBUG] BESTMOVE_IGNORED_ON_PONDER_STOP: The received bestmove value ('${mv}') will be discarded.`
            )
            ignoreNextBestMove.value = false // Reset the flag for next time.
            bestMove.value = ''
          } else if (playOnStop.value) {
            // This was a "Move Now" command.
            console.log(
              `[DEBUG] BESTMOVE_PROCESSED_ON_STOP: Setting bestMove to '${mv}'.`
            )
            bestMove.value = mv
          } else {
            // This was a simple cancellation.
            bestMove.value = ''
          }

          playOnStop.value = false // Always reset this.

          nextTick(() => {
            window.dispatchEvent(new CustomEvent('engine-stopped-and-ready'))
          })
          return // This bestmove has been fully handled.
        }

        // If we are not in a thinking state and not pondering, this is a stray bestmove from a previous,
        // already-terminated process. It must be ignored.
        if (!isThinking.value && !isPondering.value) {
          console.log(
            `[DEBUG] BESTMOVE_IGNORED: Stray move received while not in a 'thinking' or 'pondering' state.`
          )
          return
        }

        // If we're pondering and receive a bestmove, this means the ponder was stopped
        if (isPondering.value) {
          console.log(
            `[DEBUG] PONDER_STOPPED: Received bestmove while pondering, ponder session ended`
          )
          isPondering.value = false
          isInfinitePondering.value = false // Reset infinite pondering flag

          ponderhit.value = false
          return
        }

        // If we reach here, it's a legitimate bestmove from a completed analysis.
        isThinking.value = false
        // Save the analysis time before resetting
        const analysisTime = analysisStartTime.value
          ? Date.now() - analysisStartTime.value
          : 0
        lastAnalysisTime.value = analysisTime // Store the analysis time
        console.log(
          `[DEBUG] BESTMOVE_PROCESSED: '${mv}'. Analysis stopped. Analysis time: ${analysisTime}ms`
        )
        analysisStartTime.value = null // Reset analysis start time

        // Check if it's a checkmate situation (none) - use trim() to remove possible spaces
        const trimmedMv = mv.trim()
        if (trimmedMv === '(none)' || trimmedMv === 'none') {
          analysis.value = t('uci.checkmate')
          send('stop')
        } else {
          analysis.value = mv
            ? t('uci.bestMove', { move: mv })
            : t('uci.noMoves')
        }

        bestMove.value = mv // Set bestMove

        // Store ponder move if provided by engine
        if (ponderMoveFromEngine) {
          ponderMove.value = ponderMoveFromEngine
          console.log(`[DEBUG] PONDER_MOVE_SET: '${ponderMoveFromEngine}'`)
        } else {
          ponderMove.value = ''
        }

        pvMoves.value = []
        multiPvMoves.value = []
        // Clear analysis lines array when analysis completes
        analysisLines.length = 0
        isInfinitePondering.value = false // Reset infinite pondering flag when analysis completes
      }
      if (ln === 'uciok') send('isready')
      if (ln === 'readyok') analysis.value = t('uci.engineReady')

      // record UCI options
      if (ln.startsWith('option name ')) {
        uciOptionsText.value += ln + '\n'
      }
    })

    pendingOutputLines = []
    lastProcessedTime = currentTime
    outputThrottleTimer = null
  }

  // Add line to pending output queue
  const queueOutputLine = (line: string) => {
    pendingOutputLines.push(line)

    // If no timer is running, start processing
    if (!outputThrottleTimer) {
      outputThrottleTimer = setTimeout(processPendingOutput, getThrottleDelay())
    }
  }

  // Clear throttling state when analysis starts/stops
  const resetThrottling = () => {
    if (outputThrottleTimer) {
      clearTimeout(outputThrottleTimer)
      outputThrottleTimer = null
    }
    pendingOutputLines = []
    lastProcessedTime = 0
  }

  /* ---------- Engine Loading and Validation ---------- */

  // This function is now the single point of entry for loading an engine
  const loadEngine = async (engine: ManagedEngine) => {
    if (isEngineLoading.value) return
    isEngineLoading.value = true
    isEngineLoaded.value = false
    currentEngine.value = null
    engineOutput.value = [] // Clear log
    uciOptionsText.value = '' // Clear UCI options text to prevent duplication

    // Teardown previous engine if any
    if (isThinking.value) stopAnalysis({ playBestMoveOnStop: false })
    if (isPondering.value) stopPonder({ playBestMoveOnStop: false })
    await invoke('kill_engine').catch(e =>
      console.warn('Failed to kill previous engine:', e)
    )

    // Prepare for validation
    uciOkReceived.value = false
    const validationTimeout = 5000 // 5 seconds

    // A promise that resolves when 'uciok' is received
    const uciOkPromise = new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new Error(
            `Validation timeout: No 'uciok' received within ${validationTimeout}ms.`
          )
        )
      }, validationTimeout)

      // Listen specifically for the uciok signal
      listen<string>('engine-output', event => {
        if (event.payload.trim() === 'uciok') {
          console.log(
            `[DEBUG] Received uciok for ${engine.name}. Validation successful.`
          )
          uciOkReceived.value = true
          clearTimeout(timeoutId)
          resolve()
        }
      }).then(unsub => {
        // When the promise resolves or rejects, we'll stop listening
        const cleanup = () => unsub()
        uciOkPromise.finally(cleanup)
      })
    })

    try {
      // Spawn engine process
      console.log(
        `[DEBUG] Spawning engine: ${engine.name}, Path: ${engine.path}, Args: ${engine.args}`
      )
      await invoke('spawn_engine', {
        path: engine.path,
        args: engine.args.split(' ').filter(Boolean),
      })

      // Send 'uci' to start validation
      send('uci')

      // Wait for validation to complete or time out
      await uciOkPromise

      // If we reach here, engine is valid
      currentEngine.value = engine
      analysis.value = t('uci.engineReady')

      const configManager = useConfigManager()
      await configManager.saveLastSelectedEngineId(engine.id)

      // Automatically apply saved configuration after engine loads
      setTimeout(async () => {
        await applySavedSettings()
        // Mark engine as loaded after all setoption commands have been sent
        isEngineLoaded.value = true
      }, 100)
    } catch (e: any) {
      console.error(
        `Failed to load or validate engine ${engine.name}:`,
        e.message || e
      )
      alert(
        t('errors.engineLoadFailed', {
          name: engine.name,
          error: e.message || e,
        })
      )
      isEngineLoaded.value = false
      // Clear the last selected engine ID if loading fails
      const configManager = useConfigManager()
      await configManager.clearLastSelectedEngineId()
      await invoke('kill_engine').catch(err =>
        console.warn('Failed to kill invalid engine:', err)
      )
    } finally {
      isEngineLoading.value = false
    }
  }

  const autoLoadLastEngine = async () => {
    // Check if we're in match mode - if so, don't auto-load UCI engine
    const matchMode = (window as any).__MATCH_MODE__
    if (matchMode) {
      console.log(
        '[DEBUG] UCI Auto-loading: Skipping because match mode is enabled'
      )
      return
    }

    const configManager = useConfigManager()
    await configManager.loadConfig()
    const lastEngineId = configManager.getLastSelectedEngineId()
    if (lastEngineId) {
      const engines = configManager.getEngines()
      console.log(
        `[DEBUG] Auto-loading: Found last engine ID: ${lastEngineId}, Available engines: ${engines.length}`
      )
      const engineToLoad = engines.find(e => e.id === lastEngineId)
      if (engineToLoad) {
        console.log(
          `[DEBUG] Auto-loading last used engine: ${engineToLoad.name}`
        )
        await loadEngine(engineToLoad)
      } else {
        console.log(
          `[DEBUG] Auto-loading: Last selected engine (${lastEngineId}) not found in engine list`
        )
        // Clear the invalid last selected engine ID
        await configManager.clearLastSelectedEngineId()
      }
    } else {
      console.log(`[DEBUG] Auto-loading: No last selected engine ID found`)
    }
  }

  /* ---------- Android Engine Path Management ---------- */
  // const getBundleIdentifier = async () => { // Removed unused function
  //   if (!isAndroidPlatform.value) return ''

  //   try {
  //     const identifier = await invoke<string>('get_bundle_identifier')
  //     bundleIdentifier.value = identifier
  //     return identifier
  //   } catch (error) {
  //     console.error('Failed to get bundle identifier:', error)
  //     return ''
  //   }
  // }

  // const getAndroidEnginePath = async () => { // Removed unused function
  //   if (!isAndroidPlatform.value) return ''

  //   try {
  //     const path = await invoke<string>('get_default_android_engine_path')
  //     androidEnginePath.value = path
  //     return path
  //   } catch (error) {
  //     console.error('Failed to get Android engine path:', error)
  //     return ''
  //   }
  // }

  // const scanAndroidEngines = async () => { // Removed unused function
  //   if (!isAndroidPlatform.value) return []

  //   try {
  //     const engines = await invoke<string[]>('scan_android_engines')
  //     return engines
  //   } catch (error) {
  //     console.error('Failed to scan Android engines:', error)
  //     return []
  //   }
  // }

  /* ---------- Basic Send ---------- */
  const send = (cmd: string) => {
    // No longer check isEngineLoaded, as we need to send 'uci' before it's true
    engineOutput.value.push({ text: cmd, kind: 'sent' })

    // Clear analysis lines when MultiPV setting changes to prevent stale data
    if (cmd.startsWith('setoption name MultiPV value ')) {
      analysisLines.length = 0
      multiPvMoves.value = []
      analysis.value = ''
      console.log(
        `[DEBUG] UCI_OPTION_CHANGE: Cleared analysis lines for MultiPV change`
      )
    }

    invoke('send_to_engine', { command: cmd }).catch(e => {
      // Don't alert here, it can be noisy during initial load failure
      console.warn('Failed to send to engine:', e)
    })
  }

  /* ---------- Start Analysis ---------- */
  // New param baseFen: specifies the FEN for the starting position (before executing moves).
  // If not provided, it defaults to the FEN of the current position generated by generateFen().
  // New param searchmoves: specifies which moves to search (for variation analysis)
  const startAnalysis = (
    settings: any = {},
    moves: string[] = [],
    baseFen: string | null = null,
    searchmoves: string[] = []
  ) => {
    if (!isEngineLoaded.value || isThinking.value) return

    isThinking.value = true
    isStopping.value = false // Reset stopping flag on new analysis
    playOnStop.value = false // Reset play-on-stop flag
    isInfinitePondering.value = false // Reset infinite pondering flag on new analysis
    analysisStartTime.value = Date.now() // Record analysis start time
    console.log(
      '[DEBUG] START_ANALYSIS: Started analysis at:',
      analysisStartTime.value
    )

    // Reset throttling state for new analysis
    resetThrottling()

    // Clear analysis lines and multiPvMoves for new analysis
    analysisLines.length = 0
    multiPvMoves.value = []
    analysis.value = ''

    // Save current searchmoves for reuse in analysis restarts
    currentSearchMoves.value = [...searchmoves]

    // Use generateFenForEngine to ensure correct format for engine communication
    const fenToUse = gameState.generateFenForEngine
      ? gameState.generateFenForEngine(baseFen)
      : (baseFen ?? generateFen())
    console.log(
      `[DEBUG] START_ANALYSIS: FEN=${fenToUse}, Moves=${moves.join(' ')}, SearchMoves=${searchmoves.join(' ')}`
    )
    console.log(
      `[DEBUG] START_ANALYSIS: SearchMoves array length=${searchmoves.length}, content=`,
      searchmoves
    )

    // Default settings
    const defaultSettings = {
      movetime: 1000,
      maxThinkTime: 5000,
      maxDepth: 20,
      maxNodes: 1000000,
      analysisMode: 'movetime',
    }

    const finalSettings = { ...defaultSettings, ...settings }
    console.log(`[DEBUG] START_ANALYSIS: Final settings=`, finalSettings)

    // Use baseFen if provided, otherwise use the FEN of the current position.
    const pos = `position fen ${fenToUse}${moves.length ? ' moves ' + moves.join(' ') : ''}`
    console.log(`[DEBUG] START_ANALYSIS: Position command: ${pos}`)

    send(pos)

    // Send different go commands based on analysis mode, with optional searchmoves restriction
    const searchMovesStr =
      searchmoves.length > 0 ? ` searchmoves ${searchmoves.join(' ')}` : ''
    console.log(
      `[DEBUG] START_ANALYSIS: SearchMoves string='${searchMovesStr}'`
    )

    let goCommand = ''
    switch (finalSettings.analysisMode) {
      case 'depth':
        goCommand = `go depth ${finalSettings.maxDepth}${searchMovesStr}`
        break
      case 'nodes':
        goCommand = `go nodes ${finalSettings.maxNodes}${searchMovesStr}`
        break
      case 'maxThinkTime':
        if (finalSettings.maxThinkTime > 0) {
          goCommand = `go wtime ${finalSettings.maxThinkTime} btime ${finalSettings.maxThinkTime} movestogo 1${searchMovesStr}`
        } else {
          goCommand = `go infinite${searchMovesStr}`
        }
        break
      case 'movetime':
      default:
        if (finalSettings.movetime > 0) {
          goCommand = `go movetime ${finalSettings.movetime}${searchMovesStr}`
        } else {
          goCommand = `go infinite${searchMovesStr}`
        }
        break
    }
    console.log(`[DEBUG] START_ANALYSIS: Go command: ${goCommand}`)
    send(goCommand)
  }

  /* ---------- Stop Analysis ---------- */
  const stopAnalysis = (
    options: { playBestMoveOnStop: boolean } = { playBestMoveOnStop: false }
  ) => {
    // Do not set isThinking to false here.
    // The thinking process only truly ends when the engine sends a 'bestmove' response.
    // We set a flag to indicate that we are waiting for this confirmation.
    if (!isEngineLoaded.value || !isThinking.value || isStopping.value) return

    console.log(
      `[DEBUG] STOP_ANALYSIS: Sending 'stop'. playBestMoveOnStop=${options.playBestMoveOnStop}`
    )
    isStopping.value = true // Set flag to indicate we are waiting for a stop confirmation
    playOnStop.value = options.playBestMoveOnStop // Set flag for how to handle the resulting bestmove
    isInfinitePondering.value = false // Reset infinite pondering flag when stopping analysis

    // Reset throttling state when stopping analysis
    resetThrottling()

    send('stop')
  }

  /* ---------- Clear Search Moves ---------- */
  const clearSearchMoves = () => {
    currentSearchMoves.value = []
    console.log(`[DEBUG] CLEAR_SEARCH_MOVES: Cleared searchmoves restrictions`)
  }

  /* ---------- Ponder Functions ---------- */
  // Start pondering on the expected opponent move
  const startPonder = (
    fen: string,
    moves: string[],
    expectedMove: string,
    settings: any = {}
  ) => {
    isInfinitePondering.value = false // Reset infinite pondering flag when starting ponder
    if (!isEngineLoaded.value || isPondering.value) return

    // Convert FEN to the correct format for engine communication
    const fenForEngine = gameState.generateFenForEngine
      ? gameState.generateFenForEngine(fen)
      : fen

    const moveToPonder = expectedMove || ponderMove.value
    console.log(
      `[DEBUG] START_PONDER: expectedMove='${expectedMove}', ponderMove.value='${ponderMove.value}', moveToPonder='${moveToPonder}'`
    )

    if (!isDarkPieceMove(moveToPonder) && moveToPonder) {
      console.log(
        `[DEBUG] START_PONDER: Starting ponder on move '${expectedMove}' with moves [${moves.join(' ')}]`
      )
      isPondering.value = true
      ponderhit.value = false

      // Set position with all moves including the expected ponder move
      const allMoves = [...moves, expectedMove]
      const pos = `position fen ${fenForEngine}${allMoves.length ? ' moves ' + allMoves.join(' ') : ''}`
      send(pos)

      // Start pondering with analysis settings (time, depth, nodes limits)
      const defaultSettings = {
        movetime: 1000,
        maxThinkTime: 5000,
        maxDepth: 20,
        maxNodes: 1000000,
        analysisMode: 'movetime',
      }
      const finalSettings = { ...defaultSettings, ...settings }

      let goCommand = 'go ponder'
      switch (finalSettings.analysisMode) {
        case 'depth':
          goCommand = `go ponder depth ${finalSettings.maxDepth}`
          break
        case 'nodes':
          goCommand = `go ponder nodes ${finalSettings.maxNodes}`
          break
        case 'maxThinkTime':
          if (finalSettings.maxThinkTime > 0) {
            goCommand = `go ponder wtime ${finalSettings.maxThinkTime} btime ${finalSettings.maxThinkTime} movestogo 1`
          } else {
            goCommand = `go ponder infinite`
          }
          break
        case 'movetime':
        default:
          if (finalSettings.movetime > 0) {
            goCommand = `go ponder movetime ${finalSettings.movetime}`
          } else {
            goCommand = `go ponder infinite`
          }
          break
      }
      console.log(`[DEBUG] START_PONDER: Go command: ${goCommand}`)
      send(goCommand)
    } else {
      // If the move is a dark piece move, we need to start pondering with infinite search
      isInfinitePondering.value = true
      isPondering.value = true
      const pos = `position fen ${fenForEngine}${moves.length ? ' moves ' + moves.join(' ') : ''}`
      send(pos)
      // Output the reason why we are using infinite ponder
      if (isDarkPieceMove(expectedMove)) {
        console.log(
          `[DEBUG] START_PONDER: Using infinite ponder because the move is a dark piece move: ${expectedMove}`
        )
      } else {
        console.log(
          `[DEBUG] START_PONDER: Using infinite ponder because the move is not a dark piece move: ${expectedMove}`
        )
      }
      send('go infinite')
    }
  }

  // Handle ponder hit - the expected move was actually played
  const handlePonderHit = () => {
    if (!isPondering.value) return

    console.log(
      `[DEBUG] PONDER_HIT: Confirming ponder hit, switching to thinking state.`
    )
    ponderhit.value = true
    isInfinitePondering.value = false // Reset infinite pondering flag when ponder hit occurs

    // After ponderhit, the engine transitions from "pondering" to "thinking"
    isPondering.value = false
    isThinking.value = true

    // Also record the time when ponder hit happened, as this is when the "real" search begins.
    analysisStartTime.value = Date.now()

    send('ponderhit')
  }

  // Stop pondering - the opponent played a different move
  const stopPonder = (options: { playBestMoveOnStop?: boolean } = {}) => {
    if (!isPondering.value) return

    const { playBestMoveOnStop = false } = options

    console.log(
      `[DEBUG] STOP_PONDER: Stopping ponder, playBestMoveOnStop=${playBestMoveOnStop}`
    )
    isPondering.value = false
    isStopping.value = true
    isInfinitePondering.value = false // Reset infinite pondering flag

    // Handle ponderhit scenario differently
    if (ponderhit.value && playBestMoveOnStop) {
      console.log(
        `[DEBUG] STOP_PONDER: Ponder hit scenario with playBestMoveOnStop=true`
      )
      // In ponder hit scenario, we want to play the best move when it arrives
      // Don't ignore the next bestmove, and don't clear bestMove
      ignoreNextBestMove.value = false
      // Set flag similar to stopAnalysis to play move when bestmove arrives
      playOnStop.value = true
    } else {
      // Regular ponder stop - ignore the bestmove response
      ignoreNextBestMove.value = true
      // Clear any pending best move to avoid accidental auto-play after ponder stop
      bestMove.value = ''
      playOnStop.value = false
    }

    ponderhit.value = false
    ponderMove.value = ''

    send('stop')
  }

  // Check if a move matches the current ponder move (for JieQi special logic)
  const isPonderMoveMatch = (actualMove: string): boolean => {
    if (!ponderMove.value) return false

    // For JieQi: if the move involves a dark piece, it's always a ponder miss
    // Dark pieces are indicated by lowercase letters in the piece names
    // We need to check if the source position contains a dark piece
    console.log(
      `[DEBUG] PONDER_MATCH_CHECK: Comparing actual='${actualMove}' with ponder='${ponderMove.value}'`
    )

    // Simple string comparison for now
    // In JieQi, we'll need additional logic to detect dark piece moves
    return actualMove === ponderMove.value
  }

  /* ---------- Unload Engine ---------- */
  const unloadEngine = async () => {
    if (!isEngineLoaded.value) return

    console.log('[DEBUG] UNLOAD_ENGINE: Unloading current engine')

    // Stop any ongoing analysis or pondering
    if (isThinking.value) {
      stopAnalysis({ playBestMoveOnStop: false })
    }
    if (isPondering.value) {
      stopPonder({ playBestMoveOnStop: false })
    }

    // Send quit command to gracefully terminate the engine
    try {
      send('quit')
      console.log('[DEBUG] UNLOAD_ENGINE: Sent quit command to engine')

      // Wait a bit for the engine to process the quit command
      await new Promise(resolve => setTimeout(resolve, 100))

      // As a fallback, also kill the engine process
      await invoke('kill_engine')
      console.log(
        '[DEBUG] UNLOAD_ENGINE: Engine process terminated successfully'
      )
    } catch (error) {
      console.error(
        '[DEBUG] UNLOAD_ENGINE: Failed to terminate engine process:',
        error
      )
    }

    // Reset all engine-related state
    isEngineLoaded.value = false
    isEngineLoading.value = false
    currentEngine.value = null
    isThinking.value = false
    isPondering.value = false
    isInfinitePondering.value = false
    bestMove.value = ''
    analysis.value = ''
    engineOutput.value = []
    pvMoves.value = []
    multiPvMoves.value = []
    // Clear analysis lines array
    analysisLines.length = 0
    ponderMove.value = ''
    ponderhit.value = false
    isStopping.value = false
    playOnStop.value = false
    ignoreNextBestMove.value = false
    analysisStartTime.value = null
    lastAnalysisTime.value = 0
    currentSearchMoves.value = []
    uciOptionsText.value = ''
    currentEnginePath.value = ''

    // Clear the last selected engine ID from config
    const configManager = useConfigManager()
    await configManager.clearLastSelectedEngineId()

    console.log('[DEBUG] UNLOAD_ENGINE: Engine state reset completed')
  }

  /* ---------- Apply Saved Settings ---------- */
  const applySavedSettings = async () => {
    // Only check currentEngine.value, not isEngineLoaded.value
    // During engine loading, isEngineLoaded is false but engine is ready for commands
    if (!currentEngine.value) return

    try {
      const configManager = useConfigManager()
      await configManager.loadConfig()

      // Use the engine's unique ID for settings
      const savedUciOptions = configManager.getUciOptions(
        currentEngine.value.id
      )

      if (Object.keys(savedUciOptions).length === 0) return

      Object.entries(savedUciOptions).forEach(([name, value]) => {
        const command = `setoption name ${name} value ${value}`
        send(command)
      })
    } catch (error) {
      console.error('Failed to apply saved settings:', error)
    }
  }

  /* ---------- Listen to Output ---------- */
  onMounted(async () => {
    // Central listener for all engine output for logging/display
    unlisten = await listen<string>('engine-output', ev => {
      const raw_ln = ev.payload
      console.log(`[DEBUG] ENGINE_RAW_OUTPUT: ${raw_ln}`)
      queueOutputLine(raw_ln)
    })

    // Check if engine list is empty and clear last selected engine ID if needed
    const configManager = useConfigManager()
    await configManager.loadConfig()
    const engines = configManager.getEngines()
    if (engines.length === 0) {
      console.log(
        `[DEBUG] useUciEngine: Engine list is empty on mount, clearing last selected engine ID`
      )
      await configManager.clearLastSelectedEngineId()
    }

    // Auto-load engine on startup only if not in match mode
    // In match mode, JAI engine should be loaded instead
    const isMatchMode = (window as any).__MATCH_MODE__ || false
    if (!isMatchMode) {
      autoLoadLastEngine()
    } else {
      console.log('[DEBUG] useUciEngine: Skipping auto-load in match mode')
    }

    // Listen for match mode changes
    window.addEventListener('match-mode-changed', (event: Event) => {
      const customEvent = event as CustomEvent
      const newMatchMode = customEvent.detail?.isMatchMode || false
      console.log('[DEBUG] useUciEngine: Match mode changed to:', newMatchMode)

      if (newMatchMode) {
        // Entering match mode - unload UCI engine
        if (isEngineLoaded.value) {
          console.log(
            '[DEBUG] useUciEngine: Unloading UCI engine for match mode'
          )
          unloadEngine()
        }
      } else {
        // Exiting match mode - auto-load UCI engine
        if (!isEngineLoaded.value) {
          console.log(
            '[DEBUG] useUciEngine: Auto-loading UCI engine after exiting match mode'
          )
          autoLoadLastEngine()
        }
      }
    })
  })
  onUnmounted(() => {
    unlisten?.()
    invoke('kill_engine') // Kill engine on component unmount
    resetThrottling()
  })

  return {
    engineOutput,
    isEngineLoaded,
    isEngineLoading,
    bestMove,
    analysis,
    isThinking,
    isStopping,
    pvMoves,
    multiPvMoves,
    loadEngine,
    unloadEngine,
    startAnalysis,
    stopAnalysis,
    uciOptionsText,
    send,
    currentEnginePath,
    applySavedSettings,
    currentSearchMoves,
    clearSearchMoves,
    bundleIdentifier,
    analysisStartTime,
    lastAnalysisTime,
    // Ponder exports
    isPondering,
    isInfinitePondering,
    ponderMove,
    ponderhit,
    startPonder,
    handlePonderHit,
    stopPonder,
    isPonderMoveMatch,
    // Helper functions
    isDarkPieceMove,
    currentEngine,
  }
}
