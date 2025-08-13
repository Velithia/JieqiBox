<template>
  <div class="evaluation-chart">
    <h3 class="chart-title">
      {{ $t('evaluationChart.title') }}
    </h3>

    <!-- Chart container -->
    <div class="chart-container" ref="chartContainer">
      <canvas ref="chartCanvas" class="chart-canvas"></canvas>

      <!-- Move labels overlay -->
      <div class="move-labels" v-if="showMoveLabels">
        <div
          v-for="(label, index) in moveLabels"
          :key="index"
          class="move-label"
          :style="label.style"
          :class="{ 'current-move': label.isCurrentMove }"
        >
          {{ label.text }}
        </div>
      </div>

      <!-- Score tooltip -->
      <div v-if="tooltipVisible" class="score-tooltip" :style="tooltipStyle">
        <div class="tooltip-move">{{ tooltipData.move }}</div>
        <div class="tooltip-score" :class="tooltipData.scoreClass">
          {{ tooltipData.score }}
        </div>
        <div class="tooltip-time" v-if="tooltipData.time">
          {{ tooltipData.time }}
        </div>
      </div>
    </div>

    <!-- Right click hint at bottom -->
    <div class="chart-hint-bottom">
      {{ rightClickHintText }}
    </div>
    <Teleport to="body">
      <div
        v-if="contextMenuVisible"
        ref="contextMenu"
        class="context-menu"
        :style="contextMenuStyle"
      >
        <div class="context-menu-item" @click="toggleShowMoveLabels">
          <v-switch
            v-model="showMoveLabels"
            :label="$t('evaluationChart.showMoveLabels')"
            color="primary"
            hide-details
            density="compact"
            @click.stop
          />
        </div>
        <div class="context-menu-item" @click="toggleUseLinearYAxis">
          <v-switch
            v-model="useLinearYAxis"
            :label="$t('evaluationChart.linearYAxis')"
            color="primary"
            hide-details
            density="compact"
            @click.stop
          />
        </div>
        <div class="context-menu-item" @click="toggleShowOnlyLines">
          <v-switch
            v-model="showOnlyLines"
            :label="$t('evaluationChart.showOnlyLines')"
            color="primary"
            hide-details
            density="compact"
            @click.stop
          />
        </div>
        <div class="context-menu-item" @click="toggleBlackPerspective">
          <v-switch
            v-model="blackPerspective"
            :label="$t('evaluationChart.blackPerspective')"
            color="primary"
            hide-details
            density="compact"
            @click.stop
          />
        </div>
        <!-- Clamp Y-Axis Controls -->
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" @click="toggleEnableYAxisClamp">
          <v-switch
            v-model="enableYAxisClamp"
            :label="$t('evaluationChart.clampYAxis')"
            color="primary"
            hide-details
            density="compact"
            @click.stop
          />
        </div>
        <div class="context-menu-item" @click.stop>
          <v-text-field
            v-model.number="yAxisClampValue"
            :label="$t('evaluationChart.clampValue')"
            :disabled="!enableYAxisClamp"
            type="number"
            min="1"
            step="50"
            variant="underlined"
            density="compact"
            hide-details
            class="clamp-input"
          ></v-text-field>
        </div>
        <!-- Color Scheme Controls -->
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" @click.stop>
          <v-select
            v-model="colorScheme"
            :label="$t('evaluationChart.colorScheme')"
            :items="[
              { title: $t('evaluationChart.redGreen'), value: 'default' },
              { title: $t('evaluationChart.blueOrange'), value: 'blueOrange' },
            ]"
            variant="underlined"
            density="compact"
            hide-details
            class="color-scheme-select"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
  import { useI18n } from 'vue-i18n'
  import type { HistoryEntry } from '@/composables/useChessGame'
  import { useEvaluationChartSettings } from '@/composables/useEvaluationChartSettings'
  import { isMobilePlatform } from '@/utils/platform'

  const { t } = useI18n()

  /* ---------- Component Props ---------- */
  interface Props {
    history: HistoryEntry[]
    currentMoveIndex: number
  }
  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'seek', moveIndex: number): void
  }>()

  /* ---------- Canvas-related Refs ---------- */
  const chartCanvas = ref<HTMLCanvasElement | null>(null)
  const chartContainer = ref<HTMLElement | null>(null)
  const chartContext = ref<CanvasRenderingContext2D | null>(null)

  /* ---------- Display State ---------- */
  // Get persistent settings from the composable
  const {
    showMoveLabels,
    useLinearYAxis,
    showOnlyLines,
    blackPerspective,
    enableYAxisClamp,
    yAxisClampValue,
    colorScheme,
  } = useEvaluationChartSettings()

  const tooltipVisible = ref(false)
  const tooltipStyle = ref({ left: '0px', top: '0px' })
  const tooltipData = ref({
    move: '',
    score: '',
    scoreClass: '',
    time: '',
  })

  /* ---------- Platform-specific Text ---------- */
  const rightClickHintText = computed(() => {
    const isMobile = isMobilePlatform()
    if (isMobile) {
      return t('evaluationChart.longPressHint')
    }
    return t('evaluationChart.rightClickHint')
  })

  /* ---------- Zoom & Pan State ---------- */
  const zoomLevel = ref(1.0)
  const minZoom = 1.0
  const maxZoom = 20.0 // Allow zooming in up to 20x
  const panOffset = ref(0) // The starting move index for the visible area
  const isPanning = ref(false)
  const lastPanX = ref(0)
  const panStartX = ref(0)
  const panStartY = ref(0)
  const didPanSinceMouseDown = ref(false)
  const suppressNextClick = ref(false)

  /* ---------- Context Menu State ---------- */
  const contextMenuVisible = ref(false)
  const contextMenuStyle = ref<{
    left: string
    top: string
    visibility?: 'visible' | 'hidden'
  }>({ left: '0px', top: '0px' })
  const contextMenu = ref<HTMLElement | null>(null) // Ref for the context menu element itself

  // Context menu toggle functions
  const toggleShowMoveLabels = () => {
    showMoveLabels.value = !showMoveLabels.value
  }
  const toggleUseLinearYAxis = () => {
    useLinearYAxis.value = !useLinearYAxis.value
  }
  const toggleShowOnlyLines = () => {
    showOnlyLines.value = !showOnlyLines.value
  }
  const toggleBlackPerspective = () => {
    blackPerspective.value = !blackPerspective.value
  }
  const toggleEnableYAxisClamp = () => {
    enableYAxisClamp.value = !enableYAxisClamp.value
  }

  // Context menu event handlers
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    suppressNextClick.value = true
    contextMenuVisible.value = true
    contextMenuStyle.value = {
      left: `${e.clientX}px`,
      top: `${e.clientY}px`,
      visibility: 'hidden',
    }
    nextTick(() => {
      if (contextMenu.value) {
        const menuHeight = contextMenu.value.offsetHeight
        const menuWidth = contextMenu.value.offsetWidth
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        let top = e.clientY - menuHeight
        let left = e.clientX
        if (top < 0) top = 0
        if (left + menuWidth > viewportWidth) left = viewportWidth - menuWidth
        // Check if menu would go below viewport
        if (top + menuHeight > viewportHeight) top = viewportHeight - menuHeight
        contextMenuStyle.value = {
          left: `${left}px`,
          top: `${top}px`,
          visibility: 'visible',
        }
      }
    })
  }

  const handleContextMenuClickOutside = (e: MouseEvent) => {
    const isClickInsideChart =
      chartContainer.value?.contains(e.target as Node) ?? false
    const isClickInsideMenu =
      contextMenu.value?.contains(e.target as Node) ?? false
    if (!isClickInsideChart && !isClickInsideMenu && contextMenuVisible.value) {
      contextMenuVisible.value = false
    }
  }

  /* ---------- Dimensions ---------- */
  const chartWidth = ref(0)
  const chartHeight = ref(0)
  const padding = { top: 20, right: 20, bottom: 40, left: 60 }

  /* ---------- Parameter: asinh Scaling Factor ---------- */
  const scaleFactor = 100 // <- Key parameter
  const transform = (s: number) => Math.asinh(s / scaleFactor)
  const inverseTransform = (v: number) => Math.sinh(v) * scaleFactor

  /* ---------- Data Preprocessing ---------- */
  const chartData = computed(() => {
    const data: Array<{
      moveIndex: number
      moveNumber: number
      moveText: string
      score: number | null
      time: number | null
      isRedMove: boolean
    }> = []
    data.push({
      moveIndex: 0,
      moveNumber: 0,
      moveText: t('evaluationChart.opening'),
      score: null,
      time: null,
      isRedMove: false,
    })
    let moveCount = 0
    props.history.forEach((entry, index) => {
      if (entry.type === 'move') {
        moveCount++
        const moveNumber = Math.floor((moveCount - 1) / 2) + 1
        const isRedMove = (moveCount - 1) % 2 === 0
        const moveText = `${moveNumber}${isRedMove ? '.' : '...'} ${entry.data}`
        let converted = entry.engineScore
        if (converted !== null && converted !== undefined && !isRedMove) {
          converted = -converted
        }
        if (
          converted !== null &&
          converted !== undefined &&
          blackPerspective.value
        ) {
          converted = -converted
        }
        data.push({
          moveIndex: index + 1,
          moveNumber,
          moveText,
          score: converted ?? null,
          time: entry.engineTime ?? null,
          isRedMove,
        })
      }
    })
    return data
  })

  /* ---------- Move Labels ---------- */
  const moveLabels = computed(() => {
    if (
      !showMoveLabels.value ||
      !chartData.value.length ||
      !chartContainer.value
    )
      return []
    const labels: Array<{
      text: string
      style: { left: string; top: string }
      isCurrentMove: boolean
    }> = []
    const points = chartData.value
    const totalMoves = Math.max(1, points.length - 1)
    const visibleMoves = totalMoves / zoomLevel.value
    const startIndex = Math.floor(panOffset.value)
    const endIndex = Math.ceil(panOffset.value + visibleMoves)
    const areaWidth = chartWidth.value - padding.left - padding.right
    const labelStep = Math.max(1, Math.floor(visibleMoves / (areaWidth / 70)))
    for (let i = startIndex; i <= endIndex; i += 1) {
      if (i >= points.length) break
      const p = points[i]
      if (
        p &&
        p.score !== null &&
        p.score !== undefined &&
        p.moveNumber % labelStep === 0
      ) {
        const x =
          padding.left + ((i - panOffset.value) / visibleMoves) * areaWidth
        if (x >= padding.left && x <= chartWidth.value - padding.right) {
          labels.push({
            text: p.moveText,
            style: { left: `${x}px`, top: `${padding.top + 10}px` },
            isCurrentMove: p.moveIndex === props.currentMoveIndex,
          })
        }
      }
    }
    return labels
  })

  /* ---------- Main Drawing Function ---------- */
  const drawChart = () => {
    if (!chartCanvas.value || !chartContext.value) return
    const ctx = chartContext.value
    ctx.clearRect(0, 0, chartCanvas.value.width, chartCanvas.value.height)
    const points = chartData.value
    if (points.length < 2) return
    const area = {
      x: padding.left,
      y: padding.top,
      width: chartWidth.value - padding.left - padding.right,
      height: chartHeight.value - padding.top - padding.bottom,
    }
    const totalMoves = points.length - 1
    const visibleMoves = totalMoves / zoomLevel.value
    panOffset.value = Math.max(
      0,
      Math.min(panOffset.value, totalMoves - visibleMoves)
    )
    const startIndex = Math.floor(panOffset.value)
    const endIndex = Math.ceil(panOffset.value + visibleMoves)
    const visiblePoints = points.slice(
      Math.max(0, startIndex - 1),
      Math.min(points.length, endIndex + 2)
    )
    const scores = visiblePoints
      .map(p => p.score)
      .filter(s => s !== null) as number[]
    if (!scores.length) {
      ctx.fillStyle = '#999'
      ctx.font = '14px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(
        t('evaluationChart.noData'),
        area.x + area.width / 2,
        area.y + area.height / 2
      )
      return
    }

    // --- Y-AXIS SCALING LOGIC (CORRECTED) ---
    let axisMinScore, axisMaxScore
    const naturalMinScore = Math.min(...scores)
    const naturalMaxScore = Math.max(...scores)

    if (enableYAxisClamp.value && yAxisClampValue.value > 0) {
      // When clamping is ON, the axis range is strictly the intersection of the natural range and the clamp value.
      // NO PADDING is applied to prevent the axis from exceeding the clamp value.
      const clampVal = yAxisClampValue.value
      axisMinScore = Math.max(-clampVal, naturalMinScore)
      axisMaxScore = Math.min(clampVal, naturalMaxScore)
    } else {
      // When clamping is OFF, add padding for visual breathing room.
      const scoreRange = naturalMaxScore - naturalMinScore
      const scorePad = useLinearYAxis.value
        ? Math.max(50, scoreRange * 0.1)
        : Math.max(50, scoreRange * 0.1) // Padding for asinh can also be based on score range before transform
      axisMinScore = naturalMinScore - scorePad
      axisMaxScore = naturalMaxScore + scorePad
    }

    // Now, transform this definitive range to the canvas coordinate system.
    let minT: number
    let maxT: number
    if (useLinearYAxis.value) {
      minT = axisMinScore
      maxT = axisMaxScore
    } else {
      minT = transform(axisMinScore)
      maxT = transform(axisMaxScore)
    }
    const rangeT = maxT - minT || 1

    // --- DRAWING ---
    drawGrid(ctx, area, visibleMoves)
    drawScoreAxis(ctx, area, minT, maxT)
    drawMoveAxis(ctx, area, points, visibleMoves)
    drawScoreLine(ctx, area, points, minT, rangeT, visibleMoves)
    if (!showOnlyLines.value) {
      drawDataPoints(ctx, area, points, minT, rangeT, visibleMoves)
    }
    drawOffscreenIndicator(ctx, area, points, visibleMoves)
  }

  /* ---------- Drawing Helpers ---------- */
  const getClampedScore = (score: number): number => {
    if (enableYAxisClamp.value && yAxisClampValue.value > 0) {
      const clampVal = yAxisClampValue.value
      return Math.max(-clampVal, Math.min(score, clampVal))
    }
    return score
  }

  const getX = (
    index: number,
    areaWidth: number,
    visibleMoves: number
  ): number => {
    return padding.left + ((index - panOffset.value) / visibleMoves) * areaWidth
  }
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    area: any,
    visibleMoves: number
  ) => {
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    const rows = 5
    for (let i = 0; i <= rows; i++) {
      const y = area.y + (i / rows) * area.height
      ctx.beginPath()
      ctx.moveTo(area.x, y)
      ctx.lineTo(area.x + area.width, y)
      ctx.stroke()
    }
    const startIndex = Math.floor(panOffset.value)
    const endIndex = Math.ceil(panOffset.value + visibleMoves)
    for (let i = startIndex; i <= endIndex; i++) {
      const x = getX(i, area.width, visibleMoves)
      if (x >= area.x && x <= area.x + area.width) {
        ctx.beginPath()
        ctx.moveTo(x, area.y)
        ctx.lineTo(x, area.y + area.height)
        ctx.stroke()
      }
    }
  }
  const drawScoreAxis = (
    ctx: CanvasRenderingContext2D,
    area: any,
    minT: number,
    maxT: number
  ) => {
    ctx.fillStyle = '#666'
    ctx.font = '12px Arial'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    const rows = 5
    const rangeT = maxT - minT
    for (let i = 0; i <= rows; i++) {
      const tVal = minT + (i / rows) * rangeT
      const y = area.y + area.height - ((tVal - minT) / rangeT) * area.height
      let dispScore: number = useLinearYAxis.value
        ? tVal
        : inverseTransform(tVal)
      if (blackPerspective.value) {
        dispScore = -dispScore
      }
      ctx.fillText(formatScore(dispScore), area.x - 10, y)
    }
  }
  const drawMoveAxis = (
    ctx: CanvasRenderingContext2D,
    area: any,
    points: any[],
    visibleMoves: number
  ) => {
    ctx.fillStyle = '#666'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const startIndex = Math.floor(panOffset.value)
    const endIndex = Math.ceil(panOffset.value + visibleMoves)
    const step = Math.max(1, Math.floor(visibleMoves / (area.width / 40)))
    let lastDrawnMoveNumber = -1
    for (let i = startIndex; i <= endIndex; i++) {
      if (i >= 0 && i < points.length && points[i].moveNumber % step === 0) {
        const p = points[i]

        if (
          p.moveNumber > 0 &&
          p.moveNumber % step === 0 &&
          p.moveNumber !== lastDrawnMoveNumber
        ) {
          const x = getX(i, area.width, visibleMoves)

          if (x >= area.x && x <= area.x + area.width) {
            ctx.fillText(p.moveNumber.toString(), x, area.y + area.height + 5)
            lastDrawnMoveNumber = p.moveNumber
          }
        }
      }
    }
  }
  const getScoreColor = (score: number): string => {
    let displayScore = score
    if (blackPerspective.value) {
      displayScore = -displayScore
    }

    // Color scheme selection
    if (colorScheme.value === 'blueOrange') {
      if (displayScore < -100) return '#0072B2'
      if (displayScore > 100) return '#D55E00'
      if (displayScore < -50) return '#56B4E9'
      if (displayScore > 50) return '#E69F00'
      return '#666666'
    }

    // Default color scheme (red-green)
    if (displayScore > 100) return '#c62828'
    if (displayScore < -100) return '#2e7d32'
    if (displayScore > 50) return '#ef5350'
    if (displayScore < -50) return '#66bb6a'
    return '#666666'
  }
  const drawScoreLine = (
    ctx: CanvasRenderingContext2D,
    area: any,
    points: any[],
    minT: number,
    rangeT: number,
    visibleMoves: number
  ) => {
    const startIndex = Math.floor(panOffset.value)
    const endIndex = Math.ceil(panOffset.value + visibleMoves)
    if (showOnlyLines.value) {
      drawGradientLine(
        ctx,
        area,
        points,
        minT,
        rangeT,
        visibleMoves,
        startIndex,
        endIndex
      )
    } else {
      ctx.strokeStyle = '#1976d2'
      ctx.lineWidth = 2
      ctx.beginPath()
      let first = true
      for (let i = Math.max(0, startIndex); i <= endIndex + 1; i++) {
        if (i >= points.length) break
        const p = points[i]
        if (p.score !== null && p.score !== undefined) {
          const x = getX(i, area.width, visibleMoves)
          const clampedScore = getClampedScore(p.score)
          const t = useLinearYAxis.value
            ? clampedScore
            : transform(clampedScore)
          const y = area.y + area.height - ((t - minT) / rangeT) * area.height
          first ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          first = false
        }
      }
      ctx.stroke()
    }
  }
  const drawGradientLine = (
    ctx: CanvasRenderingContext2D,
    area: any,
    points: any[],
    minT: number,
    rangeT: number,
    visibleMoves: number,
    startIndex: number,
    endIndex: number
  ) => {
    let lastX = 0,
      lastY = 0,
      lastScore = 0,
      firstPoint = true
    for (let i = Math.max(0, startIndex); i <= endIndex + 1; i++) {
      if (i >= points.length) break
      const p = points[i]
      if (p.score !== null && p.score !== undefined) {
        const x = getX(i, area.width, visibleMoves)
        const clampedScore = getClampedScore(p.score)
        const t = useLinearYAxis.value ? clampedScore : transform(clampedScore)
        const y = area.y + area.height - ((t - minT) / rangeT) * area.height
        if (!firstPoint) {
          const gradient = ctx.createLinearGradient(lastX, lastY, x, y)
          const startColor = getScoreColor(lastScore)
          const endColor = getScoreColor(p.score)
          gradient.addColorStop(0, startColor)
          gradient.addColorStop(1, endColor)
          ctx.strokeStyle = gradient
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(lastX, lastY)
          ctx.lineTo(x, y)
          ctx.stroke()
        }
        lastX = x
        lastY = y
        lastScore = p.score
        firstPoint = false
      }
    }
  }
  const drawDataPoints = (
    ctx: CanvasRenderingContext2D,
    area: any,
    points: any[],
    minT: number,
    rangeT: number,
    visibleMoves: number
  ) => {
    const startIndex = Math.floor(panOffset.value)
    const endIndex = Math.ceil(panOffset.value + visibleMoves)
    for (let i = startIndex; i <= endIndex; i++) {
      if (i < 0 || i >= points.length) continue
      const p = points[i]
      if (p.score !== null && p.score !== undefined) {
        const x = getX(i, area.width, visibleMoves)
        if (x < area.x || x > area.x + area.width) continue
        const clampedScore = getClampedScore(p.score)
        const t = useLinearYAxis.value ? clampedScore : transform(clampedScore)
        const y = area.y + area.height - ((t - minT) / rangeT) * area.height
        const color = getScoreColor(p.score)
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()
        if (p.moveIndex === props.currentMoveIndex) {
          ctx.strokeStyle = '#ff9800'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(x, y, 6, 0, 2 * Math.PI)
          ctx.stroke()
        }
      }
    }
  }
  const drawOffscreenIndicator = (
    ctx: CanvasRenderingContext2D,
    area: any,
    points: any[],
    visibleMoves: number
  ) => {
    // Do not draw offscreen indicators at minimum zoom
    if (zoomLevel.value <= minZoom + 1e-6) return

    // Find the data point for the current move.
    const currentPoint = points.find(
      p => p.moveIndex === props.currentMoveIndex
    )

    // Exit if the current move isn't in the data (e.g., initial state).
    if (!currentPoint) return

    // Calculate the theoretical X coordinate where the current move would be.
    const currentX = getX(currentPoint.moveIndex, area.width, visibleMoves)

    // Check if the calculated position is outside the visible chart area.
    const epsilon = 0.5
    const isOffscreenLeft = currentX < area.x - epsilon
    const isOffscreenRight = currentX > area.x + area.width + epsilon

    if (isOffscreenLeft || isOffscreenRight) {
      // Set the style for the indicator. Use the same color as the current move highlight.
      ctx.fillStyle = '#ff9800'
      ctx.font = 'bold 16px Arial'
      ctx.textBaseline = 'middle' // Vertically center the arrow character.

      if (isOffscreenLeft) {
        // If the move is off-screen to the left, draw a left-pointing arrow.
        ctx.textAlign = 'left'
        ctx.fillText('◀', area.x + 5, area.y + area.height / 2)
      } else {
        // If the move is off-screen to the right, draw a right-pointing arrow.
        ctx.textAlign = 'right'
        ctx.fillText('▶', area.x + area.width - 5, area.y + area.height / 2)
      }
    }
  }

  /* ---------- Utility Functions ---------- */
  import { MATE_SCORE_BASE } from '@/utils/constants'
  const formatScore = (s: number) => {
    if (Math.abs(s) >= MATE_SCORE_BASE - 999) {
      const sign = s > 0 ? '+' : '-'
      const ply = Math.max(
        0,
        MATE_SCORE_BASE - Math.min(MATE_SCORE_BASE - 1, Math.abs(s))
      )
      return `${sign}M${ply}`
    }
    return Math.round(s).toString()
  }
  const getScoreClass = (s: number): string => {
    let displayScore = s
    if (blackPerspective.value) displayScore = -displayScore
    if (displayScore > 100) return 'score-positive'
    if (displayScore < -100) return 'score-negative'
    if (displayScore > 50) return 'score-slight-positive'
    if (displayScore < -50) return 'score-slight-negative'
    return 'score-neutral'
  }
  const formatTime = (ms: number) =>
    ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`

  /* ---------- Event Handlers ---------- */
  const handleWheel = (e: WheelEvent) => {
    if (!chartCanvas.value) return
    e.preventDefault()
    const areaWidth = chartWidth.value - padding.left - padding.right
    if (areaWidth <= 0) return
    const mouseX = e.offsetX
    const totalMoves = Math.max(1, chartData.value.length - 1)
    const currentVisibleMoves = totalMoves / zoomLevel.value
    const mouseProportion = (mouseX - padding.left) / areaWidth
    const moveIndexAtCursor =
      panOffset.value + mouseProportion * currentVisibleMoves
    const zoomFactor = 1.15
    const oldZoomLevel = zoomLevel.value
    let newZoomLevel =
      e.deltaY < 0 ? oldZoomLevel * zoomFactor : oldZoomLevel / zoomFactor
    zoomLevel.value = Math.max(minZoom, Math.min(maxZoom, newZoomLevel))
    const newVisibleMoves = totalMoves / zoomLevel.value
    panOffset.value = moveIndexAtCursor - mouseProportion * newVisibleMoves
    nextTick(drawChart)
  }
  const handleMouseDown = (e: MouseEvent) => {
    isPanning.value = true
    lastPanX.value = e.clientX
    panStartX.value = e.clientX
    panStartY.value = e.clientY
    didPanSinceMouseDown.value = false
    if (chartContainer.value) chartContainer.value.style.cursor = 'grabbing'
  }
  const handlePanEnd = () => {
    isPanning.value = false
    if (chartContainer.value)
      chartContainer.value.style.cursor =
        zoomLevel.value > 1.0 ? 'grab' : 'default'
  }
  const handleMouseLeave = () => {
    tooltipVisible.value = false
  }
  const handleMouseMove = (e: MouseEvent) => {
    if (!chartCanvas.value || !chartContainer.value) return
    if (isPanning.value) {
      tooltipVisible.value = false
      const totalMoves = Math.max(1, chartData.value.length - 1)
      const visibleMoves = totalMoves / zoomLevel.value
      const areaWidth = chartWidth.value - padding.left - padding.right
      const deltaX = e.clientX - lastPanX.value
      lastPanX.value = e.clientX
      const panDelta = (deltaX / areaWidth) * visibleMoves
      panOffset.value -= panDelta
      const dist =
        Math.abs(e.clientX - panStartX.value) +
        Math.abs(e.clientY - panStartY.value)
      if (dist > 4) didPanSinceMouseDown.value = true
      nextTick(drawChart)
      return
    }
    const points = chartData.value
    if (points.length < 2) {
      tooltipVisible.value = false
      return
    }
    const areaWidth = chartCanvas.value.width - padding.left - padding.right
    const totalMoves = points.length - 1
    const visibleMoves = totalMoves / zoomLevel.value
    const mouseProportion = (e.offsetX - padding.left) / areaWidth
    const moveIndex = panOffset.value + mouseProportion * visibleMoves
    const closestIndex = Math.round(moveIndex)
    if (closestIndex < 0 || closestIndex >= points.length) {
      tooltipVisible.value = false
      return
    }
    const closestPoint = points[closestIndex]
    const pointX = getX(closestIndex, areaWidth, visibleMoves)
    const distance = Math.abs(e.offsetX - pointX)
    const threshold = areaWidth / visibleMoves / 2
    if (closestPoint && closestPoint.score !== null && distance < threshold) {
      tooltipVisible.value = true
      let displayScore = closestPoint.score
      if (blackPerspective.value) displayScore = -displayScore
      tooltipData.value = {
        move: closestPoint.moveText,
        score: formatScore(displayScore),
        scoreClass: getScoreClass(displayScore),
        time: closestPoint.time ? formatTime(closestPoint.time) : '',
      }
      tooltipStyle.value = {
        left: `${e.offsetX + 15}px`,
        top: `${e.offsetY + 15}px`,
      }
    } else {
      tooltipVisible.value = false
    }
  }

  // Click to seek to the nearest move index
  const handleClick = (e: MouseEvent) => {
    if (!chartCanvas.value) return
    if (suppressNextClick.value) {
      suppressNextClick.value = false
      return
    }
    if (isPanning.value || didPanSinceMouseDown.value) {
      didPanSinceMouseDown.value = false
      return
    }
    const points = chartData.value
    if (points.length < 2) return
    const areaWidth = chartWidth.value - padding.left - padding.right
    if (areaWidth <= 0) return
    const totalMoves = points.length - 1
    const visibleMoves = totalMoves / zoomLevel.value
    const mouseProportion = (e.offsetX - padding.left) / areaWidth
    const moveIndex = panOffset.value + mouseProportion * visibleMoves
    const closestIndex = Math.round(
      Math.max(0, Math.min(points.length - 1, moveIndex))
    )
    emit('seek', closestIndex)
  }

  /* ---------- Resize Listener ---------- */
  const handleResize = () => {
    if (!chartCanvas.value || !chartContainer.value) return
    const ctn = chartContainer.value
    chartWidth.value = ctn.clientWidth
    chartHeight.value = ctn.clientHeight
    chartCanvas.value.width = chartWidth.value
    chartCanvas.value.height = chartHeight.value
    chartCanvas.value.style.width = `${chartWidth.value}px`
    chartCanvas.value.style.height = `${chartHeight.value}px`
    nextTick(drawChart)
  }

  /* ---------- Watchers for Data / Controls ---------- */
  watch(
    [() => props.history, () => props.currentMoveIndex],
    () => {
      nextTick(drawChart)
    },
    { deep: true }
  )
  watch(
    [
      showMoveLabels,
      useLinearYAxis,
      showOnlyLines,
      blackPerspective,
      enableYAxisClamp,
      yAxisClampValue,
      colorScheme,
    ],
    () => nextTick(drawChart)
  )

  /* ---------- Lifecycle Hooks ---------- */
  onMounted(() => {
    if (chartCanvas.value && chartContainer.value) {
      chartContext.value = chartCanvas.value.getContext('2d')
      chartCanvas.value.addEventListener('wheel', handleWheel, {
        passive: false,
      })
      chartCanvas.value.addEventListener('mousedown', handleMouseDown)
      chartCanvas.value.addEventListener('mousemove', handleMouseMove)
      chartCanvas.value.addEventListener('mouseleave', handleMouseLeave)
      chartCanvas.value.addEventListener('click', handleClick)
      chartCanvas.value.addEventListener('contextmenu', handleContextMenu)
      chartContainer.value.addEventListener('mouseup', handlePanEnd)
      chartContainer.value.addEventListener('mouseleave', handlePanEnd)
      handleResize()
      window.addEventListener('resize', handleResize)
      document.addEventListener('click', handleContextMenuClickOutside)
    }
  })
  onUnmounted(() => {
    if (chartCanvas.value && chartContainer.value) {
      chartCanvas.value.removeEventListener('wheel', handleWheel)
      chartCanvas.value.removeEventListener('mousedown', handleMouseDown)
      chartCanvas.value.removeEventListener('mousemove', handleMouseMove)
      chartCanvas.value.removeEventListener('mouseleave', handleMouseLeave)
      chartCanvas.value.removeEventListener('click', handleClick)
      chartCanvas.value.removeEventListener('contextmenu', handleContextMenu)
      chartContainer.value.removeEventListener('mouseup', handlePanEnd)
      chartContainer.value.removeEventListener('mouseleave', handlePanEnd)
    }
    window.removeEventListener('resize', handleResize)
    document.removeEventListener('click', handleContextMenuClickOutside)
  })
</script>

<style lang="scss" scoped>
  .evaluation-chart {
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    width: 100%;
    box-sizing: border-box;
    background-color: rgb(var(--v-theme-surface));
  }
  .chart-title {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 600;
  }
  .chart-container {
    position: relative;
    width: 100%;
    height: 200px;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 4px;
    overflow: hidden;
    cursor: default;
    user-select: none;
  }
  .chart-canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
  .move-labels {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }
  .move-label {
    position: absolute;
    background: rgba(var(--v-theme-surface), 0.9);
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    transform: translateX(-50%);
    white-space: nowrap;
    &.current-move {
      background: #ff9800;
      color: #fff;
      border-color: #f57c00;
    }
  }
  .score-tooltip {
    position: absolute;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    pointer-events: none;
    z-index: 1000;
    white-space: nowrap;
    .tooltip-move {
      font-weight: bold;
      margin-bottom: 4px;
    }
    .tooltip-score {
      font-weight: bold;
      margin-bottom: 2px;
      &.score-positive {
        color: #ef5350;
      }
      &.score-negative {
        color: #66bb6a;
      }
      &.score-slight-positive {
        color: #ffcdd2;
      }
      &.score-slight-negative {
        color: #c8e6c9;
      }
      &.score-neutral {
        color: #fff;
      }
    }
    .tooltip-time {
      color: #ccc;
      font-size: 10px;
    }
  }
  .chart-hint-bottom {
    margin-top: 8px;
    text-align: center;
    font-size: 15px;
    color: rgba(var(--v-theme-on-surface), 0.6);
  }
  .context-menu {
    position: fixed;
    background: rgb(var(--v-theme-surface));
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 4px 0;
    z-index: 1001;
    min-width: 190px;
    .context-menu-divider {
      height: 1px;
      background-color: rgba(var(--v-border-color), var(--v-border-opacity));
      margin: 4px 0;
    }
    .context-menu-item {
      padding: 0 12px; /* Adjusted padding for text-field alignment */
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: rgb(var(--v-theme-on-surface));
      transition: background-color 0.2s ease;
      &:hover {
        background-color: rgba(var(--v-theme-primary), 0.1);
      }
      .clamp-input {
        :deep(input) {
          text-align: center;
        }
      }
      .color-scheme-select {
        :deep(.v-field__input) {
          min-height: 36px;
          padding-top: 0;
          padding-bottom: 0;
        }
        :deep(.v-field__field) {
          min-height: 36px;
        }
      }
      :deep(.v-switch .v-label) {
        font-size: 13px;
      }
      :deep(.v-switch .v-selection-control) {
        min-height: auto;
        height: 36px;
      }
      .v-switch {
        margin: 0;
        flex-shrink: 0;
      }
    }
  }
  @media (max-width: 768px) {
    .evaluation-chart {
      padding: 12px;
    }
    .chart-container {
      height: 180px;
    }
    .chart-title {
      font-size: 14px;
    }
  }
</style>
