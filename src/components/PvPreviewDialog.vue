<template>
  <v-dialog v-model="isVisible" max-width="520" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>{{ title || t('analysis.fullLine') }}</span>
        <v-spacer />
        <span class="step-text">{{ currentStep }} / {{ totalSteps }}</span>
        <v-btn icon variant="text" density="compact" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <div class="preview-board">
          <Chessboard :hide-position-chart="true" :preview-mode="true" />
        </div>
        <div class="preview-controls">
          <v-btn
            icon
            size="small"
            variant="text"
            :disabled="currentStep === 0"
            @click="stepTo(0)"
          >
            <v-icon>mdi-restart</v-icon>
          </v-btn>
          <v-btn
            icon
            size="small"
            variant="text"
            :disabled="currentStep === 0"
            @click="stepTo(currentStep - 1)"
          >
            <v-icon>mdi-step-backward</v-icon>
          </v-btn>
          <v-btn
            icon
            size="small"
            variant="text"
            :disabled="currentStep >= totalSteps"
            @click="stepTo(currentStep + 1)"
          >
            <v-icon>mdi-step-forward</v-icon>
          </v-btn>
          <v-btn
            icon
            size="small"
            variant="text"
            :disabled="currentStep >= totalSteps"
            @click="stepTo(totalSteps)"
          >
            <v-icon>mdi-skip-forward</v-icon>
          </v-btn>
        </div>
        <div class="preview-moves" v-if="moves.length">
          <span
            v-for="(mv, idx) in displayMoves"
            :key="idx"
            :class="['move-chip', { active: idx < currentStep }]"
            @click="stepTo(idx + 1)"
          >
            {{ mv }}
          </span>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { computed, provide, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import Chessboard from './Chessboard.vue'
  import { useChessGame } from '@/composables/useChessGame'
  import { uciToChineseMoves } from '@/utils/chineseNotation'
  import { useInterfaceSettings } from '@/composables/useInterfaceSettings'

  const props = defineProps<{
    modelValue: boolean
    moves: string[]
    rootFen?: string
    title?: string
    initialStep?: number | null
  }>()
  const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

  const { t } = useI18n()

  // Get interface settings for Chinese notation
  const { showChineseNotation, useNewFenFormat } = useInterfaceSettings()

  const isVisible = computed({
    get: () => props.modelValue,
    set: v => emit('update:modelValue', v),
  })

  // Create an isolated game state for preview so it won't affect the main board
  const previewGame = useChessGame()

  // Provide stub engine states required by Chessboard.vue
  const engineState = {
    pvMoves: ref<string[][]>([]),
    bestMove: ref<string | null>(null),
    isThinking: ref(false),
    multiPvMoves: ref<string[][]>([]),
    stopAnalysis: () => {},
    isPondering: ref(false),
    isInfinitePondering: ref(false),
    ponderMove: ref(''),
    ponderhit: ref(false),
    analysis: ref(''),
  }
  const jaiEngineState = {
    analysisInfo: ref(''),
    isMatchRunning: ref(false),
  }

  provide('game-state', previewGame)
  provide('engine-state', engineState)
  provide('jai-engine-state', jaiEngineState)

  const currentStep = ref(0)
  const totalSteps = computed(() => props.moves.length)

  const baseFen = computed(() => (props.rootFen || '').trim())

  // Convert moves to Chinese notation if enabled
  const displayMoves = computed(() => {
    // If Chinese notation is disabled or no FEN/moves, return original UCI
    if (!showChineseNotation.value || !props.rootFen || !props.moves.length) {
      return props.moves
    }

    try {
      // Convert FEN to new format if necessary (Chinese notation parser requires new format)
      let rootFen = props.rootFen
      if (!useNewFenFormat.value && previewGame.convertFenFormat) {
        rootFen = previewGame.convertFenFormat(rootFen, 'new')
      }

      // Use uciToChineseMoves to convert the entire move sequence
      // It accepts a space-separated string and returns an array of Chinese moves
      return uciToChineseMoves(rootFen, props.moves.join(' '))
    } catch (e) {
      console.warn('PV Preview: Failed to convert moves to Chinese notation', e)
      return props.moves
    }
  })

  const runIsolated = (fn: () => void) => {
    const originalDispatch = window.dispatchEvent
    const originalPreviewFlag = (window as any).__PV_PREVIEW_MODE__
    window.dispatchEvent = () => true
    ;(window as any).__PV_PREVIEW_MODE__ = true
    try {
      fn()
    } finally {
      window.dispatchEvent = originalDispatch
      ;(window as any).__PV_PREVIEW_MODE__ = originalPreviewFlag
    }
  }

  const resetBoard = (fen: string) => {
    const fallbackFen = fen || previewGame.initialFen.value || ''
    runIsolated(() => {
      try {
        previewGame.loadFen(fallbackFen, false)
        previewGame.triggerArrowClear?.()
      } catch (e) {
        console.warn('PV preview: failed to load FEN', e)
      }
    })
  }

  const stepTo = (step: number) => {
    const target = Math.max(0, Math.min(step, totalSteps.value))
    resetBoard(baseFen.value)
    runIsolated(() => {
      for (let i = 0; i < target; i++) {
        const mv = props.moves[i]
        if (!mv) break
        // For preview: keep dark pieces hidden by stripping flip/reveal suffixes
        const sanitized = mv.length > 4 ? mv.slice(0, 4) : mv
        previewGame.playMoveFromUci(sanitized)
      }
    })
    currentStep.value = target
  }

  const close = () => {
    emit('update:modelValue', false)
  }

  watch(
    () => isVisible.value,
    visible => {
      if (visible) {
        const desired = props.initialStep ?? (currentStep.value || 0)
        stepTo(desired)
      } else {
        currentStep.value = 0
      }
    },
    { immediate: true }
  )

  // Keep snapshot stable while dialog open; only reset when closed then reopened
  watch(
    () => [props.moves, props.rootFen, props.initialStep],
    () => {
      if (!isVisible.value) {
        currentStep.value = 0
      } else if (
        props.initialStep !== undefined &&
        props.initialStep !== null
      ) {
        stepTo(props.initialStep)
      }
    }
  )
</script>

<style scoped lang="scss">
  .preview-board {
    width: 360px;
    max-width: 100%;
    /* Increased bottom margin to 60px to prevent overlap with Chessboard's absolute-positioned buttons */
    margin: 0 auto 60px auto;
  }

  .preview-controls {
    display: flex;
    gap: 6px;
    justify-content: center;
    margin: 10px 0 12px 0;
  }

  .preview-moves {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: center;
    max-height: 140px;
    overflow-y: auto;
    padding: 4px;
    border: 1px solid rgba(var(--v-border-color), 0.1);
    border-radius: 4px;
  }

  .move-chip {
    padding: 2px 8px;
    border-radius: 12px;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    background: rgba(var(--v-theme-surface), 0.6);
    font-size: 12px;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;
  }

  .move-chip:hover {
    background: rgba(var(--v-theme-primary), 0.15);
    border-color: rgba(var(--v-theme-primary), 0.6);
  }

  .move-chip.active {
    background: rgba(var(--v-theme-primary), 0.1);
    border-color: rgba(var(--v-theme-primary), 0.5);
  }

  .step-text {
    font-size: 12px;
    color: rgba(var(--v-theme-on-surface), 0.7);
    margin-right: 8px;
  }
</style>
