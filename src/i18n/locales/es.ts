export default {
  // General
  common: {
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    save: 'Guardar',
    open: 'Abrir',
    refresh: 'Actualizar',
    reset: 'Restablecer',
    clear: 'Borrar',
    apply: 'Aplicar',
    execute: 'Ejecutar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    info: 'Info',
    delete: 'Eliminar',
    add: 'Añadir',
    actions: 'Acciones',
    required: 'Este campo es obligatorio',
  },

  // Barra de herramientas superior
  toolbar: {
    newGame: 'Nueva partida',
    copyFen: 'Copiar FEN',
    inputFen: 'Introducir FEN',
    editPosition: 'Editar posición',
    uciSettings: 'Ajustes UCI',
    analysisParams: 'Parámetros de análisis',
    saveNotation: 'Guardar notación',
    openNotation: 'Abrir notación',
    interfaceSettings: 'Ajustes de interfaz',
    gameTitle: 'Partida de Jieqi',
    variation: 'Prohibir jugada actual',
    analyzeDrawings: 'Analizar dibujos',
    noDrawingMoves: 'No hay jugadas dibujadas legales',
    noMoreVariations: 'No hay más variantes disponibles',
    darkMode: 'Modo oscuro',
    lightMode: 'Modo claro',
    viewPasteNotation: 'Ver/Pegar notación',
    reviewAnalysis: 'Revisar análisis',
    openingBook: 'Libro de aperturas',
  },

  // Diálogo de opciones UCI
  uciOptions: {
    title: 'Opciones del motor UCI',
    loadingText: 'Cargando opciones del motor...',
    noEngineLoaded: 'No hay ningún motor cargado actualmente.',
    pleaseLoadEngineFirst:
      'Por favor, cargue un motor primero para configurar sus opciones.',
    loadEngine: 'Cargar motor',
    noOptionsAvailable: 'No hay opciones UCI disponibles para este motor.',
    refreshOptions: 'Actualizar opciones',
    range: 'Rango',
    execute: 'Ejecutar',
    resetToDefaults: 'Restaurar valores por defecto',
    clearSettings: 'Borrar configuración',
    confirmClearSettings:
      '¿Está seguro de que desea borrar todas las configuraciones de opciones UCI para el motor actual? Esta acción no se puede deshacer.',
    settingsCleared: 'Configuración de opciones UCI borrada',
    // Descripciones de opciones UCI
    optionDescriptions: {
      'Debug Log File':
        'El archivo de depuración que registra la comunicación entre el motor y la interfaz.',
      Threads:
        'Número de hilos utilizados para la búsqueda del motor. Se recomienda establecer esto al número de hilos disponibles en el sistema menos uno o dos.',
      Hash: 'Tamaño de la tabla hash del motor (en MB). Se recomienda establecer este valor al total de memoria disponible menos 1 o 2 GiB.',
      'Clear Hash': 'Limpia la tabla hash.',
      MultiPV:
        'Multi-Principal Variation. Permite al motor mostrar múltiples jugadas recomendadas. Se recomienda establecerlo en 1. Si es mayor, la calidad de la mejor jugada puede disminuir porque los recursos se dividen.',
      NumaPolicy:
        'Vincula los hilos a nodos NUMA específicos para asegurar la ejecución. Mejora el rendimiento en sistemas con múltiples CPUs o arquitecturas complejas.',
      Ponder: 'Permite al motor pensar (Ponder) durante el turno del oponente.',
      'Move Overhead':
        'Asume un retraso de x milisegundos debido a la red y la sobrecarga de la GUI. Útil para evitar pérdidas por tiempo.',
      nodestime:
        'Indica al motor que use el número de nodos buscados en lugar del tiempo real para calcular el tiempo transcurrido. Útil para pruebas de motores.',
      UCI_ShowWDL:
        'Si se habilita, muestra estadísticas aproximadas WDL (Victoria/Empate/Derrota) en la salida del motor.',
      EvalFile:
        'El nombre del archivo de parámetros de evaluación NNUE. Dependiendo de la GUI, puede requerir la ruta completa.',
    },
  },

  // Diálogo de revisión de análisis
  reviewDialog: {
    title: 'Revisión de análisis',
    movetime: 'Tiempo por jugada (ms)',
    progress: 'Progreso: {current}/{total}',
  },

  // Terminal UCI
  uciTerminal: {
    title: 'Terminal UCI',
    enterCommand: 'Introducir comando UCI...',
    sendCommand: 'Enviar comando',
    noEngineLoaded: 'No hay ningún motor cargado actualmente.',
    pleaseLoadEngineFirst:
      'Por favor, cargue un motor primero para usar la terminal.',
    quickCommands: 'Comandos rápidos',
    clear: 'Limpiar terminal',
    commandHistory: 'Historial de comandos',
    terminalOutput: 'Salida de terminal',
  },

  // Diálogo de tiempo
  timeDialog: {
    title: 'Parámetros de análisis del motor',
    movetime: 'Tiempo por jugada (ms)',
    maxThinkTime: 'Tiempo máx. de pensamiento (ms)',
    maxDepth: 'Profundidad máx.',
    maxNodes: 'Nodos máx.',
    analysisMode: 'Modo de análisis',
    advanced: 'Script avanzado',
    resetToDefaults: 'Restaurar valores por defecto',
    clearSettings: 'Borrar configuración',
    confirmClearSettings:
      '¿Está seguro de que desea borrar todos los parámetros de análisis? Esta acción no se puede deshacer.',
    settingsCleared: 'Parámetros de análisis borrados',
    analysisModes: {
      movetime: 'Analizar por tiempo por jugada',
      maxThinkTime: 'Analizar por tiempo máx. de pensamiento',
      depth: 'Analizar por profundidad',
      nodes: 'Analizar por nodos',
      advanced: 'Modo de programación avanzado',
    },
    advancedHint1:
      'Soporta programación simple: asignación, aritmética, operaciones bit a bit, condiciones if',
    advancedHint2:
      'Variables disponibles: movetime, depth, nodes, maxThinkTime, prev',
    advancedPlaceholder: 'Escriba su script aquí...',
    advancedExamples: {
      title: 'Código de ejemplo',
      basic: 'Ajustes básicos',
      basicCode: `depth=20
movetime=1000
nodes=2000000`,
      conditional: 'Control condicional',
      conditionalCode: `if (!prev.prev.exists()){
  movetime=1000
} else {
  movetime=prev.prev.movetime / 1.05
}`,
      scoreBased: 'Ajuste basado en puntuación',
      scoreBasedCode: `if (-prev.score < -300){
  movetime = 4000
} else if (-prev.score < -200) {
  movetime = 3000
} else {
  movetime = 2000
}`,
      variables: 'Variables disponibles',
      variablesDesc: `prev.exists() - Comprueba si la jugada anterior existe
prev.movetime - Tiempo solicitado de la jugada anterior
prev.depth - Profundidad de búsqueda de la jugada anterior
prev.nodes - Nodos de búsqueda de la jugada anterior
prev.score - Puntuación de la jugada anterior
prev.timeUsed - Tiempo real usado por el motor en la jugada anterior
prev.prev - La jugada ante-anterior (soporta anidación infinita)`,
    },
  },

  // Editor de posición
  positionEditor: {
    title: 'Editor de posición',
    flipBoard: '🔄 Voltear tablero',
    mirrorLeftRight: '↔️ Espejo Izq-Der',
    switchSide: '⚡ Cambiar turno',
    resetPosition: '🔄 Reiniciar posición',
    clearPosition: '🔄 Limpiar posición',
    recognizeImage: '🖼️ Reconocer imagen',
    addPieces: 'Añadir piezas',
    revealedPieces: 'Piezas reveladas',
    darkPieces: 'Piezas oscuras (ocultas)',
    darkPiece: 'Oscura',
    selectedPosition: 'Posición seleccionada',
    selectedPiece: 'Pieza seleccionada',
    clickToPlace: 'Clic para colocar',
    piece: 'Pieza',
    currentSide: 'Turno actual',
    redToMove: 'Mueven Rojas',
    blackToMove: 'Mueven Negras',
    imageRecognition: 'Reconocimiento de imagen',
    clickOrDragImage: 'Clic o arrastrar imagen aquí',
    supportedFormats: 'Soporta JPG, PNG y otros formatos',
    startRecognition: 'Iniciar reconocimiento',
    applyResults: 'Aplicar resultados',
    recognitionResults: 'Resultados del reconocimiento',
    imageRecognitionStatus: {
      loadingModel: 'Cargando modelo...',
      modelLoadedSuccessfully: 'Modelo cargado exitosamente',
      modelLoadingFailed: 'Error al cargar modelo: {error}',
      loadingImage: 'Cargando imagen...',
      preprocessingImage: 'Preprocesando imagen...',
      runningModelInference: 'Ejecutando inferencia del modelo...',
      postProcessingResults: 'Post-procesando resultados...',
      recognitionCompleted: '¡Reconocimiento completado!',
      processingFailed: 'Error de procesamiento: {error}',
      unknownError: 'Error desconocido',
    },
    showBoundingBoxes: 'Mostrar cuadros delimitadores',
    preserveDarkPools: 'Preservar reservas de piezas oscuras',
    validationStatus: {
      normal: 'Normal',
      error: 'Error: Discrepancia en cantidad de piezas oscuras',
      noRedKing: 'Error: No hay Rey rojo',
      noBlackKing: 'Error: No hay Rey negro',
      kingOutOfPalace: 'Error: Rey fuera del palacio',
      kingFacing: 'Error: Reyes enfrentados',
      inCheck: 'Error: El bando actual está en jaque',
      tooManyPieces: 'Error: Demasiadas piezas de este tipo',
      tooManyTotalPieces: 'Error: El total de piezas excede 16',
      darkPieceInvalidPosition: 'Error: Pieza oscura en posición inválida',
      duplicatePosition: 'Error: Posiciones de piezas duplicadas',
    },
    cancel: 'Cancelar',
    applyChanges: 'Aplicar cambios',
    clear: 'Limpiar',
    pieces: {
      red_chariot: 'Carro Rojo',
      red_horse: 'Caballo Rojo',
      red_elephant: 'Elefante Rojo',
      red_advisor: 'Consejero Rojo',
      red_king: 'Rey Rojo',
      red_cannon: 'Cañón Rojo',
      red_pawn: 'Peón Rojo',
      black_chariot: 'Carro Negro',
      black_horse: 'Caballo Negro',
      black_elephant: 'Elefante Negro',
      black_advisor: 'Consejero Negro',
      black_king: 'Rey Negro',
      black_cannon: 'Cañón Negro',
      black_pawn: 'Peón Negro',
      unknown: 'Pieza Oscura',
      red_unknown: 'Oscura Roja',
      black_unknown: 'Oscura Negra',
    },
  },

  // Entrada FEN
  fenInput: {
    title: 'Introducir cadena FEN',
    placeholder: 'Por favor introduzca la cadena FEN...',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
  },

  // Diálogo de texto de notación JSON
  notationTextDialog: {
    title: 'Ver / Pegar Notación (JSON)',
    placeholder:
      'El JSON de la notación actual aparecerá aquí. Puede copiarlo o pegar un JSON de notación y hacer clic en "Aplicar" para cargarlo.',
    copy: 'Copiar JSON',
    apply: 'Aplicar',
  },

  // Aviso de volteo
  flipPrompt: {
    title: 'Aviso de volteo',
    message: 'Por favor seleccione la pieza a voltear',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
  },

  // Diálogo Acerca de
  about: {
    title: 'Acerca de JieqiBox',
    version: 'Versión',
    description:
      'Una aplicación de escritorio moderna para el análisis y juego de Jieqi, construida con Tauri y Vue 3.',
    author: 'Autor',
    license: 'Licencia',
    github: 'GitHub',
    downloadLatest: 'Descargar última versión',
    viewLicense: 'Ver detalles de la licencia',
    credits: 'Créditos',
    piecesCredit: 'Diseño de piezas: Couch Tomato',
    checkUpdate: 'Buscar actualizaciones',
    checkingUpdate: 'Buscando actualizaciones...',
    updateAvailable: 'Nueva versión disponible: {version}',
    upToDate: 'Estás usando la última versión.',
    updateError: 'Error al buscar actualizaciones.',
  },

  // Barra lateral de análisis
  analysis: {
    title: 'Análisis del motor',
    startAnalysis: 'Iniciar análisis',
    stopAnalysis: 'Detener análisis',
    engineNotLoaded: 'Motor no cargado',
    loadEngine: 'Cargar motor',
    loadEngineSaf: 'Cargar motor (SAF)',
    analysisResults: 'Resultados',
    bestMove: 'Mejor jugada',
    score: 'Puntuación',
    depth: 'Profundidad',
    nodes: 'Nodos',
    time: 'Tiempo',
    pv: 'Variante Principal (VP)',
    engineLoaded: 'Motor cargado',
    playBestMove: 'Jugar mejor jugada',
    undoMove: 'Deshacer jugada',
    redAiOn: 'IA Roja (On)',
    redAiOff: 'IA Roja (Off)',
    blackAiOn: 'IA Negra (On)',
    blackAiOff: 'IA Negra (Off)',
    freeFlipMode: 'Modo volteo libre',
    darkPiecePool: 'Reserva de piezas oscuras (capturadas)',
    captureHistory: 'Historial de capturas',
    myCaptured: 'Mis capturas',
    opponentCaptured: 'Capturas del oponente',
    noCaptured: 'Ninguna',
    engineAnalysis: 'Análisis de motor',
    notation: 'Notación',
    moveComments: 'Comentarios',
    noComment: 'Sin comentario',
    enterComment: 'Escribir comentario...',
    saveComment: 'Guardar',
    cancelComment: 'Cancelar',
    opening: 'Apertura',
    adjustment: 'Ajuste',
    engineLog: 'Registro del motor',
    uciTerminal: 'Terminal UCI',
    about: 'Acerca de',
    undockPanel: 'Desacoplar panel',
    dockPanel: 'Acoplar panel',
    restorePanels: 'Restaurar diseño',
    flipBoard: 'Voltear tablero',
    flipBoardBack: 'Restaurar orientación',
    ponderMode: 'Modo Ponder',
    selectEngine: 'Seleccionar motor',
    manageEngines: 'Gestionar',
    unloadEngine: 'Descargar motor',
    noEngineLoaded: 'No hay ningún motor cargado.',
    // Modo torneo
    enterMatchMode: 'Modo Torneo',
    exitMatchMode: 'Salir Modo Torneo',
    // Modo Humano vs IA
    enterHumanVsAiMode: 'Humano vs IA',
    exitHumanVsAiMode: 'Salir Humano vs IA',
    startMatch: 'Iniciar duelo',
    stopMatch: 'Detener duelo',
    jaiSettings: 'Opciones de duelo',
    matchInfo: 'Información del duelo',
    multiPv: 'Multi PV',
    fullLine: 'Línea completa',
    matchStatus: 'Estado',
    gameProgress: 'Progreso',
    engineInfo: 'Motor',
    lastResult: 'Resultado',
    matchWld: 'V/E/D',
    eloRating: 'Rating Elo',
    eloCalculator: 'Calculadora Elo',
    matchEngines: 'Motores',
    running: 'Ejecutando',
    stopped: 'Detenido',
    noMatchEngine: 'No hay motor de duelo cargado',
    noAnalysis: 'Sin análisis',
    // Índice de suerte
    luckIndex: 'Índice de suerte',
    luckIndexBasedOnFlipSequence: 'Estimado basado en la secuencia de volteo',
    blackFavor: 'Favor Negras',
    redFavor: 'Favor Rojas',
    currentValue: 'Valor actual',
    // Botones de navegación
    goToFirst: 'Ir a la primera jugada',
    goToPrevious: 'Jugada anterior',
    goToNext: 'Jugada siguiente',
    goToLast: 'Ir a la última jugada',
    play: 'Reproducir',
    pause: 'Pausa',
    annotateMove: 'Anotar jugada',
    // Anotaciones
    brilliant: 'Brillante',
    good: 'Buena',
    interesting: 'Interesante',
    dubious: 'Dudosa',
    mistake: 'Error',
    blunder: 'Error grave',
    clear: 'Borrar',
  },

  // Gestor de motores
  engineManager: {
    title: 'Gestor de motores',
    addEngine: 'Añadir motor',
    addEngineAndroid: 'Añadir motor (SAF)',
    editEngine: 'Editar motor',
    engineName: 'Nombre del motor',
    enginePath: 'Ruta del motor',
    arguments: 'Argumentos de línea de comandos',
    actions: 'Acciones',
    confirmDeleteTitle: 'Confirmar eliminación',
    confirmDeleteMessage:
      '¿Está seguro de que desea eliminar el motor "{name}"? Esta acción no se puede deshacer.',
    promptEngineName: 'Por favor introduzca un nombre único para el motor:',
    promptEngineArgs:
      'Por favor introduzca argumentos de línea de comandos (opcional):',
    promptHasNnue: '¿Este motor usa archivos NNUE? (y/n):',
    promptNnueFile: 'Por favor seleccione el archivo NNUE para el motor:',
    nameExists: 'Este nombre ya existe. Por favor use un nombre único.',
    engineAddedSuccess: '¡El motor {name} se añadió correctamente!',
  },

  // Editor de opciones UCI guardadas
  uciEditor: {
    title: 'Opciones UCI guardadas',
    noSaved:
      'Aún no hay opciones guardadas para este motor. Añada elementos abajo para preconfigurar antes de cargar el motor.',
    addOption: 'Añadir opción',
    optionName: 'Nombre de opción',
    optionValue: 'Valor',
    type: 'Tipo',
    typeString: 'Cadena',
    typeNumber: 'Número',
    typeSwitch: 'Interruptor',
    typeCombo: 'Lista (Combo)',
    typeButton: 'Botón',
    willExecute: 'Ejecutar al cargar',
    noExecute: 'No ejecutar',
  },

  // Opciones JAI
  jaiOptions: {
    title: 'Opciones de duelo JAI',
    loadingText: 'Cargando opciones del motor...',
    noEngineLoaded: 'No hay motor de duelo cargado.',
    pleaseLoadEngineFirst:
      'Por favor cargue un motor de duelo primero para configurar sus opciones.',
    loadEngine: 'Cargar motor',
    noOptionsAvailable: 'No hay opciones JAI disponibles para este motor.',
    refreshOptions: 'Actualizar opciones',
    range: 'Rango',
    execute: 'Ejecutar',
    resetToDefaults: 'Restablecer valores',
    clearSettings: 'Borrar configuración',
    confirmClearSettings:
      '¿Está seguro de que desea borrar todas las configuraciones JAI? Esta acción no se puede deshacer.',
    settingsCleared: 'Configuración JAI borrada',
    // Descripciones de opciones JAI
    optionDescriptions: {
      Engine1Path:
        'La ruta completa al primer ejecutable de motor Jieqi compatible con UCI.',
      Engine1Options:
        'Una cadena de comandos UCI "setoption" para el Motor 1. Formato: "name <Nombre> value <Valor>". Separados por espacios. Ejemplo: "name Threads value 4 name Hash value 256"',
      Engine2Path:
        'La ruta completa al segundo ejecutable de motor Jieqi compatible con UCI.',
      Engine2Options:
        'Una cadena de comandos UCI "setoption" para el Motor 2. Ver "Engine1Options" para el formato.',
      TotalRounds:
        'El número de pares de partidas a jugar. El total de partidas será "TotalRounds * 2", ya que los motores intercambian colores.',
      Concurrency: 'El número de partidas a ejecutar en paralelo.',
      BookFile:
        'Ruta al archivo de libro de aperturas (FENs). Se elige una FEN al azar por ronda. Si está vacío o es inválido, se usa la posición inicial.',
      MainTimeMs:
        'El tiempo de pensamiento base para cada jugador por partida (ms).',
      IncTimeMs: 'El incremento de tiempo añadido tras cada jugada (ms).',
      TimeoutBufferMs:
        'Un periodo de gracia (ms) para la sobrecarga de procesos. Solo se pierde por tiempo si el reloj baja de "-(TimeoutBufferMs)".',
      Logging:
        'Si se habilita ("true"), el motor de duelo creará registros detallados para cada proceso.',
      SaveNotation:
        'Interruptor para guardar archivos de notación de cada partida.',
      SaveNotationDir:
        'Directorio donde se guardarán los archivos de notación.',
      TimeControl: 'Configuración de control de tiempo para cada motor.',
      AdjudicationRule: 'Reglas para adjudicar tablas o posiciones decisivas.',
    },
  },

  // Mensajes JAI
  jai: {
    engineReady: 'Motor de duelo listo',
    matchStarted: 'Duelo iniciado',
    matchStopped: 'Duelo detenido',
    gameProgress: 'Partida {current} de {total}',
    matchResult: 'Resultado del duelo: {result}',
  },

  // Calculadora Elo
  eloCalculator: {
    title: 'Calculadora Elo',
    inputSection: 'Resultados del duelo',
    wins: 'Victorias',
    losses: 'Derrotas',
    draws: 'Empates',
    totalGames: 'Total partidas',
    resultsFormat: 'Formato de resultados',
    formatWDL: 'WDL (Victorias/Empates/Derrotas)',
    formatPTNML: 'PTNML (Pares)',
    ptnml: {
      ll: 'LL (Derrota+Derrota)',
      lddl: 'LD+DL (Derr.+Empate)',
      center: 'LW+DD+WL (Intercambio/Empates)',
      dwwd: 'DW+WD (Empate+Vict.)',
      ww: 'WW (Vict.+Vict.)',
    },
    resultsSection: 'Rendimiento Elo',
    performance: 'Diferencia Elo (con error 95%)',
    confidenceInterval: 'Intervalo de confianza 95%',
    scoreRate: 'Tasa de puntuación',
    los: 'LOS (Probabilidad de superioridad)',
    drawRatio: 'Tasa de empates',
    standardError: 'Error estándar',
    noResults: 'Introduzca resultados para ver cálculos.',
    basicRequiresWDL: 'El modo básico requiere entrada WDL.',
    close: 'Cerrar',
    basicMode: 'Básico',
  },

  // Mensajes de error
  errors: {
    saveNotationFailed: 'Error al guardar notación',
    openNotationFailed: 'Error al abrir notación',
    engineNotLoaded: 'Motor no cargado, no se puede enviar comando',
    engineSendUnavailable: 'Método de envío del motor no disponible',
    redDarkPiecesMismatch:
      'Error: Rojas {darkCount} oscuras > {poolCount} reserva',
    blackDarkPiecesMismatch:
      'Error: Negras {darkCount} oscuras > {poolCount} reserva',
    pieceCountExceeded: 'Error: ¡Excedido número total de {pieceName}!',
    engineLoadFailed: 'Error al cargar motor {name}: {error}',
    jaiEngineLoadFailed: 'Error al cargar motor JAI {name}: {error}',
    engineUnloadFailed: 'Error al descargar motor',
    failedToOpenFileSelector: 'Error al abrir selector de archivos',
    failedToProcessEngine: 'Error al procesar archivo del motor',
    invalidFenFormat: 'Formato FEN inválido',
  },

  // Parte inferior del tablero
  chessboard: {
    copyFen: 'Copiar FEN',
    pasteFen: 'Pegar FEN',
    inputFen: 'Introducir FEN',
    inputCopyFen: 'Introducir/Copiar FEN',
    newGame: 'Nueva partida',
    copied: '✓ Copiado',
    clearDrawings: 'Borrar dibujos',
  },

  // Gráfico de evaluación
  evaluationChart: {
    title: 'Gráfico de evaluación',
    rightClickHint: 'Clic derecho para opciones',
    longPressHint: 'Mantener presionado para opciones',
    showMoveLabels: 'Mostrar etiquetas',
    linearYAxis: 'Eje Y lineal',
    showOnlyLines: 'Solo líneas',
    blackPerspective: 'Perspectiva de Negras',
    clampYAxis: 'Limitar Eje Y',
    clampValue: 'Valor límite',
    colorScheme: 'Esquema de colores',
    redGreen: 'Rojo-Verde',
    blueOrange: 'Azul-Naranja',
    showSeparateLines: 'Líneas separadas Rojas/Negras',
    opening: 'Apertura',
    noData: 'Sin datos de análisis',
    newGame: 'Nueva partida',
    copied: '✓ Copiado',
    saveChartImage: 'Guardar imagen',
    chartImageSaved: 'Imagen guardada en {path}',
    saveChartImageFailed: 'Error al guardar imagen',
    viewMode: 'Modo de vista',
    evaluation: 'Evaluación',
    time: 'Tiempo',
    depth: 'Profundidad',
  },

  // Selección de idioma
  languages: {
    current: 'Idioma actual',
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

  // Ajustes de interfaz
  interfaceSettings: {
    title: 'Ajustes de interfaz',
    showCoordinates: 'Mostrar coordenadas',
    parseUciInfo: 'Analizar UCI Info',
    showAnimations: 'Animación de jugadas',
    showPositionChart: 'Mostrar gráfico de evaluación',
    showEvaluationBar: 'Mostrar barra de evaluación',
    darkMode: 'Modo oscuro',
    autosave: 'Autoguardado en Autosave.json',
    useNewFenFormat: 'Usar nuevo formato FEN',
    engineLogLineLimit: 'Límite de líneas log del motor',
    validationTimeout: 'Tiempo de espera validación motor (ms)',
    showChineseNotation: 'Mostrar notación china',
    showLuckIndex: 'Mostrar índice de suerte',
    showArrows: 'Mostrar flechas',
    enableSoundEffects: 'Habilitar efectos de sonido',
    soundVolume: 'Volumen',
    pieceStyle: 'Estilo de pieza',
    pieceStyles: {
      default: 'Por defecto',
      internationalized: 'Internacionalizado',
    },
  },

  // Mensajes UCI
  uci: {
    depth: 'Prof.',
    seldepth: 'SelProf.',
    multipv: 'MultiPV',
    score: 'Punt.',
    mate: 'Mate',
    wdl: 'V/E/D',
    nodes: 'Nodos',
    nps: 'NPS',
    hashfull: 'HashFull',
    tbhits: 'TBHits',
    time: 'Tiempo',
    pv: 'VP',
    checkmate: '¡Jaque mate! No hay jugadas disponibles.',
    bestMove: 'Mejor jugada: {move}',
    noMoves: 'No hay jugadas disponibles',
    engineReady: 'Motor listo',
  },

  // Confirmación de operaciones de juego
  gameConfirm: {
    clearHistoryTitle: 'Borrar historial posterior',
    clearHistoryMessage:
      'Está realizando una jugada en una posición histórica. Esto borrará todo el historial de jugadas posteriores. ¿Desea continuar?',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
  },

  // Notificaciones de fin de juego
  gameEnd: {
    humanWins: '¡Felicidades! ¡Ha ganado!',
    aiWins: 'Juego terminado - Gana la IA',
    humanWinsMessage: '¡Ha derrotado a la IA! La IA no tiene jugadas legales.',
    aiWinsMessage:
      'La IA ha ganado esta partida. Usted no tiene jugadas legales.',
    ok: 'Aceptar',
  },

  // Modo Humano vs IA
  humanVsAi: {
    title: 'Modo Humano vs IA',
    selectAiSide: 'Seleccionar bando de IA',
    redAiBlackHuman: 'IA Roja, Humano Negro',
    blackAiRedHuman: 'IA Negra, Humano Rojo',
    options: 'Opciones',
    showEngineAnalysis: 'Mostrar análisis del motor',
    engineAnalysisHint:
      'Si se habilita, puede ver los resultados del análisis, pero no afecta las reglas del juego',
    ponderNote: 'Sobre Ponder:',
    ponderUnifiedHint:
      'Ponder usa la configuración global, que se puede alternar en la barra lateral en modo normal',
    rulesTitle: 'Reglas del juego',
    rule1: 'El modo de volteo aleatorio se fuerza automáticamente',
    rule2: 'Solo puede ver las piezas oscuras que captura de la IA',
    rule3: 'La IA solo puede ver las piezas oscuras que captura de usted',
    rule4: 'Batalla de información limitada según las reglas estándar de Jieqi',
    startGame: 'Iniciar juego',
  },

  // Libro de aperturas
  openingBook: {
    title: 'Libro de aperturas',
    currentMoves: 'Jugadas en posición actual',
    manage: 'Gestionar',
    settings: 'Configuración',
    statistics: 'Estadísticas',
    noMoves: 'No hay jugadas de libro para esta posición',
    foundMoves: '{count} jugadas encontradas',
    positions: 'Posiciones',
    move: 'Jugada',
    priority: 'Prioridad',
    stats: 'V/E/D',
    allowed: 'Permitido',
    comment: 'Comentario',
    addPosition: 'Añadir posición actual',
    editMove: 'Editar jugada',
    addMove: 'Añadir jugada',
    moveUci: 'Jugada UCI',
    moveRequired: 'La jugada es obligatoria',
    invalidUci: 'Formato UCI inválido',
    invalidMoveFormat:
      'Formato de jugada inválido, use formato UCI (ej: a1a2) o notación china',
    invalidLegalMove: 'Esta jugada no es legal en la posición actual',
    wins: 'Victorias',
    draws: 'Empates',
    losses: 'Derrotas',
    import: 'Importar',
    export: 'Exportar',
    selectFile: 'Seleccionar archivo',
    format: 'Formato',
    dangerZone: 'Zona de peligro',
    clearAll: 'Borrar todo',
    confirmClear: 'Confirmar borrado',
    clearWarning:
      'Esto eliminará permanentemente todas las entradas del libro de aperturas. Esta acción no se puede deshacer.',
    confirmDelete: 'Confirmar eliminación',
    deleteWarning:
      '¿Está seguro de que desea eliminar esta jugada? Esta acción no se puede deshacer.',
    enableInGame: 'Habilitar libro en el juego',
    showMoves: 'Mostrar jugadas del libro',
    show: 'Mostrar',
    preferHighPriority: 'Preferir alta prioridad',
    totalPositions: 'Total posiciones',
    totalMoves: 'Total jugadas',
    allowedMoves: 'Jugadas permitidas',
    disallowedMoves: 'Jugadas prohibidas',
    refreshStats: 'Actualizar estadísticas',
    refresh: 'Actualizar',
    getBookMove: 'Jugar movimiento del libro',
    initializing: 'Inicializando...',
    showLess: 'Ver menos',
    showMore: 'Ver más',
    addMarkedMoves: 'Añadir jugadas dibujadas',
    addMarkedMovesTitle: 'Añadir jugadas dibujadas al libro',
    markedMovesCount: 'Encontradas {count} jugadas legales dibujadas',
    noMarkedMoves: 'No se encontraron jugadas legales dibujadas',
    batchSettings: 'Configuración por lotes',
  },
}
