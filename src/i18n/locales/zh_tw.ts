export default {
  // 通用
  common: {
    confirm: '確定',
    cancel: '取消',
    close: '關閉',
    save: '儲存',
    open: '開啟',
    refresh: '重新整理',
    reset: '重設',
    clear: '清除',
    apply: '套用',
    execute: '執行',
    loading: '載入中...',
    error: '錯誤',
    success: '成功',
    warning: '警告',
    info: '資訊',
    delete: '刪除',
    required: '此欄位為必填項',
  },

  // 頂部工具列
  toolbar: {
    newGame: '新對局',
    copyFen: '複製FEN',
    inputFen: '輸入FEN',
    editPosition: '編輯局面',
    uciSettings: 'UCI設定',
    analysisParams: '分析參數',
    saveNotation: '儲存棋譜',
    openNotation: '開啟棋譜',
    gameTitle: '揭棋對局',
    interfaceSettings: '介面設定',
    variation: '禁止當前著法',
    noMoreVariations: '已無更多可變的走法',
    darkMode: '暗黑模式',
    lightMode: '亮色模式',
  },

  // UCI選項對話框
  uciOptions: {
    title: 'UCI引擎選項',
    loadingText: '正在載入引擎選項...',
    noEngineLoaded: '目前未載入任何引擎。',
    pleaseLoadEngineFirst: '請先載入引擎以配置其選項。',
    loadEngine: '載入引擎',
    noOptionsAvailable: '該引擎無可用UCI選項。',
    refreshOptions: '重新整理選項',
    range: '範圍',
    execute: '執行',
    resetToDefaults: '恢復預設',
    clearSettings: '清除設定',
    confirmClearSettings:
      '確定要清除當前引擎的所有UCI選項配置嗎？此操作不可恢復。',
    settingsCleared: '已清除UCI選項配置',
    // UCI選項說明
    optionDescriptions: {
      'Debug Log File': '輸出的引擎與介面通信的除錯檔案。',
      Threads:
        '引擎搜尋的執行緒數，推薦將其設定為系統可用的最大執行緒數減去1或2個執行緒。',
      Hash: '引擎的雜湊表大小（單位MB），推薦將其設定為可用記憶體的最大值減去1或2 GiB的記憶體。',
      'Clear Hash': '清除雜湊表。',
      MultiPV:
        '多主要變例，可以顯示多個推薦的走法。推薦設定為1，如果設為大於1，最優著法的品質會下降，因為程式會將部分資源分配去計算其他可能的走法。',
      NumaPolicy:
        '將執行緒綁定到特定的NUMA節點以確保執行。在具有多個CPU或具有多個NUMA域的CPU的系統上提高效能。',
      Ponder: '讓引擎在對手思考時進行後台思考。',
      'Move Overhead':
        '假設由於網路和GUI開銷造成的x毫秒時間延遲。這在避免超時損失時很有用。',
      nodestime:
        '告訴引擎使用搜尋的節點數而不是牆鐘時間來計算經過的時間。對引擎測試很有用。',
      UCI_ShowWDL:
        '如果啟用，在引擎輸出中顯示近似的WDL統計資訊。這些WDL數字模擬了在給定評估和遊戲層數下引擎自對弈的預期遊戲結果。',
      EvalFile:
        'NNUE評估參數檔案的名稱。根據GUI的不同，檔案名可能需要包含包含該檔案的資料夾/目錄的完整路徑。',
    },
  },

  // 時間對話框
  timeDialog: {
    title: '引擎分析參數設定',
    movetime: '步時 (毫秒)',
    maxThinkTime: '最大思考時間 (毫秒)',
    maxDepth: '最大層數',
    maxNodes: '最大節點數',
    analysisMode: '分析模式',
    resetToDefaults: '恢復預設',
    clearSettings: '清除設定',
    confirmClearSettings: '確定要清除所有分析參數配置嗎？此操作不可恢復。',
    settingsCleared: '已清除分析參數配置',
    analysisModes: {
      movetime: '按步時分析',
      maxThinkTime: '按最大思考時間分析',
      depth: '按層數分析',
      nodes: '按節點數分析',
    },
  },

  // 局面編輯對話框
  positionEditor: {
    title: '局面編輯',
    flipBoard: '🔄 上下翻轉',
    switchSide: '⚡ 切換先手',
    resetPosition: '🔄 重設局面',
    addPieces: '新增棋子',
    brightPieces: '明子',
    darkPieces: '暗子',
    selectedPosition: '選中位置',
    piece: '棋子',
    validationStatus: {
      normal: '正常',
      error: '錯誤: 暗子數量不匹配',
    },
    cancel: '取消',
    applyChanges: '套用變更',
    pieces: {
      red_chariot: '紅車',
      red_horse: '紅馬',
      red_elephant: '紅象',
      red_advisor: '紅士',
      red_king: '紅帥',
      red_cannon: '紅炮',
      red_pawn: '紅兵',
      black_chariot: '黑車',
      black_horse: '黑馬',
      black_elephant: '黑象',
      black_advisor: '黑士',
      black_king: '黑將',
      black_cannon: '黑炮',
      black_pawn: '黑卒',
      unknown: '暗子',
      red_unknown: '紅暗子',
      black_unknown: '黑暗子',
    },
  },

  // FEN輸入對話框
  fenInput: {
    title: '輸入FEN字串',
    placeholder: '請輸入FEN字串...',
    confirm: '確認',
    cancel: '取消',
  },

  // 翻子提示對話框
  flipPrompt: {
    title: '翻子提示',
    message: '請選擇要翻開的棋子',
    confirm: '確認',
    cancel: '取消',
  },

  // 關於對話框
  about: {
    title: '關於JieqiBox',
    version: '版本',
    description:
      '一個現代化的揭棋分析和對弈桌面應用程式，基於 Tauri 和 Vue 3 建構。',
    features: '功能特性',
    featuresList: [
      '揭棋對局支援',
      'UCI引擎分析',
      '棋譜儲存和載入',
      '局面編輯',
      'FEN字串支援',
    ],
    author: '作者',
    license: '授權條款',
    github: 'GitHub',
    downloadLatest: '下載最新版本',
    viewLicense: '查看授權條款詳情',
  },

  // 分析側邊欄
  analysis: {
    title: '引擎分析',
    startAnalysis: '開始分析',
    stopAnalysis: '停止分析',
    engineNotLoaded: '引擎未載入',
    loadEngine: '載入引擎',
    loadEngineSaf: '載入引擎（SAF）',
    analysisResults: '分析結果',
    bestMove: '最佳著法',
    score: '評分',
    depth: '層數',
    nodes: '節點數',
    time: '時間',
    pv: '主要變例',
    engineLoaded: '引擎已載入',
    playBestMove: '走最佳著',
    undoMove: '悔棋',
    redAiOn: '紅方電腦(開)',
    redAiOff: '紅方電腦(關)',
    blackAiOn: '黑方電腦(開)',
    blackAiOff: '黑方電腦(關)',
    freeFlipMode: '自由翻子模式',
    darkPiecePool: '暗子池',
    engineAnalysis: '引擎分析',
    notation: '棋譜',
    moveComments: '棋步註釋',
    noComment: '無註釋',
    enterComment: '輸入註釋...',
    saveComment: '儲存',
    cancelComment: '取消',
    opening: '開局',
    adjustment: '調整',
    engineLog: '引擎日誌',
    about: '關於',
    flipBoard: '翻轉棋盤',
    flipBoardBack: '恢復方向',
    ponderMode: '後台思考',
    selectEngine: '選擇引擎',
    manageEngines: '管理',
    unloadEngine: '卸載引擎',
    noEngineLoaded: '目前沒有載入任何引擎。',
  },

  // 引擎管理器
  engineManager: {
    title: '引擎管理器',
    addEngine: '新增引擎',
    addEngineAndroid: '新增引擎 (SAF)',
    editEngine: '編輯引擎',
    engineName: '引擎名稱',
    enginePath: '引擎路徑',
    arguments: '命令列參數',
    actions: '操作',
    confirmDeleteTitle: '確認刪除',
    confirmDeleteMessage: '您確定要刪除引擎「{name}」嗎？此操作無法復原。',
    promptEngineName: '請輸入引擎的唯一名稱：',
    promptEngineArgs: '請輸入引擎的命令列參數（可選）：',
    nameExists: '該名稱已存在，請使用唯一的名稱。',
    engineAddedSuccess: '引擎 {name} 新增成功！',
  },

  // 錯誤訊息
  errors: {
    saveNotationFailed: '儲存棋譜失敗',
    openNotationFailed: '開啟棋譜失敗',
    engineNotLoaded: '引擎未載入，無法傳送命令',
    engineSendUnavailable: '引擎send方法不可用',
    darkPiecesMismatch: '錯誤: {darkCount}暗子 > {poolCount}池',
    pieceCountExceeded: '錯誤: {pieceName} 總數超限!',
    engineLoadFailed: '載入引擎 {name} 失敗: {error}',
    engineUnloadFailed: '卸載引擎失敗',
    failedToOpenFileSelector: '開啟檔案選擇器失敗',
    failedToProcessEngine: '處理引擎檔案失敗',
  },

  // 棋盤底部
  chessboard: {
    copyFen: '複製FEN',
    pasteFen: '貼上FEN',
    inputFen: '輸入FEN',
    newGame: '新對局',
    copied: '✓ 已複製',
  },

  // 局勢圖
  evaluationChart: {
    title: '局勢圖',
    showMoveLabels: '顯示著法標籤',
    opening: '開局',
    noData: '暫無分析數據',
    newGame: '新對局',
    copied: '✓ 已複製',
  },

  // 語言選擇
  languages: {
    current: '當前語言',
    zh_cn: '简体中文',
    zh_tw: '繁體中文',
    en: 'English',
    vi: 'Tiếng Việt',
    ja: '日本語',
  },

  // 介面設定
  interfaceSettings: {
    title: '介面設定',
    showCoordinates: '顯示座標',
    parseUciInfo: '解析UCI資訊',
    showAnimations: '開啟走子動畫',
    showPositionChart: '顯示局勢圖',
    darkMode: '暗黑模式',
    autosave: '自動儲存棋譜到Autosave.json',
  },

  // UCI訊息
  uci: {
    depth: '深度',
    seldepth: '選擇深度',
    multipv: '多PV',
    score: '分數',
    mate: '絕殺',
    nodes: '節點數',
    nps: 'NPS',
    hashfull: 'Hash佔用',
    tbhits: '庫命中',
    time: '用時',
    pv: '主變',
    checkmate: '絕殺！無著可走',
    bestMove: '最佳著法: {move}',
    noMoves: '無著可走',
    engineReady: '引擎已就緒',
  },

  // 遊戲操作確認
  gameConfirm: {
    clearHistoryTitle: '清空後續棋譜',
    clearHistoryMessage:
      '您正在歷史局面中走子，這將清空後續的所有棋譜記錄。確定要繼續嗎？',
    confirm: '確定',
    cancel: '取消',
  },
}
