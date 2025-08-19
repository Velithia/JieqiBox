import { ref, watch } from 'vue'
import { useConfigManager } from './useConfigManager'

// Config manager instance
const configManager = useConfigManager()

// Get initial settings from config file
const getInitialSettings = () => {
  try {
    return configManager.getHumanVsAiSettings()
  } catch (error) {
    console.warn('Failed to load human vs AI settings:', error)
    return {
      isHumanVsAiMode: false,
      aiSide: 'black' as 'red' | 'black',
      showEngineAnalysis: false,
    }
  }
}

// Create reactive references shared across the application
const {
  isHumanVsAiMode: initialIsHumanVsAiMode,
  aiSide: initialAiSide,
  showEngineAnalysis: initialShowEngineAnalysis,
} = getInitialSettings()

const isHumanVsAiMode = ref<boolean>(initialIsHumanVsAiMode)
const aiSide = ref<'red' | 'black'>(initialAiSide)
const showEngineAnalysis = ref<boolean>(initialShowEngineAnalysis)

// Flag to track if config is loaded
const isConfigLoaded = ref(false)

// Watch for changes and persist to config file
watch(
  [isHumanVsAiMode, aiSide, showEngineAnalysis],
  async ([newIsHumanVsAiMode, newAiSide, newShowEngineAnalysis]) => {
    // Only save if config is already loaded to avoid overwriting during initialization
    if (!isConfigLoaded.value) return

    const settings = {
      isHumanVsAiMode: newIsHumanVsAiMode,
      aiSide: newAiSide,
      showEngineAnalysis: newShowEngineAnalysis,
    }

    try {
      await configManager.updateHumanVsAiSettings(settings)
    } catch (error) {
      console.error('Failed to save human vs AI settings:', error)
    }
  }
)

// Human vs AI settings composable
export function useHumanVsAiSettings() {
  // Load configuration and update reactive refs
  const loadSettings = async () => {
    try {
      const humanVsAiSettings = configManager.getHumanVsAiSettings()

      if (humanVsAiSettings) {
        isHumanVsAiMode.value = humanVsAiSettings.isHumanVsAiMode
        aiSide.value = humanVsAiSettings.aiSide
        showEngineAnalysis.value = humanVsAiSettings.showEngineAnalysis
      }

      // Mark config as loaded
      isConfigLoaded.value = true
    } catch (error) {
      console.error('Failed to load human vs AI settings from config:', error)
    }
  }

  // Toggle human vs AI mode
  const toggleHumanVsAiMode = () => {
    isHumanVsAiMode.value = !isHumanVsAiMode.value
  }

  // Set AI side
  const setAiSide = (side: 'red' | 'black') => {
    aiSide.value = side
  }

  // Toggle engine analysis visibility
  const toggleShowEngineAnalysis = () => {
    showEngineAnalysis.value = !showEngineAnalysis.value
  }

  return {
    isHumanVsAiMode,
    aiSide,
    showEngineAnalysis,
    loadSettings,
    toggleHumanVsAiMode,
    setAiSide,
    toggleShowEngineAnalysis,
  }
}
