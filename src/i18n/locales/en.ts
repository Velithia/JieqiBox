export default {
  // Common
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    close: 'Close',
    save: 'Save',
    open: 'Open',
    refresh: 'Refresh',
    reset: 'Reset',
    clear: 'Clear',
    apply: 'Apply',
    execute: 'Execute',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    delete: 'Delete',
    add: 'Add',
    actions: 'Actions',
    required: 'This field is required',
  },

  // Top toolbar
  toolbar: {
    newGame: 'New Game',
    copyFen: 'Copy FEN',
    inputFen: 'Input FEN',
    editPosition: 'Edit Position',
    uciSettings: 'UCI Settings',
    analysisParams: 'Analysis Parameters',
    saveNotation: 'Save Notation',
    openNotation: 'Open Notation',
    gameTitle: 'Jieqi Game',
    interfaceSettings: 'Interface Settings',
    variation: 'Forbid Current Move',
    analyzeDrawings: 'Analyze Drawings',
    noDrawingMoves: 'No legal drawing moves',
    noMoreVariations: 'No more variations available',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    viewPasteNotation: 'View/Paste Notation',
    reviewAnalysis: 'Review Analysis',
    openingBook: 'Opening Book',
  },

  // UCI options dialog
  uciOptions: {
    title: 'UCI Engine Options',
    loadingText: 'Loading engine options...',
    noEngineLoaded: 'No engine is currently loaded.',
    pleaseLoadEngineFirst:
      'Please load an engine first to configure its options.',
    loadEngine: 'Load Engine',
    noOptionsAvailable: 'No UCI options available for this engine.',
    refreshOptions: 'Refresh Options',
    range: 'Range',
    execute: 'Execute',
    resetToDefaults: 'Reset to Defaults',
    clearSettings: 'Clear Settings',
    confirmClearSettings:
      'Are you sure you want to clear all UCI option configurations for the current engine? This action cannot be undone.',
    settingsCleared: 'UCI option configurations cleared',
    // UCI option descriptions
    optionDescriptions: {
      'Debug Log File':
        'The debug file that records communication between the engine and the GUI.',
      Threads:
        'Number of threads used for engine search. It is recommended to set this to the number of available system threads minus one or two.',
      Hash: "Engine's hash table size (in MB). It is recommended to set this value to the total available memory minus 1 to 2 GiB.",
      'Clear Hash': 'Clears the hash table.',
      MultiPV:
        'Multi-Principal Variation. Allows the engine to show multiple recommended moves. It is recommended to set this to 1. If set higher, the quality of the best move may decrease because resources will be allocated to evaluating alternative lines.',
      NumaPolicy:
        'Binds threads to specific NUMA nodes to ensure execution. Improves performance on systems with multiple CPUs or CPUs with multiple NUMA domains.',
      Ponder: 'Allows the engine to think during the opponent’s turn.',
      'Move Overhead':
        'Assumes an x-millisecond delay due to network and GUI overhead. Useful for avoiding time losses due to delays.',
      nodestime:
        'Instructs the engine to use the number of searched nodes instead of wall clock time to calculate elapsed time. Useful for engine testing.',
      UCI_ShowWDL:
        'If enabled, displays approximate WDL (Win/Draw/Loss) statistics in the engine output. These WDL numbers estimate expected outcomes based on evaluation and depth from self-play simulations.',
      EvalFile:
        'The name of the NNUE evaluation parameter file. Depending on the GUI, the filename may need to include the full path to the folder containing the file.',
    },
  },

  // Review analysis dialog
  reviewDialog: {
    title: 'Review Analysis',
    movetime: 'Per-move time (ms)',
    progress: 'Progress: {current}/{total}',
  },

  // UCI Terminal dialog
  uciTerminal: {
    title: 'UCI Terminal',
    enterCommand: 'Enter UCI command...',
    sendCommand: 'Send Command',
    noEngineLoaded: 'No engine is currently loaded.',
    pleaseLoadEngineFirst: 'Please load an engine first to use the terminal.',
    quickCommands: 'Quick Commands',
    clear: 'Clear Terminal',
    commandHistory: 'Command History',
    terminalOutput: 'Terminal Output',
  },

  // Time dialog
  timeDialog: {
    title: 'Engine Analysis Parameters Settings',
    movetime: 'Move Time (ms)',
    maxThinkTime: 'Max Think Time (ms)',
    maxDepth: 'Max Depth',
    maxNodes: 'Max Nodes',
    analysisMode: 'Analysis Mode',
    advanced: 'Advanced Script',
    resetToDefaults: 'Reset to Defaults',
    clearSettings: 'Clear Settings',
    confirmClearSettings:
      'Are you sure you want to clear all analysis parameter configurations? This action cannot be undone.',
    settingsCleared: 'Analysis parameter configurations cleared',
    analysisModes: {
      movetime: 'Analyze by Move Time',
      maxThinkTime: 'Analyze by Max Think Time',
      depth: 'Analyze by Depth',
      nodes: 'Analyze by Nodes',
      advanced: 'Advanced Programming Mode',
    },
    advancedHint1:
      'Supports simple programming: assignment, arithmetic, bitwise operations, if conditions',
    advancedHint2:
      'Available variables: movetime, depth, nodes, maxThinkTime, prev',
    advancedPlaceholder: 'Please write your script here...',
    advancedExamples: {
      title: 'Example Code',
      basic: 'Basic Settings',
      basicCode: `depth=20
movetime=1000
nodes=2000000`,
      conditional: 'Conditional Control',
      conditionalCode: `if (!prev.prev.exists()){
  movetime=1000
} else {
  movetime=prev.prev.movetime / 1.05
}`,
      scoreBased: 'Score-based Adjustment',
      scoreBasedCode: `if (-prev.score < -300){
  movetime = 4000
} else if (-prev.score < -200) {
  movetime = 3000
} else {
  movetime = 2000
}`,
      variables: 'Available Variables',
      variablesDesc: `prev.exists() - Check if previous move exists
prev.movetime - Previous move's requested time
prev.depth - Previous move's search depth
prev.nodes - Previous move's search nodes
prev.score - Previous move's score
prev.timeUsed - Previous move's actual time used
prev.prev - Previous-previous move (supports infinite nesting)`,
    },
  },

  // Position editor dialog
  positionEditor: {
    title: 'Position Editor',
    flipBoard: '🔄 Flip Board',
    mirrorLeftRight: '↔️ Mirror Left-Right',
    switchSide: '⚡ Switch Side',
    resetPosition: '🔄 Reset Position',
    clearPosition: '🔄 Clear Position',
    recognizeImage: '🖼️ Recognize Image',
    addPieces: 'Add Pieces',
    revealedPieces: 'Revealed Pieces',
    darkPieces: 'Dark Pieces',
    darkPiece: 'Dark',
    selectedPosition: 'Selected Position',
    selectedPiece: 'Selected Piece',
    clickToPlace: 'Click position to place',
    piece: 'Piece',
    currentSide: 'Current Side',
    redToMove: 'Red to Move',
    blackToMove: 'Black to Move',
    imageRecognition: 'Image Recognition',
    clickOrDragImage: 'Click to upload or drag image here',
    supportedFormats: 'Supports JPG, PNG and other image formats',
    startRecognition: 'Start Recognition',
    applyResults: 'Apply Results',
    recognitionResults: 'Recognition Results',
    imageRecognitionStatus: {
      loadingModel: 'Loading model...',
      modelLoadedSuccessfully: 'Model loaded successfully',
      modelLoadingFailed: 'Model loading failed: {error}',
      loadingImage: 'Loading image...',
      preprocessingImage: 'Preprocessing image...',
      runningModelInference: 'Running model inference...',
      postProcessingResults: 'Post-processing results...',
      recognitionCompleted: 'Recognition completed!',
      processingFailed: 'Processing failed: {error}',
      unknownError: 'Unknown error',
    },
    showBoundingBoxes: 'Show bounding boxes',
    preserveDarkPools: 'Preserve dark piece pools',
    validationStatus: {
      normal: 'Normal',
      error: 'Error: Dark piece count mismatch',
      noRedKing: 'Error: No red king',
      noBlackKing: 'Error: No black king',
      kingOutOfPalace: 'Error: King outside palace',
      kingFacing: 'Error: Kings facing each other',
      inCheck: 'Error: Current side in check',
      tooManyPieces: 'Error: Too many pieces of type',
      tooManyTotalPieces: 'Error: Total pieces exceed 16',
      darkPieceInvalidPosition: 'Error: Dark piece in invalid position',
      duplicatePosition: 'Error: Duplicate piece positions',
    },
    cancel: 'Cancel',
    applyChanges: 'Apply Changes',
    clear: 'Clear',
    pieces: {
      red_chariot: 'Red Chariot',
      red_horse: 'Red Horse',
      red_elephant: 'Red Elephant',
      red_advisor: 'Red Advisor',
      red_king: 'Red King',
      red_cannon: 'Red Cannon',
      red_pawn: 'Red Pawn',
      black_chariot: 'Black Chariot',
      black_horse: 'Black Horse',
      black_elephant: 'Black Elephant',
      black_advisor: 'Black Advisor',
      black_king: 'Black King',
      black_cannon: 'Black Cannon',
      black_pawn: 'Black Pawn',
      unknown: 'Dark Piece',
      red_unknown: 'Red Dark Piece',
      black_unknown: 'Black Dark Piece',
    },
  },

  // FEN input dialog
  fenInput: {
    title: 'Input FEN String',
    placeholder: 'Please input FEN string...',
    confirm: 'Confirm',
    cancel: 'Cancel',
  },

  // Notation JSON dialog
  notationTextDialog: {
    title: 'View / Paste Notation (JSON)',
    placeholder:
      'JSON of current game notation will appear here. You can copy it, or paste a notation JSON and click Apply to load it.',
    copy: 'Copy JSON',
    apply: 'Apply',
  },

  // Flip prompt dialog
  flipPrompt: {
    title: 'Flip Piece Prompt',
    message: 'Please select the piece to flip',
    confirm: 'Confirm',
    cancel: 'Cancel',
  },

  // About dialog
  about: {
    title: 'About JieqiBox',
    version: 'Version',
    description:
      'A modern Jieqi analysis and game desktop application built with Tauri and Vue 3.',
    author: 'Author',
    license: 'License',
    github: 'GitHub',
    downloadLatest: 'Download Latest Version',
    viewLicense: 'View License Details',
  },

  // Analysis related
  analysis: {
    title: 'Engine Analysis',
    startAnalysis: 'Start Analysis',
    stopAnalysis: 'Stop Analysis',
    engineNotLoaded: 'Engine Not Loaded',
    loadEngine: 'Load Engine',
    loadEngineSaf: 'Load Engine (SAF)',
    analysisResults: 'Analysis Results',
    bestMove: 'Best Move',
    score: 'Score',
    depth: 'Depth',
    nodes: 'Nodes',
    time: 'Time',
    pv: 'Principal Variation',
    engineLoaded: 'Engine Loaded',
    playBestMove: 'Play Best Move',
    undoMove: 'Undo Move',
    redAiOn: 'Red AI (On)',
    redAiOff: 'Red AI (Off)',
    blackAiOn: 'Black AI (On)',
    blackAiOff: 'Black AI (Off)',
    freeFlipMode: 'Free Flip Mode',
    darkPiecePool: '(Captured) Dark Piece Pool',
    captureHistory: 'Capture History',
    myCaptured: 'My Captured',
    opponentCaptured: 'Opponent Captured',
    noCaptured: 'None',
    engineAnalysis: 'Engine Analysis',
    notation: 'Notation',
    moveComments: 'Move Comments',
    noComment: 'No comment',
    enterComment: 'Enter comment...',
    saveComment: 'Save',
    cancelComment: 'Cancel',
    opening: 'Opening',
    adjustment: 'Adjustment',
    engineLog: 'Engine Log',
    uciTerminal: 'UCI Terminal',
    about: 'About',
    undockPanel: 'Undock Panel',
    dockPanel: 'Dock Panel',
    restorePanels: 'Restore Panels Layout',
    flipBoard: 'Flip Board',
    flipBoardBack: 'Restore',
    ponderMode: 'Ponder Mode',
    selectEngine: 'Select Engine',
    manageEngines: 'Manage',
    unloadEngine: 'Unload Engine',
    noEngineLoaded: 'No engine is currently loaded.',
    // Match mode related
    enterMatchMode: 'Match Mode',
    exitMatchMode: 'Exit Match Mode',
    // Human vs AI mode related
    enterHumanVsAiMode: 'Human vs AI',
    exitHumanVsAiMode: 'Exit Human vs AI',
    startMatch: 'Start Match',
    stopMatch: 'Stop Match',
    jaiSettings: 'Match Options',
    matchInfo: 'Match Information',
    matchStatus: 'Status',
    gameProgress: 'Progress',
    engineInfo: 'Engine',
    lastResult: 'Result',
    matchWld: 'WLD',
    eloRating: 'Elo Rating',
    eloCalculator: 'Elo Calculator',
    matchEngines: 'Engines',
    running: 'Running',
    stopped: 'Stopped',
    noMatchEngine: 'No match engine loaded',
    noAnalysis: 'No analysis available',
    // Luck index related
    luckIndex: 'Luck Index',
    luckIndexBasedOnFlipSequence: 'Estimated based on flip sequence',
    blackFavor: 'Black Favor',
    redFavor: 'Red Favor',
    currentValue: 'Current Value',
    // Navigation buttons
    goToFirst: 'Go to First Move',
    goToPrevious: 'Go to Previous Move',
    goToNext: 'Go to Next Move',
    goToLast: 'Go to Last Move',
    play: 'Play',
    pause: 'Pause',
    annotateMove: 'Annotate Move',
    // Move annotations
    brilliant: 'Brilliant',
    good: 'Good',
    interesting: 'Interesting',
    dubious: 'Dubious',
    mistake: 'Mistake',
    blunder: 'Blunder',
    clear: 'Clear',
  },

  // Engine Manager
  engineManager: {
    title: 'Engine Manager',
    addEngine: 'Add Engine',
    addEngineAndroid: 'Add Engine (SAF)',
    editEngine: 'Edit Engine',
    engineName: 'Engine Name',
    enginePath: 'Engine Path',
    arguments: 'Command-line Arguments',
    actions: 'Actions',
    confirmDeleteTitle: 'Confirm Deletion',
    confirmDeleteMessage:
      'Are you sure you want to delete the engine "{name}"? This action cannot be undone.',
    promptEngineName: 'Please enter a unique name for the engine:',
    promptEngineArgs:
      'Please enter command-line arguments for the engine (optional, leave empty if unknown):',
    promptHasNnue: 'Does this engine use NNUE files? (y/n):',
    promptNnueFile: 'Please select the NNUE file for the engine:',
    nameExists: 'This name already exists. Please use a unique name.',
    engineAddedSuccess: 'Engine {name} was added successfully!',
  },

  // UCI saved options editor inside Engine Manager
  uciEditor: {
    title: 'Saved UCI Options',
    noSaved:
      'No saved options for this engine yet. Add items below to preconfigure before loading the engine.',
    addOption: 'Add Option',
    optionName: 'Option Name',
    optionValue: 'Value',
    type: 'Type',
    typeString: 'String',
    typeNumber: 'Number',
    typeSwitch: 'Switch',
    typeCombo: 'Combo (select)',
    typeButton: 'Button',
    willExecute: 'Execute on load',
    noExecute: 'Do not execute',
  },

  // JAI options dialog
  jaiOptions: {
    title: 'JAI Match Options',
    loadingText: 'Loading engine options...',
    noEngineLoaded: 'No match engine is currently loaded.',
    pleaseLoadEngineFirst:
      'Please load a match engine first to configure its options.',
    loadEngine: 'Load Engine',
    noOptionsAvailable: 'No JAI options available for this engine.',
    refreshOptions: 'Refresh Options',
    range: 'Range',
    execute: 'Execute',
    resetToDefaults: 'Reset to Defaults',
    clearSettings: 'Clear Settings',
    confirmClearSettings:
      'Are you sure you want to clear all JAI option configurations for the current engine? This action cannot be undone.',
    settingsCleared: 'JAI option configurations cleared',
    // JAI option descriptions
    optionDescriptions: {
      Engine1Path:
        'The full path to the first UCI-compatible Jieqi engine executable.',
      Engine1Options:
        'A string of UCI "setoption" commands for Engine 1. Each option must follow the format "name <Option Name> value <Value>". Multiple options are separated by spaces. This parser correctly handles option names and values that contain spaces. Example: "name Threads value 4 name Hash value 256"',
      Engine2Path:
        'The full path to the second UCI-compatible Jieqi engine executable.',
      Engine2Options:
        'A string of UCI "setoption" commands for Engine 2. See "Engine1Options" for format and examples.',
      TotalRounds:
        'The number of pairs of games to be played. The total number of games will be "TotalRounds * 2", as engines switch colors for each round.',
      Concurrency: 'The number of games to run in parallel.',
      BookFile:
        "Path to an opening book file. The file should contain one FEN position per line. At the start of each round, a FEN is chosen randomly from this file to be used for that round's pair of games. If the path is empty, invalid, or the file contains no FENs, the default starting position is used.",
      MainTimeMs:
        'The base thinking time for each player in a game, specified in milliseconds.',
      IncTimeMs:
        "The time increment added to a player's clock after each move, specified in milliseconds.",
      TimeoutBufferMs:
        'A grace period in milliseconds to account for process and communication overhead. A player is only declared lost on time if their clock falls below "-(TimeoutBufferMs)".',
      Logging:
        'If enabled ("true"), the match engine will create detailed log files for each engine process, capturing all UCI communication.',
      SaveNotation:
        'Switch to enable saving game notation files for each game.',
      SaveNotationDir:
        'Directory path where notation files will be saved when saving is enabled.',
      TimeControl: 'Time control settings for each engine.',
      AdjudicationRule: 'Rules for adjudicating drawn or decisive positions.',
    },
  },

  // JAI messages
  jai: {
    engineReady: 'Match engine is ready',
    matchStarted: 'Match started',
    matchStopped: 'Match stopped',
    gameProgress: 'Game {current} of {total}',
    matchResult: 'Match result: {result}',
  },

  // Elo Calculator
  eloCalculator: {
    title: 'Elo Calculator',
    inputSection: 'Match Results',
    wins: 'Wins',
    losses: 'Losses',
    draws: 'Draws',
    totalGames: 'Total Games',
    resultsFormat: 'Results Format',
    formatWDL: 'WDL (Wins/Draws/Losses)',
    formatPTNML: 'PTNML (pairs)',
    ptnml: {
      ll: 'LL',
      lddl: 'LD+DL',
      center: 'LW+DD+WL',
      dwwd: 'DW+WD',
      ww: 'WW',
    },
    resultsSection: 'Elo Performance',
    performance: 'Elo Difference (with 95% error)',
    confidenceInterval: '95% Confidence Interval',
    scoreRate: 'Score Rate',
    los: 'LOS (Likelihood of Superiority)',
    drawRatio: 'Draw Ratio',
    standardError: 'Standard Error',
    noResults: 'Enter match results to see calculations.',
    basicRequiresWDL: 'Basic mode requires WDL input. Switch to WDL.',
    close: 'Close',
    basicMode: 'Basic',
  },

  // Error messages
  errors: {
    saveNotationFailed: 'Failed to save notation',
    openNotationFailed: 'Failed to open notation',
    engineNotLoaded: 'Engine not loaded, cannot send command',
    engineSendUnavailable: 'Engine send method unavailable',
    redDarkPiecesMismatch:
      'Error: Red side {darkCount} dark pieces > {poolCount} pool',
    blackDarkPiecesMismatch:
      'Error: Black side {darkCount} dark pieces > {poolCount} pool',
    pieceCountExceeded: 'Error: {pieceName} total count exceeded!',
    engineLoadFailed: 'Failed to load engine {name}: {error}',
    jaiEngineLoadFailed: 'Failed to load JAI match engine {name}: {error}',
    engineUnloadFailed: 'Failed to unload engine',
    failedToOpenFileSelector: 'Failed to open file selector',
    failedToProcessEngine: 'Failed to process engine file',
    invalidFenFormat: 'Invalid FEN format',
  },

  // Chessboard bottom
  chessboard: {
    copyFen: 'Copy FEN',
    pasteFen: 'Paste FEN',
    inputFen: 'Input FEN',
    inputCopyFen: 'Input/Copy FEN',
    newGame: 'New Game',
    copied: '✓ Copied',
    clearDrawings: 'Clear Drawings',
  },

  // Evaluation Chart
  evaluationChart: {
    title: 'Evaluation Chart',
    rightClickHint: 'Right-click for options',
    longPressHint: 'Long press for options',
    showMoveLabels: 'Show Move Labels',
    linearYAxis: 'Linear Y-Axis',
    showOnlyLines: 'Show Only Lines',
    blackPerspective: 'Black Perspective',
    clampYAxis: 'Clamp Y-Axis',
    clampValue: 'Clamp Value',
    colorScheme: 'Color Scheme',
    redGreen: 'Red-Green',
    blueOrange: 'Blue-Orange',
    showSeparateLines: 'Show Separate Lines for Red & Black',
    opening: 'Opening',
    noData: 'No analysis data available',
    newGame: 'New Game',
    copied: '✓ Copied',
    saveChartImage: 'Save Chart Image',
    chartImageSaved: 'Chart image saved to {path}',
    saveChartImageFailed: 'Failed to save chart image',
    viewMode: 'View Mode',
    evaluation: 'Evaluation',
    time: 'Time',
    depth: 'Depth',
  },

  // Language selection
  languages: {
    current: 'Current Language',
    zh_cn: '简体中文',
    zh_tw: '繁體中文',
    en: 'English',
    vi: 'Tiếng Việt',
    ja: '日本語',
  },

  // Interface settings dialog
  interfaceSettings: {
    title: 'Interface Settings',
    showCoordinates: 'Show rank and file numbers',
    parseUciInfo: 'Parse UCI Info',
    showAnimations: 'Enable move animations',
    showPositionChart: 'Show evaluation chart',
    showEvaluationBar: 'Show evaluation bar',
    darkMode: 'Dark Mode',
    autosave: 'Auto-save game to Autosave.json',
    useNewFenFormat: 'Use New FEN Format',
    engineLogLineLimit: 'Engine Log Line Limit',
    validationTimeout: 'Engine Validation Timeout (ms)',
    showChineseNotation: 'Show Chinese Notation',
    showLuckIndex: 'Show Luck Index',
    showArrows: 'Show Arrows',
    enableSoundEffects: 'Enable Sound Effects',
    soundVolume: 'Sound Volume',
  },

  // UCI messages
  uci: {
    depth: 'Depth',
    seldepth: 'SelDepth',
    multipv: 'MultiPV',
    score: 'Score',
    mate: 'Mate',
    wdl: 'W/D/L',
    nodes: 'Nodes',
    nps: 'NPS',
    hashfull: 'HashFull',
    tbhits: 'TBHits',
    time: 'Time',
    pv: 'PV',
    checkmate: 'Checkmate! No moves available.',
    bestMove: 'Best Move: {move}',
    noMoves: 'No moves available',
    engineReady: 'Engine is ready',
  },

  // Game operation confirmation
  gameConfirm: {
    clearHistoryTitle: 'Clear Subsequent History',
    clearHistoryMessage:
      'You are making a move in a historical position. This will clear all subsequent move history. Are you sure you want to continue?',
    confirm: 'Confirm',
    cancel: 'Cancel',
  },

  // Game end notifications
  gameEnd: {
    humanWins: 'Congratulations! You Win!',
    aiWins: 'Game Over - AI Wins',
    humanWinsMessage:
      'You have defeated the AI! The AI has no legal moves remaining.',
    aiWinsMessage:
      'The AI has won this game. You have no legal moves remaining.',
    ok: 'OK',
  },

  // Human vs AI mode
  humanVsAi: {
    title: 'Human vs AI Mode',
    selectAiSide: 'Select AI Side',
    redAiBlackHuman: 'Red AI, Black Human',
    blackAiRedHuman: 'Black AI, Red Human',
    options: 'Options',
    showEngineAnalysis: 'Show Engine Analysis',
    engineAnalysisHint:
      'When enabled, you can view engine analysis results, but it does not affect game rules',
    ponderNote: 'About Ponder:',
    ponderUnifiedHint:
      'Ponder uses global settings, which can be toggled in the sidebar in normal mode',
    rulesTitle: 'Game Rules',
    rule1: 'Random flip mode is automatically enforced',
    rule2: 'You can only see the dark pieces you capture from AI',
    rule3: 'AI can only see the dark pieces it captures from you',
    rule4: 'Limited information battle according to standard Jieqi rules',
    startGame: 'Start Game',
  },

  // Opening Book
  openingBook: {
    title: 'Opening Book',
    currentMoves: 'Current Position Moves',
    manage: 'Manage',
    settings: 'Settings',
    statistics: 'Statistics',
    noMoves: 'No opening book moves for the current position',
    foundMoves: 'Found {count} moves',
    positions: 'Positions',
    move: 'Move',
    priority: 'Priority',
    stats: 'W/D/L',
    allowed: 'Allowed',
    comment: 'Comment',
    addPosition: 'Add Current Position',
    editMove: 'Edit Move',
    addMove: 'Add Move',
    moveUci: 'UCI Move',
    moveRequired: 'Move is required',
    invalidUci: 'Invalid UCI format',
    invalidMoveFormat:
      'Invalid move format, please use UCI format (e.g.: a1a2) or Chinese notation format (e.g.: 炮二平五)',
    invalidLegalMove: 'This move is not a legal move for the current position',
    wins: 'Wins',
    draws: 'Draws',
    losses: 'Losses',
    import: 'Import',
    export: 'Export',
    selectFile: 'Select File',
    format: 'Format',
    dangerZone: 'Danger Zone',
    clearAll: 'Clear All',
    confirmClear: 'Confirm Clear',
    clearWarning:
      'This will permanently delete all entries in the opening book. This action cannot be undone.',
    confirmDelete: 'Confirm Deletion',
    deleteWarning:
      'Are you sure you want to delete this move? This action cannot be undone.',
    enableInGame: 'Enable Opening Book in Game',
    showMoves: 'Show Opening Book Moves',
    show: 'Show',
    preferHighPriority: 'Prefer high priority moves',
    totalPositions: 'Total Positions',
    totalMoves: 'Total Moves',
    allowedMoves: 'Allowed Moves',
    disallowedMoves: 'Disallowed Moves',
    refreshStats: 'Refresh Stats',
    refresh: 'Refresh',
    getBookMove: 'Play Move from Book',
    initializing: 'Initializing...',
    showLess: 'Show Less',
    showMore: 'Show More',
    addMarkedMoves: 'Add Drawing Moves',
    addMarkedMovesTitle: 'Add Drawing Moves to Opening Book',
    markedMovesCount: 'Found {count} drawing legal move(s)',
    noMarkedMoves: 'No drawing legal moves found',
    batchSettings: 'Batch Settings',
  },
}
