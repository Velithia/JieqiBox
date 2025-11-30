<template>
  <v-dialog v-model="dialogVisible" max-width="700" persistent>
    <v-card>
      <v-card-title class="headline d-flex justify-space-between align-center">
        <span>{{ $t('linker.title') }}</span>
        <v-btn icon="mdi-close" variant="text" @click="close" />
      </v-card-title>

      <v-card-text>
        <div class="status-section mb-4">
          <v-chip
            :color="statusColor"
            variant="elevated"
            size="small"
            class="mr-2"
          >
            <v-icon start size="small">{{ statusIcon }}</v-icon>
            {{ linker.statusText.value }}
          </v-chip>
          <v-chip
            v-if="linker.selectedWindow.value"
            variant="outlined"
            size="small"
          >
            {{ linker.selectedWindow.value.name }}
          </v-chip>
        </div>

        <v-radio-group
          v-model="linker.mode.value"
          inline
          :disabled="linker.isActive.value"
          class="mb-4"
        >
          <v-radio :label="$t('linker.mode.auto')" value="auto" />
          <v-radio :label="$t('linker.mode.watch')" value="watch" />
        </v-radio-group>

        <!-- Messages -->
        <v-alert
          v-if="linker.state.value === 'idle'"
          type="info"
          variant="tonal"
          class="mb-4"
          >{{ $t('linker.instructions.idle') }}</v-alert
        >
        <v-alert
          v-else-if="linker.state.value === 'selecting'"
          type="warning"
          variant="tonal"
          class="mb-4"
          >{{ $t('linker.instructions.selecting') }}</v-alert
        >
        <v-alert
          v-else-if="linker.state.value === 'connecting'"
          type="success"
          variant="tonal"
          class="mb-4"
          >{{ $t('linker.instructions.connected') }}</v-alert
        >
        <v-alert
          v-else-if="linker.state.value === 'error'"
          type="error"
          variant="tonal"
          class="mb-4"
          >{{ linker.errorMessage.value }}</v-alert
        >

        <!-- Window Selection -->
        <div v-if="linker.state.value === 'selecting'" class="window-section">
          <div class="d-flex align-center mb-2">
            <span class="text-subtitle-2">{{ $t('linker.selectWindow') }}</span>
            <v-spacer />
            <v-btn
              size="small"
              variant="text"
              @click="refreshWindows"
              :loading="isRefreshing"
            >
              <v-icon start>mdi-refresh</v-icon> {{ $t('common.refresh') }}
            </v-btn>
          </div>
          <v-list density="compact" class="window-list" max-height="250">
            <v-list-item
              v-for="window in linker.availableWindows.value"
              :key="window.id"
              :active="linker.selectedWindowId.value === window.id"
              @click="selectWindow(window)"
              rounded="lg"
            >
              <template #prepend><v-icon>mdi-application</v-icon></template>
              <v-list-item-title>{{ window.name }}</v-list-item-title>
              <v-list-item-subtitle
                >{{ window.width }} x {{ window.height }}</v-list-item-subtitle
              >
            </v-list-item>
          </v-list>
        </div>

        <!-- Preview -->
        <div
          v-if="
            linker.state.value === 'connecting' ||
            linker.state.value === 'paused'
          "
          class="board-section mt-4"
        >
          <div class="d-flex align-center mb-2">
            <span class="text-subtitle-2">{{ $t('linker.boardPreview') }}</span>
            <v-spacer />
            <v-btn
              size="small"
              variant="text"
              @click="capturePreview"
              :loading="isCapturing"
            >
              <v-icon start>mdi-camera</v-icon> {{ $t('linker.capture') }}
            </v-btn>
          </div>
          <div v-if="previewImageUrl" class="preview-container">
            <img
              :src="previewImageUrl"
              class="preview-image"
              alt="Board preview"
            />
          </div>
          <div v-if="recognizedFen" class="fen-section mt-2">
            <v-text-field
              v-model="recognizedFen"
              label="FEN"
              readonly
              variant="outlined"
              density="compact"
              hide-details
              append-inner-icon="mdi-content-copy"
              @click:append-inner="copyFen"
            />
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-btn
          v-if="linker.state.value === 'idle'"
          color="primary"
          @click="handleStart"
          >{{ $t('linker.start') }}</v-btn
        >
        <v-btn
          v-else-if="
            linker.state.value === 'selecting' && linker.selectedWindowId.value
          "
          color="success"
          @click="handleConnect"
          ><v-icon start>mdi-link</v-icon>{{ $t('linker.connect') }}</v-btn
        >
        <v-btn
          v-else-if="linker.state.value === 'connecting'"
          color="warning"
          @click="handlePause"
          ><v-icon start>mdi-pause</v-icon>{{ $t('linker.pause') }}</v-btn
        >
        <v-btn
          v-else-if="linker.state.value === 'paused'"
          color="success"
          @click="handleResume"
          ><v-icon start>mdi-play</v-icon>{{ $t('linker.resume') }}</v-btn
        >
        <v-btn
          v-if="
            linker.state.value === 'connecting' ||
            linker.state.value === 'paused'
          "
          color="error"
          variant="text"
          @click="handleStop"
          ><v-icon start>mdi-stop</v-icon>{{ $t('linker.stop') }}</v-btn
        >
        <v-btn
          v-if="
            linker.state.value === 'connecting' ||
            linker.state.value === 'paused'
          "
          color="info"
          variant="text"
          @click="handleForceMyTurn"
          ><v-icon start>mdi-account-switch</v-icon
          >{{ $t('linker.forceMyTurn') }}</v-btn
        >
        <v-spacer />
        <v-btn variant="text" @click="showSettings = true"
          ><v-icon start>mdi-cog</v-icon>{{ $t('linker.settings') }}</v-btn
        >
      </v-card-actions>
    </v-card>
    <LinkerSettingsDialog
      v-model="showSettings"
      :settings="linker.settings.value"
      @update:settings="linker.updateSettings"
      @reset="linker.resetSettings"
    />
  </v-dialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch, inject } from 'vue'
  import { useLinker, type WindowInfo } from '../composables/useLinker'
  import { useImageRecognition } from '../composables/image-recognition'
  import { useConfigManager } from '../composables/useConfigManager'
  import LinkerSettingsDialog from './LinkerSettingsDialog.vue'

  const props = defineProps<{ modelValue: boolean }>()
  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'boardInitialized', fen: string, isReversed: boolean): void
  }>()

  const gameState = inject('game-state') as any
  const engineState = inject('engine-state') as any
  const configManager = useConfigManager()

  // Use the existing image recognition
  const imageRecognition = useImageRecognition()
  // Pass it to linker
  const linker = useLinker({ imageRecognition })

  const showSettings = ref(false)
  const isRefreshing = ref(false)
  const isCapturing = ref(false)
  const previewImageUrl = ref<string | null>(null)
  const recognizedFen = ref<string | null>(null)

  const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value),
  })

  const statusColor = computed(() => {
    switch (linker.state.value) {
      case 'idle':
        return 'grey'
      case 'selecting':
        return 'warning'
      case 'connecting':
        return 'success'
      case 'paused':
        return 'info'
      case 'error':
        return 'error'
      default:
        return 'grey'
    }
  })

  const statusIcon = computed(() => {
    switch (linker.state.value) {
      case 'connecting':
        return linker.isScanning.value ? 'mdi-radar' : 'mdi-link'
      case 'paused':
        return 'mdi-pause-circle'
      case 'error':
        return 'mdi-alert-circle'
      default:
        return 'mdi-link-off'
    }
  })

  // Setup callbacks
  // ★★★ 新架构：通过FEN直接更新内部棋盘，由外部扫描结果决定棋子状态 ★★★
  linker.setCallbacks({
    onBoardUpdated: (fen: string) => {
      // 每次外部棋盘变化后，用扫描结果的FEN更新内部棋盘
      if (gameState?.confirmFenInput) {
        console.log(`[LinkerDialog] 更新内部棋盘: ${fen}`)
        gameState.confirmFenInput(fen)
      }
    },
    onBoardInitialized: (fen: string, isReversed: boolean) => {
      emit('boardInitialized', fen, isReversed)
      recognizedFen.value = fen
      if (gameState?.confirmFenInput) {
        gameState.confirmFenInput(fen)
      }
    },
    getEngineBestMove: (): string | null => {
      // 直接返回引擎的 bestMove，不要做任何判断
      if (engineState?.bestMove?.value) {
        return engineState.bestMove.value
      }
      return null
    },
    isEngineThinking: () => {
      return engineState?.isThinking?.value || false
    },
    requestEngineStart: () => {
      if (!engineState?.isEngineLoaded?.value) return
      if (engineState.isThinking.value) return

      // Use configured analysis settings instead of hardcoded values
      const analysisSettings = configManager.getAnalysisSettings()
      console.log(
        `[LinkerDialog] 触发引擎分析, movetime=${analysisSettings.movetime}ms, mode=${analysisSettings.analysisMode}`
      )

      if (typeof engineState.startAnalysis === 'function') {
        engineState.startAnalysis({
          movetime: analysisSettings.movetime,
          maxThinkTime: analysisSettings.maxThinkTime,
          maxDepth: analysisSettings.maxDepth,
          maxNodes: analysisSettings.maxNodes,
          analysisMode: analysisSettings.analysisMode,
          advancedScript: analysisSettings.advancedScript,
        })
      }
    },
    stopEngine: () => {
      if (engineState?.stopAnalysis) {
        console.log('[LinkerDialog] 停止引擎分析')
        engineState.stopAnalysis()
      }
    },
  })

  const refreshWindows = async () => {
    isRefreshing.value = true
    try {
      await linker.refreshWindowList()
    } finally {
      isRefreshing.value = false
    }
  }

  const selectWindow = (window: WindowInfo) => {
    linker.selectWindow(window.id)
  }

  const capturePreview = async () => {
    isCapturing.value = true
    try {
      const result = await linker.captureAndProcess()
      if (result) {
        recognizedFen.value = linker.boardToFen(result.board, true)
      }
    } finally {
      isCapturing.value = false
    }
  }

  const copyFen = async () => {
    if (recognizedFen.value) {
      try {
        await navigator.clipboard.writeText(recognizedFen.value)
      } catch (error) {
        console.error(error)
      }
    }
  }

  const handleStart = async () => {
    await linker.start()
  }
  const handleConnect = async () => {
    await linker.connect()
  }
  const handlePause = () => {
    linker.pause()
  }
  const handleResume = () => {
    linker.resume()
  }
  const handleStop = () => {
    linker.stop()
    previewImageUrl.value = null
    recognizedFen.value = null
  }
  const handleForceMyTurn = () => {
    linker.forceMyTurn()
  }

  const close = () => {
    dialogVisible.value = false
  }

  watch(dialogVisible, newValue => {
    if (!newValue) {
      if (previewImageUrl.value) {
        URL.revokeObjectURL(previewImageUrl.value)
        previewImageUrl.value = null
      }
    }
  })
</script>

<style scoped lang="scss">
  .status-section {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .window-section {
    margin-top: 16px;
  }

  .window-list {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 8px;
    overflow-y: auto;
  }

  .board-section {
    margin-top: 16px;
  }

  .preview-container {
    position: relative;
    display: flex;
    justify-content: center;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 8px;
    padding: 8px;
    background: rgba(var(--v-theme-surface-variant), 0.3);
  }

  .preview-image {
    max-width: 100%;
    max-height: 300px;
    object-fit: contain;
    border-radius: 4px;
  }

  .fen-section {
    margin-top: 8px;
  }
</style>
