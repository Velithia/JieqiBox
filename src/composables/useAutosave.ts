import { ref, watch } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { useInterfaceSettings } from './useInterfaceSettings'

// Autosave functionality composable
export function useAutosave() {
  const { autosave } = useInterfaceSettings()

  const isAutosaveEnabled = ref(false)
  const lastAutosaveTime = ref<number>(0)
  const autosaveInterval = 5000 // Save every 5 seconds when enabled

  // Load autosave file on startup if autosave is enabled
  const loadAutosaveOnStartup = async (gameState: any) => {
    try {
      const autosaveContent = await invoke<string>('load_autosave')
      if (autosaveContent && autosaveContent.trim()) {
        // Parse and load the autosave content
        const gameData = JSON.parse(autosaveContent)

        // Load the game state from autosave
        if (gameData.metadata && gameData.metadata.currentFen) {
          if (gameState) {
            // Load the current position
            gameState.loadFen(gameData.metadata.currentFen, false)

            // Load move history if available
            if (gameData.moves && gameData.moves.length > 0) {
              gameState.history.value = [...gameData.moves]
              gameState.currentMoveIndex.value = gameData.moves.length
              console.log('Autosave loaded with moves:', gameData.moves.length)
            }

            console.log('Autosave loaded successfully')
          }
        }
      }
    } catch (error) {
      console.error('Failed to load autosave on startup:', error)
    }
  }

  // Save current game state to autosave file
  const saveAutosave = async (gameState: any) => {
    if (!isAutosaveEnabled.value) {
      console.log('Autosave is disabled, skipping save')
      return
    }

    try {
      if (!gameState) {
        console.error('Game state not available for autosave')
        return
      }

      const gameNotation = gameState.generateGameNotation()
      console.log('Autosave - Game notation:', {
        movesCount: gameNotation.moves.length,
        currentFen: gameNotation.metadata.currentFen,
        historyLength: gameState.history.value.length,
      })

      const autosaveContent = JSON.stringify(gameNotation, null, 2)

      await invoke('save_autosave', { content: autosaveContent })
      lastAutosaveTime.value = Date.now()

      console.log('Autosave completed successfully')
    } catch (error) {
      console.error('Failed to save autosave:', error)
    }
  }

  // Set up periodic autosave when enabled
  let autosaveTimer: ReturnType<typeof setInterval> | null = null
  let currentGameState: any = null
  let isInitialized = false // Flag to prevent multiple initializations

  const startAutosaveTimer = (gameState: any) => {
    // Clear existing timer first
    if (autosaveTimer) {
      clearInterval(autosaveTimer)
      autosaveTimer = null
    }

    currentGameState = gameState
    console.log('Autosave: Setting currentGameState:', !!gameState)

    if (isAutosaveEnabled.value) {
      console.log('Starting autosave timer with interval:', autosaveInterval)
      autosaveTimer = setInterval(async () => {
        console.log(
          'Autosave timer triggered, currentGameState:',
          !!currentGameState
        )
        if (currentGameState) {
          await saveAutosave(currentGameState)
        } else {
          console.error('Autosave: currentGameState is null in timer callback')
        }
      }, autosaveInterval)
    } else {
      console.log('Autosave is disabled, not starting timer')
    }
  }

  const stopAutosaveTimer = () => {
    if (autosaveTimer) {
      clearInterval(autosaveTimer)
      autosaveTimer = null
    }
    currentGameState = null
    console.log('Autosave: Cleared currentGameState')
  }

  // Watch for autosave setting changes to start/stop timer
  watch(autosave, newValue => {
    isAutosaveEnabled.value = newValue
    console.log(
      'Autosave setting changed to:',
      newValue,
      'currentGameState:',
      !!currentGameState,
      'isInitialized:',
      isInitialized
    )

    // Always stop existing timer first
    if (autosaveTimer) {
      clearInterval(autosaveTimer)
      autosaveTimer = null
    }

    // Only start timer if we have a game state, autosave is enabled, and we're initialized
    if (newValue && currentGameState && isInitialized) {
      console.log('Starting autosave timer due to setting change')
      startAutosaveTimer(currentGameState)
    } else if (!newValue) {
      console.log('Stopping autosave timer due to setting change')
      stopAutosaveTimer()
    }
  })

  // Initialize autosave when called from App.vue
  const initializeAutosave = async (gameState: any) => {
    // Prevent multiple initializations
    if (isInitialized) {
      console.log('Autosave already initialized, skipping')
      return
    }

    try {
      console.log('Autosave: Initializing with gameState:', !!gameState)

      // Load the autosave setting from interface settings
      isAutosaveEnabled.value = autosave.value
      console.log(
        'Autosave initialization - setting enabled:',
        isAutosaveEnabled.value
      )

      // If autosave is enabled, try to load the autosave file on startup
      if (isAutosaveEnabled.value) {
        await loadAutosaveOnStartup(gameState)
      }

      // Start the timer if autosave is enabled
      if (isAutosaveEnabled.value) {
        startAutosaveTimer(gameState)
      }

      isInitialized = true
    } catch (error) {
      console.error('Failed to initialize autosave:', error)
    }
  }

  return {
    isAutosaveEnabled,
    saveAutosave,
    loadAutosaveOnStartup,
    startAutosaveTimer,
    stopAutosaveTimer,
    initializeAutosave,
  }
}
