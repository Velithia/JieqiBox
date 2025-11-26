export default {
  // 共通
  common: {
    confirm: '確認',
    cancel: 'キャンセル',
    close: '閉じる',
    save: '保存',
    open: '開く',
    refresh: '更新',
    reset: 'リセット',
    clear: 'クリア',
    apply: '適用',
    execute: '実行',
    loading: '読み込み中...',
    error: 'エラー',
    success: '成功',
    warning: '警告',
    info: '情報',
    delete: '削除',
    add: '追加',
    actions: '操作',
    required: 'この項目は必須です',
  },

  // 上部ツールバー
  toolbar: {
    newGame: '新しいゲーム',
    copyFen: 'FENをコピー',
    inputFen: 'FENを入力',
    editPosition: '局面を編集',
    uciSettings: 'UCI設定',
    analysisParams: '解析パラメータ',
    saveNotation: '棋譜を保存',
    openNotation: '棋譜を開く',
    interfaceSettings: 'インターフェース設定',
    gameTitle: '揭棋ゲーム',
    variation: '現在の手を禁止',
    analyzeDrawings: '描画解析',
    noDrawingMoves: '有効な描画がありません',
    noMoreVariations: 'これ以上の変化はありません',
    darkMode: 'ダークモード',
    lightMode: 'ライトモード',
    viewPasteNotation: '棋譜の表示/貼り付け',
    reviewAnalysis: '検討分析',
    openingBook: 'オープニングブック',
  },

  // UCIオプションダイアログ
  uciOptions: {
    title: 'UCIエンジンオプション',
    loadingText: 'エンジンオプションを読み込み中...',
    noEngineLoaded: 'エンジンがロードされていません。',
    pleaseLoadEngineFirst:
      'エンジンのオプションを設定するには、まずエンジンを読み込んでください。',
    loadEngine: 'エンジンを読み込む',
    noOptionsAvailable: 'このエンジンには利用可能なUCIオプションがありません。',
    refreshOptions: 'オプションを更新',
    range: '範囲',
    execute: '実行',
    resetToDefaults: 'デフォルトに戻す',
    clearSettings: '設定をクリア',
    confirmClearSettings:
      '現在のエンジンのすべてのUCIオプション設定をクリアしますか？この操作は元に戻せません。',
    settingsCleared: 'UCIオプション設定をクリアしました',
    // UCIオプション説明
    optionDescriptions: {
      'Debug Log File': 'エンジンとGUIの通信内容を出力するデバッグファイル。',
      Threads:
        'エンジンが探索に使用するスレッド数。システムで利用可能な最大スレッド数から1または2を引いた値に設定することを推奨します。',
      Hash: 'エンジンのハッシュテーブルサイズ（単位：MB）。利用可能な最大メモリから1～2 GiBを差し引いた容量に設定することを推奨します。',
      'Clear Hash': 'ハッシュテーブルをクリアします。',
      MultiPV:
        '複数の推奨手を表示できる「マルチPV」。1に設定することを推奨します。1より大きい値に設定すると、他の候補手の計算にリソースが割かれるため、最善手の質が低下します。',
      NumaPolicy:
        'スレッドを特定のNUMAノードにバインドして実行を確実にします。複数のCPUや、複数のNUMAドメインを持つCPUを搭載したシステムでパフォーマンスを向上させます。',
      Ponder: '対局相手の思考中に、エンジンにバックグラウンドで思考させます。',
      'Move Overhead':
        'ネットワークやGUIのオーバーヘッドによって生じる遅延時間をxミリ秒と想定します。時間切れによる負けを防ぐのに役立ちます。',
      nodestime:
        '経過時間の計算に、実時間ではなく探索ノード数を使用するようエンジンに指示します。エンジンテストに役立ちます。',
      UCI_ShowWDL:
        '有効にすると、エンジンの出力にWDL（勝ち-引き分け-負け）の概算統計情報を表示します。これらのWDL値は、与えられた評価値と探索深度における、エンジンの自己対局での期待されるゲーム結果をシミュレートしたものです。',
      EvalFile:
        'NNUE評価パラメータファイルの名前。GUIによっては、ファイル名にそのファイルを含むフォルダやディレクトリへのフルパスを含める必要がある場合があります。',
    },
  },

  // 検討分析ダイアログ
  reviewDialog: {
    title: '検討分析',
    movetime: '1手あたりの時間 (ms)',
    progress: '進捗: {current}/{total}',
  },

  // UCIターミナルダイアログ
  uciTerminal: {
    title: 'UCIターミナル',
    enterCommand: 'UCIコマンドを入力...',
    sendCommand: 'コマンドを送信',
    noEngineLoaded: 'エンジンがロードされていません。',
    pleaseLoadEngineFirst:
      'ターミナルを使用するには、まずエンジンを読み込んでください。',
    quickCommands: 'クイックコマンド',
    clear: 'ターミナルをクリア',
    commandHistory: 'コマンド履歴',
    terminalOutput: 'ターミナル出力',
  },

  // 時間ダイアログ
  timeDialog: {
    title: 'エンジン解析パラメータ設定',
    movetime: '手の時間 (ミリ秒)',
    maxThinkTime: '最大思考時間 (ミリ秒)',
    maxDepth: '最大深さ',
    maxNodes: '最大ノード数',
    analysisMode: '解析モード',
    advanced: '高度なスクリプト',
    resetToDefaults: 'デフォルトに戻す',
    clearSettings: '設定をクリア',
    confirmClearSettings:
      'すべての解析パラメータ設定をクリアしますか？この操作は元に戻せません。',
    settingsCleared: '解析パラメータ設定をクリアしました',
    analysisModes: {
      movetime: '手の時間による解析',
      maxThinkTime: '最大思考時間による解析',
      depth: '深さによる解析',
      nodes: 'ノード数による解析',
      advanced: '高度なプログラミングモード',
    },
    advancedHint1:
      '簡単なプログラミングをサポート：代入、算術、ビット演算、if条件',
    advancedHint2: '利用可能な変数：movetime, depth, nodes, maxThinkTime, prev',
    advancedPlaceholder: 'ここにスクリプトを記述してください...',
    advancedExamples: {
      title: 'サンプルコード',
      basic: '基本設定',
      basicCode: `depth=20
movetime=1000
nodes=2000000`,
      conditional: '条件制御',
      conditionalCode: `if (!prev.prev.exists()){
  movetime=1000
} else {
  movetime=prev.prev.movetime / 1.05
}`,
      scoreBased: 'スコアベース調整',
      scoreBasedCode: `if (-prev.score < -300){
  movetime = 4000
} else if (-prev.score < -200) {
  movetime = 3000
} else {
  movetime = 2000
}`,
      variables: '利用可能な変数',
      variablesDesc: `prev.exists() - 前の手が存在するかチェック
prev.movetime - 前の手の要求時間
prev.depth - 前の手の探索深さ
prev.nodes - 前の手の探索ノード数
prev.score - 前の手のスコア
prev.timeUsed - 前の手の実際の使用時間
prev.prev - 前々の手（無限ネスト対応）`,
    },
  },

  // 局面編集ダイアログ
  positionEditor: {
    title: '局面編集',
    flipBoard: '🔄 盤を反転',
    mirrorLeftRight: '↔️ 左右対称',
    switchSide: '⚡ 手番を切り替え',
    resetPosition: '🔄 局面をリセット',
    clearPosition: '🔄 局面をクリア',
    recognizeImage: '🖼️ 画像認識',
    addPieces: '駒を追加',
    revealedPieces: '明子',
    darkPieces: '暗子',
    darkPiece: '暗',
    selectedPosition: '選択された位置',
    selectedPiece: '選択された駒',
    clickToPlace: '位置をクリックして配置',
    piece: '駒',
    currentSide: '現在の手番',
    redToMove: '赤の手番',
    blackToMove: '黒の手番',
    imageRecognition: '画像認識',
    clickOrDragImage: 'クリックしてアップロードまたは画像をドラッグ',
    supportedFormats: 'JPG、PNGなどの画像形式に対応',
    startRecognition: '認識を開始',
    applyResults: '結果を適用',
    recognitionResults: '認識結果',
    imageRecognitionStatus: {
      loadingModel: 'モデルを読み込み中...',
      modelLoadedSuccessfully: 'モデルの読み込みが成功しました',
      modelLoadingFailed: 'モデルの読み込みに失敗しました: {error}',
      loadingImage: '画像を読み込み中...',
      preprocessingImage: '画像を前処理中...',
      runningModelInference: 'モデル推論を実行中...',
      postProcessingResults: '結果を後処理中...',
      recognitionCompleted: '認識完了！',
      processingFailed: '処理に失敗しました: {error}',
      unknownError: '不明なエラー',
    },
    showBoundingBoxes: 'バウンディングボックスを表示',
    preserveDarkPools: '暗子プールと取得暗子プールを保持',
    validationStatus: {
      normal: '正常',
      error: 'エラー: 暗子の数が一致しません',
      noRedKing: 'エラー: 赤帥がありません',
      noBlackKing: 'エラー: 黒将がありません',
      kingOutOfPalace: 'エラー: 帥将が九宮外にあります',
      kingFacing: 'エラー: 帥将が向かい合っています',
      inCheck: 'エラー: 手番側が将軍されています',
      tooManyPieces: 'エラー: 駒の数が多すぎます',
      tooManyTotalPieces: 'エラー: 総駒数が16を超えています',
      darkPieceInvalidPosition: 'エラー: 暗子の位置が不正です',
      duplicatePosition: 'エラー: 駒の位置が重複しています',
    },
    cancel: 'キャンセル',
    applyChanges: '変更を適用',
    clear: 'クリア',
    pieces: {
      red_chariot: '赤車',
      red_horse: '赤馬',
      red_elephant: '赤象',
      red_advisor: '赤士',
      red_king: '赤帥',
      red_cannon: '赤砲',
      red_pawn: '赤兵',
      black_chariot: '黒車',
      black_horse: '黒馬',
      black_elephant: '黒象',
      black_advisor: '黒士',
      black_king: '黒将',
      black_cannon: '黒砲',
      black_pawn: '黒卒',
      unknown: '暗子',
      red_unknown: '赤暗子',
      black_unknown: '黒暗子',
    },
  },

  // FEN入力ダイアログ
  fenInput: {
    title: 'FEN文字列を入力',
    placeholder: 'FEN文字列を入力してください...',
    confirm: '確認',
    cancel: 'キャンセル',
  },

  // 棋譜JSONダイアログ
  notationTextDialog: {
    title: '棋譜（JSON）の表示 / 貼り付け',
    placeholder:
      '現在の対局のJSON棋譜がここに表示されます。コピーして共有できます。受け取ったJSON棋譜をここに貼り付け、「適用」を押すと読み込みます。',
    copy: 'JSONをコピー',
    apply: '適用',
  },

  // 駒をめくるプロンプトダイアログ
  flipPrompt: {
    title: '駒をめくるプロンプト',
    message: 'めくる駒を選択してください',
    confirm: '確認',
    cancel: 'キャンセル',
  },

  // についてダイアログ
  about: {
    title: 'JieqiBoxについて',
    version: 'バージョン',
    description:
      'TauriとVue 3で構築された現代的な揭棋解析とゲームデスクトップアプリケーション。',
    author: '作者',
    license: 'ライセンス',
    github: 'GitHub',
    downloadLatest: '最新バージョンをダウンロード',
    viewLicense: 'ライセンス詳細を表示',
  },

  // 解析サイドバー
  analysis: {
    title: 'エンジン解析',
    startAnalysis: '解析開始',
    stopAnalysis: '解析停止',
    engineNotLoaded: 'エンジンが読み込まれていません',
    loadEngine: 'エンジンを読み込み',
    loadEngineSaf: 'エンジン読み込み（SAF）',
    analysisResults: '解析結果',
    bestMove: '最善手',
    score: '評価値',
    depth: '深さ',
    nodes: 'ノード数',
    time: '時間',
    pv: '主な変化',
    engineLoaded: 'エンジン読み込み済み',
    playBestMove: '最善手を指す',
    undoMove: '一手戻す',
    redAiOn: '赤AI(オン)',
    redAiOff: '赤AI(オフ)',
    blackAiOn: '黒AI(オン)',
    blackAiOff: '黒AI(オフ)',
    freeFlipMode: '自由めくりモード',
    darkPiecePool: '(取)暗子プール',
    captureHistory: '駒取り履歴',
    myCaptured: '私が取った駒',
    opponentCaptured: '相手が取った駒',
    noCaptured: 'なし',
    engineAnalysis: 'エンジン解析',
    notation: '棋譜',
    moveComments: '手のコメント',
    noComment: 'コメントなし',
    enterComment: 'コメントを入力...',
    saveComment: '保存',
    cancelComment: 'キャンセル',
    opening: '開局',
    adjustment: '調整',
    engineLog: 'エンジンログ',
    uciTerminal: 'UCIターミナル',
    about: 'について',
    undockPanel: 'パネルを切り離し',
    dockPanel: 'パネルをドック',
    restorePanels: 'パネルレイアウトを復元',
    flipBoard: '盤を反転',
    flipBoardBack: '向きを復元',
    ponderMode: 'ポンダーモード',
    selectEngine: 'エンジンを選択',
    manageEngines: '管理',
    unloadEngine: 'エンジンをアンロード',
    noEngineLoaded: '現在、エンジンは読み込まれていません。',
    // マッチモード関連
    enterMatchMode: 'マッチモード',
    exitMatchMode: 'マッチモードを終了',
    // 人対AIモード関連
    enterHumanVsAiMode: '人対AI',
    exitHumanVsAiMode: '人対AIモードを終了',
    startMatch: 'マッチ開始',
    stopMatch: 'マッチ停止',
    jaiSettings: 'マッチオプション',
    matchInfo: 'マッチ情報',
    matchStatus: '状態',
    gameProgress: '進捗',
    engineInfo: 'エンジン',
    lastResult: '結果',
    matchWld: '勝敗分',
    eloRating: 'Eloレーティング',
    eloCalculator: 'Elo計算機',
    matchEngines: 'エンジン',
    running: '実行中',
    stopped: '停止',
    noMatchEngine: 'マッチエンジンが読み込まれていません',
    noAnalysis: '解析データがありません',
    // 運び指数関連
    luckIndex: '運び指数',
    luckIndexBasedOnFlipSequence: '駒をめくる順序に基づく推定',
    blackFavor: '黒優勢',
    redFavor: '赤優勢',
    currentValue: '現在値',
    // ナビゲーションボタン
    goToFirst: '最初の手に移動',
    goToPrevious: '前の手に移動',
    goToNext: '次の手に移動',
    goToLast: '最後の手に移動',
    play: '再生',
    pause: '一時停止',
    annotateMove: '手の評価',
    // 手の評価
    brilliant: '絶妙',
    good: '好手',
    interesting: '興味深い',
    dubious: '疑問',
    mistake: 'ミス',
    blunder: '大悪手',
    clear: 'クリア',
  },

  // エンジンマネージャー
  engineManager: {
    title: 'エンジンマネージャー',
    addEngine: 'エンジンを追加',
    addEngineAndroid: 'エンジンを追加 (SAF)',
    editEngine: 'エンジンを編集',
    engineName: 'エンジン名',
    enginePath: 'エンジンパス',
    arguments: 'コマンドライン引数',
    actions: '操作',
    confirmDeleteTitle: '削除の確認',
    confirmDeleteMessage:
      'エンジン「{name}」を本当に削除しますか？この操作は元に戻せません。',
    promptEngineName: 'エンジンの一意な名前を入力してください：',
    promptEngineArgs:
      'エンジンのコマンドライン引数を入力してください（任意、不明な場合は空欄）：',
    promptHasNnue: 'このエンジンはNNUEファイルを使用しますか？(y/n):',
    promptNnueFile: 'エンジンのNNUEファイルを選択してください：',
    nameExists:
      'この名前は既に使用されています。別の一意な名前を使用してください。',
    engineAddedSuccess: 'エンジン{name}が正常に追加されました！',
  },

  // エンジンマネージャー内の保存済み UCI オプション編集
  uciEditor: {
    title: '保存済みUCIオプション',
    noSaved:
      'このエンジンにはまだ保存済みのオプションがありません。下で項目を追加して、エンジン読み込み前に事前設定できます。',
    addOption: 'オプションを追加',
    optionName: 'オプション名',
    optionValue: '値',
    type: '種類',
    typeString: '文字列',
    typeNumber: '数値',
    typeSwitch: 'スイッチ',
    typeCombo: 'コンボ（選択）',
    typeButton: 'ボタン',
    willExecute: '読み込み時に実行',
    noExecute: '実行しない',
  },

  // エラーメッセージ
  errors: {
    saveNotationFailed: '棋譜の保存に失敗しました',
    openNotationFailed: '棋譜の読み込みに失敗しました',
    engineNotLoaded:
      'エンジンが読み込まれていないため、コマンドを送信できません',
    engineSendUnavailable: 'エンジンのsendメソッドが利用できません',
    redDarkPiecesMismatch: 'エラー: 赤方{darkCount}暗子 > {poolCount}池',
    blackDarkPiecesMismatch: 'エラー: 黒方{darkCount}暗子 > {poolCount}池',
    pieceCountExceeded: 'エラー: {pieceName} 総数超過!',
    jaiEngineLoadFailed:
      'JAIマッチエンジン {name} の読み込みに失敗しました: {error}',
    engineUnloadFailed: 'エンジンのアンロードに失敗しました',
    failedToOpenFileSelector:
      'ファイル選択ダイアログを開くことができませんでした',
    failedToProcessEngine: 'エンジンファイルの処理に失敗しました',
    invalidFenFormat: '無効なFEN形式',
  },

  // 盤下部
  chessboard: {
    copyFen: 'FENをコピー',
    pasteFen: 'FENを貼り付け',
    inputFen: 'FENを入力',
    inputCopyFen: 'FENを入力/コピー',
    newGame: '新しいゲーム',
    copied: '✓ コピーしました',
    clearDrawings: '描画をクリア',
  },

  // 評価チャート
  evaluationChart: {
    title: '評価チャート',
    rightClickHint: '右クリックでオプション',
    longPressHint: '長押しでオプション',
    showMoveLabels: '手のラベルを表示',
    linearYAxis: '線形Y軸',
    showOnlyLines: '線のみ表示',
    blackPerspective: '黒側視点',
    clampYAxis: 'Y軸範囲を制限',
    clampValue: '制限値',
    colorScheme: 'カラースキーム',
    redGreen: '赤緑配色',
    blueOrange: '青橙配色',
    showSeparateLines: '赤黒の評価線を別々に表示',
    opening: '序盤',
    noData: '分析データがありません',
    newGame: '新しいゲーム',
    copied: '✓ コピーしました',
    saveChartImage: '画像を保存',
    chartImageSaved: '画像が {path} に保存されました',
    saveChartImageFailed: '画像の保存に失敗しました',
    viewMode: 'ビューモード',
    evaluation: '評価',
    time: '時間',
    depth: '深度',
  },

  // 言語選択
  languages: {
    current: '現在の言語',
    zh_cn: '简体中文',
    zh_tw: '繁體中文',
    en: 'English',
    vi: 'Tiếng Việt',
    ja: '日本語',
  },

  // インターフェース設定
  interfaceSettings: {
    title: 'インターフェース設定',
    showCoordinates: '行と列の番号を表示',
    parseUciInfo: 'UCI情報を解析',
    showAnimations: '駒の動きのアニメーションを有効にする',
    showPositionChart: '形勢グラフを表示',
    showEvaluationBar: '評価バーを表示',
    darkMode: 'ダークモード',
    autosave: 'ゲームをAutosave.jsonに自動保存',
    useNewFenFormat: '新しいFEN形式を使用',
    engineLogLineLimit: 'エンジンログ行数制限',
    validationTimeout: 'エンジン検証タイムアウト (ミリ秒)',
    showChineseNotation: '中国式記譜法を表示',
    showLuckIndex: '運び指数を表示',
    showArrows: '矢印を表示',
    enableSoundEffects: '効果音を有効にする',
    soundVolume: '効果音の音量',
  },

  // UCIメッセージ
  uci: {
    depth: '深さ',
    seldepth: '選択深さ',
    multipv: 'マルチPV',
    score: 'スコア',
    mate: '詰み',
    wdl: '勝/和/負',
    nodes: 'ノード',
    nps: 'NPS',
    hashfull: 'ハッシュ使用率',
    tbhits: 'テーブルベースヒット',
    time: '時間',
    pv: '主変化',
    checkmate: 'チェックメイト！利用可能な動きがありません。',
    bestMove: '最善手: {move}',
    noMoves: '利用可能な動きがありません',
    engineReady: 'エンジンは準備ができました',
  },

  // JAIオプションダイアログ
  jaiOptions: {
    title: 'JAIマッチオプション',
    loadingText: 'エンジンオプションを読み込み中...',
    noEngineLoaded: '現在、マッチエンジンが読み込まれていません。',
    pleaseLoadEngineFirst:
      'マッチエンジンのオプションを設定するには、まずエンジンを読み込んでください。',
    loadEngine: 'エンジンを読み込む',
    noOptionsAvailable: 'このエンジンには利用可能なJAIオプションがありません。',
    refreshOptions: 'オプションを更新',
    range: '範囲',
    execute: '実行',
    resetToDefaults: 'デフォルトに戻す',
    clearSettings: '設定をクリア',
    confirmClearSettings:
      '現在のエンジンのすべてのJAIオプション設定をクリアしますか？この操作は元に戻せません。',
    settingsCleared: 'JAIオプション設定をクリアしました',
    // JAIオプション説明
    optionDescriptions: {
      Engine1Path: 'UCI 互換の揭棋エンジン実行ファイル（Engine 1）のフルパス。',
      Engine1Options:
        'Engine 1 用の UCI "setoption" コマンド文字列。各オプションは "name <オプション名> value <値>" 形式に従う必要があります。複数オプションは空白で区切ります。本パーサは空白を含むオプション名・値も正しく処理します。例: "name Threads value 4 name Hash value 256"',
      Engine2Path: 'UCI 互換の揭棋エンジン実行ファイル（Engine 2）のフルパス。',
      Engine2Options:
        'Engine 2 用の UCI "setoption" コマンド文字列。形式と例は "Engine1Options" を参照してください。',
      TotalRounds:
        'プレイするペアゲーム数。各ラウンドで先後を入れ替えるため、総対局数は "TotalRounds * 2" になります。',
      Concurrency: '並行実行する対局数。',
      BookFile:
        '序盤ブックファイルのパス。ファイルには1行につき1つの FEN を含めます。各ラウンド開始時に、このファイルからランダムに FEN を選び、そのラウンドの2局に使用します。パスが空・無効、または FEN が存在しない場合は既定の初期局面を使用します。',
      MainTimeMs: '各プレイヤーの基礎持ち時間（ミリ秒）。',
      IncTimeMs: '各手後に加算される持ち時間のインクリメント（ミリ秒）。',
      TimeoutBufferMs:
        'プロセスや通信オーバーヘッドを考慮した猶予時間（ミリ秒）。時計が "-(TimeoutBufferMs)" を下回った場合のみ時間切れと判定します。',
      Logging:
        '有効（"true"）の場合、各エンジンプロセスの詳細なログ（すべての UCI 通信）を作成します。',
      SaveNotation: '各対局の棋譜ファイルを保存するかどうかのスイッチ。',
      SaveNotationDir:
        '保存を有効にした場合の棋譜ファイルの保存先ディレクトリ。',
      TimeControl: '各エンジンの時間制御設定。',
      AdjudicationRule: '和棋や決定的な局面の裁定ルール。',
    },
  },

  // JAIメッセージ
  jai: {
    engineReady: 'マッチエンジンが準備できました',
    matchStarted: 'マッチが開始されました',
    matchStopped: 'マッチが停止されました',
    gameProgress: '第 {current} 局、全 {total} 局',
    matchResult: 'マッチ結果: {result}',
  },

  // Elo計算機
  eloCalculator: {
    title: 'Elo 計算機',
    inputSection: '対局結果',
    wins: '勝',
    losses: '敗',
    draws: '引分',
    totalGames: '総局数',
    resultsFormat: '結果形式',
    formatWDL: 'WDL（勝/引/敗）',
    formatPTNML: 'PTNML（ペア）',
    ptnml: {
      ll: 'LL',
      lddl: 'LD+DL',
      center: 'LW+DD+WL',
      dwwd: 'DW+WD',
      ww: 'WW',
    },
    resultsSection: 'Elo パフォーマンス',
    performance: 'Elo差（95%誤差含む）',
    confidenceInterval: '95% 信頼区間',
    scoreRate: '得点率',
    los: 'LOS (優越確率)',
    drawRatio: '引分率',
    standardError: '標準誤差',
    noResults: '対局結果を入力してください。',
    basicRequiresWDL:
      '基本モードでは WDL 入力が必要です。WDL に切り替えてください。',
    close: '閉じる',
    basicMode: '基本',
  },

  // ゲーム操作確認
  gameConfirm: {
    clearHistoryTitle: '後続の棋譜をクリア',
    clearHistoryMessage:
      '履歴局面で手を指しています。これにより、後続のすべての棋譜記録がクリアされます。続行しますか？',
    confirm: '確認',
    cancel: 'キャンセル',
  },

  // ゲーム終了通知
  gameEnd: {
    humanWins: 'おめでとうございます！あなたの勝利です！',
    aiWins: 'ゲーム終了 - AIの勝利',
    humanWinsMessage: 'AIを破りました！AIに合法手がありません。',
    aiWinsMessage: 'AIがこの対局で勝利しました。あなたに合法手がありません。',
    ok: 'OK',
  },

  // 人対AIモード
  humanVsAi: {
    title: '人対AIモード',
    selectAiSide: 'AI側を選択',
    redAiBlackHuman: '赤AI、黒人間',
    blackAiRedHuman: '黒AI、赤人間',
    options: 'オプション',
    showEngineAnalysis: 'エンジン解析を表示',
    engineAnalysisHint:
      '有効にすると、エンジン解析結果を確認できますが、ゲームルールには影響しません',
    ponderNote: 'バックグラウンド思考について：',
    ponderUnifiedHint:
      'バックグラウンド思考機能はグローバル設定を使用し、通常モードのサイドバーでオン/オフできます',
    rulesTitle: 'ゲームルール',
    rule1: 'ランダムめくりモードが自動的に強制されます',
    rule2: 'あなたはAIから取った暗子のみを見ることができます',
    rule3: 'AIはあなたから取った暗子のみを見ることができます',
    rule4: '標準揭棋ルールに従った限定情報戦',
    startGame: 'ゲーム開始',
  },

  // 開局庫
  openingBook: {
    title: 'オープニングブック',
    currentMoves: '現在の局面の手',
    manage: '管理',
    settings: '設定',
    statistics: '統計',
    noMoves: '現在の局面のオープニングブックの手はありません',
    foundMoves: '{count}個の手が見つかりました',
    positions: '局面',
    move: '手',
    priority: '優先度',
    stats: '勝/分/負',
    allowed: '許可',
    comment: 'コメント',
    addPosition: '現在の局面を追加',
    editMove: '手を編集',
    addMove: '手を追加',
    moveUci: 'UCIの手',
    moveRequired: '手は必須です',
    invalidUci: '無効なUCI形式',
    invalidMoveFormat:
      '無効な手の形式です。UCI形式（例：a1a2）または中国語表記形式（例：炮二平五）を使用してください',
    invalidLegalMove: 'この手は現在の局面での合法手ではありません',
    wins: '勝ち',
    draws: '引き分け',
    losses: '負け',
    import: 'インポート',
    export: 'エクスポート',
    selectFile: 'ファイルを選択',
    format: 'フォーマット',
    dangerZone: '危険な操作',
    clearAll: 'すべてクリア',
    confirmClear: 'クリアを確認',
    clearWarning:
      'これにより、オープニングブック内のすべてのデータが削除されます。この操作は元に戻せません！',
    confirmDelete: '削除の確認',
    deleteWarning:
      'この手順を削除してもよろしいですか？この操作は元に戻せません。',
    enableInGame: 'ゲーム中にオープニングブックを有効にする',
    showMoves: 'オープニングブックの手を表示',
    show: '表示',
    preferHighPriority: '優先度の高い手を選択',
    totalPositions: '総局面数',
    totalMoves: '総手数',
    allowedMoves: '許可された手',
    disallowedMoves: '禁止された手',
    refreshStats: '統計を更新',
    refresh: '更新',
    getBookMove: 'ブックから手を指す',
    initializing: '初期化中...',
    showLess: '少なく表示',
    showMore: 'もっと見る',
    addMarkedMoves: '描画した手を追加',
    addMarkedMovesTitle: '描画した手をオープニングブックに追加',
    markedMovesCount: '{count}個の描画された合法手が見つかりました',
    noMarkedMoves: '描画された合法手は見つかりませんでした',
    batchSettings: '一括設定',
  },
}
