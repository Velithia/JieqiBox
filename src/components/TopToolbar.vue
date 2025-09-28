<template>
  <div class="top-toolbar">
    <div class="toolbar-left">
      <v-btn
        icon="mdi-chess-king"
        size="small"
        color="teal"
        variant="text"
        @click="setupNewGame"
        :disabled="isMatchRunning"
        :title="$t('toolbar.newGame')"
      />
      <v-btn
        icon="mdi-pencil-box"
        size="small"
        color="amber"
        variant="text"
        @click="handleEditPosition"
        :disabled="isMatchRunning"
        :title="$t('toolbar.editPosition')"
      />
      <v-btn
        icon="mdi-view-dashboard-outline"
        size="small"
        color="lime"
        variant="text"
        @click="showInterfaceSettingsDialog = true"
        :title="$t('toolbar.interfaceSettings')"
      />
      <!-- Dark mode toggle button -->
      <v-btn
        :icon="darkMode ? 'mdi-weather-sunny' : 'mdi-weather-night'"
        size="small"
        :color="darkMode ? 'orange' : 'blue-grey'"
        variant="text"
        @click="toggleDarkMode"
        :title="darkMode ? $t('toolbar.lightMode') : $t('toolbar.darkMode')"
      />
      <v-btn
        icon="mdi-content-save"
        size="small"
        color="success"
        variant="text"
        @click="handleSaveNotation"
        :loading="isSaving"
        :title="$t('toolbar.saveNotation')"
      />
      <v-btn
        icon="mdi-clipboard-text"
        size="small"
        color="cyan"
        variant="text"
        @click="showNotationTextDialog = true"
        :disabled="isMatchRunning"
        :title="$t('toolbar.viewPasteNotation')"
      />
      <v-btn
        icon="mdi-book-open-variant"
        size="small"
        color="deep-purple"
        variant="text"
        @click="showOpeningBookDialog = true"
        :title="$t('toolbar.openingBook')"
      />
    </div>

    <div class="toolbar-center">
      <span class="game-title">{{ $t('toolbar.gameTitle') }}</span>
    </div>

    <div class="toolbar-right">
      <v-btn
        icon="mdi-cog"
        size="small"
        color="purple"
        variant="text"
        @click="showUciOptionsDialog = true"
        :disabled="isAnalyzing || engineState.isPondering?.value"
        :title="$t('toolbar.uciSettings')"
      />
      <v-btn
        icon="mdi-timer"
        size="small"
        color="indigo"
        variant="text"
        @click="showTimeDialog = true"
        :title="$t('toolbar.analysisParams')"
      />
      <v-btn
        icon="mdi-clipboard-pulse"
        size="small"
        color="deep-orange"
        variant="text"
        @click="showReviewDialog = true"
        :disabled="isMatchRunning || isAnalyzing"
        :title="$t('toolbar.reviewAnalysis')"
      />
      <v-btn
        icon="mdi-close-circle"
        size="small"
        color="deep-purple"
        variant="text"
        @click="handleVariation"
        :disabled="!isVariationAvailable"
        :title="$t('toolbar.variation')"
      />
      <v-btn
        icon="mdi-ray-start-arrow"
        size="small"
        color="green"
        variant="text"
        @click="handleAnalyzeDrawings"
        :disabled="!isAnalyzeDrawingsAvailable"
        :title="$t('toolbar.analyzeDrawings')"
      />
      <v-btn
        icon="mdi-folder-open"
        size="small"
        color="blue-grey"
        variant="text"
        @click="handleOpenNotation"
        :loading="isOpening"
        :disabled="isMatchRunning"
        :title="$t('toolbar.openNotation')"
      />
      <LanguageSelector />
    </div>

    <!-- Dialog components -->
    <UciOptionsDialog
      v-model="showUciOptionsDialog"
      :engine-id="currentEngineId"
    />
    <TimeDialog
      v-model="showTimeDialog"
      @settings-changed="handleSettingsChanged"
    />
    <PositionEditorDialog
      v-model="showPositionEditor"
      @position-changed="handlePositionChanged"
    />
    <InterfaceSettingsDialog v-model="showInterfaceSettingsDialog" />
    <NotationTextDialog
      v-model="showNotationTextDialog"
      @apply="handleApplyNotationText"
    />

    <ReviewAnalysisDialog v-model="showReviewDialog" />
    <OpeningBookDialog v-model="showOpeningBookDialog" />
  </div>
</template>

<script setup lang="ts">
  import { ref, inject, computed, onUnmounted, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import UciOptionsDialog from './UciOptionsDialog.vue'
  import TimeDialog from './TimeDialog.vue'
  import PositionEditorDialog from './PositionEditorDialog.vue'
  import LanguageSelector from './LanguageSelector.vue'
  import InterfaceSettingsDialog from './InterfaceSettingsDialog.vue'
  import NotationTextDialog from './NotationTextDialog.vue'
  import ReviewAnalysisDialog from './ReviewAnalysisDialog.vue'
  import OpeningBookDialog from './OpeningBookDialog.vue'
  import { useInterfaceSettings } from '../composables/useInterfaceSettings'

  const { t } = useI18n()
  const gameState: any = inject('game-state')
  const engineState: any = inject('engine-state')

  // Inject JAI engine state for tournament mode support
  const jaiEngine = inject('jai-engine-state') as any

  // Get dark mode setting from interface settings
  const { darkMode } = useInterfaceSettings()

  // Dialog states
  const showUciOptionsDialog = ref(false)
  const showTimeDialog = ref(false)
  const showPositionEditor = ref(false)
  const showInterfaceSettingsDialog = ref(false)
  const showNotationTextDialog = ref(false)
  const showReviewDialog = ref(false)
  const showOpeningBookDialog = ref(false)

  // State for variation restart logic
  const isWaitingToRestartForVariation = ref(false)
  const variationRestartData = ref<{ fen: string; moves: string[] } | null>(
    null
  )

  // Save/Open states
  const isSaving = ref(false)
  const isOpening = ref(false)
  const isApplyingText = ref(false)

  // Review analysis managed in ReviewAnalysisDialog

  // Analysis settings
  const analysisSettings = ref({
    movetime: 1000,
    maxThinkTime: 5000,
    maxDepth: 20,
    maxNodes: 1000000,
    analysisMode: 'movetime',
  })

  // Variation analysis state
  const excludedMoves = ref<string[]>([])
  // Drawings analysis state
  const isWaitingToRestartForDrawings = ref(false)
  const drawingsRestartData = ref<{ fen: string; moves: string[] } | null>(null)

  // Check if engine is currently analyzing (including pondering)
  const isAnalyzing = computed(() => engineState.isThinking?.value)

  // Check if match is running to disable certain interactions
  const isMatchRunning = computed(() => {
    return jaiEngine?.isMatchRunning?.value || false
  })

  // Get the currently loaded engine's ID
  const currentEngineId = computed(
    () => engineState.currentEngine?.value?.id || ''
  )

  // Computed property to determine if variation button should be enabled
  const isVariationAvailable = computed(
    () =>
      isAnalyzing.value &&
      engineState.pvMoves?.value?.length > 0 &&
      engineState.pvMoves.value[0]
  )

  // Enable drawings analysis only during analysis
  const isAnalyzeDrawingsAvailable = computed(() => isAnalyzing.value)

  // Toggle dark mode function
  const toggleDarkMode = () => {
    darkMode.value = !darkMode.value
  }

  // Handle variation button click
  const handleVariation = () => {
    console.log(`[DEBUG] Variation: Button clicked`)
    console.log(
      `[DEBUG] Variation: isAnalyzing=${isAnalyzing.value}, pvMoves=`,
      engineState.pvMoves?.value
    )

    if (!isAnalyzing.value || !engineState.pvMoves?.value?.length) {
      console.log(
        `[DEBUG] Variation: Early exit - not analyzing or no PV moves`
      )
      return
    }

    // Get the first move from current PV
    const firstPvMove = engineState.pvMoves.value[0]
    console.log(`[DEBUG] Variation: First PV move=${firstPvMove}`)
    if (!firstPvMove) {
      console.log(`[DEBUG] Variation: No first PV move available`)
      return
    }

    // Add to excluded moves list
    if (!excludedMoves.value.includes(firstPvMove)) {
      excludedMoves.value.push(firstPvMove)
    }
    console.log(`[DEBUG] Variation: Excluded moves list=`, excludedMoves.value)

    // Get all legal moves for current position
    const allLegalMoves = gameState.getAllLegalMovesForCurrentPosition()
    console.log(
      `[DEBUG] Variation: All legal moves (${allLegalMoves.length}):`,
      allLegalMoves
    )

    // Filter out excluded moves
    const allowedMoves = allLegalMoves.filter(
      (move: string) => !excludedMoves.value.includes(move)
    )
    console.log(
      `[DEBUG] Variation: Allowed moves after filtering (${allowedMoves.length}):`,
      allowedMoves
    )

    if (allowedMoves.length === 0) {
      alert(t('toolbar.noMoreVariations'))
      console.log(`[DEBUG] Variation: No allowed moves remaining`)
      return
    }

    console.log(
      `[DEBUG] Variation: Excluding move '${firstPvMove}', allowed moves:`,
      allowedMoves
    )

    // Set state to restart analysis once engine stops
    variationRestartData.value = {
      fen: gameState.generateFen(),
      moves: allowedMoves,
    }
    isWaitingToRestartForVariation.value = true

    // Stop current analysis first
    console.log(
      `[DEBUG] Variation: STOPPING current analysis to restart for variation.`
    )
    engineState.stopAnalysis({ playBestMoveOnStop: false })
  }

  // Handle analyze drawings button click
  const handleAnalyzeDrawings = () => {
    if (!isAnalyzing.value) return

    // 1) Get user-drawn arrow moves (UCI)
    const arrowMoves: string[] = gameState.getUserArrowMovesUci
      ? gameState.getUserArrowMovesUci()
      : []

    // 2) Get all legal moves for current position
    const allLegalMoves: string[] = gameState.getAllLegalMovesForCurrentPosition
      ? gameState.getAllLegalMovesForCurrentPosition()
      : []

    // 3) Intersect arrow moves with legal moves
    const arrowSet = new Set(arrowMoves)
    const filteredMoves = allLegalMoves.filter(m => arrowSet.has(m))

    if (filteredMoves.length === 0) {
      alert(t('toolbar.noDrawingMoves'))
      return
    }

    // 4) Prepare restart with restricted searchmoves
    drawingsRestartData.value = {
      fen: gameState.generateFen(),
      moves: filteredMoves,
    }
    isWaitingToRestartForDrawings.value = true

    // 5) Stop current analysis first
    engineState.stopAnalysis({ playBestMoveOnStop: false })
  }

  // Watch for engine to stop and handle variation restart or state reset
  watch(engineState.isThinking, (thinking, wasThinking) => {
    // Case 1: We were waiting for a variation restart, and the engine has now stopped.
    if (
      wasThinking &&
      !thinking &&
      isWaitingToRestartForVariation.value &&
      variationRestartData.value
    ) {
      console.log(
        `[DEBUG] Variation: Engine has stopped. RESTARTING analysis for variation.`
      )

      const { fen, moves } = variationRestartData.value

      const infiniteSettings = {
        movetime: 0,
        maxThinkTime: 0,
        maxDepth: 0,
        maxNodes: 0,
        analysisMode: 'infinite',
      }

      console.log(
        `[DEBUG] Variation: Starting infinite analysis with ${moves.length} searchmoves.`
      )
      engineState.startAnalysis(infiniteSettings, [], fen, moves)

      // Reset waiting state, but keep excludedMoves for the current variation sequence
      isWaitingToRestartForVariation.value = false
      variationRestartData.value = null
    }
    // Drawings analysis restart
    else if (
      wasThinking &&
      !thinking &&
      isWaitingToRestartForDrawings.value &&
      drawingsRestartData.value
    ) {
      const { fen, moves } = drawingsRestartData.value
      const infiniteSettings = {
        movetime: 0,
        maxThinkTime: 0,
        maxDepth: 0,
        maxNodes: 0,
        analysisMode: 'infinite',
      }
      engineState.startAnalysis(infiniteSettings, [], fen, moves)
      isWaitingToRestartForDrawings.value = false
      drawingsRestartData.value = null
    }
    // Case 2: Analysis has stopped for any other reason (e.g., manual stop, new game, etc.)
    // We check `!isWaitingToRestartForVariation` to avoid resetting during a variation sequence.
    else if (
      wasThinking &&
      !thinking &&
      !isWaitingToRestartForVariation.value
    ) {
      console.log(
        `[DEBUG] Variation: Analysis stopped. Resetting variation state.`
      )
      resetVariationState()
    }
  })

  // Reset all variation-related states
  const resetVariationState = () => {
    console.log(`[DEBUG] Variation: Full state reset initiated.`)
    excludedMoves.value = []
    isWaitingToRestartForVariation.value = false
    variationRestartData.value = null
    // Also clear any active searchmoves restrictions in the engine state
    if (engineState.clearSearchMoves) {
      console.log(
        `[DEBUG] Variation: Clearing searchmoves array in engine state.`
      )
      engineState.clearSearchMoves()
    }
    // Also reset drawings state
    isWaitingToRestartForDrawings.value = false
    drawingsRestartData.value = null
  }

  // Listen for position changes to reset variation state
  window.addEventListener('force-stop-ai', resetVariationState)

  // Handle edit position button click
  const handleEditPosition = () => {
    // Disable during match running
    if (isMatchRunning.value) {
      return
    }
    showPositionEditor.value = true
  }

  // New game - stop engine analysis before starting new game
  const setupNewGame = () => {
    // Disable during match running
    if (isMatchRunning.value) {
      return
    }
    // Stop engine analysis before starting new game to prevent continued thinking
    if (engineState.stopAnalysis) {
      engineState.stopAnalysis()
    }
    // Reset variation state when starting new game
    resetVariationState()
    gameState.setupNewGame()
  }

  // Save notation
  const handleSaveNotation = async () => {
    isSaving.value = true
    try {
      await gameState.saveGameNotation()
    } catch (error) {
      console.error(t('errors.saveNotationFailed'), error)
    } finally {
      isSaving.value = false
    }
  }

  // Open notation - stop engine analysis before loading new game
  const handleOpenNotation = () => {
    // Disable during match running
    if (isMatchRunning.value) {
      return
    }
    // Stop engine analysis before loading new game to prevent continued thinking
    if (engineState.stopAnalysis) {
      engineState.stopAnalysis()
    }
    // Reset variation state when opening notation
    resetVariationState()
    isOpening.value = true
    try {
      gameState.openGameNotation()
    } catch (error) {
      console.error(t('errors.openNotationFailed'), error)
    } finally {
      isOpening.value = false
    }
  }

  // Apply notation from pasted JSON text
  const handleApplyNotationText = async (text: string) => {
    if (isMatchRunning.value) return
    // Stop engine and reset variation state
    if (engineState.stopAnalysis) {
      engineState.stopAnalysis()
    }
    resetVariationState()
    isApplyingText.value = true
    try {
      await gameState.loadGameNotationFromText(text)
    } catch (error) {
      console.error(t('errors.openNotationFailed'), error)
    } finally {
      isApplyingText.value = false
    }
  }

  // Handle analysis settings changes
  const handleSettingsChanged = async (settings: any) => {
    // console.log('TopToolbar: 收到设置变化:', settings);
    analysisSettings.value = settings
    // Save to config file immediately to ensure AnalysisSidebar detects the change
    try {
      const { useConfigManager } = await import(
        '../composables/useConfigManager'
      )
      const configManager = useConfigManager()
      await configManager.updateAnalysisSettings(settings)
    } catch (error) {
      console.error('Failed to save analysis settings:', error)
    }
  }

  // Handle position changes - stop engine analysis when position is edited
  const handlePositionChanged = (
    _pieces: any[],
    _sideToMove: 'red' | 'black'
  ) => {
    // Stop engine analysis when position is edited to prevent continued thinking
    if (engineState.stopAnalysis) {
      engineState.stopAnalysis()
    }
    // Reset variation state when position changes
    resetVariationState()
    // Callback after position editing is complete
  }

  // Clean up event listener when component is unmounted
  onUnmounted(() => {
    window.removeEventListener('force-stop-ai', resetVariationState)
  })
</script>

<style lang="scss" scoped>
  .top-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    border-bottom: 1px solid
      rgba(var(--v-border-color), var(--v-border-opacity));
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    background-color: rgb(var(--v-theme-surface));

    // Mobile responsive adjustments
    @media (max-width: 768px) {
      padding: 6px 12px;
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  .toolbar-left,
  .toolbar-right {
    display: flex;
    gap: 4px;
    align-items: center;

    // Mobile responsive adjustments
    @media (max-width: 768px) {
      gap: 2px;

      .v-btn {
        font-size: 12px;
      }
    }
  }

  .toolbar-center {
    flex: 1;
    text-align: center;
  }

  .game-title {
    font-size: 18px;
    font-weight: 600;

    // Mobile responsive adjustments
    @media (max-width: 768px) {
      font-size: 16px;
    }
  }
</style>
