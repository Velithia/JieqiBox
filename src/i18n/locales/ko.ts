export default {
  // 일반
  common: {
    confirm: '확인',
    cancel: '취소',
    close: '닫기',
    save: '저장',
    open: '열기',
    refresh: '새로 고침',
    reset: '초기화',
    clear: '지우기',
    apply: '적용',
    execute: '실행',
    loading: '로딩 중...',
    error: '오류',
    success: '성공',
    warning: '경고',
    info: '정보',
    delete: '삭제',
    add: '추가',
    actions: '작업',
    required: '필수 항목입니다',
  },

  // 상단 도구 모음
  toolbar: {
    newGame: '새 게임',
    copyFen: 'FEN 복사',
    inputFen: 'FEN 입력',
    editPosition: '기물 배치 편집',
    uciSettings: 'UCI 설정',
    analysisParams: '분석 매개변수',
    saveNotation: '기보 저장',
    openNotation: '기보 열기',
    interfaceSettings: '인터페이스 설정',
    gameTitle: '제치(Jieqi) 대국',
    variation: '현재 수 금지',
    analyzeDrawings: '그려진 수 분석',
    noDrawingMoves: '유효한 그려진 수가 없습니다',
    noMoreVariations: '더 이상 가능한 변화수가 없습니다',
    darkMode: '다크 모드',
    lightMode: '라이트 모드',
    viewPasteNotation: '기보 보기/입력',
    reviewAnalysis: '복기 분석',
    openingBook: '오프닝 북',
  },

  // UCI 옵션 대화 상자
  uciOptions: {
    title: 'UCI 엔진 옵션',
    loadingText: '엔진 옵션을 불러오는 중...',
    noEngineLoaded: '현재 로드된 엔진이 없습니다.',
    pleaseLoadEngineFirst: '옵션을 설정하려면 먼저 엔진을 로드하세요.',
    loadEngine: '엔진 로드',
    noOptionsAvailable: '이 엔진에 사용할 수 있는 UCI 옵션이 없습니다.',
    refreshOptions: '옵션 새로 고침',
    range: '범위',
    execute: '실행',
    resetToDefaults: '기본값으로 복원',
    clearSettings: '설정 지우기',
    confirmClearSettings:
      '현재 엔진의 모든 UCI 옵션 구성을 지우시겠습니까? 이 작업은 취소할 수 없습니다.',
    settingsCleared: 'UCI 옵션 구성이 삭제되었습니다',
    // UCI 옵션 설명
    optionDescriptions: {
      'Debug Log File':
        '엔진과 인터페이스 간의 통신을 기록하는 디버그 파일입니다.',
      Threads:
        '엔진 검색에 사용되는 스레드 수입니다. 시스템의 사용 가능한 최대 스레드 수에서 1~2개를 뺀 값으로 설정하는 것이 좋습니다.',
      Hash: '엔진의 해시 테이블 크기(MB 단위)입니다. 사용 가능한 총 메모리에서 1~2 GiB를 뺀 값으로 설정하는 것이 좋습니다.',
      'Clear Hash': '해시 테이블을 지웁니다.',
      MultiPV:
        '다중 주 변형(Multi-Principal Variation)입니다. 엔진이 여러 개의 추천 수를 표시할 수 있게 합니다. 1로 설정하는 것이 좋습니다. 1보다 크게 설정하면 다른 경로를 계산하는 데 자원이 분산되어 최적의 수에 대한 품질이 떨어질 수 있습니다.',
      NumaPolicy:
        '실행을 보장하기 위해 스레드를 특정 NUMA 노드에 바인딩합니다. 다중 CPU 또는 다중 NUMA 도메인이 있는 CPU 시스템에서 성능을 향상시킵니다.',
      Ponder: '상대방이 생각하는 동안 엔진이 백그라운드에서 생각하도록 합니다.',
      'Move Overhead':
        '네트워크 및 GUI 오버헤드로 인한 x 밀리초의 시간 지연을 가정합니다. 시간 초과 패배를 방지하는 데 유용합니다.',
      nodestime:
        '엔진이 경과 시간을 계산할 때 실제 시간이 아닌 검색된 노드 수를 사용하도록 지시합니다. 엔진 테스트에 유용합니다.',
      UCI_ShowWDL:
        '활성화된 경우, 엔진 출력에 대략적인 WDL(승/무/패) 통계를 표시합니다. 이 WDL 수치는 자체 대국 시뮬레이션의 평가 및 깊이를 기반으로 예상되는 게임 결과를 나타냅니다.',
      EvalFile:
        'NNUE 평가 매개변수 파일의 이름입니다. GUI에 따라 파일이 포함된 폴더/디렉토리의 전체 경로를 포함해야 할 수도 있습니다.',
    },
  },

  // 복기 분석 대화 상자
  reviewDialog: {
    title: '복기 분석',
    movetime: '수당 시간 (ms)',
    progress: '진행 상황: {current}/{total}',
  },

  // UCI 터미널 대화 상자
  uciTerminal: {
    title: 'UCI 터미널',
    enterCommand: 'UCI 명령 입력...',
    sendCommand: '명령 전송',
    noEngineLoaded: '현재 로드된 엔진이 없습니다.',
    pleaseLoadEngineFirst: '터미널을 사용하려면 먼저 엔진을 로드하세요.',
    quickCommands: '빠른 명령',
    clear: '터미널 지우기',
    commandHistory: '명령 기록',
    terminalOutput: '터미널 출력',
  },

  // 시간 설정 대화 상자
  timeDialog: {
    title: '엔진 분석 매개변수 설정',
    movetime: '수당 시간 (ms)',
    maxThinkTime: '최대 생각 시간 (ms)',
    maxDepth: '최대 깊이',
    maxNodes: '최대 노드 수',
    analysisMode: '분석 모드',
    advanced: '고급 스크립트',
    resetToDefaults: '기본값으로 복원',
    clearSettings: '설정 지우기',
    confirmClearSettings:
      '모든 분석 매개변수 설정을 지우시겠습니까? 이 작업은 취소할 수 없습니다.',
    settingsCleared: '분석 매개변수 설정이 삭제되었습니다',
    analysisModes: {
      movetime: '수당 시간으로 분석',
      maxThinkTime: '최대 생각 시간으로 분석',
      depth: '깊이로 분석',
      nodes: '노드 수로 분석',
      advanced: '고급 프로그래밍 모드',
    },
    advancedHint1: '간단한 프로그래밍 지원: 할당, 산술, 비트 연산, if 조건문',
    advancedHint2:
      '사용 가능한 변수: movetime, depth, nodes, maxThinkTime, prev',
    advancedPlaceholder: '여기에 스크립트를 작성하세요...',
    advancedExamples: {
      title: '예제 코드',
      basic: '기본 설정',
      basicCode: `depth=20
movetime=1000
nodes=2000000`,
      conditional: '조건부 제어',
      conditionalCode: `if (!prev.prev.exists()){
  movetime=1000
} else {
  movetime=prev.prev.movetime / 1.05
}`,
      scoreBased: '점수 기반 조정',
      scoreBasedCode: `if (-prev.score < -300){
  movetime = 4000
} else if (-prev.score < -200) {
  movetime = 3000
} else {
  movetime = 2000
}`,
      variables: '사용 가능한 변수 설명',
      variablesDesc: `prev.exists() - 이전 수가 존재하는지 확인
prev.movetime - 이전 수의 요청 시간
prev.depth - 이전 수의 검색 깊이
prev.nodes - 이전 수의 검색 노드 수
prev.score - 이전 수의 점수
prev.timeUsed - 이전 수의 실제 엔진 소요 시간
prev.prev - 전전 수 (무한 중첩 지원)`,
    },
  },

  // 기물 배치 편집 대화 상자
  positionEditor: {
    title: '기물 배치 편집',
    flipBoard: '🔄 상하 반전',
    mirrorLeftRight: '↔️ 좌우 대칭',
    switchSide: '⚡ 선후수 전환',
    resetPosition: '🔄 배치 초기화',
    clearPosition: '🔄 배치 지우기',
    recognizeImage: '🖼️ 이미지 인식',
    addPieces: '기물 추가',
    revealedPieces: '밝은 기물(명기)',
    darkPieces: '암기(뒤집힌 기물)',
    darkPiece: '암',
    selectedPosition: '선택된 위치',
    selectedPiece: '선택된 기물',
    clickToPlace: '위치를 클릭하여 배치',
    piece: '기물',
    currentSide: '현재 둘 차례',
    redToMove: '홍 선',
    blackToMove: '흑 선',
    imageRecognition: '이미지 인식',
    clickOrDragImage: '이미지를 클릭하여 업로드하거나 드래그하세요',
    supportedFormats: 'JPG, PNG 등의 이미지 형식 지원',
    startRecognition: '인식 시작',
    applyResults: '결과 적용',
    recognitionResults: '인식 결과',
    imageRecognitionStatus: {
      loadingModel: '모델 로딩 중...',
      modelLoadedSuccessfully: '모델 로드 성공',
      modelLoadingFailed: '모델 로드 실패: {error}',
      loadingImage: '이미지 로딩 중...',
      preprocessingImage: '이미지 전처리 중...',
      runningModelInference: '모델 추론 실행 중...',
      postProcessingResults: '결과 후처리 중...',
      recognitionCompleted: '인식 완료!',
      processingFailed: '처리 실패: {error}',
      unknownError: '알 수 없는 오류',
    },
    showBoundingBoxes: '경계 상자 표시',
    preserveDarkPools: '암기 풀 및 먹은 암기 풀 유지',
    validationStatus: {
      normal: '정상',
      error: '오류: 암기 수량 불일치',
      noRedKing: '오류: 홍수(장) 없음',
      noBlackKing: '오류: 흑장 없음',
      kingOutOfPalace: '오류: 장(왕)이 궁을 벗어남',
      kingFacing: '오류: 장군이 서로 마주봄 (왕장)',
      inCheck: '오류: 선수가 이미 장군 상태임',
      tooManyPieces: '오류: 해당 기물의 수가 너무 많음',
      tooManyTotalPieces: '오류: 총 기물 수가 16개를 초과함',
      darkPieceInvalidPosition: '오류: 암기 위치가 유효하지 않음',
      duplicatePosition: '오류: 기물 위치 중복',
    },
    cancel: '취소',
    applyChanges: '변경 사항 적용',
    clear: '지우기',
    pieces: {
      red_chariot: '홍차(車)',
      red_horse: '홍마(馬)',
      red_elephant: '홍상(相)',
      red_advisor: '홍사(仕)',
      red_king: '홍수(帥)',
      red_cannon: '홍포(炮)',
      red_pawn: '홍병(兵)',
      black_chariot: '흑차(車)',
      black_horse: '흑마(馬)',
      black_elephant: '흑상(象)',
      black_advisor: '흑사(士)',
      black_king: '흑장(將)',
      black_cannon: '흑포(砲)',
      black_pawn: '흑졸(卒)',
      unknown: '암기',
      red_unknown: '홍암기',
      black_unknown: '흑암기',
    },
  },

  // FEN 입력 대화 상자
  fenInput: {
    title: 'FEN 문자열 입력',
    placeholder: 'FEN 문자열을 입력하세요...',
    confirm: '확인',
    cancel: '취소',
  },

  // 기보 JSON 대화 상자
  notationTextDialog: {
    title: '기보 보기 / 입력 (JSON)',
    placeholder:
      '여기에 현재 대국의 JSON 기보가 표시됩니다. 복사하여 공유하거나, 받은 JSON 기보를 여기에 붙여넣고 "적용"을 클릭하여 불러올 수 있습니다.',
    copy: 'JSON 복사',
    apply: '적용',
  },

  // 기물 뒤집기 프롬프트
  flipPrompt: {
    title: '기물 뒤집기 알림',
    message: '뒤집을 기물을 선택하세요',
    confirm: '확인',
    cancel: '취소',
  },

  // 정보 대화 상자
  about: {
    title: 'JieqiBox 정보',
    version: '버전',
    description:
      'Tauri와 Vue 3로 구축된 현대적인 제치(Jieqi) 분석 및 대국 데스크톱 애플리케이션입니다.',
    author: '작성자',
    license: '라이선스',
    github: 'GitHub',
    downloadLatest: '최신 버전 다운로드',
    viewLicense: '라이선스 세부 정보 보기',
    credits: '크레딧',
    piecesCredit: '체스 말 디자인: Couch Tomato',
    checkUpdate: '업데이트 확인',
    checkingUpdate: '업데이트 확인 중...',
    updateAvailable: '새 버전이 있습니다: {version}',
    upToDate: '최신 버전을 사용 중입니다.',
    updateError: '업데이트 확인 실패.',
  },

  // 분석 사이드바
  analysis: {
    title: '엔진 분석',
    startAnalysis: '분석 시작',
    stopAnalysis: '분석 중지',
    engineNotLoaded: '엔진 로드되지 않음',
    loadEngine: '엔진 로드',
    loadEngineSaf: '엔진 로드 (SAF)',
    analysisResults: '분석 결과',
    bestMove: '최선의 수',
    score: '평가',
    depth: '깊이',
    nodes: '노드',
    time: '시간',
    pv: '주 변형(PV)',
    engineLoaded: '엔진 로드됨',
    playBestMove: '최선의 수 두기',
    undoMove: '무르기',
    redAiOn: '홍 컴퓨터(켜짐)',
    redAiOff: '홍 컴퓨터(꺼짐)',
    blackAiOn: '흑 컴퓨터(켜짐)',
    blackAiOff: '흑 컴퓨터(꺼짐)',
    freeFlipMode: '자유 뒤집기 모드',
    darkPiecePool: '(먹은) 암기 풀',
    captureHistory: '먹은 기물 기록',
    myCaptured: '내가 먹은 기물',
    opponentCaptured: '상대가 먹은 기물',
    noCaptured: '없음',
    engineAnalysis: '엔진 분석',
    notation: '기보',
    moveComments: '수석(주석)',
    noComment: '주석 없음',
    enterComment: '주석 입력...',
    saveComment: '저장',
    cancelComment: '취소',
    opening: '오프닝',
    adjustment: '조정',
    engineLog: '엔진 로그',
    uciTerminal: 'UCI 터미널',
    about: '정보',
    undockPanel: '패널 분리',
    dockPanel: '패널 고정',
    restorePanels: '패널 레이아웃 복원',
    flipBoard: '체스판 뒤집기',
    flipBoardBack: '방향 복원',
    ponderMode: '폰더(Ponder) 모드',
    selectEngine: '엔진 선택',
    manageEngines: '관리',
    unloadEngine: '엔진 언로드',
    noEngineLoaded: '현재 로드된 엔진이 없습니다.',
    // 매치 모드 관련
    enterMatchMode: '매치 모드',
    exitMatchMode: '매치 모드 종료',
    // 인간 vs AI 모드 관련
    enterHumanVsAiMode: '인간 vs AI',
    exitHumanVsAiMode: '인간 vs AI 종료',
    startMatch: '매치 시작',
    stopMatch: '매치 중지',
    jaiSettings: '매치 옵션',
    matchInfo: '매치 정보',
    multiPv: '멀티 PV',
    fullLine: '전체 수순',
    matchStatus: '상태',
    gameProgress: '진행',
    engineInfo: '엔진',
    lastResult: '결과',
    matchWld: '승/패/무',
    eloRating: 'Elo 레이팅',
    eloCalculator: 'Elo 계산기',
    matchEngines: '엔진',
    running: '실행 중',
    stopped: '중지됨',
    noMatchEngine: '매치 엔진이 로드되지 않음',
    noAnalysis: '분석 데이터 없음',
    // 운 지수 관련
    luckIndex: '운 지수',
    luckIndexBasedOnFlipSequence: '뒤집기 순서에 따른 추정치',
    blackFavor: '흑 유리',
    redFavor: '홍 유리',
    currentValue: '현재 값',
    // 내비게이션 버튼
    goToFirst: '첫 수로 이동',
    goToPrevious: '이전 수',
    goToNext: '다음 수',
    goToLast: '마지막 수로 이동',
    play: '재생',
    pause: '일시 정지',
    annotateMove: '수 평가',
    // 수 평가
    brilliant: '묘수',
    good: '좋은 수',
    interesting: '흥미로운 수',
    dubious: '의심스러운 수',
    mistake: '실수',
    blunder: '블런더(패착)',
    clear: '지우기',
  },

  // 엔진 관리자
  engineManager: {
    title: '엔진 관리자',
    addEngine: '엔진 추가',
    addEngineAndroid: '엔진 추가 (SAF)',
    editEngine: '엔진 편집',
    engineName: '엔진 이름',
    enginePath: '엔진 경로',
    arguments: '명령줄 인수',
    actions: '작업',
    confirmDeleteTitle: '삭제 확인',
    confirmDeleteMessage:
      '엔진 "{name}"을(를) 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.',
    promptEngineName: '엔진의 고유 이름을 입력하세요:',
    promptEngineArgs:
      '엔진의 명령줄 인수를 입력하세요 (선택 사항, 모르면 비워두세요):',
    promptHasNnue: '이 엔진은 NNUE 파일을 사용합니까? (y/n):',
    promptNnueFile: '엔진의 NNUE 파일을 선택하세요:',
    nameExists: '해당 이름이 이미 존재합니다. 고유한 이름을 사용하세요.',
    engineAddedSuccess: '엔진 {name}이(가) 성공적으로 추가되었습니다!',
  },

  // 엔진 관리자 내 저장된 UCI 옵션 편집기
  uciEditor: {
    title: '저장된 UCI 옵션',
    noSaved:
      '이 엔진에 대해 저장된 옵션이 아직 없습니다. 엔진을 로드하기 전에 미리 구성하려면 아래에 항목을 추가하세요.',
    addOption: '옵션 추가',
    optionName: '옵션 이름',
    optionValue: '옵션 값',
    type: '유형',
    typeString: '문자열',
    typeNumber: '숫자',
    typeSwitch: '스위치',
    typeCombo: '콤보 (선택)',
    typeButton: '버튼',
    willExecute: '로드 시 실행',
    noExecute: '실행 안 함',
  },

  // JAI 옵션 대화 상자
  jaiOptions: {
    title: 'JAI 매치 옵션',
    loadingText: '엔진 옵션을 불러오는 중...',
    noEngineLoaded: '현재 로드된 매치 엔진이 없습니다.',
    pleaseLoadEngineFirst: '옵션을 설정하려면 먼저 매치 엔진을 로드하세요.',
    loadEngine: '엔진 로드',
    noOptionsAvailable: '이 엔진에 사용할 수 있는 JAI 옵션이 없습니다.',
    refreshOptions: '옵션 새로 고침',
    range: '범위',
    execute: '실행',
    resetToDefaults: '기본값으로 재설정',
    clearSettings: '설정 지우기',
    confirmClearSettings:
      '현재 엔진의 모든 JAI 옵션 구성을 지우시겠습니까? 이 작업은 취소할 수 없습니다.',
    settingsCleared: 'JAI 옵션 구성이 삭제되었습니다',
    // JAI 옵션 설명
    optionDescriptions: {
      Engine1Path: '첫 번째 UCI 호환 제치 엔진 실행 파일의 전체 경로입니다.',
      Engine1Options:
        '엔진 1에 대한 UCI "setoption" 명령 문자열입니다. 각 옵션은 "name <옵션 이름> value <값>" 형식을 따라야 합니다. 여러 옵션은 공백으로 구분됩니다. 이 파서는 공백이 포함된 옵션 이름과 값을 올바르게 처리합니다. 예: "name Threads value 4 name Hash value 256"',
      Engine2Path: '두 번째 UCI 호환 제치 엔진 실행 파일의 전체 경로입니다.',
      Engine2Options:
        '엔진 2에 대한 UCI "setoption" 명령 문자열입니다. 형식과 예시는 "Engine1Options"를 참조하세요.',
      TotalRounds:
        '진행할 대국 쌍(라운드)의 수입니다. 각 라운드마다 엔진이 색상을 바꾸므로 총 게임 수는 "TotalRounds * 2"가 됩니다.',
      Concurrency: '병렬로 실행할 게임 수입니다.',
      BookFile:
        '오프닝 북 파일 경로입니다. 파일은 한 줄에 하나의 FEN 포지션을 포함해야 합니다. 각 라운드가 시작될 때 이 파일에서 무작위로 FEN을 선택하여 해당 라운드의 두 게임에 사용합니다. 경로가 비어 있거나 유효하지 않거나 파일에 FEN이 없는 경우 기본 시작 포지션이 사용됩니다.',
      MainTimeMs: '각 플레이어의 게임당 기본 생각 시간(밀리초)입니다.',
      IncTimeMs: '각 수를 둘 때마다 시계에 추가되는 시간(밀리초)입니다.',
      TimeoutBufferMs:
        '프로세스 및 통신 오버헤드를 고려한 유예 시간(밀리초)입니다. 플레이어의 시계가 "-(TimeoutBufferMs)" 아래로 떨어지는 경우에만 시간패로 선언됩니다.',
      Logging:
        '활성화("true")되면 매치 엔진이 각 엔진 프로세스에 대해 모든 UCI 통신을 캡처하는 상세 로그 파일을 생성합니다.',
      SaveNotation:
        '각 게임의 기보 파일을 저장할지 여부를 결정하는 스위치입니다.',
      SaveNotationDir:
        '저장이 활성화된 경우 기보 파일이 저장될 디렉토리 경로입니다.',
      TimeControl: '각 엔진의 시간 제어 설정입니다.',
      AdjudicationRule: '무승부 또는 승패가 확실한 상황을 판정하는 규칙입니다.',
    },
  },

  // JAI 메시지
  jai: {
    engineReady: '매치 엔진 준비됨',
    matchStarted: '매치 시작됨',
    matchStopped: '매치 중지됨',
    gameProgress: '{current}국 / 총 {total}국',
    matchResult: '매치 결과: {result}',
  },

  // Elo 계산기
  eloCalculator: {
    title: 'Elo 계산기',
    inputSection: '매치 결과',
    wins: '승',
    losses: '패',
    draws: '무',
    totalGames: '총 대국 수',
    resultsFormat: '결과 형식',
    formatWDL: 'WDL (승/무/패)',
    formatPTNML: 'PTNML (쌍 대국)',
    ptnml: {
      ll: 'LL (패패)',
      lddl: 'LD+DL (패무/무패)',
      center: 'LW+DD+WL (패승/무무/승패)',
      dwwd: 'DW+WD (무승/승무)',
      ww: 'WW (승승)',
    },
    resultsSection: 'Elo 성능',
    performance: 'Elo 차이 (95% 오차 포함)',
    confidenceInterval: '95% 신뢰 구간',
    scoreRate: '득점률',
    los: 'LOS (우월 확률)',
    drawRatio: '무승부 비율',
    standardError: '표준 오차',
    noResults: '계산 결과를 보려면 매치 결과를 입력하세요.',
    basicRequiresWDL: '기본 모드에는 WDL 입력이 필요합니다. WDL로 전환하세요.',
    close: '닫기',
    basicMode: '기본',
  },

  // 오류 메시지
  errors: {
    saveNotationFailed: '기보 저장 실패',
    openNotationFailed: '기보 열기 실패',
    engineNotLoaded: '엔진이 로드되지 않아 명령을 보낼 수 없습니다',
    engineSendUnavailable: '엔진 전송 방법을 사용할 수 없습니다',
    redDarkPiecesMismatch: '오류: 홍색 암기 {darkCount}개 > 풀 {poolCount}개',
    blackDarkPiecesMismatch: '오류: 흑색 암기 {darkCount}개 > 풀 {poolCount}개',
    pieceCountExceeded: '오류: {pieceName} 총 개수 초과!',
    engineLoadFailed: '엔진 {name} 로드 실패: {error}',
    jaiEngineLoadFailed: 'JAI 매치 엔진 {name} 로드 실패: {error}',
    engineUnloadFailed: '엔진 언로드 실패',
    failedToOpenFileSelector: '파일 선택기를 여는 데 실패했습니다',
    failedToProcessEngine: '엔진 파일을 처리하는 데 실패했습니다',
    invalidFenFormat: '유효하지 않은 FEN 형식',
  },

  // 체스판 하단
  chessboard: {
    copyFen: 'FEN 복사',
    pasteFen: 'FEN 붙여넣기',
    inputFen: 'FEN 입력',
    inputCopyFen: 'FEN 입력/복사',
    newGame: '새 게임',
    copied: '✓ 복사됨',
    clearDrawings: '그리기 지우기',
  },

  // 평가 차트
  evaluationChart: {
    title: '형세도',
    rightClickHint: '우클릭으로 옵션 보기',
    longPressHint: '길게 눌러 옵션 보기',
    showMoveLabels: '수 라벨 표시',
    linearYAxis: '선형 Y축',
    showOnlyLines: '선만 표시',
    blackPerspective: '흑 관점',
    clampYAxis: 'Y축 범위 제한',
    clampValue: '제한 값',
    colorScheme: '색상 테마',
    redGreen: '홍-녹',
    blueOrange: '청-주황',
    showSeparateLines: '홍/흑 평가선 분리 표시',
    opening: '오프닝',
    noData: '분석 데이터 없음',
    newGame: '새 게임',
    copied: '✓ 복사됨',
    saveChartImage: '이미지 저장',
    chartImageSaved: '차트 이미지가 {path}에 저장되었습니다',
    saveChartImageFailed: '이미지 저장 실패',
    viewMode: '보기 모드',
    evaluation: '점수',
    time: '시간',
    depth: '깊이',
  },

  // 언어 선택
  languages: {
    current: '현재 언어',
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

  // 인터페이스 설정
  interfaceSettings: {
    title: '인터페이스 설정',
    showCoordinates: '좌표(행/열) 표시',
    parseUciInfo: 'UCI 정보 파싱',
    showAnimations: '착수 애니메이션 켜기',
    showPositionChart: '형세도 표시',
    showEvaluationBar: '형세 판단 바 표시',
    darkMode: '다크 모드',
    autosave: 'Autosave.json에 자동 저장',
    useNewFenFormat: '새 FEN 형식 사용',
    engineLogLineLimit: '엔진 로그 줄 수 제한',
    validationTimeout: '엔진 검증 타임아웃 (ms)',
    showChineseNotation: '중국식 기보 표시',
    showLuckIndex: '운 지수 표시',
    showArrows: '화살표 표시',
    enableSoundEffects: '음향 효과 켜기',
    soundVolume: '음량',
    pieceStyle: '기물 스타일',
    pieceStyles: {
      default: '기본',
      internationalized: '국제화',
    },
  },

  // UCI 메시지
  uci: {
    depth: '깊이',
    seldepth: '선택 깊이',
    multipv: '멀티 PV',
    score: '점수',
    mate: '외통',
    wdl: '승/무/패',
    nodes: '노드',
    nps: 'NPS',
    hashfull: '해시 사용률',
    tbhits: 'TB 적중',
    time: '시간',
    pv: '주 변형(PV)',
    checkmate: '외통수! 둘 수 있는 수가 없습니다.',
    bestMove: '최선의 수: {move}',
    noMoves: '둘 수 있는 수가 없습니다',
    engineReady: '엔진 준비됨',
  },

  // 게임 조작 확인
  gameConfirm: {
    clearHistoryTitle: '이후 기보 삭제',
    clearHistoryMessage:
      '과거 국면에서 수를 두려고 합니다. 이렇게 하면 이후의 모든 기보 기록이 지워집니다. 계속하시겠습니까?',
    confirm: '확인',
    cancel: '취소',
  },

  // 게임 종료 알림
  gameEnd: {
    humanWins: '축하합니다! 승리하셨습니다!',
    aiWins: '게임 종료 - AI 승리',
    humanWinsMessage: 'AI를 이겼습니다! AI는 더 이상 둘 수 있는 수가 없습니다.',
    aiWinsMessage:
      'AI가 승리했습니다. 당신은 더 이상 둘 수 있는 수가 없습니다.',
    ok: '확인',
  },

  // 인간 vs AI 모드
  humanVsAi: {
    title: '인간 vs AI 모드',
    selectAiSide: 'AI 진영 선택',
    redAiBlackHuman: '홍: AI, 흑: 인간',
    blackAiRedHuman: '흑: AI, 홍: 인간',
    options: '옵션',
    showEngineAnalysis: '엔진 분석 표시',
    engineAnalysisHint:
      '활성화하면 엔진의 분석 결과를 볼 수 있지만 게임 규칙에는 영향을 주지 않습니다.',
    ponderNote: '폰더(Ponder) 정보:',
    ponderUnifiedHint:
      '폰더는 전역 설정을 사용하며 일반 모드의 사이드바에서 켜거나 끌 수 있습니다.',
    rulesTitle: '게임 규칙',
    rule1: '자동으로 무작위 뒤집기 모드가 강제 적용됩니다',
    rule2: '당신은 AI로부터 먹은 암기만 볼 수 있습니다',
    rule3: 'AI는 당신으로부터 먹은 암기만 볼 수 있습니다',
    rule4: '표준 제치(Jieqi) 규칙에 따른 제한된 정보 대전',
    startGame: '게임 시작',
  },

  // 오프닝 북
  openingBook: {
    title: '오프닝 북',
    currentMoves: '현재 국면의 수',
    manage: '관리',
    settings: '설정',
    statistics: '통계',
    noMoves: '현재 국면에 대한 오프닝 북 수가 없습니다',
    foundMoves: '{count}개의 수를 찾았습니다',
    positions: '국면',
    move: '착수',
    priority: '우선순위',
    stats: '승/무/패',
    allowed: '허용',
    comment: '주석',
    addPosition: '현재 국면 추가',
    editMove: '수 편집',
    addMove: '수 추가',
    moveUci: 'UCI 착수',
    moveRequired: '착수는 필수 항목입니다',
    invalidUci: '유효하지 않은 UCI 형식',
    invalidMoveFormat:
      '유효하지 않은 착수 형식입니다. UCI 형식(예: a1a2) 또는 중국식 기보 형식(예: 炮二平五)을 사용하세요.',
    invalidLegalMove: '이 수는 현재 국면에서 유효한 수가 아닙니다',
    wins: '승',
    draws: '무',
    losses: '패',
    import: '가져오기',
    export: '내보내기',
    selectFile: '파일 선택',
    format: '형식',
    dangerZone: '위험 구역',
    clearAll: '모두 지우기',
    confirmClear: '지우기 확인',
    clearWarning:
      '오프닝 북의 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 취소할 수 없습니다!',
    confirmDelete: '삭제 확인',
    deleteWarning: '이 수를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.',
    enableInGame: '게임 중 오프닝 북 활성화',
    showMoves: '오프닝 북 수 표시',
    show: '표시',
    preferHighPriority: '높은 우선순위 수 선호',
    totalPositions: '총 국면 수',
    totalMoves: '총 착수 수',
    allowedMoves: '허용된 수',
    disallowedMoves: '금지된 수',
    refreshStats: '통계 새로 고침',
    refresh: '새로 고침',
    getBookMove: '오프닝 북에서 수 두기',
    initializing: '초기화 중...',
    showLess: '접기',
    showMore: '더 보기',
    addMarkedMoves: '그려진 수 추가',
    addMarkedMovesTitle: '그려진 수를 오프닝 북에 추가',
    markedMovesCount: '{count}개의 유효한 그려진 수를 찾았습니다',
    noMarkedMoves: '유효한 그려진 수를 찾지 못했습니다',
    batchSettings: '일괄 설정',
  },
}
