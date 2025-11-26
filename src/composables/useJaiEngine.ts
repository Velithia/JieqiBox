import { ref, onMounted, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useI18n } from 'vue-i18n'
import { useConfigManager, type ManagedEngine } from './useConfigManager'
import { useInterfaceSettings } from './useInterfaceSettings'
import { useSoundEffects } from './useSoundEffects'

export interface JaiEngineLine {
  text: string
  kind: 'sent' | 'recv'
}

// JAI option interface definition
export interface JaiOption {
  name: string
  type: 'spin' | 'check' | 'combo' | 'string' | 'button'
  defaultValue: string | number | boolean
  currentValue: string | number | boolean
  min?: number
  max?: number
  vars?: string[]
}

export function useJaiEngine(_generateFen: () => string, gameState: any) {
  const { t } = useI18n()
  const { validationTimeout } = useInterfaceSettings()
  const { playSoundLoop, stopSoundLoop } = useSoundEffects()
  const engineOutput = ref<JaiEngineLine[]>([])
  const isEngineLoaded = ref(false)
  const isEngineLoading = ref(false)
  const currentEngine = ref<ManagedEngine | null>(null)
  const jaiOkReceived = ref(false) // For validation
  const isMatchRunning = ref(false)
  const isMatchStopping = ref(false)
  const currentGame = ref(0)
  const totalGames = ref(0)
  const matchResult = ref('')
  const currentFen = ref('')
  const engineMove = ref('')
  const matchEngineInfo = ref('')
  const jaiOptionsText = ref('') // cache JAI options raw text
  const jaiOptions = ref<JaiOption[]>([])
  const analysisInfo = ref('') // Store depth info from UCI engine transparently passed through

  // WLD (Wins-Losses-Draws) statistics for the current match
  const matchWins = ref(0)
  const matchLosses = ref(0)
  const matchDraws = ref(0)

  // Engine information for the current match
  const redEngine = ref('')
  const blackEngine = ref('')

  // Throttling mechanism for engine output processing
  let outputThrottleTimer: ReturnType<typeof setTimeout> | null = null
  let pendingOutputLines: string[] = []
  let lastProcessedTime = 0
  const OUTPUT_THROTTLE_DELAY = 50 // Process output every 50ms maximum

  let unlisten: (() => void) | null = null

  /* ---------- Output Throttling Functions ---------- */
  // Process pending output lines with throttling
  const processPendingOutput = () => {
    if (pendingOutputLines.length === 0) return

    const currentTime = Date.now()

    // Check if enough time has passed since last processing
    if (currentTime - lastProcessedTime < OUTPUT_THROTTLE_DELAY) {
      // Schedule processing for later
      if (outputThrottleTimer) {
        clearTimeout(outputThrottleTimer)
      }
      outputThrottleTimer = setTimeout(
        processPendingOutput,
        OUTPUT_THROTTLE_DELAY - (currentTime - lastProcessedTime)
      )
      return
    }

    // Process all pending lines with parsing logic
    pendingOutputLines.forEach(raw_ln => {
      engineOutput.value.push({ text: raw_ln, kind: 'recv' })

      // Aggressive cleanup: limit engine output to prevent memory issues
      if (engineOutput.value.length > 1000) {
        console.log(
          '[DEBUG] JAI_ENGINE: Clearing engine output to prevent memory issues'
        )
        engineOutput.value = engineOutput.value.slice(-500) // Keep last 500 lines
      }

      const ln = raw_ln.trim()
      if (!ln) return // Ignore empty lines after trimming

      // Parse JAI engine responses
      if (ln.startsWith('id name ')) {
        const engineName = ln.substring(8) // Remove 'id name ' prefix
        matchEngineInfo.value += `Engine: ${engineName}\n`
      }

      if (ln.startsWith('id author ')) {
        const authorName = ln.substring(10) // Remove 'id author ' prefix
        matchEngineInfo.value += `Author: ${authorName}\n`
      }

      if (ln === 'jaiok') {
        jaiOkReceived.value = true
        send('isready')
      }

      if (ln === 'readyok') {
        matchEngineInfo.value = t('jai.engineReady')
      }

      // Parse JAI options
      if (ln.startsWith('option name ')) {
        jaiOptionsText.value += ln + '\n'
        const option = parseJaiOptionLine(ln)
        if (option) {
          // Check if option already exists
          const existingIndex = jaiOptions.value.findIndex(
            opt => opt.name === option.name
          )
          if (existingIndex >= 0) {
            jaiOptions.value[existingIndex] = option
          } else {
            jaiOptions.value.push(option)
          }
        }
      }

      // Parse match information
      if (ln.startsWith('info string ')) {
        const message = ln.substring(12) // Remove 'info string ' prefix
        matchEngineInfo.value = message
      }

      if (ln.startsWith('info game ')) {
        const gameInfo = ln.substring(10) // Remove 'info game ' prefix
        const [current, total] = gameInfo.split('/')
        currentGame.value = parseInt(current) || 0
        totalGames.value = parseInt(total) || 0
      }

      if (ln.startsWith('info fen ')) {
        const fenString = ln.substring(9) // Remove 'info fen ' prefix
        currentFen.value = fenString

        // Update game state with new FEN
        // This will reset the position to the new game state
        if (gameState.loadFen) {
          console.log('[DEBUG] JAI: Loading new FEN position:', fenString)

          // Clear all move history when loading new FEN from JAI engine
          // This ensures we start with a clean slate for each new game
          if (gameState.history) {
            gameState.history.value = []
            console.log('[DEBUG] JAI: Cleared all move history for new game')
          }
          if (gameState.currentMoveIndex) {
            gameState.currentMoveIndex.value = 0
            console.log('[DEBUG] JAI: Reset move index to 0 for new game')
          }

          // Clear engine output to prevent old score data from being recorded to move history
          engineOutput.value = []
          analysisInfo.value = ''

          gameState.loadFen(fenString, false) // No animation when loading from JAI engine
        }
      }

      if (ln.startsWith('info move ')) {
        const moveInfo = ln.substring(10) // Remove 'info move ' prefix

        // Parse move and time information
        // Format: info move <MoveString> time <TimeMs>
        const timeMatch = moveInfo.match(/^(.+?)\s+time\s+(\d+)$/)
        if (timeMatch) {
          const moveString = timeMatch[1]
          const timeMs = parseInt(timeMatch[2])

          console.log('[DEBUG] JAI: Parsed move with time:', {
            move: moveString,
            time: timeMs,
          })

          // Store the time information for useChessGame to access
          ;(window as any).__JAI_ENGINE_TIME__ = timeMs

          engineMove.value = moveString
          // Play the move in the game state
          if (gameState.playMoveFromUci) {
            gameState.playMoveFromUci(moveString)
          }
        } else {
          // Fallback for old format without time
          engineMove.value = moveInfo
          // Play the move in the game state
          if (gameState.playMoveFromUci) {
            gameState.playMoveFromUci(moveInfo)
          }
        }
      }

      if (ln.startsWith('info result ')) {
        const resultString = ln.substring(12) // Remove 'info result ' prefix
        matchResult.value = resultString

        // After receiving a result, wait for the next FEN to update the position
        // This ensures we move to the next game position instead of staying on the final position
        console.log('[DEBUG] JAI: Received game result:', resultString)
        console.log('[DEBUG] JAI: Waiting for next FEN to update position...')
      }

      // Parse WLD (Wins-Losses-Draws) statistics
      if (ln.startsWith('info wld ')) {
        const wldString = ln.substring(9) // Remove 'info wld ' prefix
        const [wins, losses, draws] = wldString
          .split('-')
          .map(s => parseInt(s) || 0)
        matchWins.value = wins
        matchLosses.value = losses
        matchDraws.value = draws
        console.log('[DEBUG] JAI: Updated WLD statistics:', {
          wins,
          losses,
          draws,
        })
      }

      // Parse engine information for the current match
      if (ln.startsWith('info engine ')) {
        const engineInfo = ln.substring(12) // Remove 'info engine ' prefix
        const engines = engineInfo.split(' ')
        if (engines.length >= 2) {
          redEngine.value = engines[0]
          blackEngine.value = engines[1]
          console.log('[DEBUG] JAI: Updated engine information:', {
            red: redEngine.value,
            black: blackEngine.value,
          })
        }
      }

      // Handle UCI analysis info transparently passed from UCI engine
      if (ln.startsWith('info depth')) {
        analysisInfo.value = ln

        // Parse UCI analysis data for score recording
        // This allows the game state to record engine scores for the current position
        if (gameState.recordEngineAnalysis) {
          gameState.recordEngineAnalysis(ln)
        }
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
      outputThrottleTimer = setTimeout(
        processPendingOutput,
        OUTPUT_THROTTLE_DELAY
      )
    }
  }

  // Clear throttling state when match starts/stops
  const resetThrottling = () => {
    if (outputThrottleTimer) {
      clearTimeout(outputThrottleTimer)
      outputThrottleTimer = null
    }
    pendingOutputLines = []
    lastProcessedTime = 0
  }

  /* ---------- JAI Option Parsing ---------- */
  const parseJaiOptionLine = (line: string): JaiOption | null => {
    const nameMatch = line.match(/option name (.+?) type (.+)/)
    if (!nameMatch) return null

    const name = nameMatch[1]
    const typeMatch = line.match(/type (\w+)/)
    if (!typeMatch) return null

    const type = typeMatch[1] as JaiOption['type']

    // Create a basic option object
    const option: JaiOption = {
      name,
      type,
      defaultValue: '',
      currentValue: '',
    }

    // Parse specific parameters based on type
    switch (type) {
      case 'spin':
        const defaultSpinMatch = line.match(/default (\d+)/)
        const minMatch = line.match(/min (\d+)/)
        const maxMatch = line.match(/max (\d+)/)

        option.defaultValue = defaultSpinMatch
          ? parseInt(defaultSpinMatch[1])
          : 0
        option.min = minMatch ? parseInt(minMatch[1]) : 0
        option.max = maxMatch ? parseInt(maxMatch[1]) : 100
        break

      case 'check':
        const defaultCheckMatch = line.match(/default (true|false)/)
        option.defaultValue = defaultCheckMatch
          ? defaultCheckMatch[1] === 'true'
          : false
        break

      case 'combo':
        const defaultComboMatch = line.match(/default (\w+)/)
        const varsMatch = line.match(/var (.+)/)

        option.defaultValue = defaultComboMatch ? defaultComboMatch[1] : ''
        option.vars = varsMatch ? varsMatch[1].split(' var ') : []
        break

      case 'string':
        const defaultStringMatch = line.match(/default (.+?)(?:\s|$)/)
        option.defaultValue = defaultStringMatch ? defaultStringMatch[1] : ''
        break

      case 'button':
        option.defaultValue = ''
        break
    }

    // Set current value to the default value
    option.currentValue = option.defaultValue

    return option
  }

  /* ---------- Engine Loading and Validation ---------- */
  const loadEngine = async (engine: ManagedEngine) => {
    if (isEngineLoading.value) return
    isEngineLoading.value = true
    isEngineLoaded.value = false
    currentEngine.value = null
    engineOutput.value = [] // Clear log
    jaiOptionsText.value = '' // Clear JAI options text to prevent duplication
    jaiOptions.value = [] // Clear JAI options array

    // Start playing loading sound in loop
    console.log(
      '[JAI_ENGINE_LOAD] Starting engine load, calling playSoundLoop...'
    )
    playSoundLoop('loading')
    console.log('[JAI_ENGINE_LOAD] playSoundLoop called')

    // Teardown previous engine if any
    if (isMatchRunning.value) stopMatch()
    await invoke('kill_engine').catch(e =>
      console.warn('Failed to kill previous engine:', e)
    )

    // Prepare for validation
    jaiOkReceived.value = false

    // A promise that resolves when 'jaiok' is received
    const jaiOkPromise = new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new Error(
            `Validation timeout: No 'jaiok' received within ${validationTimeout.value}ms.`
          )
        )
      }, validationTimeout.value)

      // Listen specifically for the jaiok signal
      listen<string>('engine-output', event => {
        if (event.payload.trim() === 'jaiok') {
          console.log(
            `[DEBUG] Received jaiok for ${engine.name}. Validation successful.`
          )
          jaiOkReceived.value = true
          clearTimeout(timeoutId)
          resolve()
        }
      }).then(unsub => {
        // When the promise resolves or rejects, we'll stop listening
        const cleanup = () => unsub()
        jaiOkPromise.finally(cleanup)
      })
    })

    try {
      // Spawn engine process
      console.log(
        `[DEBUG] Spawning JAI engine: ${engine.name}, Path: ${engine.path}, Args: ${engine.args}`
      )
      await invoke('spawn_engine', {
        path: engine.path,
        args: engine.args.split(' ').filter(Boolean),
      })

      // Send 'jai' to start validation
      send('jai')

      // Wait for validation to complete or time out
      await jaiOkPromise

      // Stop loading sound when engine is ready
      console.log(
        '[JAI_ENGINE_LOAD] Engine validation successful, stopping loading sound...'
      )
      stopSoundLoop()
      console.log('[JAI_ENGINE_LOAD] stopSoundLoop called')

      // If we reach here, engine is valid
      currentEngine.value = engine
      matchEngineInfo.value = t('jai.engineReady')

      const configManager = useConfigManager()
      await configManager.saveLastSelectedEngineId(engine.id)

      // Automatically apply saved settings after engine loads
      setTimeout(async () => {
        await applySavedSettings()
        // Mark engine as loaded after all setoption commands have been sent
        isEngineLoaded.value = true
      }, 100)
    } catch (e: any) {
      // Stop loading sound on error
      console.log(
        '[JAI_ENGINE_LOAD] Engine load failed, stopping loading sound...'
      )
      stopSoundLoop()
      console.log('[JAI_ENGINE_LOAD] stopSoundLoop called after error')

      console.error(
        `Failed to load or validate JAI engine ${engine.name}:`,
        e.message || e
      )
      alert(
        t('errors.jaiEngineLoadFailed', {
          name: engine.name,
          error: e.message || e,
        })
      )
      isEngineLoaded.value = false
      // Clear the last selected engine ID if loading fails
      const configManager = useConfigManager()
      await configManager.clearLastSelectedEngineId()
      await invoke('kill_engine').catch(err =>
        console.warn('Failed to kill invalid JAI engine:', err)
      )
    } finally {
      isEngineLoading.value = false
    }
  }

  /* ---------- Basic Send ---------- */
  const send = (cmd: string) => {
    engineOutput.value.push({ text: cmd, kind: 'sent' })

    invoke('send_to_engine', { command: cmd }).catch(e => {
      console.warn('Failed to send to JAI engine:', e)
    })
  }

  /* ---------- JAI Commands ---------- */
  const startMatch = () => {
    if (!isEngineLoaded.value || isMatchRunning.value) return

    isMatchRunning.value = true
    isMatchStopping.value = false
    resetThrottling()

    // Clear any accumulated data before starting match
    engineOutput.value = []
    pendingOutputLines = []
    lastProcessedTime = 0

    // Reset WLD statistics for new match
    matchWins.value = 0
    matchLosses.value = 0
    matchDraws.value = 0

    // Reset engine information for new match
    redEngine.value = ''
    blackEngine.value = ''

    console.log('[DEBUG] START_MATCH: Starting JAI match')
    send('startmatch')
  }

  const stopMatch = () => {
    if (!isEngineLoaded.value || !isMatchRunning.value || isMatchStopping.value)
      return

    console.log('[DEBUG] STOP_MATCH: Stopping JAI match')
    isMatchStopping.value = true
    resetThrottling()
    send('stop')

    // Reset match state
    setTimeout(() => {
      isMatchRunning.value = false
      isMatchStopping.value = false
    }, 500)
  }

  const setJaiOption = (name: string, value: string | number | boolean) => {
    const command = `setoption name ${name} value ${value}`
    send(command)
  }

  /* ---------- Apply Saved Settings ---------- */
  const applySavedSettings = async () => {
    if (!currentEngine.value) return

    try {
      const configManager = useConfigManager()
      await configManager.loadConfig()

      // Use the engine's unique ID for settings
      const savedJaiOptions = configManager.getJaiOptions(
        currentEngine.value.id
      )

      if (Object.keys(savedJaiOptions).length === 0) return

      Object.entries(savedJaiOptions).forEach(([name, value]) => {
        setJaiOption(name, value)
      })
    } catch (error) {
      console.error('Failed to apply saved JAI settings:', error)
    }
  }

  /* ---------- Auto Load Last Engine ---------- */
  const autoLoadLastEngine = async () => {
    // Only auto-load JAI engine if we're in match mode
    const matchMode = (window as any).__MATCH_MODE__
    if (!matchMode) {
      console.log(
        '[DEBUG] JAI Auto-loading: Skipping because match mode is disabled'
      )
      return
    }

    const configManager = useConfigManager()
    await configManager.loadConfig()
    const lastEngineId = configManager.getLastSelectedEngineId()
    if (lastEngineId) {
      const engines = configManager.getEngines()
      console.log(
        `[DEBUG] JAI Auto-loading: Found last engine ID: ${lastEngineId}, Available engines: ${engines.length}`
      )
      const engineToLoad = engines.find(e => e.id === lastEngineId)
      if (engineToLoad) {
        console.log(
          `[DEBUG] JAI Auto-loading last used engine: ${engineToLoad.name}`
        )
        await loadEngine(engineToLoad)
      } else {
        console.log(
          `[DEBUG] JAI Auto-loading: Last selected engine (${lastEngineId}) not found in engine list`
        )
        // Clear the invalid last selected engine ID
        await configManager.clearLastSelectedEngineId()
      }
    } else {
      console.log(`[DEBUG] JAI Auto-loading: No last selected engine ID found`)
    }
  }

  /* ---------- Unload Engine ---------- */
  const unloadEngine = async () => {
    if (!isEngineLoaded.value) return

    console.log('[DEBUG] UNLOAD_JAI_ENGINE: Unloading current JAI engine')

    // Stop any ongoing match
    if (isMatchRunning.value) {
      stopMatch()
    }

    // Send quit command to gracefully terminate the engine
    try {
      send('quit')
      console.log('[DEBUG] UNLOAD_JAI_ENGINE: Sent quit command to engine')

      // Wait a bit for the engine to process the quit command
      await new Promise(resolve => setTimeout(resolve, 100))

      // As a fallback, also kill the engine process
      await invoke('kill_engine')
      console.log(
        '[DEBUG] UNLOAD_JAI_ENGINE: Engine process terminated successfully'
      )
    } catch (error) {
      console.error(
        '[DEBUG] UNLOAD_JAI_ENGINE: Failed to terminate engine process:',
        error
      )
    }

    // Reset all engine-related state
    isEngineLoaded.value = false
    isEngineLoading.value = false
    currentEngine.value = null
    isMatchRunning.value = false
    isMatchStopping.value = false
    currentGame.value = 0
    totalGames.value = 0
    matchResult.value = ''
    currentFen.value = ''
    engineMove.value = ''
    matchEngineInfo.value = ''
    engineOutput.value = []
    jaiOptionsText.value = ''
    jaiOptions.value = []
    analysisInfo.value = ''

    // Reset WLD statistics
    matchWins.value = 0
    matchLosses.value = 0
    matchDraws.value = 0

    // Reset engine information
    redEngine.value = ''
    blackEngine.value = ''

    // Clear the last selected engine ID from config
    const configManager = useConfigManager()
    await configManager.clearLastSelectedEngineId()

    console.log('[DEBUG] UNLOAD_JAI_ENGINE: Engine state reset completed')
  }

  /* ---------- Listen to Output ---------- */
  onMounted(async () => {
    // Central listener for all engine output for logging/display
    unlisten = await listen<string>('engine-output', ev => {
      const raw_ln = ev.payload
      console.log(`[DEBUG] JAI_ENGINE_RAW_OUTPUT: ${raw_ln}`)
      queueOutputLine(raw_ln)
    })

    // Set up periodic cleanup for match mode
    const cleanupInterval = setInterval(() => {
      if (isMatchRunning.value && engineOutput.value.length > 500) {
        console.log(
          '[DEBUG] JAI_ENGINE: Periodic cleanup - clearing old engine output'
        )
        engineOutput.value = engineOutput.value.slice(-250) // Keep last 250 lines
      }
    }, 30000) // Clean up every 30 seconds

    // Store cleanup interval for later cleanup
    ;(window as any).__JAI_CLEANUP_INTERVAL__ = cleanupInterval

    // Check if engine list is empty and clear last selected engine ID if needed
    const configManager = useConfigManager()
    await configManager.loadConfig()
    const engines = configManager.getEngines()
    if (engines.length === 0) {
      console.log(
        `[DEBUG] useJaiEngine: Engine list is empty on mount, clearing last selected engine ID`
      )
      await configManager.clearLastSelectedEngineId()
    }

    // Auto-load engine on startup
    autoLoadLastEngine()
  })

  onUnmounted(() => {
    unlisten?.()
    invoke('kill_engine') // Kill engine on component unmount
    resetThrottling()

    // Clean up periodic cleanup interval
    if ((window as any).__JAI_CLEANUP_INTERVAL__) {
      clearInterval((window as any).__JAI_CLEANUP_INTERVAL__)
      ;(window as any).__JAI_CLEANUP_INTERVAL__ = null
    }
  })

  return {
    engineOutput,
    isEngineLoaded,
    isEngineLoading,
    isMatchRunning,
    isMatchStopping,
    currentGame,
    totalGames,
    matchResult,
    currentFen,
    engineMove,
    matchEngineInfo,
    analysisInfo,
    jaiOptionsText,
    jaiOptions,
    matchWins,
    matchLosses,
    matchDraws,
    redEngine,
    blackEngine,
    loadEngine,
    unloadEngine,
    startMatch,
    stopMatch,
    send,
    setJaiOption,
    applySavedSettings,
    autoLoadLastEngine,
    currentEngine,
  }
}
