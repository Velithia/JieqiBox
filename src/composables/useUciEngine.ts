import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useI18n } from 'vue-i18n'
import { useConfigManager, type ManagedEngine } from './useConfigManager' // Import new types
import { useInterfaceSettings } from './useInterfaceSettings'
import { useSoundEffects } from './useSoundEffects'
import { uciToChineseMoves } from '@/utils/chineseNotation'
import {
  evaluateAdvancedScript,
  type PrevContext,
} from '@/utils/advancedScriptInterpreter'

export interface EngineLine {
  text: string
  kind: 'sent' | 'recv'
}

export function useUciEngine(generateFen: () => string, gameState: any) {
  const { t } = useI18n()
  const { useNewFenFormat, validationTimeout } = useInterfaceSettings()
  const { playSoundLoop, stopSoundLoop } = useSoundEffects()
  const { convertFenFormat } = gameState
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
  // Persist analysis-time context for consumers (e.g., UI) to render PV against the exact position analyzed
  const analysisBaseFen = ref<string>('')
  const analysisPrefixMoves = ref<string[]>([])
  // UI-friendly FEN (Jieqi FEN) captured at analysis start, independent of engine FEN formatting
  const analysisUiFen = ref<string>('')
  // Cache of analysis lines for each PV
  const analysisLines: string[] = []
  const uciOptionsText = ref('') // cache UCI options raw text
  const currentEnginePath = ref('') // current engine path
  const currentSearchMoves = ref<string[]>([]) // Current searchmoves restriction for variation analysis
  const analysisStartTime = ref<number | null>(null) // Track when analysis started
  const lastAnalysisTime = ref<number>(0) // Store the last analysis time
  const lastRequestedLimits = ref<{
    movetime?: number
    depth?: number
    nodes?: number
    maxThinkTime?: number
  }>({})

  // Ponder-related state
  const isPondering = ref(false) // Whether engine is currently pondering
  const isInfinitePondering = ref(false) // Whether engine is currently pondering with infinite search
  const ponderMove = ref('') // The move engine is pondering on
  const ponderhit = ref(false) // Whether the pondered move was actually played
  const ignoreNextBestMove = ref(false) // Skip first bestmove after ponder stop

  // Android-specific state
  const bundleIdentifier = ref('')

  // Chinese notation setting
  const showChineseNotation = ref(false)

  // Throttling mechanism for engine output processing
  let outputThrottleTimer: ReturnType<typeof setTimeout> | null = null
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
          if (showChineseNotation && mv) {
            try {
              // Use the current FEN to convert the best move to Chinese notation
              let rootFen = generateFen()
              // Convert FEN to new format if necessary (Chinese notation parser requires new format)
              if (!useNewFenFormat.value) {
                rootFen = convertFenFormat(rootFen, 'new')
              }
              const chineseMoves = uciToChineseMoves(rootFen, mv)
              const chineseMove = chineseMoves[0] || mv
              analysis.value = t('uci.bestMove', { move: chineseMove })
            } catch (error) {
              console.warn(
                'Failed to convert best move to Chinese notation:',
                error
              )
              // Fallback to original UCI move if conversion fails
              analysis.value = t('uci.bestMove', { move: mv })
            }
          } else {
            analysis.value = mv
              ? t('uci.bestMove', { move: mv })
              : t('uci.noMoves')
          }
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
      if (ln === 'uciok' && !(window as any).__UCI_TERMINAL_ACTIVE__)
        send('isready')
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

    // Start playing loading sound in loop
    console.log('[ENGINE_LOAD] Starting engine load, calling playSoundLoop...')
    playSoundLoop('loading')
    console.log('[ENGINE_LOAD] playSoundLoop called')

    // Teardown previous engine if any
    if (isThinking.value) stopAnalysis({ playBestMoveOnStop: false })
    if (isPondering.value) stopPonder({ playBestMoveOnStop: false })
    await invoke('kill_engine').catch(e =>
      console.warn('Failed to kill previous engine:', e)
    )

    // Prepare for validation
    uciOkReceived.value = false

    // A promise that resolves when 'uciok' is received
    const uciOkPromise = new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new Error(
            `Validation timeout: No 'uciok' received within ${validationTimeout.value}ms.`
          )
        )
      }, validationTimeout.value)

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

      // Stop loading sound when engine is ready
      console.log(
        '[ENGINE_LOAD] Engine validation successful, stopping loading sound...'
      )
      stopSoundLoop()
      console.log('[ENGINE_LOAD] stopSoundLoop called')

      // If we reach here, engine is valid
      currentEngine.value = engine
      analysis.value = t('uci.engineReady')

      const configManager = useConfigManager()
      await configManager.saveLastSelectedEngineId(engine.id)

      // Automatically apply saved configuration after engine loads
      setTimeout(async () => {
        await applySavedSettings()

        // Send ucinewgame after engine is loaded and configured
        // This ensures the engine starts with a clean state
        try {
          console.log(
            '[DEBUG] ENGINE_LOAD: Sending ucinewgame after engine initialization'
          )
          await sendUciNewGame()
          console.log('[DEBUG] ENGINE_LOAD: ucinewgame completed successfully')
        } catch (error) {
          console.error(
            '[DEBUG] ENGINE_LOAD: Failed to send ucinewgame:',
            error
          )
          // Don't fail engine loading if ucinewgame fails
        }

        // Mark engine as loaded after all initialization is complete
        isEngineLoaded.value = true
      }, 100)
    } catch (e: any) {
      // Stop loading sound on error
      console.log('[ENGINE_LOAD] Engine load failed, stopping loading sound...')
      stopSoundLoop()
      console.log('[ENGINE_LOAD] stopSoundLoop called after error')

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

  /* ---------- UCI New Game ---------- */
  const sendUciNewGame = async (): Promise<void> => {
    if (!currentEngine.value) {
      console.log('[DEBUG] UCI_NEWGAME: No engine loaded, skipping ucinewgame')
      return
    }

    console.log('[DEBUG] UCI_NEWGAME: Sending ucinewgame command')

    // Send ucinewgame command
    send('ucinewgame')

    // According to UCI protocol, we should send isready after ucinewgame
    // to wait for the engine to complete internal reset
    console.log('[DEBUG] UCI_NEWGAME: Sending isready after ucinewgame')
    send('isready')

    // Wait for readyok response
    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new Error('ucinewgame timeout: No readyok received within 5 seconds')
        )
      }, 5000)

      // Listen for readyok response
      listen<string>('engine-output', event => {
        if (event.payload.trim() === 'readyok') {
          console.log(
            '[DEBUG] UCI_NEWGAME: Received readyok, new game initialized'
          )
          clearTimeout(timeoutId)
          resolve()
        }
      })
        .then(unlisten => {
          // Store the unlisten function to clean up if needed
          timeoutId && clearTimeout(timeoutId)
          return unlisten
        })
        .catch(e => {
          clearTimeout(timeoutId)
          reject(e)
        })
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

    // Record analysis-time context so UI can reconstruct PV notation against the same state
    analysisBaseFen.value = fenToUse
    analysisPrefixMoves.value = [...moves]
    // Also capture the UI/Jieqi FEN at analysis start for Chinese notation conversion
    try {
      analysisUiFen.value = gameState.generateFen()
    } catch (_) {
      analysisUiFen.value = ''
    }

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
    // Advanced mode: evaluate custom script to produce combined limits
    if (finalSettings.analysisMode === 'advanced') {
      try {
        // Build prev context from game history
        const history = gameState.history?.value || []
        const idx = gameState.currentMoveIndex?.value || history.length
        const getPrevWrapper = (offset: number): PrevContext => {
          const i = idx - 1 - offset
          const exists =
            i >= 0 && i < history.length && history[i]?.type === 'move'
          const entry = exists ? history[i] : undefined
          return {
            exists: () => !!exists,
            get movetime() {
              // Requested movetime (go movetime), not actual time used
              return (entry?.engineRequestedMovetime ?? 0) * 1.0
            },
            get depth() {
              return (entry?.engineDepth ?? 0) * 1.0
            },
            get nodes() {
              return (entry?.engineNodes ?? 0) * 1.0
            },
            get score() {
              return (entry?.engineScore ?? 0) * 1.0
            },
            get timeUsed() {
              return (entry?.engineTime ?? 0) * 1.0
            },
            get prev() {
              return getPrevWrapper(offset + 1)
            },
          }
        }

        const prevCtx = getPrevWrapper(0)

        const code: string = String(finalSettings.advancedScript || '')
        const result = evaluateAdvancedScript(code, prevCtx) || {}

        const advMovetime =
          typeof result.movetime === 'number' && isFinite(result.movetime)
            ? result.movetime
            : 0
        const advDepth =
          typeof result.depth === 'number' && isFinite(result.depth)
            ? result.depth
            : 0
        const advNodes =
          typeof result.nodes === 'number' && isFinite(result.nodes)
            ? result.nodes
            : 0
        const advMaxThinkTime =
          typeof result.maxThinkTime === 'number' &&
          isFinite(result.maxThinkTime)
            ? result.maxThinkTime
            : 0

        const parts: string[] = []
        // Construct combined go command like: go depth 20 movetime 1000 nodes 2000000
        if (advDepth > 0) parts.push(`depth ${Math.floor(advDepth)}`)
        if (advNodes > 0) parts.push(`nodes ${Math.floor(advNodes)}`)
        if (advMovetime > 0) parts.push(`movetime ${Math.floor(advMovetime)}`)
        // If using wtime/btime style for overall cap
        if (advMaxThinkTime > 0) {
          parts.push(
            `wtime ${Math.floor(advMaxThinkTime)} btime ${Math.floor(advMaxThinkTime)} movestogo 1`
          )
        }
        // Record the requested limits for prev context
        lastRequestedLimits.value = {
          movetime: advMovetime > 0 ? Math.floor(advMovetime) : undefined,
          depth: advDepth > 0 ? Math.floor(advDepth) : undefined,
          nodes: advNodes > 0 ? Math.floor(advNodes) : undefined,
          maxThinkTime:
            advMaxThinkTime > 0 ? Math.floor(advMaxThinkTime) : undefined,
        }
        const searchMovesStr2 =
          searchmoves.length > 0 ? ` searchmoves ${searchmoves.join(' ')}` : ''
        goCommand = `go ${parts.join(' ')}${searchMovesStr2}`.trim()
        if (goCommand === 'go') {
          goCommand = `go infinite${searchMovesStr2}`
        }
      } catch (e) {
        console.warn('[ADVANCED] Failed to evaluate advanced script:', e)
        // Fallback to movetime
        const searchMovesStr2 =
          searchmoves.length > 0 ? ` searchmoves ${searchmoves.join(' ')}` : ''
        if (finalSettings.movetime > 0) {
          lastRequestedLimits.value = {
            movetime: Math.floor(finalSettings.movetime),
          }
          goCommand = `go movetime ${finalSettings.movetime}${searchMovesStr2}`
        } else {
          lastRequestedLimits.value = {}
          goCommand = `go infinite${searchMovesStr2}`
        }
      }
    } else
      switch (finalSettings.analysisMode) {
        case 'depth':
          lastRequestedLimits.value = {
            depth: Math.floor(finalSettings.maxDepth),
          }
          goCommand = `go depth ${finalSettings.maxDepth}${searchMovesStr}`
          break
        case 'nodes':
          lastRequestedLimits.value = {
            nodes: Math.floor(finalSettings.maxNodes),
          }
          goCommand = `go nodes ${finalSettings.maxNodes}${searchMovesStr}`
          break
        case 'maxThinkTime':
          if (finalSettings.maxThinkTime > 0) {
            lastRequestedLimits.value = {
              maxThinkTime: Math.floor(finalSettings.maxThinkTime),
            }
            goCommand = `go wtime ${finalSettings.maxThinkTime} btime ${finalSettings.maxThinkTime} movestogo 1${searchMovesStr}`
          } else {
            lastRequestedLimits.value = {}
            goCommand = `go infinite${searchMovesStr}`
          }
          break
        case 'movetime':
        default:
          if (finalSettings.movetime > 0) {
            lastRequestedLimits.value = {
              movetime: Math.floor(finalSettings.movetime),
            }
            goCommand = `go movetime ${finalSettings.movetime}${searchMovesStr}`
          } else {
            lastRequestedLimits.value = {}
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

    // Record analysis-time context for UI while pondering so PV conversion uses the correct root FEN
    try {
      analysisUiFen.value = gameState.generateFen()
      analysisPrefixMoves.value = [...moves]
      analysisBaseFen.value = fenForEngine
      console.log(
        '[DEBUG] START_PONDER: Captured analysis UI FEN and context for PV rendering',
        {
          analysisUiFen: analysisUiFen.value,
          analysisPrefixMoves: analysisPrefixMoves.value,
          analysisBaseFen: analysisBaseFen.value,
        }
      )
    } catch (_) {
      analysisUiFen.value = ''
    }

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
        // Special handling for button type: sentinel '__button__' means execute button
        if (value === '__button__') {
          const command = `setoption name ${name}`
          send(command)
          return
        }
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
      const isStartup = customEvent.detail?.isStartup || false
      console.log(
        '[DEBUG] useUciEngine: Match mode changed to:',
        newMatchMode,
        'isStartup:',
        isStartup
      )

      if (newMatchMode) {
        // Entering match mode
        if (isEngineLoaded.value && !isStartup) {
          // Only unload if this is manual switching, not startup
          console.log(
            '[DEBUG] useUciEngine: Unloading UCI engine for match mode'
          )
          unloadEngine()
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
    analysisBaseFen,
    analysisPrefixMoves,
    analysisUiFen,
    loadEngine,
    unloadEngine,
    startAnalysis,
    stopAnalysis,
    uciOptionsText,
    send,
    sendUciNewGame,
    currentEnginePath,
    applySavedSettings,
    currentSearchMoves,
    clearSearchMoves,
    bundleIdentifier,
    analysisStartTime,
    lastAnalysisTime,
    lastRequestedLimits,
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
    // Chinese notation setting
    showChineseNotation,
    setShowChineseNotation: (value: boolean) => {
      showChineseNotation.value = value
    },
  }
}
