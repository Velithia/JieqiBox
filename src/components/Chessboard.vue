<template>
  <div class="chessboard-wrapper" :class="{ 'has-chart': showPositionChart }">
    <div class="chessboard-container">
      <img src="@/assets/xiangqi.png" class="bg" alt="board" />

      <!-- Pieces -->
      <div class="pieces" @click="boardClick">
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
          :style="
            rcStyle(
              displayRow(lastMovePositions.from.row),
              displayCol(lastMovePositions.from.col)
            )
          "
        ></div>
        <div
          class="highlight to"
          :style="
            rcStyle(
              displayRow(lastMovePositions.to.row),
              displayCol(lastMovePositions.to.col)
            )
          "
        ></div>
      </div>

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
      <svg class="ar" viewBox="0 0 90 100" preserveAspectRatio="none">
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
        <v-btn @click="copyFenToClipboard" size="small" color="button">{{
          $t('chessboard.copyFen')
        }}</v-btn>
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
          >{{ $t('chessboard.inputFen') }}</v-btn
        >
        <v-btn
          @click="setupNewGameWithArrow"
          size="small"
          color="button"
          :disabled="isMatchRunning"
          >{{ $t('chessboard.newGame') }}</v-btn
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
    />
  </div>
</template>

<script setup lang="ts">
  import { inject, ref, watch, computed, watchEffect } from 'vue'
  import type { Piece } from '@/composables/useChessGame'
  import { useInterfaceSettings } from '@/composables/useInterfaceSettings'
  import ClearHistoryConfirmDialog from './ClearHistoryConfirmDialog.vue'
  import EvaluationChart from './EvaluationChart.vue'

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

  const { showCoordinates, showAnimations, showPositionChart } =
    useInterfaceSettings()

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

    // 1. If in tournament mode and JAI engine has analysis info, display arrows from JAI analysis
    if (isMatchMode && jaiAnalysisInfo) {
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

    // Get FEN string from clipboard
    const clipboardText = await navigator.clipboard.readText()

    // Clean the FEN string
    const trimmedFen = clipboardText.trim()

    // Apply the FEN string to the game using the same method as FEN input dialog
    gs.confirmFenInput(trimmedFen)
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
      max-width: 70vmin;
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
  .highlight.to {
    border: 3px solid #4ecdc4;
    background: rgba(78, 205, 196, 0.2);
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
