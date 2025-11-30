// src/composables/useLinker.ts
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { invoke } from '@tauri-apps/api/core'
import {
  useImageRecognition,
  LABELS,
  type DetectionBox,
} from './image-recognition'

type ImageRecognitionInstance = ReturnType<typeof useImageRecognition>
export type LinkerMode = 'auto' | 'watch'
export type LinkerState =
  | 'idle'
  | 'selecting'
  | 'connecting'
  | 'paused'
  | 'error'
export type BoardGrid = (string | null)[][]

export interface WindowInfo {
  id: number
  name: string
  x: number
  y: number
  width: number
  height: number
  is_minimized: boolean
}

export interface CaptureResult {
  image_base64: string
  width: number
  height: number
}

export interface LinkerSettings {
  mouseClickDelay: number
  mouseMoveDelay: number
  scanInterval: number
  animationConfirm: boolean
}

const DEFAULT_SETTINGS: LinkerSettings = {
  mouseClickDelay: 50,
  mouseMoveDelay: 200,
  scanInterval: 400,
  animationConfirm: true,
}

// 映射表
const PIECE_TO_FEN: { [key: string]: string } = {
  r_general: 'K',
  r_advisor: 'A',
  r_elephant: 'B',
  r_horse: 'N',
  r_chariot: 'R',
  r_cannon: 'C',
  r_soldier: 'P',
  b_general: 'k',
  b_advisor: 'a',
  b_elephant: 'b',
  b_horse: 'n',
  b_chariot: 'r',
  b_cannon: 'c',
  b_soldier: 'p',
  dark: 'x',
  dark_r_general: 'X',
  dark_r_advisor: 'X',
  dark_r_elephant: 'X',
  dark_r_horse: 'X',
  dark_r_chariot: 'X',
  dark_r_cannon: 'X',
  dark_r_soldier: 'X',
  dark_b_general: 'x',
  dark_b_advisor: 'x',
  dark_b_elephant: 'x',
  dark_b_horse: 'x',
  dark_b_chariot: 'x',
  dark_b_cannon: 'x',
  dark_b_soldier: 'x',
}

// 揭棋棋子总量表 (不含帅将)
const TOTAL_PIECES: { [key: string]: number } = {
  R: 2,
  N: 2,
  B: 2,
  A: 2,
  C: 2,
  P: 5,
  r: 2,
  n: 2,
  b: 2,
  a: 2,
  c: 2,
  p: 5,
}

//const base64ToImageBitmap = async (base64: string): Promise<ImageBitmap> => {
// 更快的解码路径：fetch(dataURL) -> blob -> createImageBitmap
// createImageBitmap 在多数平台会更快并且有机会在后台线程处理解码
//const res = await fetch(`data:image/jpeg;base64,${base64}`)
//const blob = await res.blob()
//return await createImageBitmap(blob)
//}


export interface UseLinkerOptions {
  imageRecognition?: ImageRecognitionInstance
}

export function useLinker(options: UseLinkerOptions = {}) {
  const { t } = useI18n()
  let imageRecognition: ImageRecognitionInstance | null =
    options.imageRecognition || null
  const getImageRecognition = () => {
    if (!imageRecognition) imageRecognition = useImageRecognition()
    return imageRecognition
  }

  // --- 状态 ---
  const state = ref<LinkerState>('idle')
  const mode = ref<LinkerMode>('auto')
  const settings = ref<LinkerSettings>({ ...DEFAULT_SETTINGS })
  const errorMessage = ref<string>('')
  const isScanning = ref(false)

  const availableWindows = ref<WindowInfo[]>([])
  const selectedWindowId = ref<number | null>(null)
  const selectedWindow = ref<WindowInfo | null>(null)

  const recognizedBoard = ref<BoardGrid | null>(null)
  const previousBoard = ref<BoardGrid | null>(null)
  const boardBounds = ref<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const isReversed = ref(false)

  // 核心控制变量
  let scanTimer: ReturnType<typeof setInterval> | null = null
  let isProcessingFrame = false
  const stabilityCounter = ref(0)
  const lastStableFen = ref('') // 这个 FEN 包含暗子池信息
  const lastAutoExecutedMove = ref<string | null>(null)

  // 新架构变量
  const isMyTurn = ref(false)
  const waitingForExternalConfirm = ref(false)

  // 新增：历史最大明子数量记录 (用于计算暗子池)
  const maxRevealedCounts = ref<Record<string, number>>({})

  // 回调接口
  let onBoardUpdated: ((fen: string) => void) | null = null
  let onBoardInitialized: ((fen: string, isReversed: boolean) => void) | null =
    null
  let getEngineBestMove: (() => string | null) | null = null
  let isEngineThinking: (() => boolean) | null = null
  let requestEngineStart: (() => void) | null = null
  let stopEngine: (() => void) | null = null

  const isActive = computed(() => state.value === 'connecting')
  const statusText = computed(() => {
    if (state.value === 'error') return errorMessage.value
    if (state.value === 'connecting')
      return isScanning.value
        ? t('linker.status.scanning')
        : t('linker.status.connected')
    return t(`linker.status.${state.value}`)
  })

  // --- 新的控制量：用于忽略发送动作后若干帧（避免动画干扰） ---
  let framesToIgnore = 0
  const STABLE_THRESHOLD = 1 // 连续帧数阈值，1 表示 1 帧即可认为稳定

  // 最小棋子数阈值：用于过滤空棋盘或棋子过少的误检测帧
  // 此阈值设为2，代表任何有效对局的绝对最小棋子数（至少双方各有一个将/帅）
  // 实际正常对局通常有更多棋子，但设置较低阈值可以:
  // 1. 过滤游戏切换过程中完全空棋盘的误识别
  // 2. 同时允许残局等棋子较少的正常局面通过验证
  const MIN_PIECE_COUNT = 2

  // --- 核心逻辑 ---

  const rustLog = async (msg: string) => {
    // 把调试信息发回 Rust 日志（因为你说浏览器控制台不可见）
    try {
      await invoke('rust_log', { msg })
    } catch (e) {
      // 如果发送失败也别中断流程
      // console.warn('rust_log failed', e)
    }
  }

  const refreshWindowList = async () => {
    try {
      availableWindows.value = await invoke<WindowInfo[]>('list_windows')
    } catch (e) {
      errorMessage.value = t('linker.error.listWindowsFailed')
      await rustLog(`[Linker] list_windows error: ${String(e)}`)
    }
  }

  const selectWindow = async (windowId: number) => {
    try {
      selectedWindowId.value = windowId
      selectedWindow.value = await invoke<WindowInfo>('get_window_info', {
        windowId,
      })
    } catch (e) {
      errorMessage.value = t('linker.error.windowNotFound')
      await rustLog(`[Linker] get_window_info error: ${String(e)}`)
    }
  }

  const initializeModel = async () => {
    try {
      await getImageRecognition().initializeModel()
      return true
    } catch (e) {
      state.value = 'error'
      errorMessage.value = t('linker.error.modelInitFailed')
      await rustLog(`[Linker] model init failed: ${String(e)}`)
      return false
    }
  }

  const processDetectionsToBoard = async (boxes: DetectionBox[]) => {
    const ir = getImageRecognition()
    const isLocked = ir.isBoardLocked.value
    const grid = ir.updateBoardGrid(boxes)
    const boardBox = boxes
      .filter(b => LABELS[b.labelIndex]?.name === 'Board')
      .sort((a, b) => b.score - a.score)[0]

    if (!boardBox) {
      await rustLog(
        `[Linker] processDetectionsToBoard: No board found in ${boxes.length} detections, isBoardLocked=${isLocked}`
      )
      return null
    }
    const [bx, by, bw, bh] = boardBox.box

    const board: BoardGrid = Array(10)
      .fill(null)
      .map(() => Array(9).fill(null))

    let pieceCount = 0
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const piece = grid[r][c]
        if (piece) {
          const name = LABELS[piece.labelIndex]?.name
          if (name && PIECE_TO_FEN[name]) {
            board[r][c] = PIECE_TO_FEN[name]
            pieceCount++
          }
        }
      }
    }

    let reversed = false
    for (let r = 0; r < 3; r++)
      for (let c = 3; c < 6; c++) if (board[r][c] === 'K') reversed = true
    for (let r = 7; r < 10; r++)
      for (let c = 3; c < 6; c++) if (board[r][c] === 'k') reversed = true

    await rustLog(
      `[Linker] processDetectionsToBoard: Found ${pieceCount} pieces, isBoardLocked=${isLocked}, isReversed=${reversed}`
    )

    if (reversed) {
      const flipped: BoardGrid = Array(10)
        .fill(null)
        .map(() => Array(9).fill(null))
      for (let r = 0; r < 10; r++)
        for (let c = 0; c < 9; c++) flipped[r][c] = board[9 - r][8 - c]
      return {
        board: flipped,
        boardBox: { x: bx, y: by, width: bw, height: bh },
        isReversed: reversed,
        pieceCount,
      }
    }
    return {
      board,
      boardBox: { x: bx, y: by, width: bw, height: bh },
      isReversed: reversed,
      pieceCount,
    }
  }

  // 生成 Jieqi FEN（保持原逻辑）
  const generateJieqiFen = (board: BoardGrid, isRedTurn: boolean): string => {
    const boardFen = board
      .map(row => {
        let empty = 0,
          line = ''
        row.forEach(p => {
          if (p) {
            if (empty) {
              line += empty
              empty = 0
            }
            line += p
          } else empty++
        })
        if (empty) line += empty
        return line
      })
      .join('/')

    const currentCounts: Record<string, number> = {}
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = board[r][c]
        if (p && p !== 'X' && p !== 'x' && p !== 'K' && p !== 'k') {
          currentCounts[p] = (currentCounts[p] || 0) + 1
        }
      }
    }

    Object.keys(TOTAL_PIECES).forEach(key => {
      const current = currentCounts[key] || 0
      const max = maxRevealedCounts.value[key] || 0
      if (current > max) {
        maxRevealedCounts.value[key] = current
      }
    })

    const order = ['R', 'r', 'N', 'n', 'B', 'b', 'A', 'a', 'C', 'c', 'P', 'p']
    let poolStr = ''

    order.forEach(key => {
      const total = TOTAL_PIECES[key]
      const revealed = maxRevealedCounts.value[key] || 0
      const remainingInPool = Math.max(0, total - revealed)
      if (remainingInPool > 0) {
        poolStr += key + remainingInPool
      }
    })

    const turn = isRedTurn ? 'w' : 'b'
    return `${boardFen} ${turn} ${poolStr} - 0 1`
  }

  const boardToSimpleFen = (board: BoardGrid) => {
    return board
      .map(row => {
        let empty = 0,
          line = ''
        row.forEach(p => {
          if (p) {
            if (empty) {
              line += empty
              empty = 0
            }
            line += p
          } else empty++
        })
        if (empty) line += empty
        return line
      })
      .join('/')
  }

  const executeExternalMove = async (move: string): Promise<boolean> => {
    if (!selectedWindow.value || !boardBounds.value) return false
    const fC = move.charCodeAt(0) - 97,
      fR = 9 - parseInt(move[1])
    const tC = move.charCodeAt(2) - 97,
      tR = 9 - parseInt(move[3])
    const cw = boardBounds.value.width / 8
    const ch = boardBounds.value.height / 9
    const getPos = (c: number, r: number) => {
      if (isReversed.value)
        return {
          x: boardBounds.value!.width - c * cw,
          y: boardBounds.value!.height - r * ch,
        }
      return { x: c * cw, y: r * ch }
    }
    const start = getPos(fC, fR),
      end = getPos(tC, tR)
    const winX = selectedWindow.value.x + boardBounds.value.x
    const winY = selectedWindow.value.y + boardBounds.value.y

    try {
      await invoke('simulate_move', {
        fromX: Math.round(winX + start.x),
        fromY: Math.round(winY + start.y),
        toX: Math.round(winX + end.x),
        toY: Math.round(winY + end.y),
        clickDelayMs: settings.value.mouseClickDelay,
        moveDelayMs: settings.value.mouseMoveDelay,
      })
      return true
    } catch (e) {
      await rustLog(`[Linker] simulate_move error: ${String(e)}`)
      return false
    }
  }

  // 快速比较两个 board（逐格早退），替代 JSON.stringify 全量比较
  const boardsEqualFast = (a: BoardGrid | null, b: BoardGrid | null) => {
    if (!a || !b) return false
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        if (a[r][c] !== b[r][c]) return false
      }
    }
    return true
  }

  // 检测棋盘变化是"一次变化"、"两次变化"还是"重置"
  // 用于处理对手应着极快时，两步棋被合并检测为一次变化的情况
  // 比较时暗子('X'/'x')视为空位
  // 返回: 'single' 表示一次变化, 'double' 表示两次变化, 'reset' 表示新游戏
  //
  // 判定逻辑说明：
  // - 单次着法（包括吃子）只改变2个位点：起点变空，终点变成棋子
  // - 如果>4个位点变化，说明是新游戏（重置）
  // - 如果>2且<=4个位点变化，说明是两步棋合并
  // - 如果恰好2个位点变化但末状态均为空，说明是两步棋合并（例如A→B，然后B被吃掉移走）
  const detectChangeType = (
    prevBoard: BoardGrid | null,
    currBoard: BoardGrid
  ): 'single' | 'double' | 'reset' => {
    if (!prevBoard) return 'single'

    let changedCount = 0
    let allChangedToEmpty = true

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const prev = prevBoard[r][c]
        const curr = currBoard[r][c]
        if (prev !== curr) {
          changedCount++
          if (curr !== null) {
            allChangedToEmpty = false
          }
        }
      }
    }

    // 超过4个位点变化，判定为新游戏（重置）
    // 理由：正常单步棋最多改变2个位点，两步棋合并最多改变4个位点
    // 超过4个位点变化说明棋盘发生了重大改变，很可能是开始了新游戏
    if (changedCount > 4) return 'reset'

    // 超过2个位点变化，判定为两次变化
    if (changedCount > 2) return 'double'

    // 恰好2个位点变化，且末状态均为空，判定为两次变化
    // （正常单步棋的终点不可能为空，因为棋子会占据终点位置）
    if (changedCount === 2 && allChangedToEmpty) return 'double'

    return 'single'
  }

  const scanLoop = async () => {
    if (state.value !== 'connecting' || !isScanning.value) return
    if (isProcessingFrame) {
      return
    }
    if (framesToIgnore > 0) {
      framesToIgnore--
      return
    }
    isProcessingFrame = true
    const tStart = performance.now()
    try {
      const result = await captureAndProcess()
      const tAfterCapture = performance.now()
      await rustLog(
        `[Linker] frame timings: capture+decode ${(tAfterCapture - tStart).toFixed(1)} ms`
      )
      if (!result) {
        isProcessingFrame = false
        return
      }

      // 检查棋盘数据是否有效
      // 如果 board 为空或未定义，跳过此帧
      if (!result.board) {
        await rustLog(
          `[Linker] frame skipped: result.board is null or undefined`
        )
        isProcessingFrame = false
        return
      }

      // 检查棋子数量是否足够
      // 如果检测到的棋子数量低于阈值，说明可能是游戏切换过程中的空棋盘
      // 跳过此帧以避免向引擎发送无效的棋盘状态导致引擎卡死
      if (result.pieceCount < MIN_PIECE_COUNT) {
        await rustLog(
          `[Linker] frame skipped: pieceCount=${result.pieceCount} < MIN_PIECE_COUNT=${MIN_PIECE_COUNT}, likely empty board during game transition`
        )
        isProcessingFrame = false
        return
      }

      // 如果与 previousBoard 不同，则重置稳定计数
      if (
        previousBoard.value &&
        boardsEqualFast(previousBoard.value, result.board)
      ) {
        stabilityCounter.value++
      } else {
        stabilityCounter.value = 0
        previousBoard.value = result.board
        isProcessingFrame = false
        return
      }

      if (stabilityCounter.value < STABLE_THRESHOLD) {
        isProcessingFrame = false
        return
      }

      boardBounds.value = result.boardBox
      isReversed.value = result.isReversed

      const simpleFen = boardToSimpleFen(result.board)

      // 初始化逻辑
      if (!recognizedBoard.value) {
        recognizedBoard.value = result.board
        lastStableFen.value = simpleFen
        maxRevealedCounts.value = {}
        const initFen = generateJieqiFen(result.board, !result.isReversed)
        if (onBoardInitialized) onBoardInitialized(initFen, result.isReversed)
        isMyTurn.value = !result.isReversed
        await rustLog(
          `[Linker] initialized isReversed=${result.isReversed}, isMyTurn=${isMyTurn.value}`
        )
        isProcessingFrame = false
        return
      }

      // 检测棋盘变化
      if (simpleFen !== lastStableFen.value) {
        // 检测变化类型（单次变化/两次变化/重置）
        const changeType = detectChangeType(recognizedBoard.value, result.board)

        // 如果检测到重置（新游戏），重新初始化连线状态
        if (changeType === 'reset') {
          await rustLog(
            `[Linker] reset detected: new game started, reinitializing linker state`
          )
          // 停止引擎分析
          if (stopEngine) stopEngine()
          // 重置暗子池
          maxRevealedCounts.value = {}
          // 重置其他状态
          waitingForExternalConfirm.value = false
          lastAutoExecutedMove.value = null
          // 重新初始化棋盘
          recognizedBoard.value = result.board
          lastStableFen.value = simpleFen
          const initFen = generateJieqiFen(result.board, !result.isReversed)
          if (onBoardInitialized) onBoardInitialized(initFen, result.isReversed)
          isMyTurn.value = !result.isReversed
          isProcessingFrame = false
          return
        }

        recognizedBoard.value = result.board
        lastStableFen.value = simpleFen

        let nextTurnIsRed: boolean
        if (waitingForExternalConfirm.value) {
          waitingForExternalConfirm.value = false

          if (changeType === 'double') {
            // 检测到两次变化：己方应着 + 对方应着 合并为一次检测
            // 此时轮到己方
            isMyTurn.value = true
            nextTurnIsRed = !isReversed.value
            await rustLog(
              `[Linker] double change detected: AI + opponent moves merged -> our turn`
            )
          } else {
            // 单次变化：仅己方应着被确认
            isMyTurn.value = false
            nextTurnIsRed = isReversed.value
            if (stopEngine) stopEngine()
            await rustLog(`[Linker] external confirm: AI move validated`)
          }
        } else {
          isMyTurn.value = true
          nextTurnIsRed = !isReversed.value
          await rustLog(`[Linker] opponent moved -> our turn`)
        }

        const newFen = generateJieqiFen(result.board, nextTurnIsRed)
        if (onBoardUpdated) onBoardUpdated(newFen)
        lastAutoExecutedMove.value = null
      }

      // auto 模式下且轮到己方时尝试自动下棋
      if (
        mode.value === 'auto' &&
        isMyTurn.value &&
        !waitingForExternalConfirm.value
      ) {
        await tryAiAutoMove()
      }
      const tEnd = performance.now()
      await rustLog(
        `[Linker] total frame time ${(tEnd - tStart).toFixed(1)} ms`
      )
    } catch (e) {
      await rustLog(`[Linker] scanLoop error: ${String(e)}`)
    } finally {
      isProcessingFrame = false
    }
  }

  const tryAiAutoMove = async () => {
    if (!isMyTurn.value) return
    if (waitingForExternalConfirm.value) return
    if (isEngineThinking && isEngineThinking()) return

    if (getEngineBestMove) {
      const bestMove = getEngineBestMove()
      if (bestMove && bestMove !== lastAutoExecutedMove.value) {
        lastAutoExecutedMove.value = bestMove

        const success = await executeExternalMove(bestMove)
        if (success) {
          waitingForExternalConfirm.value = true
          // 发送动作后忽略若干帧以避免游戏动画影响识别
          framesToIgnore = 0
          stabilityCounter.value = 0
          await rustLog(
            `[Linker] sent move ${bestMove}, ignoring next ${framesToIgnore} frames`
          )
        }
        return
      }
    }

    if (requestEngineStart) {
      requestEngineStart()
    }
  }

  // 标记是否已经初始化过后台线程
  const isCapturerInitialized = ref(false)

  const base64ToUint8Array = (base64: string): Uint8Array => {
    const binary_string = window.atob(base64)
    const len = binary_string.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i)
    }
    return bytes
  }

  const captureAndProcess = async () => {
    if (!selectedWindowId.value) return null

    if (!isCapturerInitialized.value) {
      await invoke('init_capturer', {
        windowId: selectedWindowId.value,
        fps: 20,
      })
      isCapturerInitialized.value = true
      await new Promise(r => setTimeout(r, 100))
    }

    const t0 = performance.now()

    let b64Data: string
    try {
      b64Data = await invoke<string>('get_latest_capture_raw')
    } catch (e) {
      return null
    }

    const rawData = base64ToUint8Array(b64Data)

    const t1 = performance.now()
    await rustLog(`[Linker] transfer+decode: ${(t1 - t0).toFixed(1)} ms`)

    const ir = getImageRecognition()

    try {
      await ir.processRawData(rawData, 640, 640)
    } catch (e) {
      await rustLog(`[Linker] processRawData failed: ${String(e)}`)
      return null
    }

    const t2 = performance.now()
    await rustLog(`[Linker] inference: ${(t2 - t1).toFixed(1)} ms`)
    await rustLog(`[Linker] TOTAL: ${(t2 - t0).toFixed(1)} ms`)

    const winW = selectedWindow.value!.width
    const winH = selectedWindow.value!.height
    const scaleX = winW / 640
    const scaleY = winH / 640
    const result = await processDetectionsToBoard(ir.detectedBoxes.value)
    if (result) {
      result.boardBox.x *= scaleX
      result.boardBox.y *= scaleY
      result.boardBox.width *= scaleX
      result.boardBox.height *= scaleY
    }
    return result
  }

  const start = async () => {
    if (state.value === 'connecting') return
    await refreshWindowList()
    state.value = 'selecting'
    errorMessage.value = ''
  }

  const connect = async () => {
    if (!selectedWindowId.value) return
    if (!(await initializeModel())) return
    const res = await captureAndProcess()
    if (!res) {
      errorMessage.value = t('linker.error.noBoardDetected')
      return
    }

    previousBoard.value = res.board
    recognizedBoard.value = res.board
    boardBounds.value = res.boardBox
    isReversed.value = res.isReversed

    maxRevealedCounts.value = {}
    lastStableFen.value = boardToSimpleFen(res.board)
    waitingForExternalConfirm.value = false
    isMyTurn.value = !res.isReversed

    const initFen = generateJieqiFen(res.board, !res.isReversed)
    if (onBoardInitialized) onBoardInitialized(initFen, res.isReversed)

    // Lock the board after successful detection
    // This reuses the cached board bounding box for subsequent frames
    getImageRecognition().lockBoard(true)
    await rustLog(
      `[Linker] Board locked. Cached board box: x=${res.boardBox.x.toFixed(1)}, y=${res.boardBox.y.toFixed(1)}, w=${res.boardBox.width.toFixed(1)}, h=${res.boardBox.height.toFixed(1)}`
    )

    state.value = 'connecting'
    isScanning.value = true
    scanTimer = setInterval(scanLoop, settings.value.scanInterval)
  }

  const stop = () => {
    state.value = 'idle'
    isScanning.value = false
    if (scanTimer) clearInterval(scanTimer)
    scanTimer = null
    maxRevealedCounts.value = {}
    recognizedBoard.value = null
    previousBoard.value = null
    lastAutoExecutedMove.value = null
    waitingForExternalConfirm.value = false
    isMyTurn.value = false

    // Stop the engine analysis if it's running
    if (stopEngine) stopEngine()

    // Unlock the board when stopping
    getImageRecognition().lockBoard(false)
    // Note: rustLog is async but we don't await here to avoid blocking stop()
    rustLog('[Linker] Board unlocked. Cache cleared.')
  }

  const setCallbacks = (cbs: any) => {
    if (cbs.onBoardUpdated) onBoardUpdated = cbs.onBoardUpdated
    if (cbs.onBoardInitialized) onBoardInitialized = cbs.onBoardInitialized
    if (cbs.getEngineBestMove) getEngineBestMove = cbs.getEngineBestMove
    if (cbs.isEngineThinking) isEngineThinking = cbs.isEngineThinking
    if (cbs.requestEngineStart) requestEngineStart = cbs.requestEngineStart
    if (cbs.stopEngine) stopEngine = cbs.stopEngine
  }

  onUnmounted(stop)

  return {
    state,
    mode,
    settings,
    errorMessage,
    isScanning,
    availableWindows,
    selectedWindowId,
    selectedWindow,
    recognizedBoard,
    boardBounds,
    isReversed,
    isMyTurn,
    isActive,
    statusText,
    start,
    stop,
    connect,
    pause: () => {
      isScanning.value = false
      state.value = 'paused'
    },
    resume: () => {
      isScanning.value = true
      state.value = 'connecting'
    },
    forceMyTurn: async () => {
      isMyTurn.value = true
      waitingForExternalConfirm.value = false
      lastAutoExecutedMove.value = null

      // Regenerate FEN with correct turn side and update game state
      // When forcing my turn: if isReversed=false (Red at bottom), program plays Red -> isRedTurn=true
      //                       if isReversed=true (Black at bottom), program plays Black -> isRedTurn=false
      if (recognizedBoard.value && onBoardUpdated) {
        const isRedTurn = !isReversed.value
        const newFen = generateJieqiFen(recognizedBoard.value, isRedTurn)
        onBoardUpdated(newFen)
        await rustLog(
          `[Linker] Force switched to my turn. isReversed=${isReversed.value}, isRedTurn=${isRedTurn}, FEN updated`
        )
      } else {
        await rustLog(
          '[Linker] Force switched to my turn (no board to update FEN)'
        )
      }
    },
    refreshWindowList,
    selectWindow,
    setCallbacks,
    updateSettings: (s: any) => (settings.value = { ...settings.value, ...s }),
    resetSettings: () => (settings.value = { ...DEFAULT_SETTINGS }),
    initializeModel,
    captureAndProcess,
    executeExternalMove,
    boardToFen: generateJieqiFen, // 导出新的 FEN 生成器供外部调用(如 Capture Preview)
  }
}
