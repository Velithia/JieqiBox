export default {
  // Chung
  common: {
    confirm: 'Xác nhận',
    cancel: 'Hủy',
    close: 'Đóng',
    save: 'Lưu',
    open: 'Mở',
    refresh: 'Làm mới',
    reset: 'Đặt lại',
    clear: 'Xóa',
    apply: 'Áp dụng',
    execute: 'Thực hiện',
    loading: 'Đang tải...',
    error: 'Lỗi',
    success: 'Thành công',
    warning: 'Cảnh báo',
    info: 'Thông tin',
    delete: 'Xóa',
    required: 'Trường này là bắt buộc',
  },

  // Thanh công cụ trên cùng
  toolbar: {
    newGame: 'Ván mới',
    copyFen: 'Sao chép FEN',
    inputFen: 'Nhập FEN',
    editPosition: 'Chỉnh sửa vị trí',
    uciSettings: 'Cài đặt UCI',
    analysisParams: 'Tham số phân tích',
    saveNotation: 'Lưu biên bản',
    openNotation: 'Mở biên bản',
    gameTitle: 'Ván Cờ úp',
    interfaceSettings: 'Cài đặt giao diện',
    variation: 'Cấm nước đi hiện tại',
    noMoreVariations: 'Không còn biến thể nào khả dụng',
    darkMode: 'Chế độ tối',
    lightMode: 'Chế độ sáng',
    viewPasteNotation: 'Xem/Dán biên bản',
  },

  // Hộp thoại tùy chọn UCI
  uciOptions: {
    title: 'Tùy chọn engine UCI',
    loadingText: 'Đang tải tùy chọn engine...',
    noEngineLoaded: 'Chưa có engine nào được tải.',
    pleaseLoadEngineFirst:
      'Vui lòng tải engine trước để cấu hình các tùy chọn của nó.',
    loadEngine: 'Tải engine',
    noOptionsAvailable: 'Không có tùy chọn UCI nào cho engine này.',
    refreshOptions: 'Làm mới tùy chọn',
    range: 'Phạm vi',
    execute: 'Thực hiện',
    resetToDefaults: 'Đặt lại mặc định',
    clearSettings: 'Xóa cài đặt',
    confirmClearSettings:
      'Bạn có chắc chắn muốn xóa tất cả cấu hình tùy chọn UCI cho động cơ hiện tại không? Hành động này không thể hoàn tác.',
    settingsCleared: 'Đã xóa cấu hình tùy chọn UCI',
    // Mô tả tùy chọn UCI
    optionDescriptions: {
      'Debug Log File':
        'Tệp gỡ lỗi để ghi lại giao tiếp giữa engine và giao diện.',
      Threads:
        'Số luồng tìm kiếm của engine. Khuyến nghị đặt thành số luồng tối đa có sẵn của hệ thống trừ đi 1 hoặc 2 luồng.',
      Hash: 'Kích thước bảng băm của engine (đơn vị: MB). Khuyến nghị đặt giá trị này bằng tổng bộ nhớ khả dụng trừ đi 1 hoặc 2 GiB.',
      'Clear Hash': 'Xóa bảng băm.',
      MultiPV:
        'Đa biến thể chính, có thể hiển thị nhiều nước đi được đề xuất. Khuyến nghị đặt là 1. Nếu đặt lớn hơn 1, chất lượng của nước đi tốt nhất sẽ giảm, vì chương trình sẽ phân bổ một phần tài nguyên để tính toán các nước đi khả dĩ khác.',
      NumaPolicy:
        'Gán các luồng vào các nút NUMA cụ thể để đảm bảo việc thực thi. Cải thiện hiệu suất trên các hệ thống có nhiều CPU hoặc CPU có nhiều miền NUMA.',
      Ponder:
        'Cho phép engine suy nghĩ trong nền trong khi đối thủ đang suy nghĩ.',
      'Move Overhead':
        'Giả định độ trễ thời gian là x mili giây do chi phí mạng và GUI. Hữu ích trong việc tránh thua do hết giờ.',
      nodestime:
        'Yêu cầu engine sử dụng số lượng nút đã tìm kiếm thay vì thời gian thực để tính toán thời gian đã trôi qua. Hữu ích cho việc kiểm tra engine.',
      UCI_ShowWDL:
        'Nếu được bật, sẽ hiển thị thống kê WDL (Thắng-Hòa-Thua) gần đúng trong đầu ra của engine. Những con số WDL này mô phỏng kết quả ván cờ dự kiến khi engine tự đấu với chính nó ở một mức đánh giá và độ sâu nhất định.',
      EvalFile:
        'Tên của tệp tham số đánh giá NNUE. Tùy thuộc vào GUI, tên tệp có thể cần bao gồm đường dẫn đầy đủ đến thư mục chứa tệp.',
    },
  },

  // Hộp thoại phân tích xem lại
  reviewDialog: {
    title: 'Phân tích xem lại',
    movetime: 'Thời gian mỗi nước (ms)',
    progress: 'Tiến độ: {current}/{total}',
  },

  // Hộp thoại terminal UCI
  uciTerminal: {
    title: 'Terminal UCI',
    enterCommand: 'Nhập lệnh UCI...',
    sendCommand: 'Gửi lệnh',
    noEngineLoaded: 'Chưa có engine nào được tải.',
    pleaseLoadEngineFirst: 'Vui lòng tải engine trước để sử dụng terminal.',
    quickCommands: 'Lệnh nhanh',
    clear: 'Xóa terminal',
    commandHistory: 'Lịch sử lệnh',
    terminalOutput: 'Đầu ra terminal',
  },

  // Hộp thoại thời gian
  timeDialog: {
    title: 'Cài đặt tham số phân tích engine',
    movetime: 'Thời gian nước đi (ms)',
    maxThinkTime: 'Thời gian suy nghĩ tối đa (ms)',
    maxDepth: 'Độ sâu tối đa',
    maxNodes: 'Số nút tối đa',
    analysisMode: 'Chế độ phân tích',
    resetToDefaults: 'Đặt lại mặc định',
    clearSettings: 'Xóa cài đặt',
    confirmClearSettings:
      'Bạn có chắc chắn muốn xóa tất cả cấu hình tham số phân tích không? Hành động này không thể hoàn tác.',
    settingsCleared: 'Đã xóa cấu hình tham số phân tích',
    analysisModes: {
      movetime: 'Phân tích theo thời gian nước đi',
      maxThinkTime: 'Phân tích theo thời gian suy nghĩ tối đa',
      depth: 'Phân tích theo độ sâu',
      nodes: 'Phân tích theo số nút',
      advanced: 'Chế độ lập trình nâng cao',
    },
    advanced: 'Script nâng cao',
    advancedHint1:
      'Hỗ trợ lập trình đơn giản: gán, số học, bitwise, điều kiện if',
    advancedHint2: 'Biến có sẵn: movetime, depth, nodes, maxThinkTime, prev',
    advancedPlaceholder: 'Vui lòng viết script của bạn ở đây...',
    advancedExamples: {
      title: 'Mã mẫu',
      basic: 'Cài đặt cơ bản',
      basicCode: `depth=20
movetime=1000
nodes=2000000`,
      conditional: 'Điều khiển có điều kiện',
      conditionalCode: `if (!prev.prev.exists()){
  movetime=1000
} else {
  movetime=prev.prev.movetime / 1.05
}`,
      scoreBased: 'Điều chỉnh dựa trên điểm số',
      scoreBasedCode: `if (-prev.score < -300){
  movetime = 4000
} else if (-prev.score < -200) {
  movetime = 3000
} else {
  movetime = 2000
}`,
      variables: 'Biến có sẵn',
      variablesDesc: `prev.exists() - Kiểm tra xem nước đi trước có tồn tại không
prev.movetime - Thời gian yêu cầu của nước đi trước
prev.depth - Độ sâu tìm kiếm của nước đi trước
prev.nodes - Số nút tìm kiếm của nước đi trước
prev.score - Điểm số của nước đi trước
prev.timeUsed - Thời gian thực tế engine sử dụng cho nước đi trước
prev.prev - Nước đi trước-trước (hỗ trợ lồng nhau vô hạn)`,
    },
  },

  // Hộp thoại chỉnh sửa vị trí
  positionEditor: {
    title: 'Chỉnh sửa vị trí',
    flipBoard: '🔄 Lật bàn cờ',
    mirrorLeftRight: '↔️ Đối xứng trái-phải',
    switchSide: '⚡ Chuyển bên',
    resetPosition: '🔄 Đặt lại vị trí',
    clearPosition: '🔄 Xóa vị trí',
    recognizeImage: '🖼️ Nhận dạng hình ảnh',
    addPieces: 'Thêm quân cờ',
    brightPieces: 'Quân cờ sáng',
    darkPieces: 'Quân úp',
    selectedPosition: 'Vị trí đã chọn',
    selectedPiece: 'Quân cờ đã chọn',
    clickToPlace: 'Nhấp vị trí để đặt',
    piece: 'Quân cờ',
    currentSide: 'Bên hiện tại',
    redToMove: 'Đỏ đi',
    blackToMove: 'Đen đi',
    imageRecognition: 'Nhận dạng hình ảnh',
    clickOrDragImage: 'Nhấp để tải lên hoặc kéo thả hình ảnh vào đây',
    supportedFormats: 'Hỗ trợ JPG, PNG và các định dạng hình ảnh khác',
    startRecognition: 'Bắt đầu nhận dạng',
    applyResults: 'Áp dụng kết quả',
    recognitionResults: 'Kết quả nhận dạng',
    imageRecognitionStatus: {
      loadingModel: 'Đang tải mô hình...',
      modelLoadedSuccessfully: 'Tải mô hình thành công',
      modelLoadingFailed: 'Tải mô hình thất bại: {error}',
      loadingImage: 'Đang tải hình ảnh...',
      preprocessingImage: 'Đang tiền xử lý hình ảnh...',
      runningModelInference: 'Đang chạy sựy luận mô hình...',
      postProcessingResults: 'Đang hậu xử lý kết quả...',
      recognitionCompleted: 'Nhận dạng hoàn thành!',
      processingFailed: 'Xử lý thất bại: {error}',
      unknownError: 'Lỗi không xác định',
    },
    showBoundingBoxes: 'Hiển thị khung giới hạn',
    validationStatus: {
      normal: 'Bình thường',
      error: 'Lỗi: Số lượng quân úp không khớp',
      noRedKing: 'Lỗi: Không có tướng đỏ',
      noBlackKing: 'Lỗi: Không có tướng đen',
      kingOutOfPalace: 'Lỗi: Tướng ngoài cung',
      kingFacing: 'Lỗi: Hai tướng đối mặt',
      inCheck: 'Lỗi: Bên đi bị chiếu',
      tooManyPieces: 'Lỗi: Quá nhiều quân loại này',
      tooManyTotalPieces: 'Lỗi: Tổng số quân vượt quá 16',
      darkPieceInvalidPosition: 'Lỗi: Quân úp ở vị trí không hợp lệ',
      duplicatePosition: 'Lỗi: Vị trí quân trùng lặp',
    },
    cancel: 'Hủy',
    applyChanges: 'Áp dụng thay đổi',
    clear: 'Xóa',
    pieces: {
      red_chariot: 'Xe đỏ',
      red_horse: 'Mã đỏ',
      red_elephant: 'Tượng đỏ',
      red_advisor: 'Sĩ đỏ',
      red_king: 'Tướng đỏ',
      red_cannon: 'Pháo đỏ',
      red_pawn: 'Tốt đỏ',
      black_chariot: 'Xe đen',
      black_horse: 'Mã đen',
      black_elephant: 'Tượng đen',
      black_advisor: 'Sĩ đen',
      black_king: 'Tướng đen',
      black_cannon: 'Pháo đen',
      black_pawn: 'Tốt đen',
      unknown: 'Quân úp',
      red_unknown: 'Quân úp đỏ',
      black_unknown: 'Quân úp đen',
    },
  },

  // Hộp thoại nhập FEN
  fenInput: {
    title: 'Nhập chuỗi FEN',
    placeholder: 'Vui lòng nhập chuỗi FEN...',
    confirm: 'Xác nhận',
    cancel: 'Hủy',
  },

  // Hộp thoại biên bản JSON
  notationTextDialog: {
    title: 'Xem / Dán biên bản (JSON)',
    placeholder:
      'Biên bản JSON của ván hiện tại sẽ hiển thị ở đây. Bạn có thể sao chép để chia sẻ; hoặc dán biên bản JSON nhận được vào đây và bấm Áp dụng để tải.',
    copy: 'Sao chép JSON',
    apply: 'Áp dụng',
  },

  // Hộp thoại nhắc lật quân
  flipPrompt: {
    title: 'Nhắc lật quân',
    message: 'Vui lòng chọn quân cờ để lật',
    confirm: 'Xác nhận',
    cancel: 'Hủy',
  },

  // Hộp thoại về
  about: {
    title: 'Về JieqiBox',
    version: 'Phiên bản',
    description:
      'Một ứng dụng desktop phân tích và chơi Cờ úp hiện đại được xây dựng với Tauri và Vue 3.',
    author: 'Tác giả',
    license: 'Giấy phép',
    github: 'GitHub',
    downloadLatest: 'Tải xuống phiên bản mới nhất',
    viewLicense: 'Xem chi tiết giấy phép',
  },

  // Thanh bên phân tích
  analysis: {
    title: 'Phân tích engine',
    startAnalysis: 'Bắt đầu phân tích',
    stopAnalysis: 'Dừng phân tích',
    engineNotLoaded: 'Chưa tải engine',
    loadEngine: 'Tải engine',
    loadEngineSaf: 'Tải engine (SAF)',
    analysisResults: 'Kết quả phân tích',
    bestMove: 'Nước đi tốt nhất',
    score: 'Điểm số',
    depth: 'Độ sâu',
    nodes: 'Số nút',
    time: 'Thời gian',
    pv: 'Biến chính',
    engineLoaded: 'Đã tải động cơ',
    playBestMove: 'Đi nước tốt nhất',
    undoMove: 'Lùi một nước',
    redAiOn: 'AI Đỏ (Bật)',
    redAiOff: 'AI Đỏ (Tắt)',
    blackAiOn: 'AI Đen (Bật)',
    blackAiOff: 'AI Đen (Tắt)',
    freeFlipMode: 'Chế độ lật tự do',
    darkPiecePool: '(Ăn) Kho quân úp',
    captureHistory: 'Lịch sử ăn quân',
    myCaptured: 'Quân tôi ăn',
    opponentCaptured: 'Quân đối thủ ăn',
    noCaptured: 'Không có',
    engineAnalysis: 'Phân tích engine',
    notation: 'Biên bản',
    moveComments: 'Ghi chú nước đi',
    noComment: 'Không có ghi chú',
    enterComment: 'Nhập ghi chú...',
    saveComment: 'Lưu',
    cancelComment: 'Hủy',
    opening: 'Khai cuộc',
    adjustment: 'Điều chỉnh',
    engineLog: 'Nhật ký engine',
    uciTerminal: 'Terminal UCI',
    about: 'Về',
    undockPanel: 'Tách panel',
    dockPanel: 'Ghép panel',
    restorePanels: 'Khôi phục bố cục panel',
    flipBoard: 'Lật bàn cờ',
    flipBoardBack: 'Khôi phục hướng',
    ponderMode: 'Chế độ suy nghĩ nền',
    selectEngine: 'Chọn engine',
    manageEngines: 'Quản lý',
    unloadEngine: 'Gỡ bỏ engine',
    noEngineLoaded: 'Hiện tại chưa có engine nào được tải.',
    // Chế độ trận đấu
    enterMatchMode: 'Chế độ trận đấu',
    exitMatchMode: 'Thoát chế độ trận đấu',
    // Chế độ người chơi vs AI
    enterHumanVsAiMode: 'Người chơi vs AI',
    exitHumanVsAiMode: 'Thoát chế độ Người chơi vs AI',
    startMatch: 'Bắt đầu trận đấu',
    stopMatch: 'Dừng trận đấu',
    jaiSettings: 'Tùy chọn trận đấu',
    matchInfo: 'Thông tin trận đấu',
    matchStatus: 'Trạng thái',
    gameProgress: 'Tiến độ',
    engineInfo: 'Engine',
    lastResult: 'Kết quả',
    matchWld: 'Thắng-Thua-Hòa',
    eloRating: 'Xếp hạng Elo',
    eloCalculator: 'Máy tính Elo',
    matchEngines: 'Engine',
    running: 'Đang chạy',
    stopped: 'Đã dừng',
    noMatchEngine: 'Chưa tải engine trận đấu',
    noAnalysis: 'Không có dữ liệu phân tích',
    // Chỉ số may mắn
    luckIndex: 'Chỉ số may mắn',
    luckIndexBasedOnFlipSequence: 'Ước tính dựa trên trình tự lật quân',
    blackFavor: 'Đen có lợi',
    redFavor: 'Đỏ có lợi',
    currentValue: 'Giá trị hiện tại',
    // Nút điều hướng
    goToFirst: 'Đi đến nước đầu tiên',
    goToPrevious: 'Đi đến nước trước',
    goToNext: 'Đi đến nước tiếp theo',
    goToLast: 'Đi đến nước cuối cùng',
    play: 'Phát',
    pause: 'Tạm dừng',
    annotateMove: 'Ghi chú nước đi',
    // Ghi chú nước đi
    brilliant: 'Tuyệt vời',
    good: 'Tốt',
    interesting: 'Thú vị',
    dubious: 'Đáng ngờ',
    mistake: 'Sai lầm',
    blunder: 'Lỗi lớn',
    clear: 'Xóa',
  },

  // Trình quản lý Engine
  engineManager: {
    title: 'Trình quản lý Engine',
    addEngine: 'Thêm Engine',
    addEngineAndroid: 'Thêm Engine (SAF)',
    editEngine: 'Chỉnh sửa Engine',
    engineName: 'Tên Engine',
    enginePath: 'Đường dẫn Engine',
    arguments: 'Tham số dòng lệnh',
    actions: 'Hành động',
    confirmDeleteTitle: 'Xác nhận xóa',
    confirmDeleteMessage:
      'Bạn có chắc muốn xóa engine "{name}" không? Hành động này không thể hoàn tác.',
    promptEngineName: 'Vui lòng nhập tên duy nhất cho engine:',
    promptEngineArgs:
      'Vui lòng nhập tham số dòng lệnh cho engine (tùy chọn, để trống nếu không biết):',
    promptHasNnue: 'Engine này có sử dụng file NNUE không? (y/n):',
    promptNnueFile: 'Vui lòng chọn file NNUE cho engine:',
    nameExists: 'Tên này đã tồn tại. Vui lòng sử dụng một tên khác.',
    engineAddedSuccess: 'Đã thêm thành công engine {name}!',
  },

  // Trình sửa tùy chọn UCI đã lưu trong Trình quản lý Engine
  uciEditor: {
    title: 'Tùy chọn UCI đã lưu',
    noSaved:
      'Chưa có tùy chọn nào được lưu cho engine này. Thêm mục bên dưới để cấu hình trước khi tải engine.',
    addOption: 'Thêm tùy chọn',
    optionName: 'Tên tùy chọn',
    optionValue: 'Giá trị',
    type: 'Loại',
    typeString: 'Chuỗi',
    typeNumber: 'Số',
    typeSwitch: 'Công tắc',
    typeCombo: 'Danh sách chọn',
    typeButton: 'Nút',
    willExecute: 'Thực thi khi tải',
    noExecute: 'Không thực thi',
  },

  // Thông báo lỗi
  errors: {
    saveNotationFailed: 'Lưu biên bản thất bại',
    openNotationFailed: 'Mở biên bản thất bại',
    engineNotLoaded: 'Chưa tải engine, không thể gửi lệnh',
    engineSendUnavailable: 'Phương thức send của engine không khả dụng',
    redDarkPiecesMismatch:
      'Lỗi: Bên đỏ {darkCount} quân úp > {poolCount} trong kho',
    blackDarkPiecesMismatch:
      'Lỗi: Bên đen {darkCount} quân úp > {poolCount} trong kho',
    pieceCountExceeded: 'Lỗi: Tổng số {pieceName} vượt giới hạn!',
    engineLoadFailed: 'Không thể tải engine {name}: {error}',
    jaiEngineLoadFailed: 'Không thể tải engine trận đấu JAI {name}: {error}',
    engineUnloadFailed: 'Gỡ bỏ engine thất bại',
    failedToOpenFileSelector: 'Không thể mở trình chọn tệp',
    failedToProcessEngine: 'Không thể xử lý tệp engine',
    invalidFenFormat: 'Định dạng FEN không hợp lệ',
  },

  // Phần dưới bàn cờ
  chessboard: {
    copyFen: 'Sao chép FEN',
    pasteFen: 'Dán FEN',
    inputFen: 'Nhập FEN',
    inputCopyFen: 'Nhập/Sao chép FEN',
    newGame: 'Ván mới',
    copied: '✓ Đã sao chép',
    clearDrawings: 'Xóa vẽ',
  },

  // Biểu đồ đánh giá
  evaluationChart: {
    title: 'Biểu đồ đánh giá',
    rightClickHint: 'Nhấp chuột phải để xem tùy chọn',
    longPressHint: 'Nhấn giữ để xem tùy chọn',
    showMoveLabels: 'Hiển thị nhãn nước đi',
    linearYAxis: 'Trục Y tuyến tính',
    showOnlyLines: 'Chỉ hiển thị đường',
    blackPerspective: 'Góc nhìn Đen',
    clampYAxis: 'Giới hạn phạm vi trục Y',
    clampValue: 'Giá trị giới hạn',
    colorScheme: 'Bảng màu',
    redGreen: 'Đỏ-Xanh lá',
    blueOrange: 'Xanh dương-Cam',
    showSeparateLines: 'Hiển thị riêng đường đánh giá Đỏ & Đen',
    opening: 'Khai cuộc',
    noData: 'Không có dữ liệu phân tích',
    newGame: 'Ván mới',
    copied: '✓ Đã sao chép',
    saveChartImage: 'Lưu hình ảnh',
    chartImageSaved: 'Hình ảnh đã được lưu vào {path}',
    saveChartImageFailed: 'Lưu hình ảnh thất bại',
  },

  // Lựa chọn ngôn ngữ
  languages: {
    current: 'Ngôn ngữ hiện tại',
    zh_cn: '简体中文',
    zh_tw: '繁體中文',
    en: 'English',
    vi: 'Tiếng Việt',
    ja: '日本語',
  },

  // Hộp thoại cài đặt giao diện
  interfaceSettings: {
    title: 'Cài đặt giao diện',
    showCoordinates: 'Hiển thị số hàng và cột',
    parseUciInfo: 'Phân tích thông tin UCI',
    showAnimations: 'Bật hoạt ảnh di chuyển quân cờ',
    showPositionChart: 'Hiển thị biểu đồ cục diện',
    showEvaluationBar: 'Hiển thị thanh đánh giá',
    darkMode: 'Chế độ tối',
    autosave: 'Tự động lưu ván cờ vào Autosave.json',
    useNewFenFormat: 'Sử dụng định dạng FEN mới',
    engineLogLineLimit: 'Giới hạn dòng nhật ký động cơ',
    showChineseNotation: 'Hiển thị ký hiệu Trung Quốc',
    showLuckIndex: 'Hiển thị chỉ số may mắn',
    showArrows: 'Hiển thị mũi tên',
  },

  // Tin nhắn UCI
  uci: {
    depth: 'Độ sâu',
    seldepth: 'Độ sâu chọn',
    multipv: 'MultiPV',
    score: 'Điểm',
    mate: 'Chiếu hết',
    wdl: 'Thắng/Hòa/Thua',
    nodes: 'Số nút',
    nps: 'NPS',
    hashfull: 'Hash đầy',
    tbhits: 'Bảng truy cập',
    time: 'Thời gian',
    pv: 'Biến chính',
    checkmate: 'Chiếu hết! Không có nước đi nào.',
    bestMove: 'Nước đi tốt nhất: {move}',
    noMoves: 'Không có nước đi nào',
    engineReady: 'Engine đã sẵn sàng',
  },

  // Hộp thoại tùy chọn JAI
  jaiOptions: {
    title: 'Tùy chọn trận đấu JAI',
    loadingText: 'Đang tải tùy chọn engine...',
    noEngineLoaded: 'Hiện tại chưa có engine trận đấu nào được tải.',
    pleaseLoadEngineFirst:
      'Vui lòng tải engine trận đấu trước để cấu hình các tùy chọn của nó.',
    loadEngine: 'Tải engine',
    noOptionsAvailable: 'Không có tùy chọn JAI nào cho engine này.',
    refreshOptions: 'Làm mới tùy chọn',
    range: 'Phạm vi',
    execute: 'Thực hiện',
    resetToDefaults: 'Đặt lại mặc định',
    clearSettings: 'Xóa cài đặt',
    confirmClearSettings:
      'Bạn có chắc chắn muốn xóa tất cả cấu hình tùy chọn JAI cho engine hiện tại không? Hành động này không thể hoàn tác.',
    settingsCleared: 'Đã xóa cấu hình tùy chọn JAI',
    // Mô tả tùy chọn JAI
    optionDescriptions: {
      Engine1Path:
        'Đường dẫn đầy đủ tới tệp thực thi engine Jieqi tương thích UCI (Engine 1).',
      Engine1Options:
        'Chuỗi lệnh UCI "setoption" cho Engine 1. Mỗi tùy chọn phải theo định dạng "name <Tên tùy chọn> value <Giá trị>". Nhiều tùy chọn được phân tách bằng khoảng trắng. Trình phân tích xử lý đúng tên/giá trị có chứa khoảng trắng. Ví dụ: "name Threads value 4 name Hash value 256"',
      Engine2Path:
        'Đường dẫn đầy đủ tới tệp thực thi engine Jieqi tương thích UCI (Engine 2).',
      Engine2Options:
        'Chuỗi lệnh UCI "setoption" cho Engine 2. Xem "Engine1Options" về định dạng và ví dụ.',
      TotalRounds:
        'Số cặp ván sẽ chơi. Tổng số ván là "TotalRounds * 2" vì hai engine đổi màu mỗi vòng.',
      Concurrency: 'Số ván chạy song song.',
      BookFile:
        'Đường dẫn tới tệp khai cuộc. Tệp chứa một FEN trên mỗi dòng. Đầu mỗi vòng sẽ chọn ngẫu nhiên một FEN để dùng cho cặp ván của vòng đó. Nếu đường dẫn rỗng/không hợp lệ hoặc tệp không có FEN, sẽ dùng vị trí xuất phát mặc định.',
      MainTimeMs: 'Thời gian suy nghĩ cơ bản cho mỗi người chơi (mili giây).',
      IncTimeMs: 'Thời gian cộng thêm sau mỗi nước đi (mili giây).',
      TimeoutBufferMs:
        'Khoảng đệm (mili giây) để bù chi phí tiến trình và truyền thông. Chỉ xử thua do hết giờ khi đồng hồ xuống dưới "-(TimeoutBufferMs)".',
      Logging:
        'Nếu bật ("true"), engine trận đấu sẽ tạo tệp nhật ký chi tiết cho mỗi tiến trình engine, ghi lại toàn bộ giao tiếp UCI.',
      SaveNotation: 'Công tắc bật/tắt lưu biên bản cho từng ván.',
      SaveNotationDir: 'Thư mục lưu biên bản khi tính năng lưu được bật.',
      TimeControl: 'Cài đặt kiểm soát thời gian cho mỗi engine.',
      AdjudicationRule: 'Quy tắc phân xử hòa hoặc vị thế quyết định.',
    },
  },

  // Tin nhắn JAI
  jai: {
    engineReady: 'Engine trận đấu đã sẵn sàng',
    matchStarted: 'Trận đấu đã bắt đầu',
    matchStopped: 'Trận đấu đã dừng',
    gameProgress: 'Ván {current} / {total}',
    matchResult: 'Kết quả trận đấu: {result}',
  },

  // Máy tính Elo
  eloCalculator: {
    title: 'Máy tính Elo',
    inputSection: 'Kết quả trận đấu',
    wins: 'Thắng',
    losses: 'Thua',
    draws: 'Hòa',
    totalGames: 'Tổng ván',
    resultsFormat: 'Định dạng kết quả',
    formatWDL: 'WDL (Thắng/Hòa/Thua)',
    formatPTNML: 'PTNML (cặp ván)',
    ptnml: {
      ll: 'LL',
      lddl: 'LD+DL',
      center: 'LW+DD+WL',
      dwwd: 'DW+WD',
      ww: 'WW',
    },
    resultsSection: 'Hiệu suất Elo',
    performance: 'Chênh lệch Elo (kèm sai số 95%)',
    confidenceInterval: 'Khoảng tin cậy 95%',
    scoreRate: 'Tỉ lệ điểm',
    los: 'LOS (xác suất vượt trội)',
    drawRatio: 'Tỷ lệ hòa',
    standardError: 'Sai số chuẩn',
    noResults: 'Nhập kết quả để xem tính toán.',
    basicRequiresWDL: 'Chế độ Cơ bản cần WDL. Hãy chuyển sang WDL.',
    close: 'Đóng',
    basicMode: 'Cơ bản',
  },

  // Xác nhận thao tác trò chơi
  gameConfirm: {
    clearHistoryTitle: 'Xóa lịch sử tiếp theo',
    clearHistoryMessage:
      'Bạn đang thực hiện nước đi trong vị trí lịch sử. Điều này sẽ xóa tất cả lịch sử nước đi tiếp theo. Bạn có chắc chắn muốn tiếp tục không?',
    confirm: 'Xác nhận',
    cancel: 'Hủy',
  },

  // Thông báo kết thúc trò chơi
  gameEnd: {
    humanWins: 'Chúc mừng! Bạn đã thắng!',
    aiWins: 'Kết thúc trò chơi - AI thắng',
    humanWinsMessage: 'Bạn đã đánh bại AI! AI không còn nước đi hợp lệ.',
    aiWinsMessage: 'AI đã thắng trận đấu này. Bạn không còn nước đi hợp lệ.',
    ok: 'OK',
  },

  // Chế độ người chơi vs AI
  humanVsAi: {
    title: 'Chế độ Người chơi vs AI',
    selectAiSide: 'Chọn phía AI',
    redAiBlackHuman: 'AI Đỏ, Người chơi Đen',
    blackAiRedHuman: 'AI Đen, Người chơi Đỏ',
    options: 'Tùy chọn',
    showEngineAnalysis: 'Hiển thị phân tích engine',
    engineAnalysisHint:
      'Khi bật, bạn có thể xem kết quả phân tích engine, nhưng không ảnh hưởng đến luật chơi',
    ponderNote: 'Về suy nghĩ nền:',
    ponderUnifiedHint:
      'Tính năng suy nghĩ nền sử dụng cài đặt toàn cục, có thể bật/tắt trong thanh bên ở chế độ bình thường',
    rulesTitle: 'Luật chơi',
    rule1: 'Tự động bắt buộc bật chế độ lật ngẫu nhiên',
    rule2: 'Bạn chỉ có thể thấy quân úp mà bạn ăn từ AI',
    rule3: 'AI chỉ có thể thấy quân úp mà nó ăn từ bạn',
    rule4: 'Trận chiến thông tin hạn chế theo luật Cờ úp tiêu chuẩn',
    startGame: 'Bắt đầu trò chơi',
  },
}
