<template>
  <v-dialog
    v-model="isVisible"
    :max-width="isMobile ? '95vw' : '900px'"
    persistent
    class="uci-terminal-dialog"
  >
    <v-card class="terminal-card">
      <v-card-title class="dialog-title">
        <span class="title-text">{{ t('uciTerminal.title') }}</span>
        <v-spacer></v-spacer>
        <v-btn icon @click="closeDialog" class="close-btn">
          <v-icon :color="isDark ? 'white' : 'black'">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="terminal-container">
        <div v-if="!isEngineLoaded" class="no-engine-section">
          <v-icon size="48" color="grey">mdi-engine-off</v-icon>
          <p class="no-engine-text">{{ t('uciTerminal.noEngineLoaded') }}</p>
          <p class="no-engine-subtext">
            {{ t('uciTerminal.pleaseLoadEngineFirst') }}
          </p>
        </div>

        <div v-else class="terminal-content">
          <!-- Terminal Output Area -->
          <div class="terminal-output" ref="terminalOutput">
            <div
              v-for="(line, index) in terminalLines"
              :key="index"
              :class="['terminal-line', line.type]"
            >
              <span v-if="line.type === 'command'" class="prompt">> </span>
              <span class="line-content">{{ line.content }}</span>
            </div>
          </div>

          <!-- Command Input Area -->
          <div class="terminal-input-area">
            <div class="input-wrapper">
              <span class="prompt">> </span>
              <v-text-field
                v-model="currentCommand"
                @keyup.enter="sendCommand"
                @keyup.up="previousCommand"
                @keyup.down="nextCommand"
                :placeholder="t('uciTerminal.enterCommand')"
                variant="solo"
                density="compact"
                hide-details
                class="command-input"
                ref="commandInput"
              ></v-text-field>
              <v-btn
                @click="sendCommand"
                :disabled="!currentCommand.trim()"
                size="small"
                class="send-btn"
                icon="mdi-send"
              ></v-btn>
            </div>
          </div>

          <!-- Quick Commands -->
          <div class="quick-commands">
            <div class="quick-commands-title">
              {{ t('uciTerminal.quickCommands') }}:
            </div>
            <div class="quick-commands-buttons">
              <v-chip
                v-for="cmd in quickCommands"
                :key="cmd"
                @click="executeQuickCommand(cmd)"
                size="small"
                variant="outlined"
                class="quick-cmd-chip"
              >
                {{ cmd }}
              </v-chip>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="terminal-actions">
        <v-spacer></v-spacer>
        <v-btn
          @click="clearTerminal"
          color="grey"
          size="small"
          class="action-btn"
        >
          {{ t('uciTerminal.clear') }}
        </v-btn>
        <v-btn
          @click="closeDialog"
          color="grey"
          size="small"
          class="close-action-btn"
        >
          {{ t('common.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import {
    ref,
    computed,
    onMounted,
    onUnmounted,
    nextTick,
    watch,
    inject,
  } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useTheme } from 'vuetify'

  interface TerminalLine {
    type: 'command' | 'response' | 'error'
    content: string
    timestamp: Date
  }

  // Component properties definition
  interface Props {
    modelValue: boolean
  }

  const props = withDefaults(defineProps<Props>(), {})

  // Component events definition
  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
  }>()

  // Inject engine state
  const engineState = inject('engine-state') as any
  const { isEngineLoaded, engineOutput } = engineState

  // Use i18n
  const { t } = useI18n()

  // Theme detection
  const theme = useTheme()
  const isDark = computed(() => theme.global.current.value.dark)

  // Reactive data
  const terminalLines = ref<TerminalLine[]>([])
  const currentCommand = ref('')
  const commandHistory = ref<string[]>([])
  const historyIndex = ref(-1)
  const lastProcessedOutputIndex = ref(-1)

  // Refs
  const terminalOutput = ref<HTMLElement | null>(null)
  const commandInput = ref<any>(null)

  // Detect if the device is mobile
  const isMobile = computed(() => {
    return window.innerWidth <= 768
  })

  // Computed property - dialog visibility state
  const isVisible = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value),
  })

  // Quick commands
  const quickCommands = [
    'uci',
    'ucinewgame',
    'isready',
    'position startpos',
    'go depth 10',
    'stop',
    'quit',
  ]

  // Send UCI command to the engine
  const sendUciCommand = (command: string) => {
    if (!isEngineLoaded.value) {
      addTerminalLine('error', 'Engine not loaded')
      return
    }

    // Add command to terminal
    addTerminalLine('command', command)

    // Add to command history
    if (command.trim() && !commandHistory.value.includes(command)) {
      commandHistory.value.unshift(command)
      if (commandHistory.value.length > 50) {
        commandHistory.value = commandHistory.value.slice(0, 50)
      }
    }

    // Send command to engine
    if (engineState.send) {
      engineState.send(command)
    }

    // Auto-scroll to bottom
    nextTick(() => {
      scrollToBottom()
    })
  }

  // Add line to terminal
  const addTerminalLine = (
    type: 'command' | 'response' | 'error',
    content: string
  ) => {
    terminalLines.value.push({
      type,
      content,
      timestamp: new Date(),
    })

    // Limit terminal lines
    if (terminalLines.value.length > 1000) {
      terminalLines.value = terminalLines.value.slice(-500)
    }
  }

  // Send current command
  const sendCommand = () => {
    if (!currentCommand.value.trim()) return

    const command = currentCommand.value.trim()
    sendUciCommand(command)
    currentCommand.value = ''
    historyIndex.value = -1
  }

  // Execute quick command
  const executeQuickCommand = (command: string) => {
    sendUciCommand(command)
  }

  // Navigate command history
  const previousCommand = () => {
    if (commandHistory.value.length === 0) return

    if (historyIndex.value < commandHistory.value.length - 1) {
      historyIndex.value++
      currentCommand.value = commandHistory.value[historyIndex.value]
    }
  }

  const nextCommand = () => {
    if (historyIndex.value > 0) {
      historyIndex.value--
      currentCommand.value = commandHistory.value[historyIndex.value]
    } else if (historyIndex.value === 0) {
      historyIndex.value = -1
      currentCommand.value = ''
    }
  }

  // Clear terminal
  const clearTerminal = () => {
    terminalLines.value = []
    lastProcessedOutputIndex.value = engineOutput.value
      ? engineOutput.value.length - 1
      : -1
    addTerminalLine('response', 'Terminal cleared')
  }

  // Scroll to bottom of terminal
  const scrollToBottom = () => {
    if (terminalOutput.value) {
      terminalOutput.value.scrollTop = terminalOutput.value.scrollHeight
    }
  }

  // Watch engine output and add to terminal
  const handleEngineOutput = () => {
    if (!engineOutput.value || !isVisible.value) return

    const currentOutputLength = engineOutput.value.length

    // Only process new outputs since last processed index
    if (currentOutputLength > lastProcessedOutputIndex.value + 1) {
      const newLines = engineOutput.value.slice(
        lastProcessedOutputIndex.value + 1
      )

      newLines.forEach((line: any) => {
        if (line.kind === 'recv') {
          addTerminalLine('response', line.text)
        } else if (line.kind === 'sent') {
          // Commands sent are already added when we send them
        }
      })

      // Update the last processed index
      lastProcessedOutputIndex.value = currentOutputLength - 1

      // Auto-scroll to bottom
      nextTick(() => {
        scrollToBottom()
      })
    }
  }

  // Watch for changes in engine output
  watch(() => engineOutput.value, handleEngineOutput, { deep: true })

  // Watch dialog visibility
  watch(isVisible, newVal => {
    if (newVal) {
      // Set global flag to indicate UCI terminal is active
      ;(window as any).__UCI_TERMINAL_ACTIVE__ = true

      // Initialize last processed output index when dialog opens
      lastProcessedOutputIndex.value = engineOutput.value
        ? engineOutput.value.length - 1
        : -1

      // Focus on input when dialog opens
      nextTick(() => {
        if (commandInput.value) {
          commandInput.value.focus()
        }
      })

      // Add welcome message
      if (terminalLines.value.length === 0) {
        addTerminalLine(
          'response',
          'UCI Terminal ready. Type "uci" to get engine information.'
        )
        addTerminalLine(
          'response',
          'Use arrow keys to navigate command history.'
        )
      }
    } else {
      // Clear global flag when dialog closes
      ;(window as any).__UCI_TERMINAL_ACTIVE__ = false
    }
  })

  // Close dialog
  const closeDialog = () => {
    isVisible.value = false
  }

  // Initialize
  onMounted(() => {
    // Add initial welcome message if dialog is visible
    if (isVisible.value && terminalLines.value.length === 0) {
      addTerminalLine(
        'response',
        'UCI Terminal ready. Type "uci" to get engine information.'
      )
      addTerminalLine('response', 'Use arrow keys to navigate command history.')
    }
  })

  // Cleanup
  onUnmounted(() => {
    // Any cleanup if needed
  })
</script>

<style lang="scss" scoped>
  .uci-terminal-dialog {
    .terminal-card {
      border-radius: 12px;
      overflow: hidden;
      min-height: 600px;
    }

    .dialog-title {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 20px;
      position: relative;

      .title-text {
        font-size: 18px;
        font-weight: 600;
      }

      .close-btn {
        color: white;
        margin-right: -8px;
      }
    }

    .terminal-container {
      padding: 0;
      height: 500px;
      display: flex;
      flex-direction: column;
    }

    .no-engine-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 16px;
      padding: 40px;

      .no-engine-text {
        margin: 0;
        font-size: 16px;
        text-align: center;
        color: rgb(var(--v-theme-on-surface));
      }

      .no-engine-subtext {
        margin: 0;
        font-size: 14px;
        text-align: center;
        color: rgb(var(--v-theme-on-surface));
        opacity: 0.7;
      }
    }

    .terminal-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .terminal-output {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.4;
      background: rgb(var(--v-theme-surface));
      border-bottom: 1px solid rgb(var(--v-border-color));

      .terminal-line {
        margin-bottom: 4px;

        &.command {
          color: rgb(var(--v-theme-primary));
          font-weight: 600;

          .prompt {
            color: rgb(var(--v-theme-primary));
          }
        }

        &.response {
          color: rgb(var(--v-theme-on-surface));
        }

        &.error {
          color: rgb(var(--v-theme-error));
        }

        .line-content {
          word-break: break-all;
        }
      }
    }

    .terminal-input-area {
      padding: 12px 16px;
      border-top: 1px solid rgb(var(--v-border-color));
      background: rgb(var(--v-theme-surface));

      .input-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;

        .prompt {
          color: rgb(var(--v-theme-primary));
          font-family: 'Courier New', monospace;
          font-weight: 600;
        }

        .command-input {
          flex: 1;
        }

        .send-btn {
          flex-shrink: 0;
        }
      }
    }

    .quick-commands {
      padding: 8px 16px;
      border-top: 1px solid rgb(var(--v-border-color));
      background: rgb(var(--v-theme-surface));

      .quick-commands-title {
        font-size: 12px;
        color: rgb(var(--v-theme-on-surface));
        margin-bottom: 8px;
        font-weight: 600;
      }

      .quick-commands-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        .quick-cmd-chip {
          cursor: pointer;
          font-family: 'Courier New', monospace;
          font-size: 11px;
        }
      }
    }

    .terminal-actions {
      padding: 12px 16px;
      background: rgb(var(--v-theme-surface));
      border-top: 1px solid rgb(var(--v-border-color));

      .action-btn {
        text-transform: none;
        font-weight: 500;
      }

      .close-action-btn {
        text-transform: none;
        font-weight: 500;
        min-width: 100px;
      }
    }
  }

  // Dark theme adjustments
  .v-theme--dark {
    .uci-terminal-dialog {
      .terminal-output {
        background: rgb(30, 30, 30);
      }

      .terminal-input-area,
      .terminal-actions {
        background: rgb(30, 30, 30);
      }

      .quick-commands {
        background: rgb(25, 25, 25);
      }
    }
  }

  // Light theme adjustments
  .v-theme--light {
    .uci-terminal-dialog {
      .terminal-output {
        background: rgb(250, 250, 250);
      }

      .terminal-input-area,
      .terminal-actions {
        background: rgb(250, 250, 250);
      }

      .quick-commands {
        background: rgb(245, 245, 245);
      }
    }
  }

  // Scrollbar styles for terminal
  .terminal-output::-webkit-scrollbar {
    width: 6px;
  }

  .terminal-output::-webkit-scrollbar-track {
    background: transparent;
  }

  .terminal-output::-webkit-scrollbar-thumb {
    background: rgb(var(--v-theme-outline));
    border-radius: 3px;

    &:hover {
      background: rgb(var(--v-theme-outline-variant));
    }
  }

  // Mobile responsiveness
  @media (max-width: 768px) {
    .uci-terminal-dialog {
      .terminal-card {
        min-height: 80vh;
      }

      .terminal-container {
        height: 70vh;
      }

      .terminal-output {
        padding: 12px;
        font-size: 12px;
      }

      .terminal-input-area {
        padding: 10px 12px;
      }

      .quick-commands {
        padding: 6px 12px;

        .quick-commands-buttons {
          gap: 4px;

          .quick-cmd-chip {
            font-size: 10px;
          }
        }
      }

      .terminal-actions {
        padding: 10px 12px;
      }
    }
  }
</style>
