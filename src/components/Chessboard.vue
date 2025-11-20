<template>
  <div class="chessboard-wrapper" :class="{ 'has-chart': showPositionChart }">
    <div class="chessboard-container">
      <img src="@/assets/xiangqi.png" class="bg" alt="board" />

      <!-- Evaluation Bar (left side) -->
      <div
        v-if="showEvaluationBar && currentEvalPercent !== null"
        class="eval-bar"
        aria-hidden="true"
      >
        <div
          class="eval-top"
          :style="{
            height: currentEvalPercent + '%',
            background: isRedOnTop ? '#e53935' : '#333',
          }"
        ></div>
        <div
          class="eval-bottom"
          :style="{
            height: 100 - (currentEvalPercent as number) + '%',
            background: isRedOnTop ? '#333' : '#e53935',
          }"
        ></div>
        <div
          class="eval-marker"
          :style="{ top: currentEvalPercent + '%' }"
        ></div>
      </div>

      <!-- Pieces -->
      <div
        class="pieces"
        @click="boardClick"
        @mousedown.right="handleRightMouseDown"
        @mouseup.right="handleRightMouseUp"
        @contextmenu.prevent
      >
        <img
          v-for="p in pieces"
          :key="p.id"
          :src="img(p)"
          class="piece"
          :class="{
            selected: p.id === selectedPieceId,
            animated: isAnimating && showAnimations,
            inCheck: p.id === checkedKingId,
          }"
          :style="rcStyle(p.row, p.col, p.zIndex)"
        />
        <!-- zIndex priority: moving piece (highest) > checked king/general > lower row pieces > others -->
      </div>

      <!-- Last move highlights -->
      <div class="last-move-highlights" v-if="lastMovePositions">
        <div
          class="highlight from"
          :class="getAnnotationClass(lastMovePositions)"
          :style="
            rcStyle(
              displayRow(lastMovePositions.from.row),
              displayCol(lastMovePositions.from.col)
            )
          "
        ></div>
        <div
          class="highlight to"
          :class="getAnnotationClass(lastMovePositions)"
          :style="
            rcStyle(
              displayRow(lastMovePositions.to.row),
              displayCol(lastMovePositions.to.col)
            )
          "
        ></div>
      </div>

      <!-- Annotation badge overlay (above pieces and highlights) -->
      <div
        v-if="lastMovePositions && getCurrentMoveAnnotation()"
        class="annotation-layer"
      >
        <div
          class="annotation-anchor"
          :class="getAnnotationClass(lastMovePositions)"
          :style="
            rcStyle(
              displayRow(lastMovePositions.to.row),
              displayCol(lastMovePositions.to.col)
            )
          "
        >
          <div class="annotation-badge">{{ getCurrentMoveAnnotation() }}</div>
        </div>
      </div>

      <!-- User drawings (circles and arrows) -->
      <svg
        class="user-drawings"
        viewBox="0 0 90 100"
        preserveAspectRatio="none"
      >
        <!-- Circles -->
        <circle
          v-for="(circle, idx) in userCircles"
          :key="`circle-${idx}`"
          :cx="circle.x"
          :cy="circle.y"
          :r="circle.radius"
          fill="none"
          stroke="#ff6b6b"
          stroke-width="1"
          opacity="0.8"
        />
        <!-- Arrows -->
        <defs>
          <marker
            id="user-arrow-marker"
            markerWidth="3"
            markerHeight="3"
            refX="2"
            refY="1.5"
            orient="auto"
          >
            <polygon points="0 0, 3 1.5, 0 3" fill="#ff6b6b" />
          </marker>
        </defs>
        <line
          v-for="(arrow, idx) in userArrows"
          :key="`arrow-${idx}`"
          :x1="arrow.x1"
          :y1="arrow.y1"
          :x2="arrow.x2"
          :y2="arrow.y2"
          stroke="#ff6b6b"
          stroke-width="2"
          marker-end="url(#user-arrow-marker)"
          opacity="0.8"
        />
      </svg>

      <!-- Valid moves indicators -->
      <div
        class="valid-moves-indicators"
        v-if="validMovesForSelectedPiece.length > 0"
      >
        <div
          v-for="(move, index) in validMovesForSelectedPiece"
          :key="`valid-move-${index}`"
          class="valid-move-dot"
          :style="rcStyle(move.row, move.col)"
        ></div>
      </div>

      <!-- Rank and file labels -->
      <div class="board-labels" v-if="showCoordinates">
        <div class="rank-labels">
          <span
            v-for="(rank, index) in ranks"
            :key="rank"
            :style="rankLabelStyle(index)"
            >{{ rank }}</span
          >
        </div>
        <div class="file-labels">
          <span
            v-for="(file, index) in files"
            :key="file"
            :style="fileLabelStyle(index)"
            >{{ file }}</span
          >
        </div>
      </div>

      <!-- Arrows (support MultiPV) -->
      <svg
        class="ar"
        viewBox="0 0 90 100"
        preserveAspectRatio="none"
        v-if="showArrows"
      >
        <defs>
          <marker
            v-for="(color, idx) in arrowColors"
            :key="`marker-${idx}`"
            :id="`ah-${idx}`"
            markerWidth="2.5"
            markerHeight="2.5"
            refX="1.5"
            refY="1.25"
            orient="auto"
          >
            <polygon points="0 0, 2.5 1.25, 0 2.5" :fill="color" />
          </marker>
        </defs>
        <template v-for="(a, idx) in arrs" :key="`arrow-${idx}`">
          <line
            :x1="a.x1"
            :y1="a.y1"
            :x2="a.x2"
            :y2="a.y2"
            :style="{ stroke: arrowColor(idx) }"
            :marker-end="`url(#ah-${idx % arrowColors.length})`"
            class="al"
          />
          <text
            v-if="arrs.length > 1"
            :x="(a.x1 + a.x2) / 2"
            :y="(a.y1 + a.y2) / 2"
            :fill="arrowColor(idx)"
            class="arrow-label"
          >
            {{ a.pv }}
          </text>
        </template>
      </svg>

      <!-- Panel -->
      <div class="panel">
        <v-btn
          v-if="!isAndroid"
          @click="copyFenToClipboard"
          size="small"
          color="button"
          >{{ $t('chessboard.copyFen') }}</v-btn
        >
        <v-btn
          @click="pasteFenFromClipboard"
          size="small"
          color="button"
          :disabled="isMatchRunning"
          >{{ $t('chessboard.pasteFen') }}</v-btn
        >
        <v-btn
          @click="inputFenStringWithArrow"
          size="small"
          color="button"
          :disabled="isMatchRunning"
          >{{
            isAndroid
              ? $t('chessboard.inputCopyFen')
              : $t('chessboard.inputFen')
          }}</v-btn
        >
        <v-btn
          @click="setupNewGameWithArrow"
          size="small"
          color="button"
          :disabled="isMatchRunning"
          >{{ $t('chessboard.newGame') }}</v-btn
        >
        <v-btn
          v-if="!isAndroid"
          @click="clearUserDrawings"
          size="small"
          color="error"
          :disabled="isMatchRunning"
          >{{ $t('chessboard.clearDrawings') }}</v-btn
        >
      </div>

      <!-- Copy success tip - positioned absolutely to avoid layout shifts -->
      <div v-if="copySuccessVisible" class="copy-success-tip">
        {{ $t('chessboard.copied') }}
      </div>
      <ClearHistoryConfirmDialog
        :visible="showClearHistoryDialog"
        :onConfirm="onConfirmClearHistory"
        :onCancel="onCancelClearHistory"
      />
    </div>

    <!-- Position Chart -->
    <EvaluationChart
      v-if="showPositionChart"
      :history="history"
      :current-move-index="currentMoveIndex"
      :initial-fen="unref(gs?.initialFen)"
      @seek="handleChartSeek"
    />
  </div>
</template>

<script setup lang="ts">
  import {
    inject,
    ref,
    watch,
    computed,
    watchEffect,
    onMounted,
    onUnmounted,
    unref,
  } from 'vue'
  import { useI18n } from 'vue-i18n'
  import type { Piece } from '@/composables/useChessGame'
  import { useInterfaceSettings } from '@/composables/useInterfaceSettings'
  import ClearHistoryConfirmDialog from './ClearHistoryConfirmDialog.vue'
  import EvaluationChart from './EvaluationChart.vue'
  import { MATE_SCORE_BASE } from '@/utils/constants'
  import { isAndroidPlatform } from '@/utils/platform'
  import { validateJieqiFen } from '@/utils/fenValidator'

  // Seek handler for EvaluationChart
  const handleChartSeek = (idx: number) => {
    try {
      const gsAny: any = gs
      if (gsAny?.replayToMove) gsAny.replayToMove(idx)
    } catch {}
  }

  const { t } = useI18n()

  /* ===== Layout ===== */
  const PAD_X = 11,
    PAD_Y = 11,
    COLS = 9,
    ROWS = 10,
    GX = 100 - PAD_X,
    GY = 100 - PAD_Y,
    OX = PAD_X / 2,
    OY = PAD_Y / 2
  const files = computed(() => {
    const baseFiles = 'abcdefghi'.split('')
    return gs.isBoardFlipped.value ? baseFiles.slice().reverse() : baseFiles
  })

  const ranks = computed(() => {
    const baseRanks = Array.from({ length: 10 }, (_, i) => 9 - i)
    return gs.isBoardFlipped.value ? baseRanks.slice().reverse() : baseRanks
  })

  const {
    showCoordinates,
    showAnimations,
    showPositionChart,
    showEvaluationBar,
    showArrows,
  } = useInterfaceSettings()

  /* ===== Injections ===== */
  const gs: any = inject('game-state')
  const es = inject('engine-state') as {
    pvMoves: any
    bestMove: any
    isThinking: any
    multiPvMoves: any
    stopAnalysis: any
    isPondering: any
    isInfinitePondering: any
    ponderMove: any
    ponderhit: any
    analysis?: any
  }

  // Inject JAI engine state for tournament mode support
  const jaiEngine = inject('jai-engine-state') as any

  // Check if match is running to disable certain interactions
  const isMatchRunning = computed(() => {
    return jaiEngine?.isMatchRunning?.value || false
  })

  const {
    pieces,
    selectedPieceId,
    copySuccessVisible,
    copyFenToClipboard,
    inputFenString,
    handleBoardClick,
    setupNewGame,
    isAnimating,
    lastMovePositions,
    registerArrowClearCallback,
    history,
    currentMoveIndex,
  } = gs

  // User drawing state
  // Store additional row/col metadata so we can toggle drawings on duplicate actions
  const userCircles = ref<
    Array<{ x: number; y: number; radius: number; row: number; col: number }>
  >([])
  const userArrows = ref<
    Array<{
      x1: number
      y1: number
      x2: number
      y2: number
      fromRow: number
      fromCol: number
      toRow: number
      toCol: number
    }>
  >([])
  const isDrawing = ref(false)
  const drawingStart = ref<{ x: number; y: number } | null>(null)
  const drawingStartRC = ref<{ row: number; col: number } | null>(null)
  const {
    bestMove,
    isThinking,
    multiPvMoves,
    isPondering,
    isInfinitePondering,
    ponderMove,
    ponderhit,
  } = es

  // Inject isCurrentPositionInCheck
  const isCurrentPositionInCheck = gs.isCurrentPositionInCheck

  // Get valid moves for the selected piece
  const validMovesForSelectedPiece = computed(() => {
    return gs.getValidMovesForSelectedPiece.value
  })

  // Red side display position: when board is flipped, red is on top; otherwise red is on bottom
  const isRedOnTop = computed(() => {
    try {
      return !!gs?.isBoardFlipped?.value
    } catch {
      return false
    }
  })

  // Check if running on Android platform
  const isAndroid = computed(() => {
    return isAndroidPlatform()
  })

  // Calculate the ID of the checked king/general, if any
  const checkedKingId = computed(() => {
    // Check if red side is in check
    if (isCurrentPositionInCheck('red')) {
      const king = gs.pieces.value.find(
        (p: Piece) => p.isKnown && p.name === 'red_king'
      )
      return king ? king.id : null
    }
    // Check if black side is in check
    if (isCurrentPositionInCheck('black')) {
      const king = gs.pieces.value.find(
        (p: Piece) => p.isKnown && p.name === 'black_king'
      )
      return king ? king.id : null
    }
    return null
  })

  /* ===== General: Row/Col -> Percentage Coordinates (center of the piece) ===== */
  const percentFromRC = (row: number, col: number) => ({
    x: OX + (col / (COLS - 1)) * GX,
    y: OY + (row / (ROWS - 1)) * GY,
  })

  /* ===== Arrow Specific: Convert percentage coordinates to SVG coordinate system ===== */
  const percentToSvgCoords = (row: number, col: number) => ({
    x: (OX + (col / (COLS - 1)) * GX) * 0.9, // Convert to SVG coordinates with a width of 90
    y: OY + (row / (ROWS - 1)) * GY, // Keep height at 100
  })

  /* ===== Pieces ===== */
  const img = (p: Piece) =>
    new URL(
      `../assets/${p.isKnown ? p.name : 'dark_piece'}.svg`,
      import.meta.url
    ).href
  // rcStyle: calculate the style for each piece, including zIndex
  // zIndex priority: moving piece (2000) > checked king/general (1100) > lower row pieces > others
  const rcStyle = (r: number, c: number, zIndex?: number) => {
    const { x, y } = percentFromRC(r, c)
    return {
      top: `${y}%`,
      left: `${x}%`,
      width: '12%',
      transform: 'translate(-50%,-50%)',
      ...(zIndex !== undefined && { zIndex: zIndex }),
    }
  }

  // Calculate rank label position (ranks array already handles flip state)
  const rankLabelStyle = (index: number) => {
    const { y } = percentFromRC(index, 0)
    return { top: `${y}%`, transform: 'translateY(-50%)' }
  }

  // Calculate file label position (files array already handles flip state)
  const fileLabelStyle = (index: number) => {
    const { x } = percentFromRC(0, index)
    return { left: `${x}%`, transform: 'translateX(-50%)' }
  }

  /* ===== Clicks ===== */
  // ===== Dialog related =====
  const showClearHistoryDialog = ref(false)
  const pendingMove = ref<{ piece: Piece; row: number; col: number } | null>(
    null
  )

  // Encapsulated click handling
  const boardClick = (e: MouseEvent) => {
    // Disable manual moves during match running
    if (isMatchRunning.value) {
      return
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const xp = ((e.clientX - rect.left) / rect.width) * 100,
      yp = ((e.clientY - rect.top) / rect.height) * 100
    const col = Math.round(((xp - OX) / GX) * (COLS - 1))
    const row = Math.round(((yp - OY) / GY) * (ROWS - 1))
    // Call useChessGame's handleBoardClick
    const result = handleBoardClick(
      Math.max(0, Math.min(ROWS - 1, row)),
      Math.max(0, Math.min(COLS - 1, col))
    )
    if (result && result.requireClearHistoryConfirm) {
      pendingMove.value = result.move
      showClearHistoryDialog.value = true
    }
  }

  // Snap arbitrary percentage coordinates to nearest board grid center (row/col)
  const snapPercentToRC = (xp: number, yp: number) => {
    const colFloat = ((xp - OX) / GX) * (COLS - 1)
    const rowFloat = ((yp - OY) / GY) * (ROWS - 1)
    const col = Math.max(0, Math.min(COLS - 1, Math.round(colFloat)))
    const row = Math.max(0, Math.min(ROWS - 1, Math.round(rowFloat)))
    return { row, col }
  }

  // Right-click drawing handlers
  const handleRightMouseDown = (e: MouseEvent) => {
    e.preventDefault()
    if (isMatchRunning.value) return

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const xp = ((e.clientX - rect.left) / rect.width) * 100
    const yp = ((e.clientY - rect.top) / rect.height) * 100

    const { row, col } = snapPercentToRC(xp, yp)
    const snapped = percentFromRC(row, col)
    drawingStart.value = { x: snapped.x, y: snapped.y }
    drawingStartRC.value = { row, col }
    isDrawing.value = true
  }

  const handleRightMouseUp = (e: MouseEvent) => {
    if (!isDrawing.value || !drawingStart.value) return

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const xp = ((e.clientX - rect.left) / rect.width) * 100
    const yp = ((e.clientY - rect.top) / rect.height) * 100
    const { row, col } = snapPercentToRC(xp, yp)
    const endCenter = percentFromRC(row, col)

    // Convert to SVG coordinates (board width scaled to 90)
    const svgX = drawingStart.value.x * 0.9
    const svgY = drawingStart.value.y
    const endSvgX = endCenter.x * 0.9
    const endSvgY = endCenter.y

    if (
      drawingStartRC.value &&
      (row !== drawingStartRC.value.row || col !== drawingStartRC.value.col)
    ) {
      // Arrow mode: toggle if the same directed arrow already exists
      const fromRow = drawingStartRC.value.row
      const fromCol = drawingStartRC.value.col
      const toRow = row
      const toCol = col

      const existingIdx = userArrows.value.findIndex(
        a =>
          a.fromRow === fromRow &&
          a.fromCol === fromCol &&
          a.toRow === toRow &&
          a.toCol === toCol
      )

      if (existingIdx >= 0) {
        // Remove existing identical arrow
        userArrows.value.splice(existingIdx, 1)
      } else {
        // Create new arrow
        userArrows.value.push({
          x1: svgX,
          y1: svgY,
          x2: endSvgX,
          y2: endSvgY,
          fromRow,
          fromCol,
          toRow,
          toCol,
        })
      }
    } else {
      // Circle mode: toggle if a circle already exists at this square center
      const cellW = GX / (COLS - 1)
      const cellH = GY / (ROWS - 1)
      const radiusSvg = Math.max(
        3,
        Math.min(8, Math.min(0.9 * cellW, cellH) * 0.5)
      )

      const cRow = drawingStartRC.value?.row ?? 0
      const cCol = drawingStartRC.value?.col ?? 0
      const existingIdx = userCircles.value.findIndex(
        c => c.row === cRow && c.col === cCol
      )

      if (existingIdx >= 0) {
        // Remove existing circle at this grid center
        userCircles.value.splice(existingIdx, 1)
      } else {
        // Create new circle snapped to grid center
        userCircles.value.push({
          x: svgX,
          y: svgY,
          radius: radiusSvg,
          row: cRow,
          col: cCol,
        })
      }
    }

    isDrawing.value = false
    drawingStart.value = null
    drawingStartRC.value = null
  }

  // Clear all user drawings
  const clearUserDrawings = () => {
    userCircles.value = []
    userArrows.value = []
  }

  // Flip user drawings when board is flipped
  const flipUserDrawings = () => {
    // Flip circles
    userCircles.value = userCircles.value.map(circle => {
      const flippedRow = 9 - circle.row
      const flippedCol = 8 - circle.col
      const { x, y } = percentToSvgCoords(flippedRow, flippedCol)
      return {
        ...circle,
        row: flippedRow,
        col: flippedCol,
        x,
        y,
      }
    })

    // Flip arrows
    userArrows.value = userArrows.value.map(arrow => {
      const flippedFromRow = 9 - arrow.fromRow
      const flippedFromCol = 8 - arrow.fromCol
      const flippedToRow = 9 - arrow.toRow
      const flippedToCol = 8 - arrow.toCol
      const { x: x1, y: y1 } = percentToSvgCoords(
        flippedFromRow,
        flippedFromCol
      )
      const { x: x2, y: y2 } = percentToSvgCoords(flippedToRow, flippedToCol)
      return {
        ...arrow,
        fromRow: flippedFromRow,
        fromCol: flippedFromCol,
        toRow: flippedToRow,
        toCol: flippedToCol,
        x1,
        y1,
        x2,
        y2,
      }
    })
  }

  // Clear drawings on New Game only
  const handleForceStopAi = (e: CustomEvent) => {
    try {
      const reason = (e as any)?.detail?.reason
      if (reason === 'new-game') {
        clearUserDrawings()
      }
    } catch {}
  }
  onMounted(() => {
    window.addEventListener('force-stop-ai', handleForceStopAi as EventListener)
  })
  onUnmounted(() => {
    window.removeEventListener(
      'force-stop-ai',
      handleForceStopAi as EventListener
    )
  })

  // Register user arrow provider to game-state
  try {
    const provider = () =>
      userArrows.value.map(a => ({
        fromRow: a.fromRow,
        fromCol: a.fromCol,
        toRow: a.toRow,
        toCol: a.toCol,
      }))
    gs?.registerUserArrowProvider?.(provider)
  } catch {}

  // Register user drawings flip function to game-state
  try {
    gs?.registerUserDrawingsFlipFunction?.(flipUserDrawings)
  } catch {}

  // Execute clear history and move after user confirmation
  const onConfirmClearHistory = () => {
    if (pendingMove.value) {
      gs.clearHistoryAndMove(
        pendingMove.value.piece,
        pendingMove.value.row,
        pendingMove.value.col
      )
    }
    showClearHistoryDialog.value = false
    pendingMove.value = null
  }
  const onCancelClearHistory = () => {
    showClearHistoryDialog.value = false
    pendingMove.value = null
  }

  /* ===== Arrow ===== */
  // Support multiple arrows for MultiPV
  interface Arrow {
    x1: number
    y1: number
    x2: number
    y2: number
    pv: number
  }
  const arrs = ref<Arrow[]>([])

  // Convert UCI coordinates to display coordinates for arrow positioning
  // This function converts UCI coordinates to row/col coordinates that match the display
  const uciToDisplayRC = (uci: string) => {
    if (uci.length < 4)
      return { from: { row: 0, col: 0 }, to: { row: 0, col: 0 } }

    // Parse UCI coordinates
    const fromCol = uci.charCodeAt(0) - 'a'.charCodeAt(0)
    const fromRow = 9 - +uci[1]
    const toCol = uci.charCodeAt(2) - 'a'.charCodeAt(0)
    const toRow = 9 - +uci[3]

    // Apply display transformation based on board flip state
    if (!gs.isBoardFlipped.value) {
      // Normal state: no coordinate conversion needed
      return {
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
      }
    } else {
      // Flipped state: apply both vertical and horizontal mirror transformations
      return {
        from: { row: 9 - fromRow, col: 8 - fromCol },
        to: { row: 9 - toRow, col: 8 - toCol },
      }
    }
  }

  // Parse PV moves from JAI engine analysis info
  const parseJaiAnalysisInfoForPV = (analysisInfo: string): string[][] => {
    if (!analysisInfo) return []

    const pvMoves: string[][] = []
    const lines = analysisInfo
      .split('\n')
      .filter(line => line.trim().length > 0)

    lines.forEach(line => {
      // Look for lines containing " pv " (Principal Variation)
      const pvIndex = line.indexOf(' pv ')
      if (pvIndex !== -1) {
        const pvString = line.slice(pvIndex + 4).trim() // 4 = ' pv '.length
        const moves = pvString.split(/\s+/).filter(move => move.length >= 4)

        if (moves.length > 0) {
          pvMoves.push(moves)
        }
      }
    })

    return pvMoves
  }

  const updateArrow = () => {
    // Check if we're in tournament mode and JAI engine is available
    const isMatchMode = (window as any).__MATCH_MODE__ || false
    const jaiAnalysisInfo = jaiEngine?.analysisInfo?.value || ''

    // Check if we're in human vs AI mode - if so, don't show ponder arrows
    const isHumanVsAiMode = (window as any).__HUMAN_VS_AI_MODE__ || false
    if (isHumanVsAiMode) {
      arrs.value = []
      return
    }

    // 1. If in tournament mode and JAI engine has analysis info, display arrows from JAI analysis
    // Only show arrows when match is actually running
    if (isMatchMode && isMatchRunning.value && jaiAnalysisInfo) {
      const jaiPvMoves = parseJaiAnalysisInfoForPV(jaiAnalysisInfo)
      if (jaiPvMoves.length > 0) {
        const arrows: Arrow[] = []
        jaiPvMoves.forEach((moves: string[], idx: number) => {
          if (!moves || !moves.length) return
          const mv = moves[0]
          if (mv && mv.length >= 4) {
            const coords = uciToDisplayRC(mv)
            const f = percentToSvgCoords(coords.from.row, coords.from.col),
              t = percentToSvgCoords(coords.to.row, coords.to.col)
            arrows.push({ x1: f.x, y1: f.y, x2: t.x, y2: t.y, pv: idx + 1 })
          }
        })
        arrs.value = arrows
        return
      }
    }

    // 2. If engine is pondering (but not infinite pondering) and not ponderhit, display expected move arrow
    if (
      isPondering.value &&
      !isInfinitePondering.value &&
      !ponderhit.value &&
      ponderMove.value
    ) {
      const mv = ponderMove.value
      if (mv && mv.length >= 4) {
        const coords = uciToDisplayRC(mv)
        const f = percentToSvgCoords(coords.from.row, coords.from.col),
          t = percentToSvgCoords(coords.to.row, coords.to.col)
        arrs.value = [{ x1: f.x, y1: f.y, x2: t.x, y2: t.y, pv: 1 }]
        return
      }
    }

    // 3. If engine is thinking or infinite pondering, display arrows for all available PVs
    if (
      (isThinking.value || (isPondering.value && isInfinitePondering.value)) &&
      multiPvMoves.value.length
    ) {
      const arrows: Arrow[] = []
      multiPvMoves.value.forEach((moves: string[], idx: number) => {
        if (!moves || !moves.length) return
        const mv = moves[0]
        if (mv && mv.length >= 4) {
          const coords = uciToDisplayRC(mv)
          const f = percentToSvgCoords(coords.from.row, coords.from.col),
            t = percentToSvgCoords(coords.to.row, coords.to.col)
          arrows.push({ x1: f.x, y1: f.y, x2: t.x, y2: t.y, pv: idx + 1 })
        }
      })
      arrs.value = arrows
      return
    }

    // 4. If not thinking and not pondering, show best move if available
    if (!isThinking.value && !isPondering.value && bestMove.value) {
      const mv = bestMove.value
      if (mv.length >= 4) {
        const coords = uciToDisplayRC(mv)
        const f = percentToSvgCoords(coords.from.row, coords.from.col),
          t = percentToSvgCoords(coords.to.row, coords.to.col)
        arrs.value = [{ x1: f.x, y1: f.y, x2: t.x, y2: t.y, pv: 1 }]
        return
      }
    }
    // Clear arrows
    arrs.value = []
  }
  // Use watchEffect to react to changes inside multiPvMoves deep
  watchEffect(() => {
    // dependencies: isThinking.value, isPondering.value, isInfinitePondering.value, ponderMove.value, ponderhit.value, bestMove.value, multiPvMoves.value, multiPvMoves.value.length
    // Also incorporate pvMoves for fallback
    void isThinking.value // track isThinking
    void isPondering.value // track isPondering
    void isInfinitePondering.value // track isInfinitePondering
    void ponderMove.value // track ponderMove
    void ponderhit.value // track ponderhit
    void multiPvMoves.value.map((m: string[]) => m.join(',')) // track nested arrays
    // Track JAI engine analysis info for tournament mode
    void jaiEngine?.analysisInfo?.value // track JAI analysis info
    void (window as any).__MATCH_MODE__ // track match mode state
    void isMatchRunning.value // track match running state
    updateArrow()
  })

  // Watch for board flip state changes and update the arrow accordingly
  watch(() => gs.isBoardFlipped.value, updateArrow)

  // Register arrow clearing callback
  registerArrowClearCallback(() => {
    arrs.value = []
  })

  // Wrap original methods (now just call the original method, arrow clearing is triggered automatically)
  const setupNewGameWithArrow = () => {
    // Disable during match running
    if (isMatchRunning.value) {
      return
    }
    // Stop engine analysis before starting new game to prevent continued thinking
    if (es.stopAnalysis) {
      es.stopAnalysis()
    }
    setupNewGame()
  }
  const inputFenStringWithArrow = () => {
    // Disable during match running
    if (isMatchRunning.value) {
      return
    }
    // Stop engine analysis before inputting FEN to prevent continued thinking
    if (es.stopAnalysis) {
      es.stopAnalysis()
    }
    // Directly call the inputFenString function from game-state
    inputFenString()
  }

  // Paste FEN from clipboard functionality
  const pasteFenFromClipboard = async () => {
    // Disable during match running
    if (isMatchRunning.value) {
      return
    }
    // Stop engine analysis before pasting FEN to prevent continued thinking
    if (es.stopAnalysis) {
      es.stopAnalysis()
    }

    try {
      // Get FEN string from clipboard using backend command
      const { invoke } = await import('@tauri-apps/api/core')
      const clipboardText = await invoke('paste_from_clipboard')

      // Clean the FEN string
      const trimmedFen = clipboardText.trim()

      // Validate FEN before applying
      if (trimmedFen && !validateJieqiFen(trimmedFen)) {
        console.warn('Invalid FEN format pasted from clipboard:', trimmedFen)
        // Optionally show an error message to the user
        alert(t('errors.invalidFenFormat'))
        return
      }

      // Apply the FEN string to the game using the same method as FEN input dialog
      gs.confirmFenInput(trimmedFen)
    } catch (e) {
      console.error('粘贴FEN失败', e)
      alert('无法从剪贴板读取内容，请检查应用权限。')
    }
  }

  /* ===== Arrow Colors ===== */
  const arrowColors = [
    '#0066cc',
    '#e53935',
    '#43a047',
    '#ffb300',
    '#8e24aa',
    '#00897b',
  ]
  const arrowColor = (idx: number) => arrowColors[idx % arrowColors.length]

  // Helper to convert stored row to display row based on flip state
  const displayRow = (r: number) => (gs.isBoardFlipped.value ? 9 - r : r)

  // Helper to convert stored column to display column based on flip state
  const displayCol = (c: number) => (gs.isBoardFlipped.value ? 8 - c : c)

  // Get annotation class for highlighting
  const getAnnotationClass = (_positions: any) => {
    const currentAnnotation = getCurrentMoveAnnotation()
    if (!currentAnnotation) return ''

    switch (currentAnnotation) {
      case '!!':
        return 'annot-brilliant'
      case '!':
        return 'annot-good'
      case '!?':
        return 'annot-interesting'
      case '?!':
        return 'annot-dubious'
      case '?':
        return 'annot-mistake'
      case '??':
        return 'annot-blunder'
      default:
        return ''
    }
  }

  // Get current move annotation
  const getCurrentMoveAnnotation = () => {
    // Suppress annotation display while a flip selection dialog is pending
    try {
      if (gs?.pendingFlip?.value) return null
    } catch {}
    if (
      currentMoveIndex.value <= 0 ||
      currentMoveIndex.value > history.value.length
    ) {
      return null
    }
    const moveEntry = history.value[currentMoveIndex.value - 1]
    return moveEntry?.annotation || null
  }

  /* ===== Evaluation Bar (cp -> percent) ===== */
  const extractCpFromInfoLine = (line: string): number | null => {
    if (!line) return null
    const m = line.match(/score\s+(cp|mate)\s+(-?\d+)/)
    if (!m) return null
    const type = m[1]
    const val = parseInt(m[2])
    if (Number.isNaN(val)) return null
    if (type === 'mate') {
      const ply = Math.abs(val)
      const sign = val >= 0 ? 1 : -1
      // ±(MATE_SCORE_BASE - ply)
      return sign * (MATE_SCORE_BASE - ply)
    }
    return val
  }

  // Track the last analysis info to detect changes
  const lastAnalysisInfo = ref<string>('')
  const lastJaiAnalysisInfo = ref<string>('')
  const lastEvalCp = ref<number | null>(null)
  const lastAnalysisSideToMove = ref<string | null>(null)

  const currentEvalCp = computed<number | null>(() => {
    // Prefer JAI match analysis if available in match mode
    const isMatchMode = (window as any).__MATCH_MODE__ || false
    const jaiInfo: string | undefined = jaiEngine?.analysisInfo?.value

    if (isMatchMode && jaiInfo) {
      // Check if JAI analysis info has changed
      if (jaiInfo !== lastJaiAnalysisInfo.value) {
        lastJaiAnalysisInfo.value = jaiInfo

        const lines = jaiInfo
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean)
        // Use the latest info line with a valid score
        for (let i = lines.length - 1; i >= 0; i--) {
          const cp = extractCpFromInfoLine(lines[i])
          if (cp !== null) {
            let val = cp
            if (isPondering.value && !isInfinitePondering.value) val = -val

            // Store the side to move when we get new analysis info
            try {
              lastAnalysisSideToMove.value = gs?.sideToMove?.value || null
            } catch {}

            // Normalize to Red's perspective using the side to move when analysis info was received
            if (lastAnalysisSideToMove.value === 'black') {
              val = -val
            }

            lastEvalCp.value = val
            return val
          }
        }
      } else {
        // Analysis info hasn't changed, return the last computed value
        return lastEvalCp.value
      }
    }

    // Fallback to regular UCI engine analysis
    const analysis: string | undefined = (es as any)?.analysis?.value
    if (analysis) {
      // Check if UCI analysis info has changed
      if (analysis !== lastAnalysisInfo.value) {
        lastAnalysisInfo.value = analysis

        const lines = analysis
          .split('\n')
          .map((l: string) => l.trim())
          .filter(Boolean)
        // The first line is usually MultiPV #1, but use the latest valid score just in case
        for (let i = lines.length - 1; i >= 0; i--) {
          const cp = extractCpFromInfoLine(lines[i])
          if (cp !== null) {
            let val = cp
            if (isPondering.value && !isInfinitePondering.value) val = -val

            // Store the side to move when we get new analysis info
            try {
              lastAnalysisSideToMove.value = gs?.sideToMove?.value || null
            } catch {}

            // Normalize to Red's perspective using the side to move when analysis info was received
            if (lastAnalysisSideToMove.value === 'black') {
              val = -val
            }

            lastEvalCp.value = val
            return val
          }
        }
      } else {
        // Analysis info hasn't changed, return the last computed value
        return lastEvalCp.value
      }
    }

    // No analysis info available, reset cached values
    lastAnalysisInfo.value = ''
    lastJaiAnalysisInfo.value = ''
    lastEvalCp.value = null
    lastAnalysisSideToMove.value = null
    return null
  })

  const currentEvalPercent = computed<number | null>(() => {
    let cp = currentEvalCp.value
    if (cp === null || cp === undefined) return null
    // Smooth mapping cp -> red side percent using tanh compression
    const m = Math.tanh(cp / 600)
    const redPct = Math.max(0, Math.min(100, Math.round((m + 1) * 50)))
    // Convert to top segment percent based on which side is on top
    const topPct = isRedOnTop.value ? redPct : 100 - redPct
    return topPct
  })
</script>

<style scoped lang="scss">
  .chessboard-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 100%;
    max-width: 70vmin;
    margin: 0 auto;

    // When position chart is visible, adjust gap
    &.has-chart {
      gap: 12px;
      width: 100%;
      max-width: 72vmin;
    }

    // Mobile responsive adjustments
    @media (max-width: 768px) {
      gap: 12px;
      max-width: 90vmin;

      &.has-chart {
        gap: 8px;
        max-width: 90vmin;
      }
    }
  }

  /* Evaluation bar styles */
  .eval-bar {
    position: absolute;
    top: 0;
    bottom: 0;
    left: -12px; // slightly outside the board
    width: 8px;
    border-radius: 4px;
    overflow: hidden;
    background: #ddd;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
    z-index: 5;
    pointer-events: none;

    @media (max-width: 768px) {
      left: -10px;
      width: 6px;
    }
  }
  .eval-top {
    width: 100%;
    background: #e53935; // red side advantage
    transition: height 0.15s ease;
    pointer-events: none;
  }
  .eval-bottom {
    width: 100%;
    background: #333; // black side advantage
    transition: height 0.15s ease;
    pointer-events: none;
  }
  .eval-marker {
    position: absolute;
    left: -3px;
    right: -3px;
    height: 2px;
    background: #ffffff;
    opacity: 0.9;
    pointer-events: none;
  }

  .chessboard-container {
    position: relative;
    width: 100%;
    aspect-ratio: 9/10;
    margin: auto;
    /* Disable text selection and double-click highlighting */
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    /* Disable double-click highlighting */
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;

    // Mobile responsive adjustments
    @media (max-width: 768px) {
      width: 100%;
    }
  }
  .bg {
    width: 100%;
    height: 100%;
    display: block;
    /* Disable image selection */
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    /* Disable double-click highlighting */
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }
  .pieces {
    position: absolute;
    inset: 0;
    z-index: 20;
    /* Disable text selection and double-click highlighting */
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    /* Disable double-click highlighting */
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }
  .piece {
    position: absolute;
    aspect-ratio: 1;
    pointer-events: none;
    /* Disable image selection */
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    /* Disable double-click highlighting */
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    &.animated {
      transition: all 0.2s ease;
    }
    &.selected {
      transform: translate(-50%, -50%) scale(1.1);
      filter: drop-shadow(0 0 8px #f00);
    }
    &.inCheck {
      transform: translate(-50%, -50%) scale(1.13);
      filter: drop-shadow(0 0 0 #f00) drop-shadow(0 0 16px #ff2222)
        drop-shadow(0 0 32px #ff2222);
      z-index: 1100;
    }
  }

  .ar {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 30;
    /* Disable text selection and double-click highlighting */
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    /* Disable double-click highlighting */
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  .user-drawings {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 35;
    /* Disable text selection and double-click highlighting */
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    /* Disable double-click highlighting */
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }
  .al {
    stroke-width: 1;
    stroke-opacity: 0.9;
  }

  .panel {
    position: absolute;
    bottom: -55px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;

    // Mobile responsive adjustments
    @media (max-width: 768px) {
      bottom: -45px;
      gap: 6px;

      .v-btn {
        font-size: 12px;
        padding: 4px 8px;
      }
    }
  }
  .copy-success-tip {
    position: absolute;
    bottom: -25px;
    left: 50%;
    transform: translateX(-50%);
    color: #2ecc71;
    font-size: 12px;
    background: rgba(255, 255, 255, 0.95);
    padding: 4px 8px;
    border-radius: 4px;
    z-index: 100;
    pointer-events: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* Last move highlight styles */
  .last-move-highlights {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 10;
    /* Disable text selection and double-click highlighting */
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    /* Disable double-click highlighting */
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }
  .highlight {
    position: absolute;
    width: 12%;
    aspect-ratio: 1;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    /* Disable text selection and double-click highlighting */
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    /* Disable double-click highlighting */
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }
  .highlight.from {
    border: 3px solid #ff6b6b;
    background: rgba(255, 107, 107, 0.2);
  }

  /* Annotation background colors for highlight.from */
  .highlight.from.annot-brilliant {
    background: rgba(0, 102, 204, 0.2);
  }
  .highlight.from.annot-good {
    background: rgba(0, 188, 212, 0.2);
  }
  .highlight.from.annot-interesting {
    background: rgba(139, 195, 74, 0.2);
  }
  .highlight.from.annot-dubious {
    background: rgba(255, 152, 0, 0.2);
  }
  .highlight.from.annot-mistake {
    background: rgba(255, 87, 34, 0.2);
  }
  .highlight.from.annot-blunder {
    background: rgba(244, 67, 54, 0.2);
  }
  .highlight.to {
    border: 3px solid #4ecdc4;
    background: rgba(78, 205, 196, 0.2);
    position: relative;
  }

  /* Annotation badge styles */
  .annotation-badge {
    position: absolute;
    top: -12px;
    right: -12px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: bold;
    color: white;
    border: 2px solid white;
  }

  /* Annotation color classes */
  .annot-brilliant {
    border-color: #0066cc !important;
  }
  .annot-brilliant .annotation-badge {
    background: #0066cc;
  }

  .annot-good {
    border-color: #00bcd4 !important;
  }
  .annot-good .annotation-badge {
    background: #00bcd4;
  }

  .annot-interesting {
    border-color: #8bc34a !important;
  }
  .annot-interesting .annotation-badge {
    background: #8bc34a;
  }

  .annot-dubious {
    border-color: #ff9800 !important;
  }
  .annot-dubious .annotation-badge {
    background: #ff9800;
  }

  .annot-mistake {
    border-color: #ff5722 !important;
  }
  .annot-mistake .annotation-badge {
    background: #ff5722;
  }

  .annot-blunder {
    border-color: #f44336 !important;
  }
  .annot-blunder .annotation-badge {
    background: #f44336;
  }

  /* Annotation overlay above pieces and last move highlight */
  .annotation-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 3000; // above all pieces and highlights
  }
  .annotation-anchor {
    position: absolute;
    width: 12%;
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
  }

  /* Valid move indicator styles */
  .valid-moves-indicators {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 15;
    /* Disable text selection and double-click highlighting */
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    /* Disable double-click highlighting */
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }
  .valid-move-dot {
    position: absolute;
    width: 8%;
    aspect-ratio: 1;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: rgba(76, 175, 80, 0.6);
    border: 2px solid #4caf50;
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.4);
    /* Disable text selection and double-click highlighting */
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    /* Disable double-click highlighting */
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  /* Arrow labels */
  .arrow-label {
    fill: #0066cc;
    font-size: 3px;
    font-weight: bold;
    pointer-events: none;
    user-select: none;
  }

  .board-labels {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible;

    .rank-labels,
    .file-labels {
      span {
        position: absolute;
        color: #666;
        font-size: 14px;
        font-weight: bold;
        user-select: none;
      }
    }

    .rank-labels span {
      right: -10px;
    }

    .file-labels span {
      bottom: -17px;
    }
  }
</style>
