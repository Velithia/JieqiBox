import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';
import { useI18n } from 'vue-i18n';

export interface EngineLine { text: string; kind: 'sent' | 'recv' }

// Platform detection utility
const isAndroid = () => {
  // Check multiple ways to detect Android platform
  if (typeof window !== 'undefined') {
    // Check Tauri platform if available
    const tauriPlatform = (window as any).__TAURI__?.platform;
    if (tauriPlatform === 'android') return true;
    
    // Check user agent
    if (navigator.userAgent.includes('Android')) return true;
    if (/Android/i.test(navigator.userAgent)) return true;
  }
  
  return false;
};

// function dbg(tag: string, ...m: any[]) { // console.log('[UCI]', tag, ...m) }

export function useUciEngine(generateFen: () => string) {
  const { t } = useI18n();
  const engineOutput = ref<EngineLine[]>([]);
  const isEngineLoaded = ref(false);
  const isEngineLoading = ref(false); // Add a new state for engine loading
  const bestMove = ref('');
  const analysis = ref('');
  const isThinking = ref(false);
  const isStopping = ref(false); // Flag to indicate that analysis is being manually stopped
  const playOnStop = ref(false); // Flag to determine if the best move should be played after stopping
  const pvMoves = ref<string[]>([]);          // Real-time PV
  // MultiPV: store moves for each PV index (0-based)
  const multiPvMoves = ref<string[][]>([]);
  // Cache of analysis lines for each PV
  const analysisLines: string[] = [];
  const uciOptionsText = ref(''); // cache UCI options raw text
  const currentEnginePath = ref(''); // current engine path
  const currentSearchMoves = ref<string[]>([]); // Current searchmoves restriction for variation analysis

  // Android-specific state
  const isAndroidPlatform = ref(isAndroid());
  const androidEnginePath = ref('');
  const bundleIdentifier = ref('');

  // Throttling mechanism for engine output processing
  let outputThrottleTimer: number | null = null;
  let pendingOutputLines: string[] = [];
  let lastProcessedTime = 0;
  const OUTPUT_THROTTLE_DELAY = 50; // Process output every 50ms maximum
  const MATE_OUTPUT_THROTTLE_DELAY = 300; // Slower processing for mate situations

  let unlisten: (() => void) | null = null;

  /* ---------- Output Throttling Functions ---------- */
  // Check if current analysis contains mate score
  const hasMateScore = () => {
    return analysisLines.some(line => line.includes('score mate'));
  };

  // Get appropriate throttle delay based on analysis content
  const getThrottleDelay = () => {
    return hasMateScore() ? MATE_OUTPUT_THROTTLE_DELAY : OUTPUT_THROTTLE_DELAY;
  };

  // Process pending output lines with throttling
  const processPendingOutput = () => {
    if (pendingOutputLines.length === 0) return;

    const currentTime = Date.now();
    const throttleDelay = getThrottleDelay();
    
    // Check if enough time has passed since last processing
    if (currentTime - lastProcessedTime < throttleDelay) {
      // Schedule processing for later
      if (outputThrottleTimer) {
        clearTimeout(outputThrottleTimer);
      }
      outputThrottleTimer = setTimeout(processPendingOutput, throttleDelay - (currentTime - lastProcessedTime));
      return;
    }

    // Process all pending lines with parsing logic
    pendingOutputLines.forEach(raw_ln => {
      engineOutput.value.push({text: raw_ln, kind: 'recv'});

      const ln = raw_ln.trim();
      if (!ln) return; // Ignore empty lines after trimming

      // -------- MultiPV parsing helpers --------
      const mpvMatch = ln.match(/\bmultipv\s+(\d+)/);
      const mpvIndex = mpvMatch ? parseInt(mpvMatch[1], 10) - 1 : 0; // 0-based index

      /* --- Extract PV (using indexOf is more robust than regex) --- */
      const idx = ln.indexOf(' pv ');
      if(idx !== -1) {
        const mvStr = ln.slice(idx + 4).trim();           // 4 = ' pv '.length
        const movesArr = mvStr.split(/\s+/);
        // Update primary pvMoves for backward compatibility
        if (mpvIndex === 0) {
          pvMoves.value = movesArr;
        }
        // Store into multiPvMoves with reactive update
        if (mpvIndex >= multiPvMoves.value.length) {
          // Append
          multiPvMoves.value.push(movesArr);
        } else {
          // Replace existing index to keep order
          multiPvMoves.value.splice(mpvIndex, 1, movesArr);
        }
      }
      // ------ Aggregate analysis lines (show all PVs) ------
      if(ln.startsWith('info') && ln.includes('score')) {
        analysisLines[mpvIndex] = ln;
        // Join available lines by newline
        analysis.value = analysisLines.filter(Boolean).join('\n');
      }

      if(ln.startsWith('bestmove')) {
        const mv = ln.split(' ')[1] ?? '';
        console.log(`[DEBUG] BESTMOVE_RECEIVED: '${mv}'. isThinking=${isThinking.value}, isStopping=${isStopping.value}.`);

        // If we are not in a thinking state, this is a stray bestmove from a previous,
        // already-terminated process. It must be ignored.
        if (!isThinking.value) {
          console.log(`[DEBUG] BESTMOVE_IGNORED: Stray move received while not in a 'thinking' state.`);
          return;
        }
        
        // If the 'isStopping' flag is true, this is the confirmation from the engine that
        // the 'stop' command was received. We handle it based on the 'playOnStop' flag.
        if (isStopping.value) {
          console.log(`[DEBUG] STOP_CONFIRMED: Engine acknowledged stop command.`);
          isThinking.value = false;
          isStopping.value = false;

          if (playOnStop.value) {
            console.log(`[DEBUG] BESTMOVE_PROCESSED_ON_STOP: Setting bestMove to '${mv}'.`);
            bestMove.value = mv; // This will trigger the watcher in AnalysisSidebar
          } else {
            console.log(`[DEBUG] BESTMOVE_IGNORED_ON_CANCEL: 'playOnStop' was false.`);
            bestMove.value = ''; // Ensure bestMove is cleared
          }
          playOnStop.value = false; // Reset for next time

          // After a successful stop, immediately check if a new AI move should be triggered.
          // This is crucial for the AI to respond after a manual user move.
          nextTick(() => {
            window.dispatchEvent(new CustomEvent('engine-stopped-and-ready'));
          });

          return;
        }

        // If we reach here, it's a legitimate bestmove from a completed analysis.
        isThinking.value = false;
        console.log(`[DEBUG] BESTMOVE_PROCESSED: '${mv}'.`);
        
        // Check if it's a checkmate situation (none) - use trim() to remove possible spaces
        const trimmedMv = mv.trim();
        if(trimmedMv === '(none)' || trimmedMv === 'none') {
          analysis.value = t('uci.checkmate');
          send('stop');
        } else {
          analysis.value = mv ? t('uci.bestMove', { move: mv }) : t('uci.noMoves');
        }
        
        bestMove.value = mv; // Set bestMove
        
        pvMoves.value = [];
        multiPvMoves.value = [];
      }
      if(ln === 'uciok') send('isready');
      if(ln === 'readyok') analysis.value = t('uci.engineReady');

      // record UCI options
      if (ln.startsWith('option name ')) {
        uciOptionsText.value += ln + '\n';
      }
    });
    
    pendingOutputLines = [];
    lastProcessedTime = currentTime;
    outputThrottleTimer = null;
  };

  // Add line to pending output queue
  const queueOutputLine = (line: string) => {
    pendingOutputLines.push(line);
    
    // If no timer is running, start processing
    if (!outputThrottleTimer) {
      outputThrottleTimer = setTimeout(processPendingOutput, getThrottleDelay());
    }
  };

  // Clear throttling state when analysis starts/stops
  const resetThrottling = () => {
    if (outputThrottleTimer) {
      clearTimeout(outputThrottleTimer);
      outputThrottleTimer = null;
    }
    pendingOutputLines = [];
    lastProcessedTime = 0;
  };

  /* ---------- Android Engine Path Management ---------- */
  const getBundleIdentifier = async () => {
    if (!isAndroidPlatform.value) return '';
    
    try {
      const identifier = await invoke<string>('get_bundle_identifier');
      bundleIdentifier.value = identifier;
      return identifier;
    } catch (error) {
      console.error('Failed to get bundle identifier:', error);
      return '';
    }
  };

  const getAndroidEnginePath = async () => {
    if (!isAndroidPlatform.value) return '';
    
    try {
      const path = await invoke<string>('get_default_android_engine_path');
      androidEnginePath.value = path;
      return path;
    } catch (error) {
      console.error('Failed to get Android engine path:', error);
      return '';
    }
  };

  const scanAndroidEngines = async () => {
    if (!isAndroidPlatform.value) return [];
    
    try {
      const engines = await invoke<string[]>('scan_android_engines');
      return engines;
    } catch (error) {
      console.error('Failed to scan Android engines:', error);
      return [];
    }
  };

  /* ---------- Load Engine ---------- */
  const loadEngine = async () => {
    isEngineLoading.value = true; // Set loading to true
    try {
      let path: string;
      
      if (isAndroidPlatform.value) {
        // On Android, first sync and get the list of available engines
        const availableEngines = await scanAndroidEngines();
        
        if (availableEngines.length > 0) {
          // Use the first available engine's full internal path
          path = availableEngines[0];
        } else {
          // If no engines found, show a message to the user
          const userDir = await getAndroidEnginePath();
          const bundleId = await getBundleIdentifier();
          const externalPath = bundleId ? `/storage/emulated/0/Android/data/${bundleId}/files/engines` : '/storage/emulated/0/Android/data/[包名]/files/engines';
          alert(`请在以下路径放置UCI引擎文件：\n${userDir}\n或\n${externalPath}\n\n应用会自动扫描并复制引擎文件到内部存储。`);
          isEngineLoading.value = false;
          return;
        }
      } else {
        // On desktop platforms, use file dialog
        const selectedPath = await open({ multiple: false, title: '选择UCI引擎' });
        if (typeof selectedPath !== 'string' || !selectedPath) {
          isEngineLoading.value = false;
          return;
        }
        path = selectedPath;
      }

      engineOutput.value = []; 
      bestMove.value = ''; 
      analysis.value = ''; 
      pvMoves.value = [];
      currentEnginePath.value = path; // Store engine path
      
      await invoke('spawn_engine', { path });
      isEngineLoaded.value = true;
      send('uci');
      
      // Automatically apply saved configuration after engine loads
      setTimeout(() => {
        applySavedSettings();
      }, 500);
    } catch(e) { 
      console.error('Failed to load engine:', e);
      alert('Failed to load engine'); 
    } finally {
      isEngineLoading.value = false; // Set loading to false
    }
  };

  /* ---------- Basic Send ---------- */
  const send = (cmd: string) => { if(!isEngineLoaded.value) return;
    engineOutput.value.push({text: cmd, kind: 'sent'}); invoke('send_to_engine', { command: cmd }) };

  /* ---------- Start Analysis ---------- */
  // New param baseFen: specifies the FEN for the starting position (before executing moves).
  // If not provided, it defaults to the FEN of the current position generated by generateFen().
  // New param searchmoves: specifies which moves to search (for variation analysis)
  const startAnalysis = (settings: any = {}, moves: string[] = [], baseFen: string | null = null, searchmoves: string[] = []) => {
    if(!isEngineLoaded.value || isThinking.value) return;
    
    isThinking.value = true;
    isStopping.value = false; // Reset stopping flag on new analysis
    playOnStop.value = false; // Reset play-on-stop flag

    // Reset throttling state for new analysis
    resetThrottling();

    // Save current searchmoves for reuse in analysis restarts
    currentSearchMoves.value = [...searchmoves];

    const fenToUse = baseFen ?? generateFen();
    console.log(`[DEBUG] START_ANALYSIS: FEN=${fenToUse}, Moves=${moves.join(' ')}, SearchMoves=${searchmoves.join(' ')}`);
    console.log(`[DEBUG] START_ANALYSIS: SearchMoves array length=${searchmoves.length}, content=`, searchmoves);

    // Default settings
    const defaultSettings = {
      movetime: 1000,
      maxThinkTime: 5000,
      maxDepth: 20,
      maxNodes: 1000000,
      analysisMode: 'movetime'
    };
    
    const finalSettings = { ...defaultSettings, ...settings };
    console.log(`[DEBUG] START_ANALYSIS: Final settings=`, finalSettings);
        
    // Use baseFen if provided, otherwise use the FEN of the current position.
    const pos = `position fen ${fenToUse}${moves.length ? ' moves ' + moves.join(' ') : ''}`;
    console.log(`[DEBUG] START_ANALYSIS: Position command: ${pos}`);
    
    send(pos);
    
    // Send different go commands based on analysis mode, with optional searchmoves restriction
    const searchMovesStr = searchmoves.length > 0 ? ` searchmoves ${searchmoves.join(' ')}` : '';
    console.log(`[DEBUG] START_ANALYSIS: SearchMoves string='${searchMovesStr}'`);
    
    let goCommand = '';
    switch (finalSettings.analysisMode) {
      case 'depth':
        goCommand = `go depth ${finalSettings.maxDepth}${searchMovesStr}`;
        break;
      case 'nodes':
        goCommand = `go nodes ${finalSettings.maxNodes}${searchMovesStr}`;
        break;
      case 'maxThinkTime':
        if (finalSettings.maxThinkTime > 0) {
          goCommand = `go wtime ${finalSettings.maxThinkTime} btime ${finalSettings.maxThinkTime} movestogo 1${searchMovesStr}`;
        } else {
          goCommand = `go infinite${searchMovesStr}`;
        }
        break;
      case 'movetime':
      default:
        if (finalSettings.movetime > 0) {
          goCommand = `go movetime ${finalSettings.movetime}${searchMovesStr}`;
        } else {
          goCommand = `go infinite${searchMovesStr}`;
        }
        break;
    }
    console.log(`[DEBUG] START_ANALYSIS: Go command: ${goCommand}`);
    send(goCommand);
  };

  /* ---------- Stop Analysis ---------- */
  const stopAnalysis = (options: { playBestMoveOnStop: boolean } = { playBestMoveOnStop: false }) => {
    // Do not set isThinking to false here.
    // The thinking process only truly ends when the engine sends a 'bestmove' response.
    // We set a flag to indicate that we are waiting for this confirmation.
    if(!isEngineLoaded.value || !isThinking.value || isStopping.value) return;
    
    console.log(`[DEBUG] STOP_ANALYSIS: Sending 'stop'. playBestMoveOnStop=${options.playBestMoveOnStop}`);
    isStopping.value = true; // Set flag to indicate we are waiting for a stop confirmation
    playOnStop.value = options.playBestMoveOnStop; // Set flag for how to handle the resulting bestmove
    
    // Reset throttling state when stopping analysis
    resetThrottling();
    
    send('stop');
  };



  /* ---------- Clear Search Moves ---------- */
  const clearSearchMoves = () => {
    currentSearchMoves.value = [];
    console.log(`[DEBUG] CLEAR_SEARCH_MOVES: Cleared searchmoves restrictions`);
  };

  /* ---------- Apply Saved Settings ---------- */
  const applySavedSettings = () => {
    if (!isEngineLoaded.value || !currentEnginePath.value) return;
    
    // Apply analysis settings
    const analysisSettings = localStorage.getItem('analysis-settings');
    if (analysisSettings) {
    }
    
    // Apply UCI options settings
    const enginePathHash = btoa(currentEnginePath.value).replace(/[^a-zA-Z0-9]/g, '');
    const uciOptionsKey = `uci-options-${enginePathHash}`;
    const savedUciOptions = localStorage.getItem(uciOptionsKey);
    
    if (savedUciOptions) {
      try {
        const options = JSON.parse(savedUciOptions);
        Object.entries(options).forEach(([name, value]) => {
          const command = `setoption name ${name} value ${value}`;
          send(command);
        });
      } catch (e) {
      }
    }
  };

  /* ---------- Listen to Output ---------- */
  onMounted(async() => {
    unlisten = await listen<string>('engine-output', (ev) => {
      const raw_ln = ev.payload;
      console.log(`[DEBUG] ENGINE_RAW_OUTPUT: ${raw_ln}`);
      queueOutputLine(raw_ln); // Use queueOutputLine for throttling
      // All parsing logic is now handled by processPendingOutput function
    });
  });
  onUnmounted(() => {
    unlisten?.();
    resetThrottling(); // Clean up throttling state
  });

  return { 
    engineOutput, isEngineLoaded, isEngineLoading, bestMove, analysis, isThinking, pvMoves, multiPvMoves,
    loadEngine, startAnalysis, stopAnalysis, uciOptionsText, send, currentEnginePath, applySavedSettings,
    currentSearchMoves, clearSearchMoves, bundleIdentifier
  };
}
