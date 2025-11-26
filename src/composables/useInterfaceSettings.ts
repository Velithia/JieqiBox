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
      showLuckIndex: false,
      showArrows: true,
      showBookMoves: true,
      openingBookEnableInGame: true,
      openingBookPreferHighPriority: true,
      validationTimeout: 5000,
      enableSoundEffects: true,
      soundVolume: 70,
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
      showLuckIndex: !!settings.showLuckIndex, // Default to false
      showArrows: settings.showArrows !== false, // Default to true
      showBookMoves: settings.showBookMoves !== false, // Default to true
      openingBookEnableInGame: settings.openingBookEnableInGame !== false, // Default to true
      openingBookPreferHighPriority:
        settings.openingBookPreferHighPriority !== false, // Default to true
      validationTimeout: settings.validationTimeout || 5000, // Default to 5000
      enableSoundEffects: settings.enableSoundEffects !== false, // Default to true
      soundVolume: settings.soundVolume ?? 70, // Default to 70%
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
      showLuckIndex: false,
      showArrows: true,
      showBookMoves: true,
      openingBookEnableInGame: true,
      openingBookPreferHighPriority: true,
      validationTimeout: 5000,
      enableSoundEffects: true,
      soundVolume: 70,
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
  showArrows: initialShowArrows,
  showBookMoves: initialShowBookMoves,
  openingBookEnableInGame: initialOpeningBookEnableInGame,
  openingBookPreferHighPriority: initialOpeningBookPreferHighPriority,
  validationTimeout: initialValidationTimeout,
  enableSoundEffects: initialEnableSoundEffects,
  soundVolume: initialSoundVolume,
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
const showArrows = ref<boolean>(initialShowArrows)
const showBookMoves = ref<boolean>(initialShowBookMoves)
const openingBookEnableInGame = ref<boolean>(initialOpeningBookEnableInGame)
const openingBookPreferHighPriority = ref<boolean>(
  initialOpeningBookPreferHighPriority
)
const validationTimeout = ref<number>(initialValidationTimeout)
const enableSoundEffects = ref<boolean>(initialEnableSoundEffects)
const soundVolume = ref<number>(initialSoundVolume)

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
    showArrows,
    showBookMoves,
    openingBookEnableInGame,
    openingBookPreferHighPriority,
    validationTimeout,
    enableSoundEffects,
    soundVolume,
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
    newShowArrows,
    newShowBookMoves,
    newOpeningBookEnableInGame,
    newOpeningBookPreferHighPriority,
    newValidationTimeout,
    newEnableSoundEffects,
    newSoundVolume,
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
      showArrows: newShowArrows,
      showBookMoves: newShowBookMoves,
      openingBookEnableInGame: newOpeningBookEnableInGame,
      openingBookPreferHighPriority: newOpeningBookPreferHighPriority,
      validationTimeout: newValidationTimeout,
      enableSoundEffects: newEnableSoundEffects,
      soundVolume: newSoundVolume,
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
      showArrows.value = settings.showArrows !== false // Default to true
      showBookMoves.value = settings.showBookMoves !== false // Default to true
      openingBookEnableInGame.value = settings.openingBookEnableInGame !== false // Default to true
      openingBookPreferHighPriority.value =
        settings.openingBookPreferHighPriority !== false // Default to true
      validationTimeout.value = settings.validationTimeout || 5000 // Default to 5000
      enableSoundEffects.value = settings.enableSoundEffects !== false // Default to true
      soundVolume.value = settings.soundVolume ?? 70 // Default to 70%

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
    showArrows,
    showBookMoves,
    openingBookEnableInGame,
    openingBookPreferHighPriority,
    validationTimeout,
    enableSoundEffects,
    soundVolume,
    loadSettings,
  }
}
