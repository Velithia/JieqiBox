export default {
  // Umum
  common: {
    confirm: 'Sahkan',
    cancel: 'Batal',
    close: 'Tutup',
    save: 'Simpan',
    open: 'Buka',
    refresh: 'Muat Semula',
    reset: 'Tetapkan Semula',
    clear: 'Padam',
    apply: 'Gunakan',
    execute: 'Laksanakan',
    loading: 'Sedang memuatkan...',
    error: 'Ralat',
    success: 'Berjaya',
    warning: 'Amaran',
    info: 'Info',
    delete: 'Hapus',
    add: 'Tambah',
    actions: 'Tindakan',
    required: 'Ruangan ini diperlukan',
  },

  // Bar Alat Atas
  toolbar: {
    newGame: 'Permainan Baru',
    copyFen: 'Salin FEN',
    inputFen: 'Masukkan FEN',
    editPosition: 'Edit Posisi',
    uciSettings: 'Tetapan UCI',
    analysisParams: 'Parameter Analisis',
    saveNotation: 'Simpan Notasi',
    openNotation: 'Buka Notasi',
    interfaceSettings: 'Tetapan Antara Muka',
    gameTitle: 'Permainan Jieqi',
    variation: 'Larang Langkah Semasa',
    analyzeDrawings: 'Analisis Lukisan',
    noDrawingMoves: 'Tiada langkah lukisan yang sah',
    noMoreVariations: 'Tiada lagi variasi tersedia',
    darkMode: 'Mod Gelap',
    lightMode: 'Mod Cerah',
    viewPasteNotation: 'Lihat/Tampal Notasi',
    reviewAnalysis: 'Semak Analisis',
    openingBook: 'Buku Pembukaan',
  },

  // Dialog Pilihan UCI
  uciOptions: {
    title: 'Pilihan Enjin UCI',
    loadingText: 'Memuatkan pilihan enjin...',
    noEngineLoaded: 'Tiada enjin dimuatkan pada masa ini.',
    pleaseLoadEngineFirst:
      'Sila muatkan enjin dahulu untuk mengkonfigurasi pilihannya.',
    loadEngine: 'Muatkan Enjin',
    noOptionsAvailable: 'Tiada pilihan UCI tersedia untuk enjin ini.',
    refreshOptions: 'Muat Semula Pilihan',
    range: 'Julat',
    execute: 'Laksanakan',
    resetToDefaults: 'Tetapkan Semula ke Lalai',
    clearSettings: 'Padam Tetapan',
    confirmClearSettings:
      'Adakah anda pasti mahu memadam semua konfigurasi pilihan UCI untuk enjin semasa? Tindakan ini tidak boleh dibuat asal.',
    settingsCleared: 'Konfigurasi pilihan UCI telah dipadam',
    // Penerangan Pilihan UCI
    optionDescriptions: {
      'Debug Log File':
        'Fail debug yang merekodkan komunikasi antara enjin dan antara muka.',
      Threads:
        'Bilangan utas (threads) yang digunakan untuk carian enjin. Disyorkan menetapkannya kepada bilangan utas sistem tersedia tolak 1 atau 2.',
      Hash: 'Saiz jadual hash enjin (dalam MB). Disyorkan menetapkan nilai ini kepada jumlah memori tersedia tolak 1-2 GiB.',
      'Clear Hash': 'Membersihkan jadual hash.',
      MultiPV:
        'Multi-Principal Variation. Membolehkan enjin menunjukkan beberapa langkah yang disyorkan. Disyorkan menetapkan kepada 1. Jika lebih tinggi, kualiti langkah terbaik mungkin menurun.',
      NumaPolicy:
        'Mengikat utas kepada nod NUMA tertentu untuk memastikan pelaksanaan. Meningkatkan prestasi pada sistem dengan berbilang CPU.',
      Ponder: 'Membenarkan enjin berfikir (Ponder) semasa giliran lawan.',
      'Move Overhead':
        'Menganggap kelewatan x milisaat disebabkan oleh rangkaian dan GUI. Berguna untuk mengelakkan kekalahan masa.',
      nodestime:
        'Memberitahu enjin untuk menggunakan bilangan nod carian dan bukan masa sebenar. Berguna untuk ujian enjin.',
      UCI_ShowWDL:
        'Jika diaktifkan, memaparkan statistik anggaran WDL (Menang/Seri/Kalah) dalam output enjin.',
      EvalFile:
        'Nama fail parameter penilaian NNUE. Bergantung pada GUI, nama fail mungkin memerlukan laluan penuh.',
    },
  },

  // Dialog Semakan Analisis
  reviewDialog: {
    title: 'Semakan Analisis',
    movetime: 'Masa setiap langkah (ms)',
    progress: 'Kemajuan: {current}/{total}',
  },

  // Terminal UCI
  uciTerminal: {
    title: 'Terminal UCI',
    enterCommand: 'Masukkan arahan UCI...',
    sendCommand: 'Hantar Arahan',
    noEngineLoaded: 'Tiada enjin dimuatkan pada masa ini.',
    pleaseLoadEngineFirst:
      'Sila muatkan enjin dahulu untuk menggunakan terminal.',
    quickCommands: 'Arahan Pantas',
    clear: 'Bersihkan Terminal',
    commandHistory: 'Sejarah Arahan',
    terminalOutput: 'Output Terminal',
  },

  // Dialog Masa
  timeDialog: {
    title: 'Tetapan Parameter Analisis Enjin',
    movetime: 'Masa Langkah (ms)',
    maxThinkTime: 'Masa Fikir Maksimum (ms)',
    maxDepth: 'Kedalaman Maksimum',
    maxNodes: 'Nod Maksimum',
    analysisMode: 'Mod Analisis',
    advanced: 'Skrip Lanjutan',
    resetToDefaults: 'Tetapkan Semula ke Lalai',
    clearSettings: 'Padam Tetapan',
    confirmClearSettings:
      'Adakah anda pasti mahu memadam semua konfigurasi parameter analisis?',
    settingsCleared: 'Parameter analisis telah dipadam',
    analysisModes: {
      movetime: 'Analisis mengikut Masa Langkah',
      maxThinkTime: 'Analisis mengikut Masa Fikir Maksimum',
      depth: 'Analisis mengikut Kedalaman',
      nodes: 'Analisis mengikut Bilangan Nod',
      advanced: 'Mod Pengaturcaraan Lanjutan',
    },
    advancedHint1:
      'Menyokong pengaturcaraan mudah: tugasan, aritmetik, operasi bit, keadaan if',
    advancedHint2:
      'Pembolehubah tersedia: movetime, depth, nodes, maxThinkTime, prev',
    advancedPlaceholder: 'Sila tulis skrip anda di sini...',
    advancedExamples: {
      title: 'Kod Contoh',
      basic: 'Tetapan Asas',
      basicCode: `depth=20
movetime=1000
nodes=2000000`,
      conditional: 'Kawalan Bersyarat',
      conditionalCode: `if (!prev.prev.exists()){
  movetime=1000
} else {
  movetime=prev.prev.movetime / 1.05
}`,
      scoreBased: 'Pelarasan Berdasarkan Skor',
      scoreBasedCode: `if (-prev.score < -300){
  movetime = 4000
} else if (-prev.score < -200) {
  movetime = 3000
} else {
  movetime = 2000
}`,
      variables: 'Penerangan Pembolehubah',
      variablesDesc: `prev.exists() - Semak jika langkah sebelumnya wujud
prev.movetime - Masa diminta langkah sebelumnya
prev.depth - Kedalaman carian langkah sebelumnya
prev.nodes - Bilangan nod carian langkah sebelumnya
prev.score - Skor langkah sebelumnya
prev.timeUsed - Masa sebenar digunakan oleh enjin
prev.prev - Langkah sebelum sebelumnya (sokongan bersarang tanpa had)`,
    },
  },

  // Editor Posisi
  positionEditor: {
    title: 'Editor Posisi',
    flipBoard: '🔄 Pusing Papan',
    mirrorLeftRight: '↔️ Cermin Kiri-Kanan',
    switchSide: '⚡ Tukar Giliran',
    resetPosition: '🔄 Tetapkan Semula Posisi',
    clearPosition: '🔄 Kosongkan Posisi',
    recognizeImage: '🖼️ Cam Imej',
    addPieces: 'Tambah Buah',
    revealedPieces: 'Buah Terdedah',
    darkPieces: 'Buah Gelap (Tersembunyi)',
    darkPiece: 'Gelap',
    selectedPosition: 'Posisi Dipilih',
    selectedPiece: 'Buah Dipilih',
    clickToPlace: 'Klik untuk letak',
    piece: 'Buah',
    currentSide: 'Giliran Semasa',
    redToMove: 'Merah Jalan',
    blackToMove: 'Hitam Jalan',
    imageRecognition: 'Pengecaman Imej',
    clickOrDragImage: 'Klik atau seret imej ke sini',
    supportedFormats: 'Menyokong JPG, PNG dan format lain',
    startRecognition: 'Mula Pengecaman',
    applyResults: 'Gunakan Hasil',
    recognitionResults: 'Hasil Pengecaman',
    imageRecognitionStatus: {
      loadingModel: 'Memuatkan model...',
      modelLoadedSuccessfully: 'Model berjaya dimuatkan',
      modelLoadingFailed: 'Gagal memuatkan model: {error}',
      loadingImage: 'Memuatkan imej...',
      preprocessingImage: 'Memproses imej...',
      runningModelInference: 'Menjalankan inferens model...',
      postProcessingResults: 'Memproses hasil...',
      recognitionCompleted: 'Pengecaman selesai!',
      processingFailed: 'Pemprosesan gagal: {error}',
      unknownError: 'Ralat tidak diketahui',
    },
    showBoundingBoxes: 'Tunjukkan kotak sempadan',
    preserveDarkPools: 'Kekalkan kolam buah gelap',
    validationStatus: {
      normal: 'Normal',
      error: 'Ralat: Bilangan buah gelap tidak sepadan',
      noRedKing: 'Ralat: Tiada Raja Merah',
      noBlackKing: 'Ralat: Tiada Raja Hitam',
      kingOutOfPalace: 'Ralat: Raja di luar istana',
      kingFacing: 'Ralat: Raja berhadapan (Raja Lawan Raja)',
      inCheck: 'Ralat: Pihak semasa sedang di-check',
      tooManyPieces: 'Ralat: Terlalu banyak buah jenis ini',
      tooManyTotalPieces: 'Ralat: Jumlah buah melebihi 16',
      darkPieceInvalidPosition: 'Ralat: Buah gelap di posisi tidak sah',
      duplicatePosition: 'Ralat: Posisi buah bertindih',
    },
    cancel: 'Batal',
    applyChanges: 'Gunakan Perubahan',
    clear: 'Padam',
    pieces: {
      red_chariot: 'Kereta Merah',
      red_horse: 'Kuda Merah',
      red_elephant: 'Gajah Merah',
      red_advisor: 'Pengawal Merah',
      red_king: 'Raja Merah',
      red_cannon: 'Meriam Merah',
      red_pawn: 'Bidak Merah',
      black_chariot: 'Kereta Hitam',
      black_horse: 'Kuda Hitam',
      black_elephant: 'Gajah Hitam',
      black_advisor: 'Pengawal Hitam',
      black_king: 'Raja Hitam',
      black_cannon: 'Meriam Hitam',
      black_pawn: 'Bidak Hitam',
      unknown: 'Buah Gelap',
      red_unknown: 'Gelap Merah',
      black_unknown: 'Gelap Hitam',
    },
  },

  // Input FEN
  fenInput: {
    title: 'Masukkan Rentetan FEN',
    placeholder: 'Sila masukkan rentetan FEN...',
    confirm: 'Sahkan',
    cancel: 'Batal',
  },

  // Dialog Notasi JSON
  notationTextDialog: {
    title: 'Lihat / Tampal Notasi (JSON)',
    placeholder:
      'JSON notasi permainan semasa akan muncul di sini. Anda boleh menyalinnya, atau menampal JSON notasi dan klik "Gunakan" untuk memuatkannya.',
    copy: 'Salin JSON',
    apply: 'Gunakan',
  },

  // Gesaan Pusing Buah
  flipPrompt: {
    title: 'Gesaan Pusing Buah',
    message: 'Sila pilih buah untuk dipusingkan',
    confirm: 'Sahkan',
    cancel: 'Batal',
  },

  // Perihal
  about: {
    title: 'Tentang JieqiBox',
    version: 'Versi',
    description:
      'Aplikasi desktop moden untuk analisis dan permainan Jieqi, dibina dengan Tauri dan Vue 3.',
    author: 'Pengarang',
    license: 'Lesen',
    github: 'GitHub',
    downloadLatest: 'Muat Turun Versi Terkini',
    viewLicense: 'Lihat Butiran Lesen',
    credits: 'Kredit',
    piecesCredit: 'Reka Bentuk Buah: Couch Tomato',
    checkUpdate: 'Semak Kemas Kini',
    checkingUpdate: 'Menyemak kemas kini...',
    updateAvailable: 'Versi baharu tersedia: {version}',
    upToDate: 'Anda menggunakan versi terkini.',
    updateError: 'Gagal menyemak kemas kini.',
  },

  // Bar Sisi Analisis
  analysis: {
    title: 'Analisis Enjin',
    startAnalysis: 'Mula Analisis',
    stopAnalysis: 'Henti Analisis',
    engineNotLoaded: 'Enjin Tidak Dimuatkan',
    loadEngine: 'Muatkan Enjin',
    loadEngineSaf: 'Muatkan Enjin (SAF)',
    analysisResults: 'Hasil Analisis',
    bestMove: 'Langkah Terbaik',
    score: 'Skor',
    depth: 'Kedalaman',
    nodes: 'Nod',
    time: 'Masa',
    pv: 'Variasi Utama (PV)',
    engineLoaded: 'Enjin Dimuatkan',
    playBestMove: 'Main Langkah Terbaik',
    undoMove: 'Buat Asal Langkah',
    redAiOn: 'AI Merah (Hidup)',
    redAiOff: 'AI Merah (Mati)',
    blackAiOn: 'AI Hitam (Hidup)',
    blackAiOff: 'AI Hitam (Mati)',
    freeFlipMode: 'Mod Pusing Bebas',
    darkPiecePool: 'Kolam Buah Gelap (Ditangkap)',
    captureHistory: 'Sejarah Tangkapan',
    myCaptured: 'Tangkapan Saya',
    opponentCaptured: 'Tangkapan Lawan',
    noCaptured: 'Tiada',
    engineAnalysis: 'Analisis Enjin',
    notation: 'Notasi',
    moveComments: 'Komen Langkah',
    noComment: 'Tiada komen',
    enterComment: 'Masukkan komen...',
    saveComment: 'Simpan',
    cancelComment: 'Batal',
    opening: 'Pembukaan',
    adjustment: 'Pelarasan',
    engineLog: 'Log Enjin',
    uciTerminal: 'Terminal UCI',
    about: 'Tentang',
    undockPanel: 'Nyahdok Panel',
    dockPanel: 'Dok Panel',
    restorePanels: 'Pulihkan Susun Atur',
    flipBoard: 'Pusing Papan',
    flipBoardBack: 'Pulihkan Arah',
    ponderMode: 'Mod Ponder',
    selectEngine: 'Pilih Enjin',
    manageEngines: 'Urus',
    unloadEngine: 'Nyahmuat Enjin',
    noEngineLoaded: 'Tiada enjin dimuatkan pada masa ini.',
    // Mod Perlawanan
    enterMatchMode: 'Mod Perlawanan',
    exitMatchMode: 'Keluar Mod Perlawanan',
    // Mod Manusia vs AI
    enterHumanVsAiMode: 'Manusia vs AI',
    exitHumanVsAiMode: 'Keluar Manusia vs AI',
    startMatch: 'Mula Perlawanan',
    stopMatch: 'Henti Perlawanan',
    jaiSettings: 'Pilihan Perlawanan',
    matchInfo: 'Maklumat Perlawanan',
    multiPv: 'Multi PV',
    fullLine: 'Baris penuh',
    matchStatus: 'Status',
    gameProgress: 'Kemajuan',
    engineInfo: 'Enjin',
    lastResult: 'Keputusan',
    matchWld: 'M/S/K',
    eloRating: 'Rating Elo',
    eloCalculator: 'Kalkulator Elo',
    matchEngines: 'Enjin',
    running: 'Sedang Berjalan',
    stopped: 'Dihentikan',
    noMatchEngine: 'Tiada enjin perlawanan dimuatkan',
    noAnalysis: 'Tiada data analisis',
    // Indeks Nasib
    luckIndex: 'Indeks Nasib',
    luckIndexBasedOnFlipSequence: 'Anggaran berdasarkan urutan pusingan',
    blackFavor: 'Memihak Hitam',
    redFavor: 'Memihak Merah',
    currentValue: 'Nilai Semasa',
    // Butang Navigasi
    goToFirst: 'Ke Langkah Pertama',
    goToPrevious: 'Langkah Sebelumnya',
    goToNext: 'Langkah Seterusnya',
    goToLast: 'Ke Langkah Terakhir',
    play: 'Main',
    pause: 'Jeda',
    annotateMove: 'Anotasi Langkah',
    // Anotasi Langkah
    brilliant: 'Brilian',
    good: 'Bagus',
    interesting: 'Menarik',
    dubious: 'Meragukan',
    mistake: 'Kesilapan',
    blunder: 'Kesilapan Besar',
    clear: 'Padam',
  },

  // Pengurus Enjin
  engineManager: {
    title: 'Pengurus Enjin',
    addEngine: 'Tambah Enjin',
    addEngineAndroid: 'Tambah Enjin (SAF)',
    editEngine: 'Edit Enjin',
    engineName: 'Nama Enjin',
    enginePath: 'Laluan Enjin',
    arguments: 'Argumen Baris Arahan',
    actions: 'Tindakan',
    confirmDeleteTitle: 'Sahkan Penghapusan',
    confirmDeleteMessage:
      'Adakah anda pasti mahu menghapus enjin "{name}"? Tindakan ini tidak boleh dibuat asal.',
    promptEngineName: 'Sila masukkan nama unik untuk enjin:',
    promptEngineArgs: 'Sila masukkan argumen baris arahan (pilihan):',
    promptHasNnue: 'Adakah enjin ini menggunakan fail NNUE? (y/n):',
    promptNnueFile: 'Sila pilih fail NNUE untuk enjin:',
    nameExists: 'Nama ini sudah wujud. Sila gunakan nama yang unik.',
    engineAddedSuccess: 'Enjin {name} berjaya ditambah!',
  },

  // Editor Pilihan UCI Disimpan
  uciEditor: {
    title: 'Pilihan UCI Disimpan',
    noSaved:
      'Tiada pilihan disimpan untuk enjin ini. Tambah item di bawah untuk prakonfigurasi sebelum memuatkan enjin.',
    addOption: 'Tambah Pilihan',
    optionName: 'Nama Pilihan',
    optionValue: 'Nilai',
    type: 'Jenis',
    typeString: 'Rentetan',
    typeNumber: 'Nombor',
    typeSwitch: 'Suis',
    typeCombo: 'Kombinasi (Pilih)',
    typeButton: 'Butang',
    willExecute: 'Laksanakan semasa memuatkan',
    noExecute: 'Jangan laksanakan',
  },

  // Pilihan JAI
  jaiOptions: {
    title: 'Pilihan Perlawanan JAI',
    loadingText: 'Memuatkan pilihan enjin...',
    noEngineLoaded: 'Tiada enjin perlawanan dimuatkan.',
    pleaseLoadEngineFirst:
      'Sila muatkan enjin perlawanan dahulu untuk mengkonfigurasi pilihannya.',
    loadEngine: 'Muatkan Enjin',
    noOptionsAvailable: 'Tiada pilihan JAI tersedia untuk enjin ini.',
    refreshOptions: 'Muat Semula Pilihan',
    range: 'Julat',
    execute: 'Laksanakan',
    resetToDefaults: 'Tetapkan Semula ke Lalai',
    clearSettings: 'Padam Tetapan',
    confirmClearSettings:
      'Adakah anda pasti mahu memadam semua konfigurasi pilihan JAI? Tindakan ini tidak boleh dibuat asal.',
    settingsCleared: 'Konfigurasi pilihan JAI telah dipadam',
    // Penerangan Pilihan JAI
    optionDescriptions: {
      Engine1Path:
        'Laluan penuh ke fail boleh laksana enjin Jieqi serasi UCI pertama.',
      Engine1Options:
        'Rentetan arahan UCI "setoption" untuk Enjin 1. Format: "name <Nama> value <Nilai>".',
      Engine2Path:
        'Laluan penuh ke fail boleh laksana enjin Jieqi serasi UCI kedua.',
      Engine2Options:
        'Rentetan arahan UCI "setoption" untuk Enjin 2. Lihat "Engine1Options" untuk format.',
      TotalRounds:
        'Bilangan pasangan permainan yang akan dimainkan. Jumlah permainan akan menjadi "TotalRounds * 2".',
      Concurrency: 'Bilangan permainan yang dijalankan secara selari.',
      BookFile:
        'Laluan ke fail buku pembukaan (FEN). Jika kosong atau tidak sah, posisi permulaan digunakan.',
      MainTimeMs:
        'Masa berfikir asas untuk setiap pemain setiap permainan (ms).',
      IncTimeMs: 'Tambahan masa selepas setiap langkah (ms).',
      TimeoutBufferMs:
        'Tempoh tangguh (ms) untuk overhed proses dan komunikasi.',
      Logging:
        'Jika diaktifkan ("true"), enjin perlawanan akan mencipta fail log terperinci.',
      SaveNotation:
        'Suis untuk membolehkan penyimpanan fail notasi setiap permainan.',
      SaveNotationDir: 'Laluan direktori di mana fail notasi akan disimpan.',
      TimeControl: 'Tetapan kawalan masa untuk setiap enjin.',
      AdjudicationRule:
        'Peraturan untuk mengadili kedudukan seri atau penentu.',
    },
  },

  // Mesej JAI
  jai: {
    engineReady: 'Enjin perlawanan sedia',
    matchStarted: 'Perlawanan bermula',
    matchStopped: 'Perlawanan dihentikan',
    gameProgress: 'Permainan {current} dari {total}',
    matchResult: 'Keputusan perlawanan: {result}',
  },

  // Kalkulator Elo
  eloCalculator: {
    title: 'Kalkulator Elo',
    inputSection: 'Keputusan Perlawanan',
    wins: 'Menang',
    losses: 'Kalah',
    draws: 'Seri',
    totalGames: 'Jumlah Permainan',
    resultsFormat: 'Format Keputusan',
    formatWDL: 'WDL (Menang/Seri/Kalah)',
    formatPTNML: 'PTNML (Pasangan)',
    ptnml: {
      ll: 'LL (Kalah+Kalah)',
      lddl: 'LD+DL (Kalah+Seri)',
      center: 'LW+DD+WL (Tukar/Seri)',
      dwwd: 'DW+WD (Seri+Menang)',
      ww: 'WW (Menang+Menang)',
    },
    resultsSection: 'Prestasi Elo',
    performance: 'Perbezaan Elo (dengan ralat 95%)',
    confidenceInterval: 'Selang Keyakinan 95%',
    scoreRate: 'Kadar Skor',
    los: 'LOS (Kemungkinan Keunggulan)',
    drawRatio: 'Nisbah Seri',
    standardError: 'Ralat Piawai',
    noResults: 'Masukkan keputusan untuk melihat pengiraan.',
    basicRequiresWDL: 'Mod asas memerlukan input WDL.',
    close: 'Tutup',
    basicMode: 'Asas',
  },

  // Mesej Ralat
  errors: {
    saveNotationFailed: 'Gagal menyimpan notasi',
    openNotationFailed: 'Gagal membuka notasi',
    engineNotLoaded: 'Enjin tidak dimuatkan, tidak boleh menghantar arahan',
    engineSendUnavailable: 'Kaedah penghantaran enjin tidak tersedia',
    redDarkPiecesMismatch: 'Ralat: Merah {darkCount} gelap > {poolCount} kolam',
    blackDarkPiecesMismatch:
      'Ralat: Hitam {darkCount} gelap > {poolCount} kolam',
    pieceCountExceeded: 'Ralat: Jumlah {pieceName} melebihi had!',
    engineLoadFailed: 'Gagal memuatkan enjin {name}: {error}',
    jaiEngineLoadFailed: 'Gagal memuatkan enjin perlawanan JAI {name}: {error}',
    engineUnloadFailed: 'Gagal menyahmuat enjin',
    failedToOpenFileSelector: 'Gagal membuka pemilih fail',
    failedToProcessEngine: 'Gagal memproses fail enjin',
    invalidFenFormat: 'Format FEN tidak sah',
  },

  // Bawah Papan Catur
  chessboard: {
    copyFen: 'Salin FEN',
    pasteFen: 'Tampal FEN',
    inputFen: 'Masukkan FEN',
    inputCopyFen: 'Input/Salin FEN',
    newGame: 'Permainan Baru',
    copied: '✓ Disalin',
    clearDrawings: 'Padam Lukisan',
  },

  // Carta Penilaian
  evaluationChart: {
    title: 'Carta Penilaian',
    rightClickHint: 'Klik kanan untuk pilihan',
    longPressHint: 'Tekan lama untuk pilihan',
    showMoveLabels: 'Tunjukkan Label Langkah',
    linearYAxis: 'Paksi-Y Linear',
    showOnlyLines: 'Tunjukkan Garisan Sahaja',
    blackPerspective: 'Perspektif Hitam',
    clampYAxis: 'Kepit Paksi-Y',
    clampValue: 'Nilai Kepit',
    colorScheme: 'Skema Warna',
    redGreen: 'Merah-Hijau',
    blueOrange: 'Biru-Oren',
    showSeparateLines: 'Tunjukkan Garisan Asing untuk Merah & Hitam',
    opening: 'Pembukaan',
    noData: 'Tiada data analisis',
    newGame: 'Permainan Baru',
    copied: '✓ Disalin',
    saveChartImage: 'Simpan Imej Carta',
    chartImageSaved: 'Imej carta disimpan ke {path}',
    saveChartImageFailed: 'Gagal menyimpan imej',
    viewMode: 'Mod Paparan',
    evaluation: 'Penilaian',
    time: 'Masa',
    depth: 'Kedalaman',
  },

  // Pilihan Bahasa
  languages: {
    current: 'Bahasa Semasa',
    zh_cn: '简体中文',
    zh_tw: '繁體中文',
    en: 'English',
    vi: 'Tiếng Việt',
    ja: '日本語',
    ko: '한국어',
    ru: 'Русский',
    de: 'Deutsch',
    fr: 'Français',
    es: 'Español',
    th: 'ไทย',
    ms: 'Bahasa Melayu',
  },

  // Tetapan Antara Muka
  interfaceSettings: {
    title: 'Tetapan Antara Muka',
    showCoordinates: 'Tunjukkan koordinat',
    parseUciInfo: 'Huraikan Maklumat UCI',
    showAnimations: 'Dayakan animasi langkah',
    showPositionChart: 'Tunjukkan carta penilaian',
    showEvaluationBar: 'Tunjukkan bar penilaian',
    darkMode: 'Mod Gelap',
    autosave: 'Simpan automatik ke Autosave.json',
    useNewFenFormat: 'Gunakan Format FEN Baru',
    engineLogLineLimit: 'Had Baris Log Enjin',
    validationTimeout: 'Tamat Masa Validasi Enjin (ms)',
    showChineseNotation: 'Tunjukkan Notasi Cina',
    showLuckIndex: 'Tunjukkan Indeks Nasib',
    showArrows: 'Tunjukkan Anak Panah',
    enableSoundEffects: 'Dayakan Kesan Bunyi',
    soundVolume: 'Kelantangan Bunyi',
    pieceStyle: 'Gaya Buah',
    pieceStyles: {
      default: 'Lalai',
      internationalized: 'Antarabangsa',
    },
  },

  // Mesej UCI
  uci: {
    depth: 'Kedalaman',
    seldepth: 'SelDepth',
    multipv: 'MultiPV',
    score: 'Skor',
    mate: 'Mate',
    wdl: 'M/S/K',
    nodes: 'Nod',
    nps: 'NPS',
    hashfull: 'HashFull',
    tbhits: 'TBHits',
    time: 'Masa',
    pv: 'PV',
    checkmate: 'Checkmate! Tiada langkah tersedia.',
    bestMove: 'Langkah Terbaik: {move}',
    noMoves: 'Tiada langkah tersedia',
    engineReady: 'Enjin sedia',
  },

  // Pengesahan Operasi Permainan
  gameConfirm: {
    clearHistoryTitle: 'Padam Sejarah Berikutnya',
    clearHistoryMessage:
      'Anda membuat langkah dalam posisi sejarah. Ini akan memadamkan semua sejarah langkah berikutnya. Adakah anda pasti mahu meneruskan?',
    confirm: 'Sahkan',
    cancel: 'Batal',
  },

  // Pemberitahuan Tamat Permainan
  gameEnd: {
    humanWins: 'Tahniah! Anda Menang!',
    aiWins: 'Permainan Tamat - AI Menang',
    humanWinsMessage:
      'Anda telah mengalahkan AI! AI tidak mempunyai langkah sah yang tinggal.',
    aiWinsMessage:
      'AI telah memenangi permainan ini. Anda tidak mempunyai langkah sah yang tinggal.',
    ok: 'OK',
  },

  // Mod Manusia vs AI
  humanVsAi: {
    title: 'Mod Manusia vs AI',
    selectAiSide: 'Pilih Pihak AI',
    redAiBlackHuman: 'AI Merah, Manusia Hitam',
    blackAiRedHuman: 'AI Hitam, Manusia Merah',
    options: 'Pilihan',
    showEngineAnalysis: 'Tunjukkan Analisis Enjin',
    engineAnalysisHint:
      'Apabila diaktifkan, anda boleh melihat hasil analisis, tetapi ia tidak menjejaskan peraturan permainan',
    ponderNote: 'Tentang Ponder:',
    ponderUnifiedHint:
      'Ponder menggunakan tetapan global, yang boleh diubah dalam bar sisi dalam mod biasa',
    rulesTitle: 'Peraturan Permainan',
    rule1: 'Mod pusing rawak dikuatkuasakan secara automatik',
    rule2: 'Anda hanya boleh melihat buah gelap yang anda tangkap dari AI',
    rule3: 'AI hanya boleh melihat buah gelap yang ia tangkap dari anda',
    rule4: 'Pertempuran maklumat terhad mengikut peraturan standard Jieqi',
    startGame: 'Mula Permainan',
  },

  // Buku Pembukaan
  openingBook: {
    title: 'Buku Pembukaan',
    currentMoves: 'Langkah Posisi Semasa',
    manage: 'Urus',
    settings: 'Tetapan',
    statistics: 'Statistik',
    noMoves: 'Tiada langkah buku pembukaan untuk posisi semasa',
    foundMoves: 'Menjumpai {count} langkah',
    positions: 'Posisi',
    move: 'Langkah',
    priority: 'Keutamaan',
    stats: 'M/S/K',
    allowed: 'Dibenarkan',
    comment: 'Komen',
    addPosition: 'Tambah Posisi Semasa',
    editMove: 'Edit Langkah',
    addMove: 'Tambah Langkah',
    moveUci: 'Langkah UCI',
    moveRequired: 'Langkah diperlukan',
    invalidUci: 'Format UCI tidak sah',
    invalidMoveFormat:
      'Format langkah tidak sah, sila gunakan format UCI (contoh: a1a2) atau format notasi Cina',
    invalidLegalMove: 'Langkah ini bukan langkah yang sah untuk posisi semasa',
    wins: 'Menang',
    draws: 'Seri',
    losses: 'Kalah',
    import: 'Import',
    export: 'Eksport',
    selectFile: 'Pilih Fail',
    format: 'Format',
    dangerZone: 'Zon Bahaya',
    clearAll: 'Padam Semua',
    confirmClear: 'Sahkan Padam',
    clearWarning:
      'Ini akan memadamkan semua entri dalam buku pembukaan secara kekal. Tindakan ini tidak boleh dibuat asal.',
    confirmDelete: 'Sahkan Penghapusan',
    deleteWarning:
      'Adakah anda pasti mahu menghapus langkah ini? Tindakan ini tidak boleh dibuat asal.',
    enableInGame: 'Dayakan Buku Pembukaan dalam Permainan',
    showMoves: 'Tunjukkan Langkah Buku Pembukaan',
    show: 'Tunjuk',
    preferHighPriority: 'Utamakan langkah keutamaan tinggi',
    totalPositions: 'Jumlah Posisi',
    totalMoves: 'Jumlah Langkah',
    allowedMoves: 'Langkah Dibenarkan',
    disallowedMoves: 'Langkah Dilarang',
    refreshStats: 'Muat Semula Statistik',
    refresh: 'Muat Semula',
    getBookMove: 'Main Langkah dari Buku',
    initializing: 'Memulakan...',
    showLess: 'Tunjuk Kurang',
    showMore: 'Tunjuk Lebih',
    addMarkedMoves: 'Tambah Langkah Lukisan',
    addMarkedMovesTitle: 'Tambah Langkah Lukisan ke Buku Pembukaan',
    markedMovesCount: 'Menjumpai {count} langkah lukisan yang sah',
    noMarkedMoves: 'Tiada langkah lukisan yang sah dijumpai',
    batchSettings: 'Tetapan Kelompok',
  },
}
