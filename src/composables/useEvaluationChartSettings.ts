import { ref, watch } from 'vue'
import { useConfigManager } from './useConfigManager'

// Configuration manager
const configManager = useConfigManager()

/**
 * Get initial settings from the config manager
 * @returns {object} - Object containing initial values for evaluation chart settings
 */
const getInitialSettings = () => {
  // Only access in client environment
  if (typeof window === 'undefined') {
    return {
      showMoveLabels: true,
      useLinearYAxis: false,
      showOnlyLines: false,
      blackPerspective: false,
      enableYAxisClamp: false,
      yAxisClampValue: 500,
    }
  }

  try {
    const settings = configManager.getEvaluationChartSettings()
    return {
      showMoveLabels: settings.showMoveLabels !== false, // Default to true
      useLinearYAxis: !!settings.useLinearYAxis, // Default to false
      showOnlyLines: !!settings.showOnlyLines, // Default to false
      blackPerspective: !!settings.blackPerspective, // Default to false
      enableYAxisClamp: !!settings.enableYAxisClamp, // Default to false
      yAxisClampValue: settings.yAxisClampValue || 500, // Default to 500
      colorScheme: settings.colorScheme || 'default', // Default to 'default'
    }
  } catch (e) {
    console.error('Failed to get evaluation chart settings:', e)
    // Return default values on error
    return {
      showMoveLabels: true,
      useLinearYAxis: false,
      showOnlyLines: false,
      blackPerspective: false,
      enableYAxisClamp: false,
      yAxisClampValue: 500,
      colorScheme: 'default',
    }
  }
}

// Create reactive references shared across the application
const {
  showMoveLabels: initialShowMoveLabels,
  useLinearYAxis: initialUseLinearYAxis,
  showOnlyLines: initialShowOnlyLines,
  blackPerspective: initialBlackPerspective,
  enableYAxisClamp: initialEnableYAxisClamp,
  yAxisClampValue: initialYAxisClampValue,
  colorScheme: initialColorScheme,
} = getInitialSettings()

const showMoveLabels = ref<boolean>(initialShowMoveLabels)
const useLinearYAxis = ref<boolean>(initialUseLinearYAxis)
const showOnlyLines = ref<boolean>(initialShowOnlyLines)
const blackPerspective = ref<boolean>(initialBlackPerspective)
const enableYAxisClamp = ref<boolean>(initialEnableYAxisClamp)
const yAxisClampValue = ref<number>(initialYAxisClampValue)
const colorScheme = ref<string>(initialColorScheme || 'default')

// Flag to track if config is loaded
const isConfigLoaded = ref(false)

// Watch for changes and persist to config file
watch(
  [
    showMoveLabels,
    useLinearYAxis,
    showOnlyLines,
    blackPerspective,
    enableYAxisClamp,
    yAxisClampValue,
    colorScheme,
  ],
  async ([
    newShowMoveLabels,
    newUseLinearYAxis,
    newShowOnlyLines,
    newBlackPerspective,
    newEnableYAxisClamp,
    newYAxisClampValue,
    newColorScheme,
  ]) => {
    // Only save if config is already loaded to avoid overwriting during initialization
    if (!isConfigLoaded.value) return

    const settings = {
      showMoveLabels: newShowMoveLabels,
      useLinearYAxis: newUseLinearYAxis,
      showOnlyLines: newShowOnlyLines,
      blackPerspective: newBlackPerspective,
      enableYAxisClamp: newEnableYAxisClamp,
      yAxisClampValue: newYAxisClampValue,
      colorScheme: newColorScheme,
    }

    try {
      await configManager.updateEvaluationChartSettings(settings)
    } catch (error) {
      console.error('Failed to save evaluation chart settings:', error)
    }
  }
)

// Evaluation chart settings composable
export function useEvaluationChartSettings() {
  // Load configuration and update reactive refs
  const loadSettings = async () => {
    try {
      await configManager.loadConfig()
      const settings = configManager.getEvaluationChartSettings()

      // Update reactive refs
      showMoveLabels.value = settings.showMoveLabels !== false
      useLinearYAxis.value = !!settings.useLinearYAxis
      showOnlyLines.value = !!settings.showOnlyLines
      blackPerspective.value = !!settings.blackPerspective
      enableYAxisClamp.value = !!settings.enableYAxisClamp
      yAxisClampValue.value = settings.yAxisClampValue || 500
      colorScheme.value = settings.colorScheme || 'default'

      isConfigLoaded.value = true
    } catch (error) {
      console.error('Failed to load evaluation chart settings:', error)
      isConfigLoaded.value = true // Still mark as loaded to enable saving
    }
  }

  // Initialize settings on first import
  if (typeof window !== 'undefined') {
    loadSettings()
  }

  return {
    showMoveLabels,
    useLinearYAxis,
    showOnlyLines,
    blackPerspective,
    enableYAxisClamp,
    yAxisClampValue,
    colorScheme,
    loadSettings,
  }
}
