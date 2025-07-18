<template>
  <div class="sidebar">
    <v-btn @click="loadEngine" :color="isEngineLoaded ? 'success' : 'primary'" class="full-btn">
      {{ isEngineLoaded ? $t('analysis.engineLoaded') : $t('analysis.loadEngine') }}
    </v-btn>
    
    <!-- SAF file selection button for Android -->
    <v-btn 
      v-if="isAndroidPlatform" 
      @click="loadEngineWithSaf" 
      :color="isEngineLoaded ? 'success' : 'secondary'" 
      class="full-btn"
      :disabled="isEngineLoading"
    >
      {{ isEngineLoaded ? $t('analysis.engineLoaded') : $t('analysis.loadEngineSaf') }}
    </v-btn>
    
    <v-btn @click="manualStartAnalysis" :disabled="!isEngineLoaded || isThinking" color="primary" class="full-btn">
      {{ isThinking ? $t('analysis.thinking') : $t('analysis.startAnalysis') }}
    </v-btn>
    <v-btn @click="handleStopAnalysis" :disabled="!isEngineLoaded || !isThinking" color="warning" class="full-btn">
      {{ $t('analysis.stopAnalysis') }}
    </v-btn>
    <v-btn @click="playBestMove" :disabled="!bestMove" color="secondary" class="full-btn">
      {{ $t('analysis.playBestMove') }}
    </v-btn>
    
    <v-btn @click="handleUndoMove" :disabled="currentMoveIndex <= 0" color="error" class="full-btn">
      {{ $t('analysis.undoMove') }}
    </v-btn>
    
    <div class="autoplay-settings">
      <v-btn @click="toggleRedAi" :color="isRedAi ? 'error' : 'primary'" class="half-btn" :disabled="isManualAnalysis">
        {{ isRedAi ? $t('analysis.redAiOn') : $t('analysis.redAiOff') }}
      </v-btn>
      <v-btn @click="toggleBlackAi" :color="isBlackAi ? 'error' : 'primary'" class="half-btn" :disabled="isManualAnalysis">
        {{ isBlackAi ? $t('analysis.blackAiOn') : $t('analysis.blackAiOff') }}
      </v-btn>
    </div>

    <v-btn @click="toggleBoardFlip" color="primary" class="full-btn">
      {{ isBoardFlipped ? ($t('analysis.flipBoardBack') || '恢复方向') : ($t('analysis.flipBoard') || '翻转棋盘') }}
    </v-btn>

    <v-switch
      v-model="flipMode"
      :label="$t('analysis.freeFlipMode')"
      color="indigo"
      true-value="free"
      false-value="random"
      hide-details
      class="custom-switch"
    />

    <div class="section">
      <h3 class="section-title">
        {{ $t('analysis.darkPiecePool') }}
        <v-chip size="x-small" :color="validationStatusKey === 'normal' ? 'green' : 'red'" variant="flat">
          {{ validationStatusMessage }}
        </v-chip>
      </h3>
      <div class="pool-manager">
        <div v-for="item in unrevealedPiecesForDisplay" :key="item.char" class="pool-item">
          <img :src="getPieceImageUrl(item.name)" :alt="item.name" class="pool-piece-img" />
          <v-btn density="compact" icon="mdi-minus" size="x-small" @click="adjustUnrevealedCount(item.char, -1)" :disabled="item.count <= 0" />
          <span class="pool-count">{{ item.count }}</span>
          <v-btn density="compact" icon="mdi-plus" size="x-small" @click="adjustUnrevealedCount(item.char, 1)" :disabled="item.count >= item.max" />
        </div>
      </div>
    </div>

    <div class="section">
      <h3>{{ $t('analysis.engineAnalysis') }}</h3>
      <div class="analysis-output">
        <div v-for="(ln, idx) in parsedAnalysisLines" :key="`an-${idx}`" v-html="ln"></div>
      </div>
    </div>

    <div class="section">
      <h3>{{ $t('analysis.notation') }}</h3>
      <div class="move-list" ref="moveListElement">
        <div
          class="move-item"
          :class="{ 'current-move': currentMoveIndex === 0 }"
          @click="handleMoveClick(0)"
        >
          <span class="move-number">{{ $t('analysis.opening') }}</span>
        </div>
        <div
          v-for="(entry, idx) in history"
          :key="idx"
          class="move-item"
          :class="{ 'current-move': currentMoveIndex === idx + 1 }"
          @click="handleMoveClick(idx + 1)"
        >
          <template v-if="entry.type === 'move'">
            <span class="move-number">{{ getMoveNumber(idx) }}</span>
            <span class="move-uci">{{ entry.data }}</span>
          </template>
          <template v-else-if="entry.type === 'adjust'">
            <span class="move-adjust">{{ $t('analysis.adjustment') }}: {{ entry.data }}</span>
          </template>
        </div>
      </div>
    </div>

    <div class="section">
      <h3>{{ $t('analysis.moveComments') }}</h3>
      <div class="comments-list" ref="commentsListElement">
        <div
          class="comment-item"
          :class="{ 'current-comment': currentMoveIndex === 0 }"
        >
          <div class="comment-header">
            <span class="comment-number">{{ $t('analysis.opening') }}</span>
            <v-btn 
              density="compact" 
              icon="mdi-pencil" 
              size="x-small" 
              @click="editComment(0)"
              color="primary"
              variant="text"
            />
          </div>
          <div v-if="editingCommentIndex === 0" class="comment-edit">
            <v-text-field
              v-model="editingCommentText"
              density="compact"
              hide-details
              :placeholder="$t('analysis.enterComment')"
              @keyup.enter="saveComment"
              @keyup.esc="cancelEdit"
            />
            <div class="comment-edit-buttons">
              <v-btn size="x-small" @click="saveComment" color="success">{{ $t('analysis.saveComment') }}</v-btn>
              <v-btn size="x-small" @click="cancelEdit" color="error">{{ $t('analysis.cancelComment') }}</v-btn>
            </div>
          </div>
          <div v-else class="comment-text">
            {{ getCommentText(0) || $t('analysis.noComment') }}
          </div>
        </div>
        <div
          v-for="(_, idx) in history"
          :key="`comment-${idx}`"
          class="comment-item"
          :class="{ 'current-comment': currentMoveIndex === idx + 1 }"
        >
          <div class="comment-header">
            <span class="comment-number">{{ getMoveNumber(idx) }}</span>
            <v-btn 
              density="compact" 
              icon="mdi-pencil" 
              size="x-small" 
              @click="editComment(idx + 1)"
              color="primary"
              variant="text"
            />
          </div>
          <div v-if="editingCommentIndex === idx + 1" class="comment-edit">
            <v-text-field
              v-model="editingCommentText"
              density="compact"
              hide-details
              :placeholder="$t('analysis.enterComment')"
              @keyup.enter="saveComment"
              @keyup.esc="cancelEdit"
            />
            <div class="comment-edit-buttons">
              <v-btn size="x-small" @click="saveComment" color="success">{{ $t('analysis.saveComment') }}</v-btn>
              <v-btn size="x-small" @click="cancelEdit" color="error">{{ $t('analysis.cancelComment') }}</v-btn>
            </div>
          </div>
          <div v-else class="comment-text">
            {{ getCommentText(idx + 1) || $t('analysis.noComment') }}
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h3>{{ $t('analysis.engineLog') }}</h3>
      <div class="engine-log" ref="engineLogElement">
        <div
          v-for="(ln, Idx) in engineOutput"
          :key="Idx"
          :class="ln.kind === 'sent' ? 'line-sent' : 'line-recv'"
        >
          {{ ln.text }}
        </div>
      </div>
    </div>

    <div class="about-section">
      <v-btn 
        @click="openAboutDialog" 
        color="info" 
        variant="outlined" 
        class="full-btn"
        prepend-icon="mdi-information"
      >
        {{ $t('analysis.about') }}
      </v-btn>
    </div>

    <AboutDialog ref="aboutDialogRef" />

  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import type { HistoryEntry } from '@/composables/useChessGame';
import { useInterfaceSettings } from '@/composables/useInterfaceSettings';
import AboutDialog from './AboutDialog.vue';

const { t } = useI18n();

// Get interface settings
const { parseUciInfo } = useInterfaceSettings();

/* ---------- Injected State ---------- */
const gameState = inject('game-state') as any;
const {
  history,
  currentMoveIndex,
  replayToMove,
  playMoveFromUci,
  flipMode,
  unrevealedPieceCounts,
  validationStatus,
  adjustUnrevealedCount,
  getPieceNameFromChar,
  sideToMove,
  pendingFlip,
  toggleBoardFlip,
  isBoardFlipped,
  initialFen,
  undoLastMove,
} = gameState;

const engineState = inject('engine-state') as any;
const {
  engineOutput,
  isEngineLoaded,
  isEngineLoading,
  analysis,
  bestMove,
  isThinking,
  loadEngine,
  startAnalysis,
  stopAnalysis,
  currentSearchMoves,
  pvMoves,
  currentEnginePath,
  send,
  applySavedSettings,
} = engineState;

/* ---------- Auto Play ---------- */
const isRedAi = ref(false);
const isBlackAi = ref(false);
const isManualAnalysis = ref(false); // Track if current analysis is manual or AI auto-play
const moveListElement = ref<HTMLElement | null>(null);
const engineLogElement = ref<HTMLElement | null>(null);
const aboutDialogRef = ref<InstanceType<typeof AboutDialog> | null>(null);

/* ---------- Android Platform Detection ---------- */
const isAndroidPlatform = computed(() => {
  if (typeof window !== 'undefined') {
    const tauriPlatform = (window as any).__TAURI__?.platform;
    if (tauriPlatform === 'android') return true;
    if (navigator.userAgent.includes('Android')) return true;
    if (/Android/i.test(navigator.userAgent)) return true;
  }
  return false;
});

/* ---------- Comment Management ---------- */
const editingCommentIndex = ref<number | null>(null);
const editingCommentText = ref<string>('');
const commentsListElement = ref<HTMLElement | null>(null);




// Analysis settings
const analysisSettings = ref({
  movetime: 1000,
  maxThinkTime: 5000,
  maxDepth: 20,
  maxNodes: 1000000,
  analysisMode: 'movetime'
});

// Computed: split analysis lines by newline for display
const analysisLines = computed(() => {
  return analysis.value ? analysis.value.split('\n').filter((l: string) => l.trim().length > 0) : [];
});

// Load analysis settings from local storage
const loadAnalysisSettings = () => {
  const savedSettings = localStorage.getItem('analysis-settings');
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      analysisSettings.value = {
        movetime: settings.movetime || 1000,
        maxThinkTime: settings.maxThinkTime || 5000,
        maxDepth: settings.maxDepth || 20,
        maxNodes: settings.maxNodes || 1000000,
        analysisMode: settings.analysisMode || 'movetime'
      };
    } catch (e) {
    }
  }
};

// Listen for local storage changes and update analysis settings in real-time
let storageCheckInterval: number | null = null;

const watchStorageChanges = () => {
  // Listen for storage events (for cross-tab sync)
  window.addEventListener('storage', (e) => {
    if (e.key === 'analysis-settings' && e.newValue) {
      try {
        const settings = JSON.parse(e.newValue);
        analysisSettings.value = {
          movetime: settings.movetime || 1000,
          maxThinkTime: settings.maxThinkTime || 5000,
          maxDepth: settings.maxDepth || 20,
          maxNodes: settings.maxNodes || 1000000,
          analysisMode: settings.analysisMode || 'movetime'
        };
      } catch (e) {
      }
    }
  });
  
  // Listen for settings changes within the same page (via interval check)
  storageCheckInterval = setInterval(() => {
    const savedSettings = localStorage.getItem('analysis-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        const currentSettings = analysisSettings.value;
        
        // Check if there are any changes
        if (settings.movetime !== currentSettings.movetime ||
            settings.maxThinkTime !== currentSettings.maxThinkTime ||
            settings.maxDepth !== currentSettings.maxDepth ||
            settings.maxNodes !== currentSettings.maxNodes ||
            settings.analysisMode !== currentSettings.analysisMode) {
          
          analysisSettings.value = {
            movetime: settings.movetime || 1000,
            maxThinkTime: settings.maxThinkTime || 5000,
            maxDepth: settings.maxDepth || 20,
            maxNodes: settings.maxNodes || 1000000,
            analysisMode: settings.analysisMode || 'movetime'
          };
        }
      } catch (e) {
      }
    }
  }, 50); // Check every 50ms for better responsiveness
};

// Clean up the storage watcher
const cleanupStorageWatch = () => {
  if (storageCheckInterval) {
    clearInterval(storageCheckInterval);
    storageCheckInterval = null;
  }
};

/* ---------- Helper: Count unknown pieces in FEN ---------- */
function countUnknownPieces(fen: string): number {
  const boardPart = fen.split(' ')[0];
  return (boardPart.match(/[xX]/g) || []).length;
}

/* ---------- Find the index of the last piece reveal (when the number of unknown pieces changes) ---------- */
function findLastRevealIndex(): number {
  const h = history.value;
  for (let i = h.length - 1; i >= 0; i--) {
    const entry = h[i];
    // Position edits or adjustments reset the engine state
    if (entry.type === 'adjust') {
      return i;
    }
    const prevFen = i === 0 ? initialFen.value : h[i - 1].fen;
    const prevUnknown = countUnknownPieces(prevFen);
    const currUnknown = countUnknownPieces(h[i].fen);
    if (prevUnknown !== currUnknown) {
      return i; // Reveal happened at index i (after executing move i)
    }
  }
  return -1;
}

/* ---------- Generate starting FEN and moves based on the last reveal ---------- */
const baseFenForEngine = computed(() => {
  const idx = findLastRevealIndex();
  if (idx >= 0) {
    return history.value[idx].fen; // The FEN already includes the result of the reveal
  }
  return initialFen.value;
});

const engineMovesSinceLastReveal = computed(() => {
  const idx = findLastRevealIndex();
  const moves: string[] = [];
  for (let i = idx + 1; i < history.value.length; i++) {
    const entry = history.value[i];
    if (entry.type === 'move') {
      moves.push(entry.data);
    }
  }
  return moves;
});

/* ---------- UI ---------- */
const INITIAL_PIECE_COUNTS: { [k: string]: number } = {
  R: 2, N: 2, B: 2, A: 2, C: 2, P: 5, K: 1,
  r: 2, n: 2, b: 2, a: 2, c: 2, p: 5, k: 1,
};
const unrevealedPiecesForDisplay = computed(() => {
  const allChars = 'RNBACP'.split('');
  return allChars.flatMap((char) => [
    {
      char,
      name: getPieceNameFromChar(char),
      count: unrevealedPieceCounts.value[char] || 0,
      max: INITIAL_PIECE_COUNTS[char],
    },
    {
      char: char.toLowerCase(),
      name: getPieceNameFromChar(char.toLowerCase()),
      count: unrevealedPieceCounts.value[char.toLowerCase()] || 0,
      max: INITIAL_PIECE_COUNTS[char.toLowerCase()],
    },
  ]);
});
function getPieceImageUrl(pieceName: string): string {
  return new URL(`../assets/${pieceName}.svg`, import.meta.url).href;
}
function getMoveNumber(historyIndex: number): string {
  const moveCount = history.value
    .slice(0, historyIndex + 1)
    .filter((e: HistoryEntry) => e.type === 'move').length;
  if (moveCount === 0) return '';
  const moveNumber = Math.floor((moveCount - 1) / 2) + 1;
  const isSecondMove = (moveCount - 1) % 2 === 1;
  return `${moveNumber}${isSecondMove ? '...' : '.'}`;
}

/* ---------- Core Logic ---------- */
function toggleRedAi() {
  // Disable manual analysis when AI auto-play is enabled
  if (!isRedAi.value && isThinking.value && isManualAnalysis.value) {
    stopAnalysis({ playBestMoveOnStop: false });
    isManualAnalysis.value = false;
  }
  isRedAi.value = !isRedAi.value;
}
function toggleBlackAi() {
  // Disable manual analysis when AI auto-play is enabled
  if (!isBlackAi.value && isThinking.value && isManualAnalysis.value) {
    stopAnalysis({ playBestMoveOnStop: false });
    isManualAnalysis.value = false;
  }
  isBlackAi.value = !isBlackAi.value;
}
function isCurrentAiTurnNow() {
  const redTurn = sideToMove.value === 'red';
  return (redTurn && isRedAi.value) || (!redTurn && isBlackAi.value);
}
function checkAndTriggerAi() {
  // If the engine is thinking but it's not the AI's turn, stop the analysis first
  if (isThinking.value && !isCurrentAiTurnNow()) {
    // This is a "cancel" operation, not a "move now".
    stopAnalysis({ playBestMoveOnStop: false });
    return;
  }
  
  const should =
    isEngineLoaded.value && 
    isCurrentAiTurnNow() && 
    !isThinking.value && 
    !pendingFlip.value;

  console.log(`[DEBUG] CHECK_AND_TRIGGER_AI: Checking... isEngineLoaded=${isEngineLoaded.value}, isCurrentAiTurnNow()=${isCurrentAiTurnNow()}, isThinking=${isThinking.value}, pendingFlip=${pendingFlip.value}. Outcome: ${should ? 'STARTING ANALYSIS' : 'DOING NOTHING'}`);
  
  if (should) {
    // AI auto-play mode uses limited analysis settings (time, depth, nodes)
    isManualAnalysis.value = false; // Mark as AI auto-play analysis
    startAnalysis(analysisSettings.value, engineMovesSinceLastReveal.value, baseFenForEngine.value, currentSearchMoves.value);
  }
}
function playBestMove() {
  if (!bestMove.value) return;
  playMoveFromUci(bestMove.value);
}
function handleMoveClick(moveIndex: number) {
  replayToMove(moveIndex);
}
function manualStartAnalysis() {
  // Manual analysis uses infinite thinking mode without time, depth, or node limits
  // Disable AI auto-play when manual analysis is active
  isRedAi.value = false;
  isBlackAi.value = false;
  isManualAnalysis.value = true; // Mark as manual analysis
  
  console.log('[DEBUG] MANUAL_START_ANALYSIS: Triggered.');
  
  const infiniteAnalysisSettings = {
    movetime: 0, // 0 means infinite thinking
    maxThinkTime: 0, // 0 means no time limit
    maxDepth: 0, // 0 means no depth limit
    maxNodes: 0, // 0 means no node limit
    analysisMode: 'infinite'
  };
  startAnalysis(infiniteAnalysisSettings, engineMovesSinceLastReveal.value, baseFenForEngine.value, currentSearchMoves.value);
}

// Handle stop analysis and reset manual analysis state
function handleStopAnalysis() {
  // If we are in auto-analysis mode, the stop button should act as a "Move Now" command.
  if (isRedAi.value || isBlackAi.value) {
    console.log('[DEBUG] HANDLE_STOP_ANALYSIS: Auto-analysis mode. Stopping with playBestMoveOnStop = true.');
    stopAnalysis({ playBestMoveOnStop: true });
  } else {
    // If in manual analysis mode, the stop button just cancels the analysis.
    console.log('[DEBUG] HANDLE_STOP_ANALYSIS: Manual analysis mode. Stopping with playBestMoveOnStop = false.');
    stopAnalysis({ playBestMoveOnStop: false });
  }
  isManualAnalysis.value = false; // Reset manual analysis state regardless
}

// Undo the last move
function handleUndoMove() {
  undoLastMove();
}

// Load engine using SAF file selection (Android only)
const loadEngineWithSaf = async () => {
  if (!isAndroidPlatform.value) return;
  
  try {
    // Use JavaScript interface to request SAF file selection
    if (typeof (window as any).SafFileInterface !== 'undefined') {
      (window as any).SafFileInterface.startFileSelection();
    } else {
      // Fallback to Tauri command if JavaScript interface is not available
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('request_saf_file_selection');
    }
    
    // Listen for SAF file selection result
    const handleSafFileResult = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[DEBUG] Received SAF file result:', customEvent.detail);
      
      const { result } = customEvent.detail;
      if (result && typeof result === 'string' && result.length > 0) {
        // Successfully got a file, now load it as an engine
        console.log('[DEBUG] Loading engine from SAF file:', result);
        
        // Load the engine using the internal path
        loadEngineFromPath(result);
      } else {
        console.log('[DEBUG] SAF file selection failed or cancelled');
        alert('文件选择失败或已取消');
      }
      
      // Remove event listener
      window.removeEventListener('saf-file-result', handleSafFileResult);
    };
    
    window.addEventListener('saf-file-result', handleSafFileResult);
    
  } catch (error) {
    console.error('Failed to request SAF file selection:', error);
    alert('打开文件选择器失败');
  }
};

// Load engine from a specific path
const loadEngineFromPath = async (path: string) => {
  try {
    engineOutput.value = []; 
    bestMove.value = ''; 
    analysis.value = ''; 
    pvMoves.value = [];
    currentEnginePath.value = path; // Store engine path
    
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('spawn_engine', { path });
    isEngineLoaded.value = true;
    send('uci');
    
    // Automatically apply saved configuration after engine loads
    setTimeout(() => {
      applySavedSettings();
    }, 500);
  } catch(e) { 
    console.error('Failed to load engine from path:', e);
    alert('加载引擎失败'); 
  }
};

// Open the about dialog
function openAboutDialog() {
  aboutDialogRef.value?.openDialog();
}

/* ---------- Comment Management Functions ---------- */
// Get comment text for a specific move index
function getCommentText(moveIndex: number): string {
  if (moveIndex === 0) {
    return ''; // Opening position has no comment
  }
  const historyIndex = moveIndex - 1;
  if (historyIndex >= 0 && historyIndex < history.value.length) {
    return history.value[historyIndex].comment || '';
  }
  return '';
}

// Start editing a comment
function editComment(moveIndex: number) {
  editingCommentIndex.value = moveIndex;
  editingCommentText.value = getCommentText(moveIndex);
}

// Save the current comment
function saveComment() {
  if (editingCommentIndex.value !== null) {
    if (editingCommentIndex.value === 0) {
      // Opening position - no comment to save
      editingCommentIndex.value = null;
      editingCommentText.value = '';
      return;
    }
    
    const historyIndex = editingCommentIndex.value - 1;
    if (historyIndex >= 0 && historyIndex < history.value.length) {
      // Update the comment in the history
      gameState.updateMoveComment(historyIndex, editingCommentText.value);
    }
  }
  
  editingCommentIndex.value = null;
  editingCommentText.value = '';
}

// Cancel editing
function cancelEdit() {
  editingCommentIndex.value = null;
  editingCommentText.value = '';
}

// Load settings when the component is mounted
onMounted(() => {
  loadAnalysisSettings();
  watchStorageChanges();
  
  // Listen for force stop AI event. This is used to stop analysis in various scenarios.
  const handleForceStopAi = (event: CustomEvent) => {
    console.log(`[DEBUG] HANDLE_FORCE_STOP_AI: Caught event. Reason: ${event.detail?.reason}`);
    // For a manual move, we only stop the thinking process.
    // We don't turn off the AI toggles, allowing the AI to potentially start thinking for the next turn.
    if (event.detail?.reason === 'manual-move') {
    if (isThinking.value) {
        // This is a "cancel" operation.
        stopAnalysis({ playBestMoveOnStop: false });
    }
      return; // Early return to avoid turning off AI states
    }
    
    // For all other reasons (new game, replay, fen input etc.), perform a full stop.
    // The engine's state (isThinking) will be reset when it acknowledges the stop.
    if (isThinking.value) {
      // This is also a "cancel" operation.
      stopAnalysis({ playBestMoveOnStop: false });
    }

    // Reset AI toggles immediately.
    isRedAi.value = false;
    isBlackAi.value = false;
    isManualAnalysis.value = false;
    if (engineState.bestMove) {
      engineState.bestMove.value = '';
    }
  };
  
  // This listener is crucial. It waits for the engine to confirm it has stopped,
  // then it checks if a new analysis should begin.
  const onEngineReady = () => {
    console.log('[DEBUG] ON_ENGINE_READY: Event received. Checking what to do next.');

    // If a flip prompt is active, do nothing yet.
    // The analysis will be re-triggered (if needed) by other watchers after the user makes a selection.
    if (pendingFlip.value) {
      console.log('[DEBUG] ON_ENGINE_READY: A flip is pending. Deferring analysis decision.');
      return;
    }
    
    // If we were in manual analysis mode, restart it for the new position.
    if (isManualAnalysis.value) {
      console.log('[DEBUG] ON_ENGINE_READY: Manual analysis mode detected. Restarting analysis.');
      manualStartAnalysis();
    } else {
      // Otherwise, check if it's an AI's turn to move.
      console.log('[DEBUG] ON_ENGINE_READY: Auto analysis mode detected. Checking if AI should move.');
      checkAndTriggerAi();
    }
  };
  
  window.addEventListener('force-stop-ai', handleForceStopAi as EventListener);
  window.addEventListener('engine-stopped-and-ready', onEngineReady);
  
  // Clean up listeners when the component is unmounted
  onUnmounted(() => {
    window.removeEventListener('force-stop-ai', handleForceStopAi as EventListener);
    window.removeEventListener('engine-stopped-and-ready', onEngineReady);
    cleanupStorageWatch();
  });
});

/* ---------- Watchers ---------- */
watch(
  [sideToMove, isRedAi, isBlackAi, isEngineLoaded, pendingFlip],
  () => {
    nextTick(() => checkAndTriggerAi());
  },
  { immediate: true },
);

// This watcher ensures that if a manual move is made while in "manual analysis" mode,
// a new analysis is automatically started for the resulting position.
watch(currentMoveIndex, () => {
  if (isManualAnalysis.value && !isThinking.value) {
    manualStartAnalysis();
  }
});

watch(bestMove, (move) => {
  if (!move) return;
  
  console.log(`[DEBUG] BESTMOVE_WATCHER: Triggered with move '${move}'. isCurrentAiTurnNow()=${isCurrentAiTurnNow()}.`);
  // Only execute best move when it's AI's turn.
  // The isThinking check was removed because the new isStopping flag in useUciEngine handles stale bestmove commands more reliably.
  if (isEngineLoaded.value && isCurrentAiTurnNow()) {
    console.log(`[DEBUG] BESTMOVE_WATCHER: Condition met. Playing move.`);
    setTimeout(() => {
      const ok = playMoveFromUci(move);
      bestMove.value = '';
      if (!ok) {
        // In case of a checkmate, do not search again - use trim() to remove spaces
        const trimmedMove = move.trim();
        if (trimmedMove === '(none)' || trimmedMove === 'none') {
          return;
        }
        // AI auto-play mode also uses limited analysis settings when re-searching
        isManualAnalysis.value = false; // Ensure it's marked as AI analysis
        startAnalysis(analysisSettings.value, engineMovesSinceLastReveal.value, baseFenForEngine.value, currentSearchMoves.value);
      } else {
        nextTick(() => {
          checkAndTriggerAi();
        });
      }
    }, 50);
  }
});

watch(
  history,
  () => {
    nextTick(() => {
      if (moveListElement.value) {
        moveListElement.value.scrollTop = moveListElement.value.scrollHeight;
      }

    });
  },
  { deep: true },
);

watch(
  engineOutput,
  () => {
    nextTick(() => {
      if (engineLogElement.value) {
        engineLogElement.value.scrollTop = engineLogElement.value.scrollHeight;
      }
    });
  },
  { deep: true },
);

// Clean up the storage watcher when the component is unmounted
// onUnmounted(() => {
//   cleanupStorageWatch();
// });

const validationStatusKey = computed(() => {
  if (!validationStatus.value) return 'error';
  // Support "正常"/normal/Normal
  return validationStatus.value.includes('正常') || validationStatus.value.toLowerCase().includes('normal') ? 'normal' : 'error';
});

// Get specific error message
const validationStatusMessage = computed(() => {
  if (!validationStatus.value) return '';
  
  // If it's normal status, use i18n translation
  if (validationStatus.value.includes('正常') || validationStatus.value.toLowerCase().includes('normal')) {
    return t('positionEditor.validationStatus.normal');
  }
  
  // Parse error information
  const errorText = validationStatus.value;
  
  // Check if it's dark pieces count mismatch error
  const darkPiecesMatch = errorText.match(/错误:\s*(\d+)暗子\s*>\s*(\d+)池/);
  if (darkPiecesMatch) {
    const darkCount = darkPiecesMatch[1];
    const poolCount = darkPiecesMatch[2];
    return t('errors.darkPiecesMismatch', { darkCount, poolCount });
  }
  
  // Check if it's piece count exceeded error
  const pieceCountMatch = errorText.match(/错误:\s*(.+?)\s*总数超限!/);
  if (pieceCountMatch) {
    const pieceName = pieceCountMatch[1];
    return t('errors.pieceCountExceeded', { pieceName });
  }
  
  // If none matches, return original error message
  return errorText;
});

// UCI info line parser: parse info line into an object
function parseUciInfoLine(line: string) {
  // Only process lines starting with 'info '
  if (!line.startsWith('info ')) return null;
  const result: Record<string, any> = {};
  // Extract common fields using regex
  const regexps = [
    { key: 'depth', re: /depth (\d+)/ },
    { key: 'seldepth', re: /seldepth (\d+)/ },
    { key: 'multipv', re: /multipv (\d+)/ },
    { key: 'score', re: /score (cp|mate) ([\-\d]+)/ },
    { key: 'nodes', re: /nodes (\d+)/ },
    { key: 'nps', re: /nps (\d+)/ },
    { key: 'hashfull', re: /hashfull (\d+)/ },
    { key: 'tbhits', re: /tbhits (\d+)/ },
    { key: 'time', re: /time (\d+)/ },
    { key: 'pv', re: /\spv\s(.+?)(?=\s+(?:depth|seldepth|multipv|score|nodes|nps|hashfull|tbhits|time|$))/ },
  ];
  for (const { key, re } of regexps) {
    const m = line.match(re);
    if (m) {
      if (key === 'score') {
        result['scoreType'] = m[1];
        result['scoreValue'] = m[2];
      } else {
        result[key] = m[1] || m[2];
      }
    }
  }
  return result;
}

// Format UCI info object for user-friendly display, with i18n support and color coding
function formatUciInfo(info: Record<string, any>) {
  if (!info) return '';
  
  let scoreValue = 0;
  let isMate = false;
  if (info.scoreType && info.scoreValue) {
    if (info.scoreType === 'cp') {
      scoreValue = parseInt(info.scoreValue, 10);
    } else if (info.scoreType === 'mate') {
      scoreValue = parseInt(info.scoreValue, 10);
      isMate = true;
    }
  }
  
  const getScoreColorClass = () => {
    if (isMate) {
      return scoreValue > 0 ? 'score-mate-positive' : 'score-mate-negative';
    } else {
      if (scoreValue > 50) return 'score-positive';
      if (scoreValue < -50) return 'score-negative';
      return 'score-neutral';
    }
  };
  
  // Use i18n for field names
  const fields = [
    info.depth && `${t('uci.depth')}: ${info.depth}`,
    info.seldepth && `${t('uci.seldepth')}: ${info.seldepth}`,
    info.multipv && `${t('uci.multipv')}: ${info.multipv}`,
    (info.scoreType && info.scoreValue) && `<span class="${getScoreColorClass()}">${info.scoreType === 'cp'
      ? `${t('uci.score')}: ${info.scoreValue}`
      : `${t('uci.mate')}: ${info.scoreValue}`}</span>`,
    info.nodes && `${t('uci.nodes')}: ${info.nodes}`,
    info.nps && `${t('uci.nps')}: ${(parseInt(info.nps, 10) / 1000).toFixed(1)}K`,
    info.hashfull && `${t('uci.hashfull')}: ${info.hashfull}`,
    info.tbhits && `${t('uci.tbhits')}: ${info.tbhits}`,
    info.time && `${t('uci.time')}: ${(parseInt(info.time, 10) / 1000).toFixed(2)}s`,
    info.pv && `<span class="pv-line">${t('uci.pv')}: ${info.pv}</span>`,
  ].filter(Boolean);
  return fields.join(' | ');
}

// Process analysisLines: translate info lines, keep others as is
const parsedAnalysisLines = computed(() => {
  return analysisLines.value.map((line: string) => {
    if (line.startsWith('info ')) {
      // Decide whether to parse UCI info based on parseUciInfo setting
      if (parseUciInfo.value) {
        const info = parseUciInfoLine(line);
        if (info) return formatUciInfo(info);
      }
      // If not parsing, return original line
      return line;
    }
    return line; // Non-info lines are returned as is
  });
});
</script>

<style lang="scss">
.sidebar {
  width: 320px;
  height: 90vh;
  padding: 15px;
  background-color: #f4f6f8;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
  border-left: 1px solid #ddd;
  overflow-y: auto;
  
  // Mobile responsive adjustments
  @media (max-width: 768px) {
    width: 100%;
    max-width: 500px;
    height: auto;
    max-height: 60vh;
    border-left: none;
    border-top: 1px solid #ddd;
    margin-top: 20px;
  }
}
.full-btn {
  width: 100%;
}
.half-btn {
  width: 49%;
  
  // Mobile responsive adjustments
  @media (max-width: 768px) {
    width: 48%;
    font-size: 12px;
  }
}
.section {
  padding-top: 10px;
  border-top: 1px solid #e0e0e0;
}
.section h3,
.section-title {
  margin: 0 0 10px;
  padding-bottom: 5px;
  font-size: 1rem;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.analysis-output,
.move-list {
  background-color: #fff;
  padding: 10px;
  border-radius: 5px;
  height: 150px;
  overflow-y: auto;
  font-family: 'Courier New', Courier, monospace;
  border: 1px solid #eee;
  font-size: 13px;
  
  // Mobile responsive adjustments
  @media (max-width: 768px) {
    height: 120px;
    font-size: 12px;
  }
}

.score-positive {
  color: #c62828;
  font-weight: bold;
}

.score-negative {
  color: #2e7d32;
  font-weight: bold;
}

.score-neutral {
  color: #666;
}

.score-mate-positive {
  color: #b71c1c;
  font-weight: bold;
  background-color: #ffcdd2;
  padding: 1px 4px;
  border-radius: 3px;
}

.score-mate-negative {
  color: #1b5e20;
  font-weight: bold;
  background-color: #c8e6c9;
  padding: 1px 4px;
  border-radius: 3px;
}

.pv-line {
  color: #1976d2;
  font-weight: bold;
}
.move-item {
  display: flex;
  gap: 10px;
  padding: 3px 5px;
  cursor: pointer;
  border-radius: 3px;
}
.move-item:hover {
  background-color: #e8f4fd;
}
.move-item.current-move {
  background-color: #bbdefb;
  font-weight: bold;
}
.move-number {
  font-weight: bold;
  width: 40px;
  text-align: right;
  color: #666;
  white-space: nowrap;
}
.move-uci {
  flex: 1;
}
.move-adjust {
  color: #888;
  font-style: italic;
  font-size: 12px;
  width: 100%;
  text-align: center;
}
.autoplay-settings {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  
  // Mobile responsive adjustments
  @media (max-width: 768px) {
    gap: 6px;
  }
}

.pool-manager {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  
  // Mobile responsive adjustments
  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
}
.pool-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 2px 5px;
  border-radius: 4px;
  border: 1px solid #eee;
}
.pool-piece-img {
  width: 24px;
  height: 24px;
}
.pool-count {
  font-weight: bold;
  font-size: 1rem;
  width: 20px;
  text-align: center;
}
.custom-switch {
  margin-top: -10px;
}
.notation-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.notation-btn {
  flex: 1;
}

.notation-info {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  color: #666;

  p {
    margin: 4px 0;
    line-height: 1.4;
  }
}

.engine-log {
  background-color: #2e2e2e;
  color: #f0f0f0;
  padding: 10px;
  border-radius: 5px;
  height: 150px;
  overflow-y: scroll;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  white-space: pre-line;
  
  // Mobile responsive adjustments
  @media (max-width: 768px) {
    height: 120px;
    font-size: 11px;
  }
}

.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #333;
  color: white;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  z-index: 1000;
  opacity: 0;
  transform: translateY(-20px);
  transition: all 0.3s ease;

  &.show {
    opacity: 1;
    transform: translateY(0);
  }
}

.line-sent {
  color: #87cefa;
}
.line-sent::before {
  content: '>> ';
}
.line-recv {
  color: #b3b3b3;
}

.about-section {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

/* ---------- Comment Styles ---------- */
.comments-list {
  background-color: #fff;
  padding: 10px;
  border-radius: 5px;
  height: 200px;
  overflow-y: auto;
  border: 1px solid #eee;
  font-size: 13px;
  
  // Mobile responsive adjustments
  @media (max-width: 768px) {
    height: 150px;
    font-size: 12px;
  }
}

.comment-item {
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  background-color: #fafafa;
}

.comment-item.current-comment {
  background-color: #e3f2fd;
  border-color: #2196f3;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.comment-number {
  font-weight: bold;
  color: #666;
  font-size: 12px;
}

.comment-text {
  color: #333;
  font-size: 13px;
  line-height: 1.4;
  word-wrap: break-word;
}

.comment-edit {
  margin-top: 4px;
}

.comment-edit-buttons {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}
</style>