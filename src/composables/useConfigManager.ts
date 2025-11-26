import { ref, computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import Ini from 'ini'
import { isAndroidPlatform as checkAndroidPlatform } from '../utils/platform'

// Add this new interface and export it
export interface ManagedEngine {
  id: string
  name: string
  path: string
  args: string
}

// Configuration data structure
interface ConfigData {
  interfaceSettings: {
    showCoordinates: boolean
    parseUciInfo: boolean
    showAnimations: boolean
    showPositionChart: boolean
    showEvaluationBar: boolean
    darkMode: boolean
    autosave: boolean
    useNewFenFormat: boolean
    engineLogLineLimit: number
    validationTimeout: number
    showChineseNotation: boolean
    showLuckIndex: boolean
    showArrows: boolean
    showBookMoves: boolean
    openingBookEnableInGame: boolean
    openingBookPreferHighPriority: boolean
    enableSoundEffects: boolean
    soundVolume: number
  }
  windowSettings: {
    width: number
    height: number
    x?: number
    y?: number
    isMaximized?: boolean
    scaleFactor?: number
  }
  evaluationChartSettings: {
    showMoveLabels: boolean
    useLinearYAxis: boolean
    showOnlyLines: boolean
    blackPerspective: boolean
    enableYAxisClamp: boolean
    yAxisClampValue: number
    colorScheme: string
    showSeparateLines: boolean
    viewMode: string
  }
  analysisSettings: {
    movetime: number
    maxThinkTime: number
    maxDepth: number
    maxNodes: number
    analysisMode: string
    advancedScript?: string
  }
  gameSettings: {
    flipMode: 'random' | 'free'
    enablePonder: boolean
  }
  matchSettings: {
    isMatchMode: boolean
  }
  humanVsAiSettings: {
    isHumanVsAiMode: boolean
    aiSide: 'red' | 'black'
    showEngineAnalysis: boolean
  }
  uciOptions: Record<string, Record<string, string | number | boolean>>
  jaiOptions: Record<string, Record<string, string | number | boolean>>
  locale: string
  // New properties for engine management
  Engines?: {
    list?: string
  }
  Settings?: {
    lastSelectedEngineId?: string
  }
  [key: string]: any // Allow additional properties for UCI and JAI options
}

// Default configuration values
const defaultConfig: ConfigData = {
  interfaceSettings: {
    showCoordinates: false,
    parseUciInfo: true,
    showAnimations: true,
    showPositionChart: false,
    showEvaluationBar: true,
    darkMode: false,
    autosave: true,
    useNewFenFormat: true,
    engineLogLineLimit: 256,
    validationTimeout: 5000,
    showChineseNotation: true,
    showLuckIndex: false,
    showArrows: true,
    showBookMoves: true,
    openingBookEnableInGame: true,
    openingBookPreferHighPriority: true,
    enableSoundEffects: true,
    soundVolume: 70,
  },
  windowSettings: {
    width: 800,
    height: 600,
  },
  evaluationChartSettings: {
    showMoveLabels: true,
    useLinearYAxis: false,
    showOnlyLines: false,
    blackPerspective: false,
    enableYAxisClamp: false,
    yAxisClampValue: 500,
    colorScheme: 'default',
    showSeparateLines: false,
    viewMode: 'evaluation',
  },
  analysisSettings: {
    movetime: 1000,
    maxThinkTime: 5000,
    maxDepth: 20,
    maxNodes: 1000000,
    analysisMode: 'movetime',
    advancedScript: '',
  },
  gameSettings: {
    flipMode: 'random',
    enablePonder: false,
  },
  matchSettings: {
    isMatchMode: false,
  },
  humanVsAiSettings: {
    isHumanVsAiMode: false,
    aiSide: 'black',
    showEngineAnalysis: false,
  },
  uciOptions: {},
  jaiOptions: {},
  locale: 'zh_cn',
}

// Current configuration data
const configData = ref<ConfigData>({ ...defaultConfig })

// Platform detection utility
const isAndroidPlatform = computed(() => checkAndroidPlatform())

// Configuration file manager composable
export function useConfigManager() {
  // Load configuration from file
  const loadConfig = async (): Promise<void> => {
    try {
      const loadedConfig = await invoke<string>('load_config')
      if (loadedConfig) {
        const parsedConfig = Ini.parse(loadedConfig)

        // Validate window settings to detect abnormal values
        const validateWindowSettings = (settings: any) => {
          if (!settings) return false

          const width = Number(settings.width)
          const height = Number(settings.height)
          const x = Number(settings.x)
          const y = Number(settings.y)

          // Check for abnormal values that would cause window issues
          const isAbnormal =
            width <= 0 ||
            height <= 0 || // Invalid dimensions
            x < -10000 ||
            y < -10000 || // Window positioned far off-screen
            x > 10000 ||
            y > 10000 || // Window positioned far off-screen
            isNaN(width) ||
            isNaN(height) ||
            isNaN(x) ||
            isNaN(y) // Invalid numbers

          if (isAbnormal) {
            console.warn(
              'Abnormal window settings detected, using defaults:',
              settings
            )
            return false
          }

          return true
        }

        // Check if window settings are valid
        const windowSettingsValid = validateWindowSettings(
          parsedConfig.windowSettings
        )

        // Merge with default config to ensure all properties exist
        configData.value = {
          ...defaultConfig,
          ...parsedConfig,
          interfaceSettings: {
            ...defaultConfig.interfaceSettings,
            ...parsedConfig.interfaceSettings,
          },
          windowSettings: windowSettingsValid
            ? {
                ...defaultConfig.windowSettings,
                ...parsedConfig.windowSettings,
              }
            : defaultConfig.windowSettings, // Use defaults if invalid
          evaluationChartSettings: {
            ...defaultConfig.evaluationChartSettings,
            ...parsedConfig.evaluationChartSettings,
          },
          analysisSettings: {
            ...defaultConfig.analysisSettings,
            ...parsedConfig.analysisSettings,
          },
          gameSettings: {
            ...defaultConfig.gameSettings,
            ...parsedConfig.gameSettings,
          },
          uciOptions: parsedConfig.uciOptions || {},
          jaiOptions: parsedConfig.jaiOptions || {},
        }
      }
    } catch (error) {
      console.error('Failed to load configuration:', error)
      // Use default configuration if loading fails
      configData.value = { ...defaultConfig }
    }
  }

  // Save configuration to file
  const saveConfig = async (): Promise<void> => {
    try {
      const configIni = Ini.stringify(configData.value)
      await invoke('save_config', { content: configIni })
    } catch (error) {
      console.error('Failed to save configuration:', error)
    }
  }

  // Get interface settings
  const getInterfaceSettings = () => configData.value.interfaceSettings

  // Update interface settings
  const updateInterfaceSettings = async (
    settings: Partial<ConfigData['interfaceSettings']>
  ): Promise<void> => {
    configData.value.interfaceSettings = {
      ...configData.value.interfaceSettings,
      ...settings,
    }
    await saveConfig()
  }

  // Get window settings
  const getWindowSettings = () => configData.value.windowSettings

  // Update window settings
  const updateWindowSettings = async (
    settings: Partial<ConfigData['windowSettings']>
  ): Promise<void> => {
    configData.value.windowSettings = {
      ...configData.value.windowSettings,
      ...settings,
    }
    await saveConfig()
  }

  // Get evaluation chart settings
  const getEvaluationChartSettings = () =>
    configData.value.evaluationChartSettings

  // Update evaluation chart settings
  const updateEvaluationChartSettings = async (
    settings: Partial<ConfigData['evaluationChartSettings']>
  ): Promise<void> => {
    configData.value.evaluationChartSettings = {
      ...configData.value.evaluationChartSettings,
      ...settings,
    }
    await saveConfig()
  }

  // Get analysis settings
  const getAnalysisSettings = () => configData.value.analysisSettings

  // Update analysis settings
  const updateAnalysisSettings = async (
    settings: Partial<ConfigData['analysisSettings']>
  ): Promise<void> => {
    configData.value.analysisSettings = {
      ...configData.value.analysisSettings,
      ...settings,
    }
    await saveConfig()
  }

  // Get game settings
  const getGameSettings = () => configData.value.gameSettings

  // Update game settings
  const updateGameSettings = async (
    settings: Partial<ConfigData['gameSettings']>
  ): Promise<void> => {
    configData.value.gameSettings = {
      ...configData.value.gameSettings,
      ...settings,
    }
    await saveConfig()
  }

  // --- NEW METHODS FOR ENGINE MANAGEMENT ---

  const getEngines = (): ManagedEngine[] => {
    if (!configData.value.Engines) {
      return []
    }
    try {
      // Engines are stored as a JSON string under the [Engines] section
      const engines = JSON.parse(configData.value.Engines.list || '[]')
      return engines
    } catch (e) {
      console.error('Failed to parse engines from config:', e)
      return []
    }
  }

  const saveEngines = async (engines: ManagedEngine[]) => {
    if (!configData.value.Engines) {
      configData.value.Engines = {}
    }
    configData.value.Engines.list = JSON.stringify(engines)
    await saveConfig()
    // Clear last selected engine ID if the list is empty
    if (engines.length === 0) {
      console.log(
        `[DEBUG] ConfigManager: Engine list is empty, clearing last selected engine ID`
      )
      if (configData.value.Settings) {
        delete configData.value.Settings.lastSelectedEngineId
        await saveConfig()
      }
    }
  }

  const getLastSelectedEngineId = (): string | null => {
    return configData.value.Settings?.lastSelectedEngineId || null
  }

  const saveLastSelectedEngineId = async (id: string) => {
    if (!configData.value.Settings) {
      configData.value.Settings = {}
    }
    configData.value.Settings.lastSelectedEngineId = id
    await saveConfig()
  }

  // Clear the last selected engine ID
  const clearLastSelectedEngineId = async () => {
    if (configData.value.Settings) {
      console.log(`[DEBUG] ConfigManager: Clearing last selected engine ID`)
      delete configData.value.Settings.lastSelectedEngineId
      // Don't call saveConfig here to avoid infinite recursion
      // The caller should call saveConfig if needed
    }
  }

  // --- UPDATE UCI OPTIONS TO USE ENGINE ID ---

  const getUciOptions = (engineId: string): Record<string, any> => {
    const key = `UciOptions_${engineId}`
    return configData.value[key] || {}
  }

  const updateUciOptions = async (
    engineId: string,
    options: Record<string, any>
  ) => {
    const key = `UciOptions_${engineId}`
    // Replace saved options entirely so removed keys do not persist
    if (options && Object.keys(options).length === 0) {
      if (configData.value[key]) {
        delete configData.value[key]
      }
    } else {
      configData.value[key] = { ...options }
    }
    await saveConfig()
  }

  const clearUciOptions = async (engineId: string) => {
    const key = `UciOptions_${engineId}`
    if (configData.value[key]) {
      delete configData.value[key]
      await saveConfig()
    }
  }

  // --- JAI OPTIONS METHODS ---

  const getJaiOptions = (engineId: string): Record<string, any> => {
    const key = `JaiOptions_${engineId}`
    return configData.value[key] || {}
  }

  const updateJaiOptions = async (
    engineId: string,
    options: Record<string, any>
  ) => {
    const key = `JaiOptions_${engineId}`
    configData.value[key] = { ...(configData.value[key] || {}), ...options }
    await saveConfig()
  }

  const clearJaiOptions = async (engineId: string) => {
    const key = `JaiOptions_${engineId}`
    if (configData.value[key]) {
      delete configData.value[key]
      await saveConfig()
    }
  }

  // Get locale setting
  const getLocale = () => configData.value.locale

  // Update locale setting
  const updateLocale = async (locale: string): Promise<void> => {
    configData.value.locale = locale
    await saveConfig()
  }

  // --- MATCH SETTINGS METHODS ---

  // Get match settings
  const getMatchSettings = () => configData.value.matchSettings

  // Update match settings
  const updateMatchSettings = async (
    settings: Partial<ConfigData['matchSettings']>
  ): Promise<void> => {
    configData.value.matchSettings = {
      ...configData.value.matchSettings,
      ...settings,
    }
    await saveConfig()
  }

  // Human vs AI settings management
  const getHumanVsAiSettings = () => {
    return configData.value.humanVsAiSettings || defaultConfig.humanVsAiSettings
  }

  const updateHumanVsAiSettings = async (
    settings: Partial<ConfigData['humanVsAiSettings']>
  ): Promise<void> => {
    configData.value.humanVsAiSettings = {
      ...configData.value.humanVsAiSettings,
      ...settings,
    }
    await saveConfig()
  }

  // Reset all configuration to defaults
  const resetToDefaults = async (): Promise<void> => {
    configData.value = { ...defaultConfig }
    await saveConfig()
  }

  // Clear all configuration
  const clearAllConfig = async (): Promise<void> => {
    try {
      await invoke('clear_config')
      configData.value = { ...defaultConfig }
    } catch (error) {
      console.error('Failed to clear configuration:', error)
    }
  }

  return {
    // State
    configData,
    isAndroidPlatform,

    // Methods
    loadConfig,
    saveConfig,
    getInterfaceSettings,
    updateInterfaceSettings,
    getWindowSettings,
    updateWindowSettings,
    getEvaluationChartSettings,
    updateEvaluationChartSettings,
    getAnalysisSettings,
    updateAnalysisSettings,
    getGameSettings,
    updateGameSettings,
    getMatchSettings,
    updateMatchSettings,
    getHumanVsAiSettings,
    updateHumanVsAiSettings,
    getEngines,
    saveEngines,
    getLastSelectedEngineId,
    saveLastSelectedEngineId,
    clearLastSelectedEngineId,
    getUciOptions,
    updateUciOptions,
    clearUciOptions,
    getJaiOptions,
    updateJaiOptions,
    clearJaiOptions,
    getLocale,
    updateLocale,
    resetToDefaults,
    clearAllConfig,
  }
}
