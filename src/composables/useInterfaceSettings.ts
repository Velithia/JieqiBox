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
      showEvaluationBar: true,
      darkMode: false,
      autosave: true,
      useNewFenFormat: true,
      engineLogLineLimit: 256,
      showChineseNotation: true,
      showLuckIndex: true,
    }
  }

  try {
    const settings = configManager.getInterfaceSettings()
    return {
      showCoordinates: !!settings.showCoordinates,
      parseUciInfo: settings.parseUciInfo !== false, // Default to true
      showAnimations: settings.showAnimations !== false, // Default to true
      showPositionChart: !!settings.showPositionChart, // Default to false
      showEvaluationBar: settings.showEvaluationBar !== false, // Default to true
      darkMode: !!settings.darkMode, // Default to false
      autosave: settings.autosave !== false, // Default to true
      useNewFenFormat: settings.useNewFenFormat !== false, // Default to true
      engineLogLineLimit: settings.engineLogLineLimit || 256, // Default to 256
      showChineseNotation: settings.showChineseNotation !== false, // Default to true
      showLuckIndex: settings.showLuckIndex !== false, // Default to true
    }
  } catch (e) {
    console.error('Failed to get interface settings:', e)
    // Return default values on error
    return {
      showCoordinates: false,
      parseUciInfo: true,
      showAnimations: true,
      showPositionChart: false,
      showEvaluationBar: true,
      darkMode: false,
      autosave: true,
      useNewFenFormat: true,
      engineLogLineLimit: 256,
      showChineseNotation: true,
      showLuckIndex: true,
    }
  }
}

// Create reactive references shared across the application
const {
  showCoordinates: initialShowCoordinates,
  parseUciInfo: initialParseUciInfo,
  showAnimations: initialShowAnimations,
  showPositionChart: initialShowPositionChart,
  showEvaluationBar: initialShowEvaluationBar,
  darkMode: initialDarkMode,
  autosave: initialAutosave,
  useNewFenFormat: initialUseNewFenFormat,
  engineLogLineLimit: initialEngineLogLineLimit,
  showChineseNotation: initialShowChineseNotation,
  showLuckIndex: initialShowLuckIndex,
} = getInitialSettings()

const showCoordinates = ref<boolean>(initialShowCoordinates)
const parseUciInfo = ref<boolean>(initialParseUciInfo)
const showAnimations = ref<boolean>(initialShowAnimations)
const showPositionChart = ref<boolean>(initialShowPositionChart)
const showEvaluationBar = ref<boolean>(initialShowEvaluationBar)
const darkMode = ref<boolean>(initialDarkMode)
const autosave = ref<boolean>(initialAutosave)
const useNewFenFormat = ref<boolean>(initialUseNewFenFormat)
const engineLogLineLimit = ref<number>(initialEngineLogLineLimit)
const showChineseNotation = ref<boolean>(initialShowChineseNotation)
const showLuckIndex = ref<boolean>(initialShowLuckIndex)

// Flag to track if config is loaded
const isConfigLoaded = ref(false)

// Watch for changes and persist to config file
watch(
  [
    showCoordinates,
    parseUciInfo,
    showAnimations,
    showPositionChart,
    showEvaluationBar,
    darkMode,
    autosave,
    useNewFenFormat,
    engineLogLineLimit,
    showChineseNotation,
    showLuckIndex,
  ],
  async ([
    newShowCoordinates,
    newParseUciInfo,
    newShowAnimations,
    newShowPositionChart,
    newShowEvaluationBar,
    newDarkMode,
    newAutosave,
    newUseNewFenFormat,
    newEngineLogLineLimit,
    newShowChineseNotation,
    newShowLuckIndex,
  ]) => {
    // Only save if config is already loaded to avoid overwriting during initialization
    if (!isConfigLoaded.value) return

    const settings = {
      showCoordinates: newShowCoordinates,
      parseUciInfo: newParseUciInfo,
      showAnimations: newShowAnimations,
      showPositionChart: newShowPositionChart,
      showEvaluationBar: newShowEvaluationBar,
      darkMode: newDarkMode,
      autosave: newAutosave,
      useNewFenFormat: newUseNewFenFormat,
      engineLogLineLimit: newEngineLogLineLimit,
      showChineseNotation: newShowChineseNotation,
      showLuckIndex: newShowLuckIndex,
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
      showEvaluationBar.value = settings.showEvaluationBar !== false
      darkMode.value = !!settings.darkMode
      autosave.value = settings.autosave !== false
      useNewFenFormat.value = settings.useNewFenFormat !== false
      engineLogLineLimit.value = settings.engineLogLineLimit || 256
      showChineseNotation.value = !!settings.showChineseNotation
      showLuckIndex.value = settings.showLuckIndex !== false

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
    showEvaluationBar,
    darkMode,
    autosave,
    useNewFenFormat,
    engineLogLineLimit,
    showChineseNotation,
    showLuckIndex,
    loadSettings,
  }
}
