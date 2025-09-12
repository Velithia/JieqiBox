export default {
  // 通用
  common: {
    confirm: '确定',
    cancel: '取消',
    close: '关闭',
    save: '保存',
    open: '打开',
    refresh: '刷新',
    reset: '重置',
    clear: '清除',
    apply: '应用',
    execute: '执行',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    warning: '警告',
    info: '信息',
    delete: '删除',
    required: '此字段为必填项',
  },

  // 顶部工具栏
  toolbar: {
    newGame: '新对局',
    copyFen: '复制FEN',
    inputFen: '输入FEN',
    editPosition: '编辑局面',
    uciSettings: 'UCI设置',
    analysisParams: '分析参数',
    saveNotation: '保存棋谱',
    openNotation: '打开棋谱',
    interfaceSettings: '界面设置',
    gameTitle: '揭棋对局',
    variation: '禁止当前着法',
    noMoreVariations: '已无更多可变的走法',
    darkMode: '暗黑模式',
    lightMode: '亮色模式',
    viewPasteNotation: '查看/输入棋谱',
    reviewAnalysis: '复盘分析',
  },

  // UCI选项对话框
  uciOptions: {
    title: 'UCI引擎选项',
    loadingText: '正在加载引擎选项...',
    noEngineLoaded: '当前未加载任何引擎。',
    pleaseLoadEngineFirst: '请先加载引擎以配置其选项。',
    loadEngine: '加载引擎',
    noOptionsAvailable: '该引擎无可用UCI选项。',
    refreshOptions: '刷新选项',
    range: '范围',
    execute: '执行',
    resetToDefaults: '恢复默认',
    clearSettings: '清除配置',
    confirmClearSettings:
      '确定要清除当前引擎的所有UCI选项配置吗？此操作不可恢复。',
    settingsCleared: '已清除UCI选项配置',
    // UCI选项说明
    optionDescriptions: {
      'Debug Log File': '输出的引擎与界面通信的调试文件。',
      Threads:
        '引擎搜索的线程数，推荐将其设置为系统可用的最大线程数减去1或2个线程。',
      Hash: '引擎的哈希表大小（单位MB），推荐将其设置为可用内存的最大值减去1或2 GiB的内存。',
      'Clear Hash': '清除哈希表。',
      MultiPV:
        '多主要变例，可以显示多个推荐的走法。推荐设置为1，如果设为大于1，最优着法的质量会下降，因为程序会将部分资源分配去计算其他可能的走法。',
      NumaPolicy:
        '将线程绑定到特定的NUMA节点以确保执行。在具有多个CPU或具有多个NUMA域的CPU的系统上提高性能。',
      Ponder: '让引擎在对手思考时进行后台思考。',
      'Move Overhead':
        '假设由于网络和GUI开销造成的x毫秒时间延迟。这在避免超时损失时很有用。',
      nodestime:
        '告诉引擎使用搜索的节点数而不是墙钟时间来计算经过的时间。对引擎测试很有用。',
      UCI_ShowWDL:
        '如果启用，在引擎输出中显示近似的WDL统计信息。这些WDL数字模拟了在给定评估和游戏层数下引擎自对弈的预期游戏结果。',
      EvalFile:
        'NNUE评估参数文件的名称。根据GUI的不同，文件名可能需要包含包含该文件的文件夹/目录的完整路径。',
    },
  },

  // 复盘分析对话框
  reviewDialog: {
    title: '复盘分析',
    movetime: '每步用时 (毫秒)',
    progress: '进度: {current}/{total}',
  },

  // UCI终端对话框
  uciTerminal: {
    title: 'UCI终端',
    enterCommand: '输入UCI命令...',
    sendCommand: '发送命令',
    noEngineLoaded: '当前未加载任何引擎。',
    pleaseLoadEngineFirst: '请先加载引擎以使用终端。',
    quickCommands: '快速命令',
    clear: '清空终端',
    commandHistory: '命令历史',
    terminalOutput: '终端输出',
  },

  // 时间对话框
  timeDialog: {
    title: '引擎分析参数设置',
    movetime: '步时 (毫秒)',
    maxThinkTime: '最大思考时间 (毫秒)',
    maxDepth: '最大层数',
    maxNodes: '最大节点数',
    analysisMode: '分析模式',
    advanced: '高级脚本',
    resetToDefaults: '恢复默认',
    clearSettings: '清除配置',
    confirmClearSettings: '确定要清除所有分析参数配置吗？此操作不可恢复。',
    settingsCleared: '已清除分析参数配置',
    analysisModes: {
      movetime: '按步时分析',
      maxThinkTime: '按最大思考时间分析',
      depth: '按层数分析',
      nodes: '按节点数分析',
      advanced: '高级编程模式',
    },
    advancedHint1: '支持简单编程：赋值、算术、位运算、if条件',
    advancedHint2: '可用变量：movetime, depth, nodes, maxThinkTime, prev',
    advancedPlaceholder: '请在此处编写您的脚本...',
    advancedExamples: {
      title: '示例代码',
      basic: '基础设置',
      basicCode: `depth=20
movetime=1000
nodes=2000000`,
      conditional: '条件控制',
      conditionalCode: `if (!prev.prev.exists()){
  movetime=1000
} else {
  movetime=prev.prev.movetime / 1.05
}`,
      scoreBased: '基于分数调整',
      scoreBasedCode: `if (-prev.score < -300){
  movetime = 4000
} else if (-prev.score < -200) {
  movetime = 3000
} else {
  movetime = 2000
}`,
      variables: '可用变量说明',
      variablesDesc: `prev.exists() - 判断上一步是否存在
prev.movetime - 上一步请求的步时
prev.depth - 上一步的搜索深度
prev.nodes - 上一步的搜索节点数
prev.score - 上一步的分数
prev.timeUsed - 上一步引擎实际耗时
prev.prev - 上上步（支持无限嵌套）`,
    },
  },

  // 局面编辑对话框
  positionEditor: {
    title: '局面编辑',
    flipBoard: '🔄 上下翻转',
    mirrorLeftRight: '↔️ 左右对称',
    switchSide: '⚡ 切换先手',
    resetPosition: '🔄 重置局面',
    clearPosition: '🔄 清除局面',
    recognizeImage: '🖼️ 识别图片',
    addPieces: '添加棋子',
    brightPieces: '明子',
    darkPieces: '暗子',
    selectedPosition: '选中位置',
    selectedPiece: '选中棋子',
    clickToPlace: '点击位置放置',
    piece: '棋子',
    currentSide: '当前先手',
    redToMove: '红方先走',
    blackToMove: '黑方先走',
    imageRecognition: '图片识别',
    clickOrDragImage: '点击上传或拖拽图片到此处',
    supportedFormats: '支持 JPG、PNG 等图片格式',
    startRecognition: '开始识别',
    applyResults: '应用结果',
    recognitionResults: '识别结果',
    imageRecognitionStatus: {
      loadingModel: '加载模型中...',
      modelLoadedSuccessfully: '模型加载成功',
      modelLoadingFailed: '模型加载失败: {error}',
      loadingImage: '加载图片中...',
      preprocessingImage: '预处理图片中...',
      runningModelInference: '运行模型推理中...',
      postProcessingResults: '后处理结果中...',
      recognitionCompleted: '识别完成！',
      processingFailed: '处理失败: {error}',
      unknownError: '未知错误',
    },
    showBoundingBoxes: '显示边界框',
    validationStatus: {
      normal: '正常',
      error: '错误: 暗子数量不匹配',
      noRedKing: '错误: 红方无帅',
      noBlackKing: '错误: 黑方无将',
      kingOutOfPalace: '错误: 将帅不在九宫内',
      kingFacing: '错误: 将帅对脸',
      inCheck: '错误: 先走方已将军',
      tooManyPieces: '错误: 某种棋子数量过多',
      tooManyTotalPieces: '错误: 总棋子数超过16',
      darkPieceInvalidPosition: '错误: 暗子位置不合法',
      duplicatePosition: '错误: 棋子位置重复',
    },
    cancel: '取消',
    applyChanges: '应用更改',
    clear: '清除',
    pieces: {
      red_chariot: '红车',
      red_horse: '红马',
      red_elephant: '红象',
      red_advisor: '红士',
      red_king: '红帅',
      red_cannon: '红炮',
      red_pawn: '红兵',
      black_chariot: '黑车',
      black_horse: '黑马',
      black_elephant: '黑象',
      black_advisor: '黑士',
      black_king: '黑将',
      black_cannon: '黑炮',
      black_pawn: '黑卒',
      unknown: '暗子',
      red_unknown: '红暗子',
      black_unknown: '黑暗子',
    },
  },

  // FEN输入对话框
  fenInput: {
    title: '输入FEN字符串',
    placeholder: '请输入FEN字符串...',
    confirm: '确认',
    cancel: '取消',
  },

  // 棋谱JSON对话框
  notationTextDialog: {
    title: '查看 / 输入棋谱（JSON）',
    placeholder:
      '此处会显示当前对局的JSON棋谱。你可以复制分享；或将收到的JSON棋谱粘贴到此处，点击“应用”载入棋谱。',
    copy: '复制JSON',
    apply: '应用',
  },

  // 翻子提示对话框
  flipPrompt: {
    title: '翻子提示',
    message: '请选择要翻开的棋子',
    confirm: '确认',
    cancel: '取消',
  },

  // 关于对话框
  about: {
    title: '关于JieqiBox',
    version: '版本',
    description:
      '一个现代化的揭棋分析和对弈桌面应用程序，基于 Tauri 和 Vue 3 构建。',
    author: '作者',
    license: '许可证',
    github: 'GitHub',
    downloadLatest: '下载最新版本',
    viewLicense: '查看许可证详情',
  },

  // 分析侧边栏
  analysis: {
    title: '引擎分析',
    startAnalysis: '开始分析',
    stopAnalysis: '停止分析',
    engineNotLoaded: '引擎未加载',
    loadEngine: '加载引擎',
    loadEngineSaf: '加载引擎（SAF）',
    analysisResults: '分析结果',
    bestMove: '最佳着法',
    score: '评分',
    depth: '层数',
    nodes: '节点数',
    time: '时间',
    pv: '主要变例',
    engineLoaded: '引擎已加载',
    playBestMove: '走最佳着',
    undoMove: '悔棋',
    redAiOn: '红方电脑(开)',
    redAiOff: '红方电脑(关)',
    blackAiOn: '黑方电脑(开)',
    blackAiOff: '黑方电脑(关)',
    freeFlipMode: '自由翻子模式',
    darkPiecePool: '(吃)暗子池',
    captureHistory: '吃子记录',
    myCaptured: '我方吃子',
    opponentCaptured: '对方吃子',
    noCaptured: '暂无',
    engineAnalysis: '引擎分析',
    notation: '棋谱',
    moveComments: '棋步注释',
    noComment: '无注释',
    enterComment: '输入注释...',
    saveComment: '保存',
    cancelComment: '取消',
    opening: '开局',
    adjustment: '调整',
    engineLog: '引擎日志',
    uciTerminal: 'UCI终端',
    about: '关于',
    undockPanel: '取消停靠面板',
    dockPanel: '停靠面板',
    restorePanels: '恢复面板布局',
    flipBoard: '翻转棋盘',
    flipBoardBack: '恢复方向',
    ponderMode: '后台思考',
    selectEngine: '选择引擎',
    manageEngines: '管理',
    unloadEngine: '卸载引擎',
    noEngineLoaded: '当前没有加载引擎。',
    // 比赛模式相关
    enterMatchMode: '比赛模式',
    exitMatchMode: '退出比赛模式',
    // 人机对战模式相关
    enterHumanVsAiMode: '人机对战',
    exitHumanVsAiMode: '退出人机对战',
    startMatch: '开始比赛',
    stopMatch: '停止比赛',
    jaiSettings: '比赛选项',
    matchInfo: '比赛信息',
    matchStatus: '状态',
    gameProgress: '进度',
    engineInfo: '引擎',
    lastResult: '结果',
    matchWld: '胜负和',
    eloRating: 'Elo评级',
    eloCalculator: 'Elo计算器',
    matchEngines: '引擎',
    running: '运行中',
    stopped: '已停止',
    noMatchEngine: '未加载比赛引擎',
    noAnalysis: '无分析数据',
    // 运气指数相关
    luckIndex: '运气指数',
    luckIndexBasedOnFlipSequence: '基于翻子顺序估计',
    blackFavor: '黑方好',
    redFavor: '红方好',
    currentValue: '当前值',
    // 导航按钮
    goToFirst: '回到第一步',
    goToPrevious: '上一步',
    goToNext: '下一步',
    goToLast: '到最后一步',
    play: '播放',
    pause: '暂停',
    annotateMove: '标注走法',
    // 走法标注
    brilliant: '妙手',
    good: '好棋',
    interesting: '有趣',
    dubious: '可疑',
    mistake: '失误',
    blunder: '败着',
    clear: '清除',
  },

  // 引擎管理器
  engineManager: {
    title: '引擎管理器',
    addEngine: '添加引擎',
    addEngineAndroid: '添加引擎 (SAF)',
    editEngine: '编辑引擎',
    engineName: '引擎名称',
    enginePath: '引擎路径',
    arguments: '命令行参数',
    actions: '操作',
    confirmDeleteTitle: '确认删除',
    confirmDeleteMessage: '您确定要删除引擎“{name}”吗？此操作无法撤销。',
    promptEngineName: '请输入引擎的唯一名称:',
    promptEngineArgs: '请输入引擎的命令行参数（可选，未知则留空）：',
    promptHasNnue: '此引擎是否使用NNUE文件？(y/n):',
    promptNnueFile: '请选择引擎的NNUE文件：',
    nameExists: '该名称已存在，请使用唯一的名称。',
    engineAddedSuccess: '引擎 {name} 添加成功!',
  },

  // 引擎管理器中的已保存 UCI 选项编辑器
  uciEditor: {
    title: '已保存的UCI选项',
    noSaved:
      '当前引擎尚无已保存的选项。可在下方添加项目，以在加载引擎前预配置。',
    addOption: '添加选项',
    optionName: '选项名',
    optionValue: '选项值',
    type: '类型',
    typeString: '字符串',
    typeNumber: '数字',
    typeSwitch: '开关',
    typeCombo: '下拉选择',
    typeButton: '按钮',
    willExecute: '加载时执行',
    noExecute: '不执行',
  },

  // JAI 选项对话框
  jaiOptions: {
    title: 'JAI比赛选项',
    loadingText: '正在加载引擎选项...',
    noEngineLoaded: '当前未加载任何比赛引擎。',
    pleaseLoadEngineFirst: '请先加载比赛引擎以配置其选项。',
    loadEngine: '加载引擎',
    noOptionsAvailable: '该引擎无可用JAI选项。',
    refreshOptions: '刷新选项',
    range: '范围',
    execute: '执行',
    resetToDefaults: '重置为默认值',
    clearSettings: '清除设置',
    confirmClearSettings:
      '您确定要清除当前引擎的所有JAI选项配置吗？此操作无法撤销。',
    settingsCleared: 'JAI选项配置已清除',
    // JAI 选项描述
    optionDescriptions: {
      Engine1Path: '第一个兼容 UCI 的揭棋引擎可执行文件的完整路径。',
      Engine1Options:
        'Engine 1 的 UCI "setoption" 命令字符串。每个选项必须使用 "name <选项名> value <值>" 格式；多个选项用空格分隔。该解析器可正确处理包含空格的选项名和值。示例："name Threads value 4 name Hash value 256"',
      Engine2Path: '第二个兼容 UCI 的揭棋引擎可执行文件的完整路径。',
      Engine2Options:
        'Engine 2 的 UCI "setoption" 命令字符串。格式与 "Engine1Options" 相同。',
      TotalRounds:
        '要进行的成对对局数。由于每轮交换先后手，总局数为 "TotalRounds * 2"。',
      Concurrency: '并行运行的对局数量。',
      BookFile:
        '开局库文件路径。文件应每行包含一个 FEN 局面。每轮开始时，将从该文件随机选择一个 FEN，用于该轮的两盘对局。若路径为空、无效，或文件不含 FEN，则使用默认起始局面。',
      MainTimeMs: '每位棋手的基础思考时间，单位毫秒。',
      IncTimeMs: '每步走子后增加到棋钟的增益时间，单位毫秒。',
      TimeoutBufferMs:
        '用于进程与通信开销的宽限时间（毫秒）。仅当棋钟低于 "-(TimeoutBufferMs)" 时才判定超时。',
      Logging:
        '若启用（"true"），比赛引擎将为每个引擎进程创建详细日志文件，记录所有 UCI 通信。',
      SaveNotation: '是否保存每盘对局的棋谱文件的开关。',
      SaveNotationDir: '开启保存后，用于存放棋谱文件的目录路径。',
      TimeControl: '每个引擎的时间控制设置。',
      AdjudicationRule: '裁决和棋或决定性局面的规则。',
    },
  },

  // JAI 消息
  jai: {
    engineReady: '比赛引擎已就绪',
    matchStarted: '比赛已开始',
    matchStopped: '比赛已停止',
    gameProgress: '第 {current} 局，共 {total} 局',
    matchResult: '比赛结果: {result}',
  },

  // Elo 计算器
  eloCalculator: {
    title: 'Elo 计算器',
    inputSection: '比赛结果',
    wins: '胜',
    losses: '负',
    draws: '和',
    totalGames: '总局数',
    resultsFormat: '结果格式',
    formatWDL: 'WDL（胜/和/负）',
    formatPTNML: 'PTNML（成对局）',
    ptnml: {
      ll: 'LL',
      lddl: 'LD+DL',
      center: 'LW+DD+WL',
      dwwd: 'DW+WD',
      ww: 'WW',
    },
    resultsSection: 'Elo表现',
    performance: 'Elo差值（含95%误差）',
    confidenceInterval: '95%置信区间',
    scoreRate: '得分率',
    los: 'LOS 优势概率',
    drawRatio: '和棋率',
    standardError: '标准误差',
    noResults: '输入比赛结果以查看计算结果。',
    basicRequiresWDL: '基础模式需要 WDL 输入。请切换为 WDL。',
    close: '关闭',
    basicMode: '基础',
  },

  // 错误消息
  errors: {
    saveNotationFailed: '保存棋谱失败',
    openNotationFailed: '打开棋谱失败',
    engineNotLoaded: '引擎未加载，无法发送命令',
    engineSendUnavailable: '引擎send方法不可用',
    redDarkPiecesMismatch: '错误: 红方{darkCount}暗子 > {poolCount}池',
    blackDarkPiecesMismatch: '错误: 黑方{darkCount}暗子 > {poolCount}池',
    pieceCountExceeded: '错误: {pieceName} 总数超限!',
    engineLoadFailed: '加载引擎 {name} 失败: {error}',
    jaiEngineLoadFailed: '加载JAI比赛引擎 {name} 失败: {error}',
    engineUnloadFailed: '卸载引擎失败',
    failedToOpenFileSelector: '打开文件选择器失败',
    failedToProcessEngine: '处理引擎文件失败',
    invalidFenFormat: '无效的FEN格式',
  },

  // 棋盘底部
  chessboard: {
    copyFen: '复制FEN',
    pasteFen: '粘贴FEN',
    inputFen: '输入FEN',
    inputCopyFen: '输入/复制FEN',
    newGame: '新对局',
    copied: '✓ 已复制',
    clearDrawings: '清除绘制',
  },

  // 局势图
  evaluationChart: {
    title: '局势图',
    rightClickHint: '右键点击查看选项',
    longPressHint: '长按查看选项',
    showMoveLabels: '显示着法标签',
    linearYAxis: '线性Y轴',
    showOnlyLines: '仅显示线条',
    blackPerspective: '黑方视角',
    clampYAxis: '限制Y轴范围',
    clampValue: '限制值',
    colorScheme: '配色方案',
    redGreen: '红绿配色',
    blueOrange: '蓝橙配色',
    showSeparateLines: '分别显示红黑双方评估线',
    opening: '开局',
    noData: '暂无分析数据',
    newGame: '新对局',
    copied: '✓ 已复制',
    saveChartImage: '保存图片',
    chartImageSaved: '图片已保存到 {path}',
    saveChartImageFailed: '保存图片失败',
  },

  // 语言选择
  languages: {
    current: '当前语言',
    zh_cn: '简体中文',
    zh_tw: '繁體中文',
    en: 'English',
    vi: 'Tiếng Việt',
    ja: '日本語',
  },

  // 界面设置
  interfaceSettings: {
    title: '界面设置',
    showCoordinates: '显示行列坐标',
    parseUciInfo: '解析UCI信息',
    showAnimations: '开启走子动画',
    showPositionChart: '显示局势图',
    showEvaluationBar: '显示局势评估条',
    darkMode: '暗黑模式',
    autosave: '自动保存棋谱到Autosave.json',
    useNewFenFormat: '使用新FEN格式',
    engineLogLineLimit: '引擎日志行数限制',
    showChineseNotation: '显示中文记谱法',
    showLuckIndex: '显示运气指数',
    showArrows: '显示箭头',
  },

  // UCI消息
  uci: {
    depth: '深度',
    seldepth: '选择深度',
    multipv: '多主变',
    score: '分数',
    mate: '绝杀',
    wdl: '胜/和/负',
    nodes: '节点数',
    nps: 'NPS',
    hashfull: 'Hash占用',
    tbhits: '库命中',
    time: '用时',
    pv: '主变',
    checkmate: '绝杀！无着可走',
    bestMove: '最佳着法: {move}',
    noMoves: '无着可走',
    engineReady: '引擎已就绪',
  },

  // 游戏操作确认
  gameConfirm: {
    clearHistoryTitle: '清空后续棋谱',
    clearHistoryMessage:
      '您正在历史局面中走子，这将清空后续的所有棋谱记录。确定要继续吗？',
    confirm: '确定',
    cancel: '取消',
  },

  // 游戏结束通知
  gameEnd: {
    humanWins: '恭喜！您获胜了！',
    aiWins: '游戏结束 - AI获胜',
    humanWinsMessage: '您击败了AI！AI已无合法走法。',
    aiWinsMessage: 'AI获得了这局胜利。您已无合法走法。',
    ok: '确定',
  },

  // 人机对战模式
  humanVsAi: {
    title: '人机对战模式',
    selectAiSide: '选择AI方',
    redAiBlackHuman: '红方AI，黑方人类',
    blackAiRedHuman: '黑方AI，红方人类',
    options: '选项',
    showEngineAnalysis: '显示引擎分析',
    engineAnalysisHint: '开启后，可以查看引擎的分析结果，但不影响游戏规则',
    ponderNote: '关于后台思考：',
    ponderUnifiedHint:
      '后台思考功能使用全局设置，可在正常模式的侧边栏中开启或关闭',
    rulesTitle: '游戏规则',
    rule1: '自动强制开启随机翻子模式',
    rule2: '您只能看到自己吃掉AI的暗子',
    rule3: 'AI只能看到自己吃掉您的暗子',
    rule4: '符合标准揭棋规则的有限信息对战',
    startGame: '开始游戏',
  },
}
