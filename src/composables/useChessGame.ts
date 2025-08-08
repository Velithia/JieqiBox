import { ref, computed } from 'vue'
import {
  START_FEN,
  FEN_MAP,
  REVERSE_FEN_MAP,
  INITIAL_PIECE_COUNTS,
} from '@/utils/constants'
import { isAndroidPlatform as checkAndroidPlatform } from '../utils/platform'
import { useInterfaceSettings } from './useInterfaceSettings'
import { useGameSettings } from './useGameSettings'

export interface Piece {
  id: number
  name: string
  row: number
  col: number
  isKnown: boolean
  initialRole: string
  initialRow: number
  initialCol: number
  zIndex?: number // controls layering; moving piece is temporarily brought to the top
}

export type HistoryEntry = {
  type: 'move' | 'adjust'
  data: string
  fen: string
  comment?: string // User comment for this move
  engineScore?: number // Engine analysis score for this move (only recorded if engine was thinking)
  engineTime?: number // Engine analysis time in milliseconds for this move (only recorded if engine was thinking)
}

// Custom game notation format interface
export interface GameNotation {
  metadata: {
    event?: string
    site?: string
    date?: string
    round?: string
    white?: string
    black?: string
    result?: string
    initialFen?: string
    flipMode?: 'random' | 'free'
    currentFen?: string
  }
  moves: HistoryEntry[]
}

export function useChessGame() {
  // Get FEN format setting
  const { useNewFenFormat } = useInterfaceSettings()

  // Get persistent game settings
  const { flipMode } = useGameSettings()

  const pieces = ref<Piece[]>([])
  const selectedPieceId = ref<number | null>(null)
  const copySuccessVisible = ref(false)
  const sideToMove = ref<'red' | 'black'>('red')
  const halfmoveClock = ref(0) // halfmove clock
  const fullmoveNumber = ref(1) // fullmove number

  const history = ref<HistoryEntry[]>([])
  const currentMoveIndex = ref<number>(0)
  const unrevealedPieceCounts = ref<{ [key: string]: number }>({})
  const isBoardFlipped = ref(false) // board flip state

  const pendingFlip = ref<{
    pieceToMove: Piece
    uciMove: string
    side: 'red' | 'black'
    callback: (chosenPieceName: string) => void
  } | null>(null)

  // Arrow clear event callbacks
  const arrowClearCallbacks = ref<(() => void)[]>([])

  const isFenInputDialogVisible = ref(false)
  const isAnimating = ref(true) // Control piece movement animation switch

  // Store the initial FEN for replay functionality
  const initialFen = ref<string>(START_FEN)

  // record the start and end positions of the last move for highlighting
  const lastMovePositions = ref<{
    from: { row: number; col: number }
    to: { row: number; col: number }
  } | null>(null)

  const getRoleByPosition = (row: number, col: number): string => {
    const initialPositions: { [role: string]: { row: number; col: number }[] } =
      {
        chariot: [
          { row: 0, col: 0 },
          { row: 0, col: 8 },
          { row: 9, col: 0 },
          { row: 9, col: 8 },
        ],
        horse: [
          { row: 0, col: 1 },
          { row: 0, col: 7 },
          { row: 9, col: 1 },
          { row: 9, col: 7 },
        ],
        elephant: [
          { row: 0, col: 2 },
          { row: 0, col: 6 },
          { row: 9, col: 2 },
          { row: 9, col: 6 },
        ],
        advisor: [
          { row: 0, col: 3 },
          { row: 0, col: 5 },
          { row: 9, col: 3 },
          { row: 9, col: 5 },
        ],
        king: [
          { row: 0, col: 4 },
          { row: 9, col: 4 },
        ],
        cannon: [
          { row: 2, col: 1 },
          { row: 2, col: 7 },
          { row: 7, col: 1 },
          { row: 7, col: 7 },
        ],
        pawn: [
          { row: 3, col: 0 },
          { row: 3, col: 2 },
          { row: 3, col: 4 },
          { row: 3, col: 6 },
          { row: 3, col: 8 },
          { row: 6, col: 0 },
          { row: 6, col: 2 },
          { row: 6, col: 4 },
          { row: 6, col: 6 },
          { row: 6, col: 8 },
        ],
      }
    for (const role in initialPositions) {
      if (initialPositions[role].some(p => p.row === row && p.col === col))
        return role
    }
    return ''
  }

  const getPieceSide = (piece: Piece): 'red' | 'black' => {
    if (piece.isKnown) {
      return piece.name.startsWith('red') ? 'red' : 'black'
    } else {
      // For hidden pieces, determine color based on position
      // If the board is flipped, need to reverse the judgment
      if (isBoardFlipped.value) {
        // After flip: first 5 rows are red, last 5 rows are black
        return piece.row < 5 ? 'red' : 'black'
      } else {
        // Normal: first 5 rows are black, last 5 rows are red
        return piece.row >= 5 ? 'red' : 'black'
      }
    }
  }

  const shuffle = <T>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }
  const getPieceNameFromChar = (char: string): string => {
    const isRed = char === char.toUpperCase()
    const role = REVERSE_FEN_MAP[char.toUpperCase()]
    return `${isRed ? 'red' : 'black'}_${role}`
  }
  const getCharFromPieceName = (name: string): string => FEN_MAP[name]

  const validationStatus = computed(() => {
    // Count dark pieces on board for each side
    const darkPiecesOnBoard = pieces.value.filter(p => !p.isKnown)
    const redDarkPiecesOnBoard = darkPiecesOnBoard.filter(
      p => getPieceSide(p) === 'red'
    ).length
    const blackDarkPiecesOnBoard = darkPiecesOnBoard.filter(
      p => getPieceSide(p) === 'black'
    ).length

    // Count pieces in pool for each side
    const redPiecesInPool = Object.entries(unrevealedPieceCounts.value)
      .filter(([char]) => char === char.toUpperCase()) // Red pieces are uppercase
      .reduce((sum, [, count]) => sum + count, 0)

    const blackPiecesInPool = Object.entries(unrevealedPieceCounts.value)
      .filter(([char]) => char === char.toLowerCase()) // Black pieces are lowercase
      .reduce((sum, [, count]) => sum + count, 0)

    // Check if red side dark pieces exceed pool
    if (redPiecesInPool < redDarkPiecesOnBoard) {
      return `错误: 红方${redDarkPiecesOnBoard}暗子 > ${redPiecesInPool}池`
    }

    // Check if black side dark pieces exceed pool
    if (blackPiecesInPool < blackDarkPiecesOnBoard) {
      return `错误: 黑方${blackDarkPiecesOnBoard}暗子 > ${blackPiecesInPool}池`
    }

    // Check piece count limits for each side separately
    for (const char in INITIAL_PIECE_COUNTS) {
      const revealedCount = pieces.value.filter(
        p => p.isKnown && getCharFromPieceName(p.name) === char
      ).length
      const inPoolCount = unrevealedPieceCounts.value[char] || 0
      if (
        revealedCount + inPoolCount >
        INITIAL_PIECE_COUNTS[char as keyof typeof INITIAL_PIECE_COUNTS]
      ) {
        return `错误: ${getPieceNameFromChar(char)} 总数超限!`
      }
    }

    return '正常'
  })

  const moveHistory = computed(() => history.value)

  // FEN format conversion functions
  const detectFenFormat = (fen: string): 'new' | 'old' => {
    const parts = fen.split(' ')
    if (parts.length >= 2) {
      // If second part is 'w' or 'b', it's new format
      return parts[1] === 'w' || parts[1] === 'b' ? 'new' : 'old'
    }
    return 'old' // Default to old format if uncertain
  }

  const convertFenFormat = (
    fen: string,
    targetFormat: 'new' | 'old'
  ): string => {
    const parts = fen.split(' ')
    const currentFormat = detectFenFormat(fen)

    if (currentFormat === targetFormat) {
      return fen // No conversion needed
    }

    let boardPart: string,
      hiddenPart: string = '-',
      sidePart: string,
      halfmove: string = '0',
      fullmove: string = '1'

    if (currentFormat === 'new') {
      // Convert from new to old format
      if (parts.length >= 5) {
        ;[boardPart, sidePart, hiddenPart, halfmove, fullmove] = parts
      } else if (parts.length >= 3) {
        ;[boardPart, sidePart, hiddenPart] = parts
      } else {
        ;[boardPart, sidePart] = parts
      }
      // Old format: board hiddenPart side castling enpassant halfmove fullmove
      return `${boardPart} ${hiddenPart} ${sidePart} - - ${halfmove} ${fullmove}`
    } else {
      // Convert from old to new format
      if (parts.length >= 7) {
        ;[boardPart, hiddenPart, sidePart, , , halfmove, fullmove] = parts
      } else if (parts.length >= 3) {
        ;[boardPart, hiddenPart, sidePart] = parts
      } else {
        ;[boardPart, sidePart] = parts
      }
      // New format: board side hiddenPart halfmove fullmove
      return `${boardPart} ${sidePart} ${hiddenPart} ${halfmove} ${fullmove}`
    }
  }

  // Generate FEN for engine communication (respects format settings)
  const generateFenForEngine = (baseFen?: string): string => {
    const targetFormat = useNewFenFormat.value ? 'new' : 'old'

    if (baseFen) {
      // Convert baseFen to the target format
      return convertFenFormat(baseFen, targetFormat)
    } else {
      // Generate current position FEN in the target format
      const currentFen = generateFen()
      return convertFenFormat(currentFen, targetFormat)
    }
  }

  const generateFen = (): string => {
    const board: (Piece | null)[][] = Array.from({ length: 10 }, () =>
      Array(9).fill(null)
    )
    // If the board is flipped, need to remap positions to generate FEN that engine can understand
    pieces.value.forEach(p => {
      const actualRow = isBoardFlipped.value ? 9 - p.row : p.row
      const actualCol = isBoardFlipped.value ? 8 - p.col : p.col
      board[actualRow][actualCol] = p
    })
    const boardFen = board
      .map((row, rowIndex) => {
        let empty = 0
        let str = ''
        row.forEach(p => {
          if (p) {
            if (empty > 0) {
              str += empty
              empty = 0
            }
            if (p.isKnown) {
              str += FEN_MAP[p.name]
            } else {
              // For hidden pieces, determine color based on remapped position
              // After remapping: first 5 rows are black, last 5 rows are red (standard format)
              const isRedSide = rowIndex >= 5
              str += isRedSide ? 'X' : 'x'
            }
          } else empty++
        })
        if (empty > 0) str += empty
        return str
      })
      .join('/')
    let hiddenStr = ''
    const hiddenOrder = 'RNBAKCP'
    hiddenOrder.split('').forEach(char => {
      const redCount = unrevealedPieceCounts.value[char] || 0
      const blackCount = unrevealedPieceCounts.value[char.toLowerCase()] || 0
      if (redCount > 0) hiddenStr += char + redCount
      if (blackCount > 0) hiddenStr += char.toLowerCase() + blackCount
    })
    // Generate FEN based on format setting
    const color = sideToMove.value === 'red' ? 'w' : 'b'
    const hiddenPart = hiddenStr || '-'

    if (useNewFenFormat.value) {
      // New FEN format: board color hiddenPieces halfmove fullmove
      return `${boardFen} ${color} ${hiddenPart} ${halfmoveClock.value} ${fullmoveNumber.value}`
    } else {
      // Old FEN format: board hiddenPieces color castling enpassant halfmove fullmove
      return `${boardFen} ${hiddenPart} ${color} - - ${halfmoveClock.value} ${fullmoveNumber.value}`
    }
  }

  const loadFen = (fen: string, animate: boolean) => {
    isAnimating.value = animate
    try {
      const parts = fen.split(' ')
      let boardPart: string,
        hiddenPart: string = '-',
        sidePart: string,
        halfmove: string,
        fullmove: string

      // Detect FEN format by checking if second part is color ('w' or 'b')
      const isNewFormat =
        parts.length >= 2 && (parts[1] === 'w' || parts[1] === 'b')

      if (isNewFormat) {
        // New FEN format parsing
        if (parts.length >= 5) {
          // Format: board color hiddenPart halfmove fullmove
          ;[boardPart, sidePart, hiddenPart, halfmove, fullmove] = parts
        } else if (parts.length >= 3) {
          // Format: board color hiddenPart (missing moves)
          ;[boardPart, sidePart, hiddenPart] = parts
          halfmove = '0'
          fullmove = '1'
        } else {
          // Format: board color (minimal)
          ;[boardPart, sidePart] = parts
          halfmove = '0'
          fullmove = '1'
        }
      } else {
        // Old FEN format parsing (existing logic)
        if (parts.length === 2) {
          ;[boardPart, sidePart] = parts
          halfmove = '0'
          fullmove = '1'
        } else if (parts.length === 6) {
          ;[
            boardPart,
            sidePart, // castling and en passant are ignored
            ,
            ,
            halfmove,
            fullmove,
          ] = parts
        } else {
          ;[
            boardPart,
            hiddenPart,
            sidePart, // castling and en passant are ignored
            ,
            ,
            halfmove,
            fullmove,
          ] = parts
        }
      }

      sideToMove.value = sidePart === 'w' ? 'red' : 'black'
      halfmoveClock.value = halfmove ? parseInt(halfmove, 10) : 0
      fullmoveNumber.value = fullmove ? parseInt(fullmove, 10) : 1

      const newPieces: Piece[] = []
      let pieceId = 1

      boardPart.split('/').forEach((rowStr, rowIndex) => {
        let colIndex = 0
        for (const char of rowStr) {
          if (/\d/.test(char)) {
            colIndex += parseInt(char, 10)
          } else {
            const isRed = char.toUpperCase() === char
            const initialRole = getRoleByPosition(rowIndex, colIndex)
            if (char.toLowerCase() === 'x') {
              const tempName = isRed ? 'red_unknown' : 'black_unknown'
              newPieces.push({
                id: pieceId++,
                name: tempName,
                row: rowIndex,
                col: colIndex,
                isKnown: false,
                initialRole: initialRole,
                initialRow: rowIndex,
                initialCol: colIndex,
              })
            } else {
              const pieceName = getPieceNameFromChar(char)
              newPieces.push({
                id: pieceId++,
                name: pieceName,
                row: rowIndex,
                col: colIndex,
                isKnown: true,
                initialRole: initialRole,
                initialRow: rowIndex,
                initialCol: colIndex,
              })
            }
            colIndex++
          }
        }
      })

      const newCounts: { [key: string]: number } = {}
      'RNBAKCP rnbakcp'
        .split('')
        .filter(c => c !== ' ')
        .forEach(c => (newCounts[c] = 0))
      if (hiddenPart && hiddenPart !== '-') {
        const hiddenMatches = hiddenPart.match(/[a-zA-Z]\d+/g) || []
        hiddenMatches.forEach(match => {
          const char = match[0]
          const count = parseInt(match.slice(1), 10)
          newCounts[char] = count
        })
      }

      const darkPieces = newPieces.filter(p => !p.isKnown)
      const hiddenPool: string[] = []
      Object.entries(newCounts).forEach(([char, count]) => {
        for (let i = 0; i < count; i++) {
          hiddenPool.push(getPieceNameFromChar(char))
        }
      })

      const shuffledIdentities = shuffle(hiddenPool)
      darkPieces.forEach(p => {
        const side = getPieceSide(p)
        const identityIndex = shuffledIdentities.findIndex(name =>
          name.startsWith(side)
        )
        if (identityIndex !== -1) {
          p.name = shuffledIdentities.splice(identityIndex, 1)[0]
        }
      })

      pieces.value = newPieces
      unrevealedPieceCounts.value = newCounts
      selectedPieceId.value = null
      lastMovePositions.value = null // Clear highlights when loading FEN

      // Detect and set correct flip state
      detectAndSetBoardFlip()

      // Reset zIndex for all pieces and update based on position
      pieces.value.forEach(p => (p.zIndex = undefined))
      updateAllPieceZIndexes()

      // Trigger arrow clear event
      triggerArrowClear()
    } catch (e: any) {
      console.error('加载FEN失败！', e)
      alert(e.message || '输入的FEN格式有误！')
    }
  }

  const recordAndFinalize = (type: 'move' | 'adjust', data: string) => {
    // Record move history: slice to current index position, then add new move record
    const newHistory = history.value.slice(0, currentMoveIndex.value)

    // For 'move' type, update side to move before generating FEN for the resulting position.
    if (type === 'move') {
      sideToMove.value = sideToMove.value === 'red' ? 'black' : 'red'
    }

    const fen = generateFen()

    // Get engine analysis data if engine was thinking before this move
    let engineScore: number | undefined
    let engineTime: number | undefined

    if (type === 'move') {
      // Check if engine was thinking before this move
      // We need to get engine state from the global state
      const engineState = (window as any).__ENGINE_STATE__
      console.log('[DEBUG] RECORD_AND_FINALIZE: Engine state check:', {
        hasEngineState: !!engineState,
        isThinking: engineState?.isThinking?.value,
        analysisText: engineState?.analysis?.value,
        analysisStartTime: engineState?.analysisStartTime?.value,
      })

      // Check if this is an AI move (we can detect this by checking if the move was triggered by bestMove)
      const isAiMove = (window as any).__LAST_AI_MOVE__ === data
      console.log('[DEBUG] RECORD_AND_FINALIZE: Is AI move:', isAiMove)

      // Get isManualAnalysis from global state
      const isManualAnalysis = (window as any).__MANUAL_ANALYSIS__ || {
        value: false,
      }

      if (
        engineState &&
        (engineState.isThinking?.value ||
          isAiMove ||
          isManualAnalysis.value ||
          engineState.isPondering?.value ||
          (window as any).__JAI_ENGINE__?.isMatchRunning?.value)
      ) {
        console.log(
          '[DEBUG] RECORD_AND_FINALIZE: Engine was thinking or this is an AI move, extracting data...'
        )

        // Fallback to UCI engine analysis extraction
        const analysisText = engineState.analysis?.value || ''
        console.log('[DEBUG] RECORD_AND_FINALIZE: Analysis text:', analysisText)

        // In match mode, use JAI engine output; otherwise, use UCI engine output
        const isMatchMode = (window as any).__MATCH_MODE__ || false
        const jaiEngine = (window as any).__JAI_ENGINE__
        const engineOutput =
          isMatchMode && jaiEngine?.engineOutput?.value
            ? jaiEngine.engineOutput.value
            : engineState.engineOutput?.value || []

        console.log('[DEBUG] RECORD_AND_FINALIZE: Using engine output:', {
          isMatchMode,
          outputSource: isMatchMode ? 'JAI' : 'UCI',
          outputLength: engineOutput.length,
        })

        let lastValidScoreLine = ''

        if (isMatchMode) {
          // Find the last info move line first
          let lastMoveIndex = -1
          for (let i = engineOutput.length - 1; i >= 0; i--) {
            const line = engineOutput[i]
            if (line.kind === 'recv' && line.text.startsWith('info move ')) {
              lastMoveIndex = i
              break
            }
          }

          console.log(
            '[DEBUG] RECORD_AND_FINALIZE: Found last move index:',
            lastMoveIndex
          )

          // If we found an info move line, look for the preceding info depth line
          if (lastMoveIndex >= 0) {
            for (let i = lastMoveIndex - 1; i >= 0; i--) {
              const line = engineOutput[i]
              if (
                line.kind === 'recv' &&
                line.text.includes('score') &&
                line.text.startsWith('info depth') &&
                !line.text.includes('lowerbound') &&
                !line.text.includes('upperbound')
              ) {
                lastValidScoreLine = line.text
                console.log(
                  '[DEBUG] RECORD_AND_FINALIZE: Found score line at index:',
                  i,
                  'Line:',
                  line.text
                )
                break
              }
            }
          }
        } else {
          // Normal UCI mode: find the last valid score line
          for (let i = engineOutput.length - 1; i >= 0; i--) {
            const line = engineOutput[i]
            if (
              line.kind === 'recv' &&
              line.text.includes('score') &&
              !line.text.includes('lowerbound') &&
              !line.text.includes('upperbound')
            ) {
              lastValidScoreLine = line.text
              break
            }
          }
        }

        console.log(
          '[DEBUG] RECORD_AND_FINALIZE: Last valid score line:',
          lastValidScoreLine
        )

        const scoreMatch = lastValidScoreLine.match(
          /score\s+(cp|mate)\s+(-?\d+)/
        )
        if (scoreMatch) {
          const scoreType = scoreMatch[1]
          const scoreValue = parseInt(scoreMatch[2])
          // Convert to centipawns (cp) or mate score
          engineScore =
            scoreType === 'mate'
              ? scoreValue > 0
                ? 10000
                : -10000
              : scoreValue

          // If pondering, invert the score
          if (
            engineState.isPondering?.value &&
            !engineState.isInfinitePondering?.value
          ) {
            engineScore = -engineScore
          }

          console.log(
            '[DEBUG] RECORD_AND_FINALIZE: Extracted score from UCI engine:',
            {
              scoreType,
              scoreValue,
              engineScore,
            }
          )
        } else {
          console.log(
            '[DEBUG] RECORD_AND_FINALIZE: No valid score match found in engine output'
          )
        }

        // Get analysis time - prioritize JAI engine time if available
        const jaiEngineTime = (window as any).__JAI_ENGINE_TIME__
        if (engineState.lastAnalysisTime?.value) {
          engineTime = engineState.lastAnalysisTime.value
          console.log(
            '[DEBUG] RECORD_AND_FINALIZE: Using stored analysis time:',
            engineTime
          )
        } else if (engineState.analysisStartTime?.value) {
          engineTime = Date.now() - engineState.analysisStartTime.value
          console.log(
            '[DEBUG] RECORD_AND_FINALIZE: Calculated time from current analysis:',
            engineTime
          )
        } else if (jaiEngineTime !== undefined) {
          engineTime = jaiEngineTime
          console.log(
            '[DEBUG] RECORD_AND_FINALIZE: Using JAI engine time:',
            engineTime
          )
          // Clear the stored time after using it
          ;(window as any).__JAI_ENGINE_TIME__ = undefined
        } else {
          engineTime = 0
          console.log('[DEBUG] RECORD_AND_FINALIZE: No analysis time available')
        }
      } else {
        console.log(
          '[DEBUG] RECORD_AND_FINALIZE: No JAI engine score available and engine is not thinking, skipping engine data'
        )
      }
    }

    console.log('[DEBUG] RECORD_AND_FINALIZE: Final engine data:', {
      engineScore,
      engineTime,
    })

    const newEntry = { type, data, fen, engineScore, engineTime }
    console.log('[DEBUG] RECORD_AND_FINALIZE: New history entry:', newEntry)

    newHistory.push(newEntry)

    // Limit history size to prevent memory issues in long games
    if (newHistory.length > 2000) {
      console.log(
        '[DEBUG] RECORD_AND_FINALIZE: History too long, truncating to last 1000 moves'
      )
      const truncatedHistory = newHistory.slice(-1000)
      history.value = truncatedHistory
      currentMoveIndex.value = truncatedHistory.length
    } else {
      history.value = newHistory
      currentMoveIndex.value = history.value.length
    }

    console.log(
      '[DEBUG] RECORD_AND_FINALIZE: Updated history length:',
      history.value.length
    )

    // Clear the AI move flag after recording
    const isAiMove = (window as any).__LAST_AI_MOVE__ === data
    if (isAiMove) {
      console.log(
        '[DEBUG] RECORD_AND_FINALIZE: Clearing AI move flag for move:',
        data
      )
      ;(window as any).__LAST_AI_MOVE__ = null
    }

    // Handle ponder logic for manual moves (human moves)
    if (type === 'move' && !isAiMove) {
      const ponderState = (window as any).__PONDER_STATE__
      if (ponderState && ponderState.handlePonderAfterMove) {
        console.log(
          '[DEBUG] RECORD_AND_FINALIZE: Handling ponder for human move:',
          data
        )
        ponderState.handlePonderAfterMove(data, false)
      }
    }

    if (type === 'move') {
      // Enable animation when making moves
      isAnimating.value = true
      // Record last move position for highlighting
      // In free mode, if it's a dark piece move, lastMovePositions has already been set in movePiece
      if (!(flipMode.value === 'free' && pendingFlip.value)) {
        const movePositions = calculateMovePositions(data)
        lastMovePositions.value = movePositions
      }

      // Update z-index for all pieces after move completion
      // Reset zIndex for all pieces and update based on new positions
      pieces.value.forEach(p => (p.zIndex = undefined))
      updateAllPieceZIndexes()
    }
    selectedPieceId.value = null
  }

  const setupNewGame = () => {
    initialFen.value = START_FEN // Update initial FEN for new game
    loadFen(START_FEN, false) // No animation at game start
    history.value = []
    currentMoveIndex.value = 0
    lastMovePositions.value = null // Clear highlights for new game

    // Ensure flip state is correct for new game
    detectAndSetBoardFlip()

    // Trigger arrow clear event
    triggerArrowClear()

    // Force stop engine analysis and AI to ensure engine doesn't continue thinking when starting new game
    // Trigger custom event to notify AnalysisSidebar component to close AI
    window.dispatchEvent(
      new CustomEvent('force-stop-ai', {
        detail: { reason: 'new-game' },
      })
    )
  }

  const adjustUnrevealedCount = (char: string, delta: 1 | -1) => {
    const currentCount = unrevealedPieceCounts.value[char] || 0

    if (delta === -1 && currentCount <= 0) return

    if (delta === 1) {
      const revealedCount = pieces.value.filter(
        p => p.isKnown && getCharFromPieceName(p.name) === char
      ).length
      if (
        revealedCount + currentCount >=
        INITIAL_PIECE_COUNTS[char as keyof typeof INITIAL_PIECE_COUNTS]
      ) {
        alert(`不能再增加了！${getPieceNameFromChar(char)} 总数已达上限。`)
        return
      }
    }

    unrevealedPieceCounts.value[char] = currentCount + delta
    recordAndFinalize('adjust', `${char}${delta > 0 ? '+' : '-'}`)
  }

  const completeFlipAfterMove = (
    piece: Piece,
    uciMove: string,
    chosenPieceName: string
  ) => {
    console.log(
      `[DEBUG] completeFlipAfterMove: Entered. User chose '${chosenPieceName}'.`
    )
    const char = getCharFromPieceName(chosenPieceName)

    if ((unrevealedPieceCounts.value[char] || 0) <= 0) {
      alert(`错误：暗子池中没有 ${chosenPieceName} 了！`)
      pendingFlip.value = null
      return
    }

    unrevealedPieceCounts.value[char]--

    piece.name = chosenPieceName
    piece.isKnown = true

    // Reset zIndex for all pieces and update based on position after revealing
    pieces.value.forEach(p => (p.zIndex = undefined))
    updateAllPieceZIndexes()

    // Ensure the revealed piece stacks correctly above row-based layers immediately after reveal
    const movePositions = calculateMovePositions(uciMove)
    if (movePositions) {
      // If the reveal happened on the destination (i.e., capture or move complete), prioritize temporarily
      const revealedOnDestination =
        piece.row === movePositions.to.row && piece.col === movePositions.to.col
      if (revealedOnDestination) {
        piece.zIndex = 2000
        updateAllPieceZIndexes()
      }
    }

    pendingFlip.value = null
    console.log(
      `[DEBUG] completeFlipAfterMove: 'pendingFlip' cleared. Finalizing move.`
    )

    // Check if this was an AI move before calling recordAndFinalize (which clears the flag)
    const isAiMove = (window as any).__LAST_AI_MOVE__ === uciMove

    // In free mode, lastMovePositions has already been set in movePiece, here we only need to record history
    console.log(
      `[DEBUG] completeFlipAfterMove: About to call recordAndFinalize with move: ${uciMove}`
    )
    recordAndFinalize('move', uciMove)

    // If this was an AI move, start ponder now that the flip dialog is closed
    if (isAiMove) {
      console.log(
        `[DEBUG] completeFlipAfterMove: AI move completed after flip dialog. Checking if ponder should start.`
      )
      const ponderState = (window as any).__PONDER_STATE__
      if (ponderState && ponderState.handlePonderAfterMove) {
        console.log(
          `[DEBUG] completeFlipAfterMove: Triggering ponder for AI move: ${uciMove}`
        )
        ponderState.handlePonderAfterMove(uciMove, true)
      }
    }
  }

  /**
   * Handle board click event.
   * If a move is attempted in a historical position, return an object indicating confirmation is required.
   * Otherwise, perform the move as usual.
   * @returns {object|undefined} If confirmation is needed, returns { requireClearHistoryConfirm: true, move: { piece, row, col } }
   */
  const handleBoardClick = (row: number, col: number) => {
    if (pendingFlip.value) return
    const clickedPiece = pieces.value.find(p => p.row === row && p.col === col)

    if (selectedPieceId.value !== null) {
      const selectedPiece = pieces.value.find(
        p => p.id === selectedPieceId.value
      )!
      if (clickedPiece && clickedPiece.id === selectedPieceId.value) {
        selectedPieceId.value = null
        return
      }
      if (
        clickedPiece &&
        getPieceSide(clickedPiece) === getPieceSide(selectedPiece)
      ) {
        selectedPieceId.value = clickedPiece.id
        return
      }
      // If in a historical position, require confirmation before clearing history
      if (currentMoveIndex.value < history.value.length) {
        // Return a signal to the UI to show confirmation dialog
        return {
          requireClearHistoryConfirm: true,
          move: { piece: selectedPiece, row, col },
        }
      }
      movePiece(selectedPiece, row, col)
    } else if (clickedPiece) {
      if (getPieceSide(clickedPiece) === sideToMove.value) {
        selectedPieceId.value = clickedPiece.id
      }
    }
  }

  /**
   * Actually perform the move and clear history after user confirms.
   * This should be called by the UI after user confirms the dialog.
   */
  const clearHistoryAndMove = (piece: Piece, row: number, col: number) => {
    history.value = history.value.slice(0, currentMoveIndex.value)
    movePiece(piece, row, col)
  }

  /**
   * Helper function to check if a move is mechanically valid according to the rules of a piece.
   * This function checks for things like blocked horse legs, elephant eyes, and cannon jumps.
   * It does NOT check whether the move would put the player's own king in check.
   * This logic is shared by both isMoveValid and isInCheck to ensure consistency.
   * @param piece The piece to move.
   * @param targetRow The destination row.
   * @param targetCol The destination column.
   * @returns {boolean} True if the move is mechanically possible.
   */
  const isMoveMechanicallyValid = (
    piece: Piece,
    targetRow: number,
    targetCol: number
  ): boolean => {
    // If it's an unrevealed piece, ensure it has an initialRole
    if (!piece.isKnown && !piece.initialRole) {
      return false
    }

    const role = piece.isKnown ? piece.name.split('_')[1] : piece.initialRole
    const dRow = Math.abs(targetRow - piece.row)
    const dCol = Math.abs(targetCol - piece.col)
    const pieceSide = getPieceSide(piece)

    const targetPiece = pieces.value.find(
      p => p.row === targetRow && p.col === targetCol
    )
    // A piece cannot capture a piece of the same side.
    if (targetPiece && getPieceSide(targetPiece) === pieceSide) {
      return false
    }

    const countPiecesBetween = (
      r1: number,
      c1: number,
      r2: number,
      c2: number
    ): number => {
      let count = 0
      if (r1 === r2) {
        // Horizontal move
        for (let c = Math.min(c1, c2) + 1; c < Math.max(c1, c2); c++) {
          if (pieces.value.some(p => p.row === r1 && p.col === c)) count++
        }
      } else if (c1 === c2) {
        // Vertical move
        for (let r = Math.min(r1, r2) + 1; r < Math.max(r1, r2); r++) {
          if (pieces.value.some(p => p.col === c1 && p.row === r)) count++
        }
      }
      return count
    }

    let moveValid = false
    switch (role) {
      case 'king':
        // King's move validation needs to consider the board flip state
        let kingTargetRowMin, kingTargetRowMax
        if (isBoardFlipped.value) {
          // Flipped: Red is at the bottom (rows 0-2), Black is at the top (rows 7-9)
          kingTargetRowMin = pieceSide === 'red' ? 0 : 7
          kingTargetRowMax = pieceSide === 'red' ? 2 : 9
        } else {
          // Normal: Red is at the top (rows 7-9), Black is at the bottom (rows 0-2)
          kingTargetRowMin = pieceSide === 'red' ? 7 : 0
          kingTargetRowMax = pieceSide === 'red' ? 9 : 2
        }
        moveValid =
          ((dRow === 1 && dCol === 0) || (dRow === 0 && dCol === 1)) &&
          targetCol >= 3 &&
          targetCol <= 5 &&
          targetRow >= kingTargetRowMin &&
          targetRow <= kingTargetRowMax
        break
      case 'advisor':
        // Check if it's an unrevealed advisor (at initial position and not flipped)
        const isDarkAdvisor =
          !piece.isKnown &&
          ((piece.row === 0 && (piece.col === 3 || piece.col === 5)) ||
            (piece.row === 9 && (piece.col === 3 || piece.col === 5)))
        // Prohibit unrevealed advisors from making specific moves
        if (isDarkAdvisor) {
          if (
            (piece.row === 0 &&
              piece.col === 3 &&
              targetRow === 1 &&
              targetCol === 2) ||
            (piece.row === 0 &&
              piece.col === 5 &&
              targetRow === 1 &&
              targetCol === 6) ||
            (piece.row === 9 &&
              piece.col === 3 &&
              targetRow === 8 &&
              targetCol === 2) ||
            (piece.row === 9 &&
              piece.col === 5 &&
              targetRow === 8 &&
              targetCol === 6)
          ) {
            return false // Explicitly invalid move for unrevealed advisor
          }
        }
        moveValid = dRow === 1 && dCol === 1
        break
      case 'elephant':
        if (dRow !== 2 || dCol !== 2) {
          moveValid = false
          break
        }
        // Check for a blocking piece in the "elephant's eye"
        const eyeRow = piece.row + (targetRow - piece.row) / 2
        const eyeCol = piece.col + (targetCol - piece.col) / 2
        if (pieces.value.some(p => p.row === eyeRow && p.col === eyeCol)) {
          moveValid = false
          break
        }
        moveValid = true
        break
      case 'horse':
        if (!((dRow === 2 && dCol === 1) || (dRow === 1 && dCol === 2))) {
          moveValid = false
          break
        }
        // Check for a blocking piece in the "horse's leg"
        const legRow =
          piece.row + (dRow === 2 ? (targetRow - piece.row) / 2 : 0)
        const legCol =
          piece.col + (dCol === 2 ? (targetCol - piece.col) / 2 : 0)
        moveValid = !pieces.value.some(
          p => p.row === legRow && p.col === legCol
        )
        break
      case 'chariot':
        if (dRow > 0 && dCol > 0) {
          moveValid = false
          break
        }
        // Chariot moves in a straight line, must be no pieces in between
        moveValid =
          countPiecesBetween(piece.row, piece.col, targetRow, targetCol) === 0
        break
      case 'cannon':
        if (dRow > 0 && dCol > 0) {
          moveValid = false
          break
        }
        const piecesBetween = countPiecesBetween(
          piece.row,
          piece.col,
          targetRow,
          targetCol
        )
        // If capturing, there must be exactly one piece (the "screen") in between.
        if (targetPiece) {
          moveValid = piecesBetween === 1
        } else {
          // If moving to an empty square, there must be no pieces in between.
          moveValid = piecesBetween === 0
        }
        break
      case 'pawn':
        // Pawn's move validation needs to consider the board flip state
        let isOverRiver
        isOverRiver = pieceSide === 'red' ? piece.row <= 4 : piece.row >= 5
        if (isBoardFlipped.value) {
          // On a flipped board, the river logic is inverted
          isOverRiver = pieceSide === 'red' ? piece.row >= 5 : piece.row <= 4
        }

        if (isOverRiver) {
          // Can move sideways after crossing the river
          if (isBoardFlipped.value) {
            // Flipped: Red pawns move "down" (row increases), Black pawns move "up" (row decreases)
            moveValid =
              (pieceSide === 'red'
                ? targetRow - piece.row === 1 && dCol === 0
                : piece.row - targetRow === 1 && dCol === 0) ||
              (dRow === 0 && dCol === 1)
          } else {
            // Normal: Red pawns move "down" (row decreases), Black pawns move "up" (row increases)
            moveValid =
              (pieceSide === 'red'
                ? piece.row - targetRow === 1 && dCol === 0
                : targetRow - piece.row === 1 && dCol === 0) ||
              (dRow === 0 && dCol === 1)
          }
        } else {
          // Can only move forward before crossing the river
          if (isBoardFlipped.value) {
            // Flipped: Red pawns move "down" (row increases), Black pawns move "up" (row decreases)
            moveValid =
              pieceSide === 'red'
                ? targetRow - piece.row === 1 && dCol === 0
                : piece.row - targetRow === 1 && dCol === 0
          } else {
            // Normal: Red pawns move "down" (row decreases), Black pawns move "up" (row increases)
            moveValid =
              pieceSide === 'red'
                ? piece.row - targetRow === 1 && dCol === 0
                : targetRow - piece.row === 1 && dCol === 0
          }
        }
        break
    }
    return moveValid
  }

  /**
   * Checks if the specified position is in check by an opponent piece.
   * This function now calls `isMoveMechanicallyValid` for each opponent piece
   * to see if any can legally attack the king's square.
   * @param kingRow The king's row.
   * @param kingCol The king's column.
   * @param kingSide The side of the king being checked.
   * @returns {boolean} True if the king is in check.
   */
  const isInCheck = (
    kingRow: number,
    kingCol: number,
    kingSide: 'red' | 'black'
  ): boolean => {
    const opponentSide = kingSide === 'red' ? 'black' : 'red'

    // Check if any opponent piece can attack the king's position
    for (const piece of pieces.value) {
      if (getPieceSide(piece) !== opponentSide) continue
      // Skip unrevealed pieces as they cannot check
      if (!piece.isKnown) continue

      // The king is in check if any opponent piece can make a valid mechanical move
      // to the king's square. This includes capturing the king.
      // We also need to handle the special "flying king" check rule.
      const role = piece.isKnown ? piece.name.split('_')[1] : piece.initialRole
      if (role === 'king') {
        // Special case: Flying King rule
        // If kings are on the same column and there are no pieces between them.
        if (piece.col === kingCol) {
          let piecesBetween = 0
          for (
            let r = Math.min(piece.row, kingRow) + 1;
            r < Math.max(piece.row, kingRow);
            r++
          ) {
            if (pieces.value.some(p => p.row === r && p.col === kingCol)) {
              piecesBetween++
            }
          }
          if (piecesBetween === 0) return true
        }
        // Kings cannot check each other otherwise, so we continue to the next piece.
        continue
      }

      // For all other pieces, we check if they can move to the king's square.
      if (isMoveMechanicallyValid(piece, kingRow, kingCol)) {
        return true // This piece is checking the king
      }
    }

    return false // No opponent piece can attack the king's position
  }

  // Check if the current position is in check
  const isCurrentPositionInCheck = (side: 'red' | 'black'): boolean => {
    // Find the king of the specified side
    const king = pieces.value.find(p => {
      if (!p.isKnown) return false
      const role = p.name.split('_')[1]
      return role === 'king' && getPieceSide(p) === side
    })

    if (!king) {
      // If the king is captured (or not on board), the game is over.
      // For check validation purposes, we can consider this not in check.
      return false
    }

    return isInCheck(king.row, king.col, side)
  }

  // Simulate the move and check if the king is still in check
  const wouldBeInCheckAfterMove = (
    piece: Piece,
    targetRow: number,
    targetCol: number
  ): boolean => {
    const pieceSide = getPieceSide(piece)
    const originalRow = piece.row
    const originalCol = piece.col
    const targetPiece = pieces.value.find(
      p => p.row === targetRow && p.col === targetCol
    )

    // Temporarily make the move
    // 1. Remove the captured piece, if any
    const originalPieces = [...pieces.value]
    if (targetPiece) {
      pieces.value = pieces.value.filter(p => p.id !== targetPiece.id)
    }
    // 2. Move the piece
    const movedPiece = pieces.value.find(p => p.id === piece.id)
    if (movedPiece) {
      movedPiece.row = targetRow
      movedPiece.col = targetCol
    }

    // Check if the current side's king is in check after the move
    const inCheck = isCurrentPositionInCheck(pieceSide)

    // Revert the board state to its original form
    pieces.value = originalPieces
    // Ensure the original piece reference is updated back, as it might be stale
    const originalPieceRef = pieces.value.find(p => p.id === piece.id)
    if (originalPieceRef) {
      originalPieceRef.row = originalRow
      originalPieceRef.col = originalCol
    }

    return inCheck
  }

  /**
   * Checks if a move is fully legal. A move is legal if:
   * 1. It is mechanically valid (follows the piece's movement rules).
   * 2. It does not result in the player's own king being in check.
   * @param piece The piece to move.
   * @param targetRow The destination row.
   * @param targetCol The destination column.
   * @returns {boolean} True if the move is fully legal.
   */
  const isMoveValid = (
    piece: Piece,
    targetRow: number,
    targetCol: number
  ): boolean => {
    // First, check if the move is mechanically possible using the shared helper function.
    if (!isMoveMechanicallyValid(piece, targetRow, targetCol)) {
      return false
    }

    // Then, check if this move would put the player's own king in check.
    // If it does, the move is illegal.
    if (wouldBeInCheckAfterMove(piece, targetRow, targetCol)) {
      return false
    }

    // If both checks pass, the move is valid.
    return true
  }

  const movePiece = (
    piece: Piece,
    targetRow: number,
    targetCol: number,
    skipFlipLogic: boolean = false
  ) => {
    console.log(
      `[DEBUG] movePiece: Entered for piece ${piece.id} to ${targetRow},${targetCol}.`
    )

    // Any user-initiated move should immediately stop any ongoing analysis.
    // This handles all cases: regular moves, captures, and dark piece flips.
    console.log(
      `[DEBUG] movePiece: Dispatching 'force-stop-ai' for reason 'manual-move'.`
    )
    window.dispatchEvent(
      new CustomEvent('force-stop-ai', {
        detail: { reason: 'manual-move' },
      })
    )

    const pieceSide = getPieceSide(piece)

    // Update halfmove and fullmove counters
    // A flip move is when an unknown piece is moved.
    const isFlip = !piece.isKnown
    // Check for capture by checking if there is a piece at the target location before moving.
    const capturedPieceIndexAtTarget = pieces.value.findIndex(
      p => p.row === targetRow && p.col === targetCol
    )
    const isCapture = capturedPieceIndexAtTarget !== -1

    if (isFlip || isCapture) {
      halfmoveClock.value = 0
    } else {
      halfmoveClock.value++
    }

    if (sideToMove.value === 'black') {
      fullmoveNumber.value++
    }

    // Generate UCI coordinates; if the board is flipped, coordinates need to be converted
    const toUci = (r: number, c: number) => {
      if (isBoardFlipped.value) {
        // After flipping, coordinates need to be converted - both vertically and horizontally
        const flippedRow = 9 - r
        const flippedCol = 8 - c // Horizontal mirror flip
        return `${String.fromCharCode(97 + flippedCol)}${9 - flippedRow}`
      } else {
        return `${String.fromCharCode(97 + c)}${9 - r}`
      }
    }
    const uciMove = toUci(piece.row, piece.col) + toUci(targetRow, targetCol)

    if (!isMoveValid(piece, targetRow, targetCol)) {
      return
    }

    // Enable animation effect when making a move
    isAnimating.value = true

    // In match mode, skip all flip logic since JAI engine provides exact moves
    const isMatchMode = (window as any).__MATCH_MODE__ || false

    const targetPiece = pieces.value.find(
      p => p.row === targetRow && p.col === targetCol
    )
    const wasDarkPiece = !piece.isKnown
    const originalRow = piece.row
    const originalCol = piece.col

    const highlightMove = {
      from: { row: originalRow, col: originalCol },
      to: { row: targetRow, col: targetCol },
    }

    if (targetPiece) {
      // In free flip mode, capturing opponent's hidden piece should not affect their unrevealed pool
      // Only in random flip mode and not in match mode, we randomly remove a piece from opponent's pool
      if (!targetPiece.isKnown && flipMode.value === 'random' && !isMatchMode) {
        const targetSide = getPieceSide(targetPiece)
        const opponentPoolChars = Object.keys(
          unrevealedPieceCounts.value
        ).filter(
          char =>
            unrevealedPieceCounts.value[char] > 0 &&
            getPieceNameFromChar(char).startsWith(targetSide)
        )

        if (opponentPoolChars.length > 0) {
          const charToRemove = shuffle(opponentPoolChars)[0]
          unrevealedPieceCounts.value[charToRemove]--
        }
      }
      pieces.value = pieces.value.filter(p => p.id !== targetPiece.id)
    }

    piece.row = targetRow
    piece.col = targetCol

    // Temporarily bring the moving piece to the highest z-index during its move
    pieces.value.forEach(p => (p.zIndex = undefined))
    piece.zIndex = 2000
    // Update other pieces' zIndex based on position
    updateAllPieceZIndexes()

    if (wasDarkPiece && !skipFlipLogic && !isMatchMode) {
      console.log(`[DEBUG] movePiece: Dark piece move detected.`)
      if (flipMode.value === 'free') {
        console.log(
          `[DEBUG] movePiece: Free flip mode. Setting 'pendingFlip' to open dialog.`
        )
        // For highlighting, we need to use display coordinates, which respect board flip.
        const displayHighlightMove = {
          from: {
            row: isBoardFlipped.value ? 9 - originalRow : originalRow,
            col: isBoardFlipped.value ? 8 - originalCol : originalCol, // Horizontal mirror flip
          },
          to: {
            row: isBoardFlipped.value ? 9 - targetRow : targetRow,
            col: isBoardFlipped.value ? 8 - targetCol : targetCol, // Horizontal mirror flip
          },
        }
        lastMovePositions.value = displayHighlightMove

        pendingFlip.value = {
          pieceToMove: piece,
          uciMove: uciMove,
          side: pieceSide,
          callback: chosenName =>
            completeFlipAfterMove(piece, uciMove, chosenName),
        }
      } else {
        const pool = Object.entries(unrevealedPieceCounts.value)
          .filter(([, count]) => count > 0)
          .flatMap(([char, count]) => {
            const name = getPieceNameFromChar(char)
            return name.startsWith(pieceSide) ? Array(count).fill(name) : []
          })

        if (pool.length === 0) {
          alert(`错误：${pieceSide === 'red' ? '红' : '黑'}方暗子池已空！`)
          piece.row = originalRow
          piece.col = originalCol
          if (targetPiece) pieces.value.push(targetPiece)
          return
        }
        const chosenName = shuffle(pool)[0]
        completeFlipAfterMove(piece, uciMove, chosenName)
      }
    } else {
      console.log(`[DEBUG] movePiece: Regular move detected. Finalizing.`)
      // Set highlight
      lastMovePositions.value = highlightMove
      console.log(
        `[DEBUG] movePiece: About to call recordAndFinalize with move: ${uciMove}`
      )
      recordAndFinalize('move', uciMove)
    }
  }

  // Calculate zIndex based on piece position and special conditions
  const calculatePieceZIndex = (piece: Piece): number | undefined => {
    // Base z-index: lower rows (visually closer) stack above higher rows
    // Row 9 (bottom) has higher priority; Row 0 (top) has lower priority
    const baseZIndex = piece.row * 10 // each row difference = 10 z-index units

    // Keep explicitly assigned zIndex (e.g., while moving)
    if (piece.zIndex !== undefined) {
      return piece.zIndex
    }

    // Checked king/general should float above others
    if (piece.isKnown && piece.name.includes('king')) {
      const side = getPieceSide(piece)
      if (isCurrentPositionInCheck(side)) {
        return 1100
      }
    }

    // Default layering based on position
    return baseZIndex
  }

  // Update z-index for all pieces based on current position
  const updateAllPieceZIndexes = () => {
    pieces.value.forEach(piece => {
      // Only compute when piece does not have an explicit zIndex (e.g., moving piece)
      if (piece.zIndex === undefined) {
        piece.zIndex = calculatePieceZIndex(piece)
      }
    })
  }

  // Convert UCI coordinates (if the board is flipped)
  const convertUciForFlip = (uci: string): string => {
    if (!isBoardFlipped.value || uci.length < 4) return uci

    const file2col = (c: string) => c.charCodeAt(0) - 'a'.charCodeAt(0)
    const rank2row = (d: string) => 9 - parseInt(d, 10)
    const row2rank = (r: number) => 9 - r
    const col2file = (c: number) => String.fromCharCode(97 + c)

    // Parse original coordinates
    const fromCol = file2col(uci[0])
    const fromRow = rank2row(uci[1])
    const toCol = file2col(uci[2])
    const toRow = rank2row(uci[3])

    // Flip the coordinates - both vertically and horizontally
    const flippedFromRow = 9 - fromRow
    const flippedToRow = 9 - toRow
    const flippedFromCol = 8 - fromCol // Horizontal mirror flip
    const flippedToCol = 8 - toCol // Horizontal mirror flip

    // Convert back to UCI format
    const flippedFromRank = row2rank(flippedFromRow)
    const flippedToRank = row2rank(flippedToRow)
    const flippedFromFile = col2file(flippedFromCol)
    const flippedToFile = col2file(flippedToCol)

    return `${flippedFromFile}${flippedFromRank}${flippedToFile}${flippedToRank}`
  }

  const playMoveFromUci = (uci: string): boolean => {
    // Trim whitespace characters (including \r\n) from the UCI string
    const trimmedUci = uci.trim()

    if (trimmedUci.length < 4) {
      return false
    }

    // Extract base UCI move (first 4 characters)
    const baseUci = trimmedUci.substring(0, 4)

    // If the board is flipped, UCI coordinates need to be converted
    const actualUci = convertUciForFlip(baseUci)

    const file2col = (c: string) => c.charCodeAt(0) - 'a'.charCodeAt(0)
    const rank2row = (d: string) => 9 - parseInt(d, 10)

    const fromCol = file2col(actualUci[0])
    const fromRow = rank2row(actualUci[1])
    const toCol = file2col(actualUci[2])
    const toRow = rank2row(actualUci[3])

    const piece = pieces.value.find(p => p.row === fromRow && p.col === fromCol)
    if (!piece) {
      return false
    }

    if (!isMoveValid(piece, toRow, toCol)) {
      return false
    }

    // Check if this move has explicit flip information
    const hasExplicitFlip = trimmedUci.length > 4

    // In match mode, always skip flip logic since JAI engine provides exact moves
    // For UCI engine moves, we should NOT skip flip logic since engine UCI moves are always 4 characters
    // Only skip flip logic if there's explicit flip information (which engine never provides)
    const isMatchMode = (window as any).__MATCH_MODE__ || false
    const skipFlipLogic = hasExplicitFlip || isMatchMode
    movePiece(piece, toRow, toCol, skipFlipLogic)

    // Handle flip information if present (characters after the 4th position)
    if (hasExplicitFlip) {
      const flipInfo = trimmedUci.substring(4)

      // Get the side that made this move (opposite of current side to move since move was just made)
      const moveSide = sideToMove.value === 'red' ? 'black' : 'red'

      // Process flip information based on the side that made the move
      // For red side: uppercase = revealed piece, lowercase = captured piece
      // For black side: lowercase = revealed piece, uppercase = captured piece
      for (const char of flipInfo) {
        const isUppercase =
          char === char.toUpperCase() && char !== char.toLowerCase()
        const isLowercase =
          char === char.toLowerCase() && char !== char.toUpperCase()

        // Determine if this character represents a revealed piece based on the side
        const isRevealedPiece =
          (moveSide === 'red' && isUppercase) ||
          (moveSide === 'black' && isLowercase)

        if (isRevealedPiece) {
          // This is a revealed piece - find and reveal the moved piece
          const pieceName = getPieceNameFromChar(char)
          if (pieceName) {
            // Find the moved piece and reveal it
            const movedPiece = pieces.value.find(
              p => p.row === toRow && p.col === toCol
            )
            if (movedPiece && !movedPiece.isKnown) {
              movedPiece.name = pieceName
              movedPiece.isKnown = true
              // Adjust unrevealed count
              adjustUnrevealedCount(char, -1)
            }
          }
        } else if (isUppercase || isLowercase) {
          // This is a captured piece - just adjust the unrevealed count
          const pieceName = getPieceNameFromChar(char)
          if (pieceName) {
            // Adjust unrevealed count for captured piece
            adjustUnrevealedCount(char, -1)
          }
        }
      }

      // If there was explicit flip information, clear any pending flip dialog
      if (pendingFlip.value) {
        pendingFlip.value = null
      }
    }

    return true // Executed successfully
  }

  const replayToMove = (index: number) => {
    currentMoveIndex.value = index
    if (index === 0) {
      // Load the initial FEN (either default or user-input) to preserve history
      loadFen(initialFen.value, false) // No animation during history navigation
      lastMovePositions.value = null // Clear highlight at the start of the game
      return
    }
    const targetFen = history.value[index - 1].fen
    loadFen(targetFen, false) // No animation during history navigation
    // Restore the highlight of the previous move
    const lastEntry = history.value[index - 1]
    if (lastEntry.type === 'move') {
      lastMovePositions.value = calculateMovePositions(lastEntry.data)
    } else {
      lastMovePositions.value = null
    }

    // Reset zIndex for all pieces during history replay
    pieces.value.forEach(p => (p.zIndex = undefined))
    // Update zIndex for all pieces based on new positions
    updateAllPieceZIndexes()

    // Trigger arrow clear event
    triggerArrowClear()

    // Force stop engine analysis and AI to ensure engine doesn't continue thinking when replaying moves
    window.dispatchEvent(
      new CustomEvent('force-stop-ai', {
        detail: { reason: 'replay-move' },
      })
    )
  }

  const copyFenToClipboard = async () => {
    try {
      // Use the same FEN generation logic as the engine to ensure consistency
      const fen = generateFen()
      await navigator.clipboard.writeText(fen)
      copySuccessVisible.value = true
      setTimeout(() => {
        copySuccessVisible.value = false
      }, 2000)
    } catch (e) {
      console.error('复制FEN失败', e)
      alert('无法复制FEN，你的浏览器可能不支持。')
    }
  }

  const inputFenString = () => {
    // Use global FEN dialog state
    isFenInputDialogVisible.value = true
  }

  const confirmFenInput = (fen: string) => {
    // Load FEN if the string is not empty
    if (fen && fen.trim()) {
      let processedFen = fen.trim()

      // Remove "position fen " or "fen " prefix if present
      if (processedFen.startsWith('position fen ')) {
        processedFen = processedFen.substring(13) // "position fen " length is 13
      } else if (processedFen.startsWith('fen ')) {
        processedFen = processedFen.substring(4) // "fen " length is 4
      } else if (processedFen.startsWith('position ')) {
        processedFen = processedFen.substring(9) // "position " length is 9
      }

      // Replace "startpos" with the actual start FEN (check if it starts with "startpos")
      if (processedFen.startsWith('startpos')) {
        if (processedFen === 'startpos') {
          processedFen = START_FEN
        } else if (processedFen.startsWith('startpos ')) {
          // If there are additional parts after "startpos", keep them
          const remainingPart = processedFen.substring(9) // "startpos " length is 9
          // Check if the remaining part contains "moves"
          if (remainingPart.startsWith('moves ')) {
            // For "startpos moves ..." format, we need to handle it specially
            processedFen = START_FEN + ' ' + remainingPart
          } else {
            // For other formats, just append
            processedFen = START_FEN + remainingPart
          }
        }
      }

      // Check if contains move history information
      const movesIndex = processedFen.indexOf(' moves ')
      if (movesIndex !== -1) {
        // Separate FEN part and move history part
        const fenPart = processedFen.substring(0, movesIndex).trim()
        const movesPart = processedFen.substring(movesIndex + 7).trim() // " moves " length is 7

        // Load base FEN first
        loadFen(fenPart, false)
        history.value = []
        currentMoveIndex.value = 0
        lastMovePositions.value = null

        // Ensure flip state is correct
        detectAndSetBoardFlip()

        // Reset zIndex for all pieces
        pieces.value.forEach(p => (p.zIndex = undefined))
        updateAllPieceZIndexes()

        // Reformat FEN using generateFen to ensure consistency for Opening section
        initialFen.value = generateFen()

        // Execute historical moves
        const moves = movesPart.split(' ').filter(move => move.length >= 4)
        for (const move of moves) {
          if (playMoveFromUci(move)) {
            // Move successful, continue to next
            continue
          } else {
            // Move failed, stop execution
            break
          }
        }

        // Trigger arrow clear event
        triggerArrowClear()
      } else {
        // No move history, process as before
        loadFen(processedFen, false)
        history.value = []
        currentMoveIndex.value = 0
        lastMovePositions.value = null

        // Ensure flip state is correct
        detectAndSetBoardFlip()

        // Reset zIndex for all pieces
        pieces.value.forEach(p => (p.zIndex = undefined))
        updateAllPieceZIndexes()

        // Reformat FEN using generateFen to ensure consistency for Opening section
        initialFen.value = generateFen()

        // Trigger arrow clear event
        triggerArrowClear()
      }

      // Force stop engine analysis and AI to ensure input FEN when engine doesn't continue thinking
      window.dispatchEvent(
        new CustomEvent('force-stop-ai', {
          detail: { reason: 'fen-input' },
        })
      )
    }
    // Close dialog regardless of whether FEN is loaded
    isFenInputDialogVisible.value = false
  }

  // Generate custom game notation format
  const generateGameNotation = (): GameNotation => {
    return {
      metadata: {
        event: '揭棋对局',
        site: 'jieqibox',
        date: new Date().toISOString().split('T')[0],
        white: '红方',
        black: '黑方',
        result: determineGameResult(), // Determine result based on current position
        initialFen: initialFen.value, // Use the actual initial FEN
        flipMode: flipMode.value,
        currentFen: generateFen(),
      },
      moves: [...history.value],
    }
  }

  // Save game notation to a file
  const saveGameNotation = async () => {
    try {
      const notation = generateGameNotation()
      const content = JSON.stringify(notation, null, 2)

      // Check if running on Android platform using centralized detection logic
      const isAndroidPlatform = checkAndroidPlatform()

      if (isAndroidPlatform) {
        // Use Tauri command to save to Android internal storage
        const filename = `jieqi_game_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
        const { invoke } = await import('@tauri-apps/api/core')
        const savedPath = await invoke('save_game_notation', {
          content,
          filename,
        })
        console.log('Game notation saved to:', savedPath)
        alert(
          `棋谱已保存到Android外部存储（${savedPath}），用户可通过文件管理器访问`
        )
      } else {
        // Use browser download for desktop platforms
        const blob = new Blob([content], { type: 'application/json' })
        const url = URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.href = url
        a.download = `揭棋对局_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('保存棋谱失败:', error)
      alert('保存棋谱失败，请重试')
    }
  }

  // Load game notation from a file
  const loadGameNotation = async (file: File) => {
    try {
      const text = await file.text()
      const notation: GameNotation = JSON.parse(text)

      // Validate the game notation format
      if (!notation.metadata || !notation.moves) {
        throw new Error('无效的棋谱格式')
      }

      // Set the flip mode
      if (notation.metadata.flipMode) {
        flipMode.value = notation.metadata.flipMode
      }

      // Restore the history
      history.value = [...notation.moves]
      currentMoveIndex.value = notation.moves.length

      // Always set the initial FEN from notation if available
      if (notation.metadata.initialFen) {
        initialFen.value = notation.metadata.initialFen // Set the initial FEN from notation
      }

      // If there is a current FEN, load the current state directly
      if (notation.metadata.currentFen) {
        loadFen(notation.metadata.currentFen, false)
        // Derive unrevealed piece counts from current FEN
        unrevealedPieceCounts.value = deriveUnrevealedPieceCountsFromFen(
          notation.metadata.currentFen
        )
      } else if (notation.metadata.initialFen) {
        // Otherwise, replay from the initial FEN
        loadFen(notation.metadata.initialFen, false)
        // Derive unrevealed piece counts from initial FEN
        unrevealedPieceCounts.value = deriveUnrevealedPieceCountsFromFen(
          notation.metadata.initialFen
        )
        if (currentMoveIndex.value > 0) {
          replayToMove(currentMoveIndex.value)
        }
      } else {
        setupNewGame()
      }

      // Reset zIndex for all pieces when loading game notation
      pieces.value.forEach(p => (p.zIndex = undefined))
      // Update zIndex for all pieces based on new positions
      updateAllPieceZIndexes()

      // Trigger arrow clear event
      triggerArrowClear()

      // Force stop engine analysis and AI to ensure loading game notation when engine doesn't continue thinking
      window.dispatchEvent(
        new CustomEvent('force-stop-ai', {
          detail: { reason: 'load-notation' },
        })
      )

      return true
    } catch (error) {
      console.error('加载棋谱失败:', error)
      alert('加载棋谱失败，请检查文件格式')
      return false
    }
  }

  // Open a game notation file
  const openGameNotation = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async event => {
      const target = event.target as HTMLInputElement
      if (target.files && target.files[0]) {
        await loadGameNotation(target.files[0])
      }
    }
    input.click()
  }

  // Detect board state and automatically set the flip state
  const detectAndSetBoardFlip = () => {
    // Record whether the board is flipped before detection
    const isBoardFlippedBeforeDetection = isBoardFlipped.value

    // Detect if the board should be flipped based on the current position
    // This is used to ensure the board orientation matches the FEN format
    const redKing = pieces.value.find(p => p.name === 'red_king')
    const blackKing = pieces.value.find(p => p.name === 'black_king')

    if (redKing && blackKing) {
      // If the red King is at the top (row < 5) and the black General is at the bottom (row >= 5), the board is flipped
      // If the red King is at the bottom (row >= 5) and the black General is at the top (row < 5), the board is in its normal state
      const shouldBeFlipped = redKing.row < 5 && blackKing.row >= 5

      if (shouldBeFlipped !== isBoardFlipped.value) {
        // The flip state needs to be adjusted
        isBoardFlipped.value = shouldBeFlipped
      }
    }

    // If the board was flipped before detection, flip it back
    if (isBoardFlippedBeforeDetection) {
      toggleBoardFlip(false)
    }
  }

  // Toggle the board flip state
  const toggleBoardFlip = (isAutoFlip = false) => {
    if (!isAutoFlip) {
      isBoardFlipped.value = !isBoardFlipped.value
    }

    // Flip the positions of all pieces - both vertically and horizontally
    pieces.value = pieces.value.map(piece => ({
      ...piece,
      row: 9 - piece.row, // Vertical flip (up-down)
      col: 8 - piece.col, // Horizontal mirror flip (left-right)
    }))
    // Reset zIndex for all pieces when flipping the board
    pieces.value.forEach(p => (p.zIndex = undefined))
    // Update zIndex for all pieces based on new positions
    updateAllPieceZIndexes()

    // Trigger arrow clear event
    triggerArrowClear()
  }

  // Register arrow clear callback
  const registerArrowClearCallback = (callback: () => void) => {
    arrowClearCallbacks.value.push(callback)
  }

  // Trigger arrow clear
  const triggerArrowClear = () => {
    arrowClearCallbacks.value.forEach(callback => callback())
  }

  // Calculate all valid moves for a given piece
  const getValidMovesForPiece = (
    piece: Piece
  ): { row: number; col: number }[] => {
    const validMoves: { row: number; col: number }[] = []

    // Iterate over all positions on the board
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 9; col++) {
        // Skip the current position
        if (row === piece.row && col === piece.col) {
          continue
        }
        // Check if each position is a valid move
        if (isMoveValid(piece, row, col)) {
          validMoves.push({ row, col })
        }
      }
    }

    return validMoves
  }

  // Get the valid moves for the currently selected piece
  const getValidMovesForSelectedPiece = computed(() => {
    if (pendingFlip.value !== null) return []

    if (!selectedPieceId.value) return []

    const selectedPiece = pieces.value.find(p => p.id === selectedPieceId.value)
    if (!selectedPiece) return []

    // Check if it's a piece of the current side to move
    const pieceSide = getPieceSide(selectedPiece)
    if (pieceSide !== sideToMove.value) return []

    return getValidMovesForPiece(selectedPiece)
  })

  // Get all legal moves for the current position (for variation analysis)
  const getAllLegalMovesForCurrentPosition = (): string[] => {
    const legalMoves: string[] = []
    const currentSidePieces = pieces.value.filter(
      p => getPieceSide(p) === sideToMove.value
    )

    // Generate UCI coordinates; if the board is flipped, coordinates need to be converted
    const toUci = (r: number, c: number) => {
      if (isBoardFlipped.value) {
        // After flipping, coordinates need to be converted - both vertically and horizontally
        const flippedRow = 9 - r
        const flippedCol = 8 - c // Horizontal mirror flip
        return `${String.fromCharCode(97 + flippedCol)}${9 - flippedRow}`
      } else {
        return `${String.fromCharCode(97 + c)}${9 - r}`
      }
    }

    currentSidePieces.forEach(piece => {
      const validMoves = getValidMovesForPiece(piece)
      validMoves.forEach(move => {
        const uciMove = toUci(piece.row, piece.col) + toUci(move.row, move.col)
        legalMoves.push(uciMove)
      })
    })

    return legalMoves
  }

  // Calculate move positions from UCI move data
  function calculateMovePositions(uciMove: string): {
    from: { row: number; col: number }
    to: { row: number; col: number }
  } | null {
    if (uciMove.length < 4) return null

    const file2col = (c: string) => c.charCodeAt(0) - 'a'.charCodeAt(0)
    const rank2row = (d: string) => 9 - parseInt(d, 10)

    const fromCol = file2col(uciMove[0])
    const fromRow = rank2row(uciMove[1])
    const toCol = file2col(uciMove[2])
    const toRow = rank2row(uciMove[3])

    return {
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
    }
  }

  // Update comment for a specific move
  const updateMoveComment = (moveIndex: number, comment: string) => {
    if (moveIndex >= 0 && moveIndex < history.value.length) {
      history.value[moveIndex] = {
        ...history.value[moveIndex],
        comment: comment.trim() || undefined,
      }
    }
  }

  // Undo the last move (whether made by human or computer)
  const undoLastMove = () => {
    // Check if there are any moves to undo
    if (currentMoveIndex.value <= 0) {
      return false // No moves to undo
    }

    // Remove the last move from history
    const newHistory = history.value.slice(0, currentMoveIndex.value - 1)
    history.value = newHistory
    currentMoveIndex.value = newHistory.length

    // Replay to the new current position
    if (newHistory.length === 0) {
      // If no moves left, load the initial position
      loadFen(initialFen.value, false)
      lastMovePositions.value = null
    } else {
      // Replay to the last remaining move
      const lastEntry = newHistory[newHistory.length - 1]
      loadFen(lastEntry.fen, false)
      if (lastEntry.type === 'move') {
        lastMovePositions.value = calculateMovePositions(lastEntry.data)
      } else {
        lastMovePositions.value = null
      }
    }

    // Reset zIndex for all pieces
    pieces.value.forEach(p => (p.zIndex = undefined))
    updateAllPieceZIndexes()

    // Trigger arrow clear event
    triggerArrowClear()

    // Force stop engine analysis and AI to ensure undo move when engine doesn't continue thinking
    window.dispatchEvent(
      new CustomEvent('force-stop-ai', {
        detail: { reason: 'undo-move' },
      })
    )

    return true
  }

  setupNewGame()

  // Derive unrevealed piece counts from FEN string
  const deriveUnrevealedPieceCountsFromFen = (
    fen: string
  ): { [key: string]: number } => {
    const parts = fen.split(' ')

    // Detect FEN format by checking if second part is color ('w' or 'b')
    const isNewFormat =
      parts.length >= 2 && (parts[1] === 'w' || parts[1] === 'b')

    // In new format: board color hiddenPart halfmove fullmove
    // In old format: board hiddenPart color castling enpassant halfmove fullmove
    const hiddenPart = isNewFormat
      ? parts.length >= 3
        ? parts[2]
        : '-'
      : parts.length >= 2
        ? parts[1]
        : '-'

    const newCounts: { [key: string]: number } = {}
    'RNBAKCP rnbakcp'
      .split('')
      .filter(c => c !== ' ')
      .forEach(c => (newCounts[c] = 0))

    if (hiddenPart && hiddenPart !== '-') {
      const hiddenMatches = hiddenPart.match(/[a-zA-Z]\d+/g) || []
      hiddenMatches.forEach(match => {
        const char = match[0]
        const count = parseInt(match.slice(1), 10)
        newCounts[char] = count
      })
    }

    return newCounts
  }

  // Determine game result based on current position
  const determineGameResult = (): string => {
    // Get all legal moves for the current side to move
    const legalMoves = getAllLegalMovesForCurrentPosition()

    // If no legal moves are available, the current side has lost
    if (legalMoves.length === 0) {
      // Determine which side has no legal moves and set the result accordingly
      if (sideToMove.value === 'red') {
        return '0-1' // Red has no legal moves, Black wins
      } else {
        return '1-0' // Black has no legal moves, Red wins
      }
    }

    // Game is still ongoing
    return '*'
  }

  return {
    pieces,
    selectedPieceId,
    copySuccessVisible,
    sideToMove,
    history,
    moveHistory,
    currentMoveIndex,
    flipMode,
    unrevealedPieceCounts,
    pendingFlip,
    validationStatus,
    isFenInputDialogVisible,
    confirmFenInput,
    isAnimating,
    lastMovePositions,
    initialFen,
    getPieceNameFromChar,
    getPieceSide,
    getRoleByPosition,
    generateFen,
    generateFenForEngine,
    detectFenFormat,
    convertFenFormat,
    copyFenToClipboard,
    inputFenString,
    handleBoardClick,
    clearHistoryAndMove,
    setupNewGame,
    playMoveFromUci,
    replayToMove,
    adjustUnrevealedCount,
    saveGameNotation,
    openGameNotation,
    generateGameNotation,
    loadFen,
    recordAndFinalize,
    toggleBoardFlip,
    isBoardFlipped,
    detectAndSetBoardFlip,
    registerArrowClearCallback,
    triggerArrowClear,
    isCurrentPositionInCheck,
    isInCheck,
    wouldBeInCheckAfterMove,
    getValidMovesForSelectedPiece,
    getAllLegalMovesForCurrentPosition,
    undoLastMove,
    updateAllPieceZIndexes,
    updateMoveComment,
    determineGameResult,
  }
}
