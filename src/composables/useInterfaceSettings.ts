import { ref, watch } from 'vue'
import { useConfigManager } from './useConfigManager'

// Configuration manager
const configManager = useConfigManager()

/**
 * Get initial settings from the config manager
 * @returns {object} - Object containing initial values for interface settings
 */
const getInitialSettings = () => {
  // Only access in client environment
  if (typeof window === 'undefined') {
    return {
      showCoordinates: false,
      parseUciInfo: true,
      showAnimations: true,
      showPositionChart: false,
      darkMode: false,
      autosave: true,
    }
  }

  try {
    const settings = configManager.getInterfaceSettings()
    return {
      showCoordinates: !!settings.showCoordinates,
      parseUciInfo: settings.parseUciInfo !== false, // Default to true
      showAnimations: settings.showAnimations !== false, // Default to true
      showPositionChart: !!settings.showPositionChart, // Default to false
      darkMode: !!settings.darkMode, // Default to false
      autosave: settings.autosave !== false, // Default to true
    }
  } catch (e) {
    console.error('Failed to get interface settings:', e)
    // Return default values on error
    return {
      showCoordinates: false,
      parseUciInfo: true,
      showAnimations: true,
      showPositionChart: false,
      darkMode: false,
      autosave: true,
    }
  }
}

// Create reactive references shared across the application
const {
  showCoordinates: initialShowCoordinates,
  parseUciInfo: initialParseUciInfo,
  showAnimations: initialShowAnimations,
  showPositionChart: initialShowPositionChart,
  darkMode: initialDarkMode,
  autosave: initialAutosave,
} = getInitialSettings()

const showCoordinates = ref<boolean>(initialShowCoordinates)
const parseUciInfo = ref<boolean>(initialParseUciInfo)
const showAnimations = ref<boolean>(initialShowAnimations)
const showPositionChart = ref<boolean>(initialShowPositionChart)
const darkMode = ref<boolean>(initialDarkMode)
const autosave = ref<boolean>(initialAutosave)

// Flag to track if config is loaded
const isConfigLoaded = ref(false)

// Watch for changes and persist to config file
watch(
  [
    showCoordinates,
    parseUciInfo,
    showAnimations,
    showPositionChart,
    darkMode,
    autosave,
  ],
  async ([
    newShowCoordinates,
    newParseUciInfo,
    newShowAnimations,
    newShowPositionChart,
    newDarkMode,
    newAutosave,
  ]) => {
    // Only save if config is already loaded to avoid overwriting during initialization
    if (!isConfigLoaded.value) return

    const settings = {
      showCoordinates: newShowCoordinates,
      parseUciInfo: newParseUciInfo,
      showAnimations: newShowAnimations,
      showPositionChart: newShowPositionChart,
      darkMode: newDarkMode,
      autosave: newAutosave,
    }

    try {
      await configManager.updateInterfaceSettings(settings)
    } catch (error) {
      console.error('Failed to save interface settings:', error)
    }
  }
)

// Interface settings composable
export function useInterfaceSettings() {
  // Load configuration and update reactive refs
  const loadSettings = async () => {
    try {
      await configManager.loadConfig()
      const settings = configManager.getInterfaceSettings()

      // Update reactive refs
      showCoordinates.value = !!settings.showCoordinates
      parseUciInfo.value = settings.parseUciInfo !== false
      showAnimations.value = settings.showAnimations !== false
      showPositionChart.value = !!settings.showPositionChart
      darkMode.value = !!settings.darkMode
      autosave.value = settings.autosave !== false

      isConfigLoaded.value = true
    } catch (error) {
      console.error('Failed to load interface settings:', error)
      isConfigLoaded.value = true // Still mark as loaded to enable saving
    }
  }

  // Initialize settings on first import
  if (typeof window !== 'undefined') {
    loadSettings()
  }

  return {
    showCoordinates,
    parseUciInfo,
    showAnimations,
    showPositionChart,
    darkMode,
    autosave,
    loadSettings,
  }
}
