<script setup lang="ts">
  import { provide, computed, watch, onMounted, onUnmounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useTheme } from 'vuetify'
  import TopToolbar from './components/TopToolbar.vue'
  import Chessboard from './components/Chessboard.vue'
  import AnalysisSidebar from './components/AnalysisSidebar.vue'
  import FlipPromptDialog from './components/FlipPromptDialog.vue'
  import FenInputDialog from './components/FenInputDialog.vue'
  import GameEndDialog from './components/GameEndDialog.vue'

  import { useChessGame } from './composables/useChessGame'
  import { useUciEngine } from './composables/useUciEngine'
  import { useJaiEngine } from './composables/useJaiEngine'
  import { useInterfaceSettings } from './composables/useInterfaceSettings'
  import { useConfigManager } from './composables/useConfigManager'
  import { useAutosave } from './composables/useAutosave'
  import { useWindowManager } from './composables/useWindowManager'
  import { LANGUAGE_TO_HTML_LANG } from './utils/constants'

  const { locale } = useI18n()
  const configManager = useConfigManager()
  const theme = useTheme()

  // Get interface settings including dark mode
  const { showPositionChart, darkMode } = useInterfaceSettings()

  // Watch for dark mode changes and update theme
  watch(
    darkMode,
    newDarkMode => {
      theme.global.name.value = newDarkMode ? 'dark' : 'light'
    },
    { immediate: true }
  )

  // Set HTML lang attribute based on current language
  const htmlLang = computed(() => {
    return LANGUAGE_TO_HTML_LANG[locale.value] || 'en-US'
  })

  // Watch for language changes and update HTML lang attribute
  watch(
    locale,
    newLocale => {
      const htmlLang = LANGUAGE_TO_HTML_LANG[newLocale] || 'en-US'
      document.documentElement.lang = htmlLang
      document.documentElement.setAttribute('lang', htmlLang)
    },
    { immediate: true }
  )

  const game = useChessGame()

  // Pass generateFen and gameState to ensure engine receives correct FEN format and can access game state
  const engine = useUciEngine(game.generateFen, game)
  const jaiEngine = useJaiEngine(game.generateFen, game)

  // Provide global state
  provide('game-state', game)
  provide('engine-state', engine)
  provide('jai-engine-state', jaiEngine)

  // Provide the FEN input dialog state from game state
  provide('fen-input-dialog-visible', game.isFenInputDialogVisible)

  // Set global engine state for useChessGame to access
  ;(window as any).__ENGINE_STATE__ = engine
  ;(window as any).__JAI_ENGINE__ = jaiEngine

  // Initialize autosave functionality after providing game state
  const autosave = useAutosave()

  // Initialize window manager for window size persistence
  const windowManager = useWindowManager()

  // Load configuration when app mounts
  onMounted(async () => {
    try {
      await configManager.loadConfig()

      // Restore window state immediately after config is loaded for faster startup
      windowManager.restoreWindowState()

      // Set locale from config
      const savedLocale = configManager.getLocale()
      if (
        savedLocale &&
        ['zh_cn', 'zh_tw', 'en', 'vi', 'ja'].includes(savedLocale)
      ) {
        locale.value = savedLocale
      }

      // Check if engine list is empty and clear last selected engine ID if needed
      const engines = configManager.getEngines()
      if (engines.length === 0) {
        console.log(
          `[DEBUG] App: Engine list is empty on startup, clearing last selected engine ID`
        )
        await configManager.clearLastSelectedEngineId()
      }

      // Initialize autosave after configuration is loaded
      await autosave.initializeAutosave(game)
    } catch (error) {
      console.error('Failed to load configuration on app startup:', error)
    }
  })

  // Clean up autosave timer when app unmounts
  onUnmounted(() => {
    autosave.stopAutosaveTimer()
    // Window manager cleanup is handled automatically by its own onUnmounted hook
  })
</script>

<template>
  <div class="app-container" :lang="htmlLang">
    <TopToolbar />
    <div class="main-layout">
      <div class="chessboard-area" :class="{ 'with-chart': showPositionChart }">
        <Chessboard />
      </div>
      <AnalysisSidebar />
      <FlipPromptDialog />
      <FenInputDialog
        v-model="game.isFenInputDialogVisible.value"
        @confirm="game.confirmFenInput"
      />
      <GameEndDialog
        :visible="game.isGameEndDialogVisible.value"
        :game-result="game.gameEndResult.value"
        :on-close="() => (game.isGameEndDialogVisible.value = false)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: rgb(var(--v-theme-background));
  }

  .main-layout {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: center;
    flex: 1;
    width: 100%;
    padding: 20px;
    gap: 20px;
    box-sizing: border-box;
    background-color: rgb(var(--v-theme-background));
    max-height: calc(
      100vh - 80px
    ); /* Prevent layout from exceeding viewport height */
    overflow: hidden; /* Prevent scrolling when content fits */

    // Mobile responsive layout - switch to vertical on narrow screens
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: center;
      padding: 10px;
      gap: 15px; // Reduced gap for mobile
      max-height: none; /* Allow natural height on mobile */
      overflow: visible; /* Allow scrolling on mobile if needed */
    }
  }

  .chessboard-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 20px;
    max-height: 100%; /* Ensure it doesn't exceed parent height */

    // On desktop, when position chart is shown, make chessboard smaller
    &.with-chart {
      .chessboard-wrapper {
        transform: scale(0.75);
        transform-origin: top center;
      }
    }

    // Mobile responsive adjustments
    @media (max-width: 768px) {
      padding-top: 0;
      width: 100%;
      max-height: none; /* Allow natural height on mobile */

      // On mobile, disable the scaling when chart is shown
      &.with-chart {
        .chessboard-wrapper {
          transform: none;
        }
      }
    }
  }
</style>
