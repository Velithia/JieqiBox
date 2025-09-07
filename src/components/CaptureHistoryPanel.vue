<template>
  <DraggablePanel panel-id="capture-history">
    <template #header>
      <h3 class="section-title">{{ $t('analysis.captureHistory') }}</h3>
    </template>
    <div class="capture-history">
      <div class="capture-section">
        <h4 class="capture-title">{{ $t('analysis.myCaptured') }}</h4>
        <div class="captured-pieces">
          <div
            v-for="(piece, index) in myCapturedPieces"
            :key="index"
            class="captured-piece"
          >
            <img
              :src="getPieceImageUrl(piece.name)"
              :alt="piece.name"
              class="captured-piece-img"
            />
          </div>
          <div v-if="myCapturedPieces.length === 0" class="no-captures">
            {{ $t('analysis.noCaptured') }}
          </div>
        </div>
      </div>

      <div class="capture-section">
        <h4 class="capture-title">{{ $t('analysis.opponentCaptured') }}</h4>
        <div class="captured-pieces">
          <div
            v-for="(piece, index) in opponentCapturedPieces"
            :key="index"
            class="captured-piece"
          >
            <img
              :src="getPieceImageUrl(piece.name)"
              :alt="
                piece.name === 'unknown'
                  ? $t('positionEditor.pieces.unknown')
                  : piece.name
              "
              :class="[
                'captured-piece-img',
                { unknown: piece.name === 'unknown' },
              ]"
            />
          </div>
          <div v-if="opponentCapturedPieces.length === 0" class="no-captures">
            {{ $t('analysis.noCaptured') }}
          </div>
        </div>
      </div>
    </div>
  </DraggablePanel>
</template>

<script setup lang="ts">
  import { computed, inject } from 'vue'
  import { useHumanVsAiSettings } from '@/composables/useHumanVsAiSettings'
  import DraggablePanel from './DraggablePanel.vue'
  const { isHumanVsAiMode, aiSide } = useHumanVsAiSettings()

  // Inject game state
  const gameState = inject('game-state') as any
  const { history, currentMoveIndex } = gameState

  // Get piece image URL function (consistent with other components)
  const getPieceImageUrl = (pieceName: string): string => {
    const imageName = pieceName === 'unknown' ? 'dark_piece' : pieceName
    return new URL(`../assets/${imageName}.svg`, import.meta.url).href
  }

  interface CapturedPiece {
    name: string
    moveNumber: number
  }

  // Parse UCI extended format to extract flip and capture information
  const parseUciExtended = (uciMove: string, movingSide: 'red' | 'black') => {
    if (uciMove.length <= 4) {
      return { flipChar: null, captureChar: null }
    }

    const extension = uciMove.slice(4) // Everything after position info

    console.log(
      `parseUciExtended: uciMove="${uciMove}", movingSide="${movingSide}"`
    )
    console.log(`Extension: "${extension}"`)

    if (extension.length === 1) {
      // 5 characters total: could be flip or capture
      const char = extension[0]
      const isUpperCase = char === char.toUpperCase()
      const charSide = isUpperCase ? 'red' : 'black'

      console.log(
        `Single char extension: char="${char}", isUpperCase=${isUpperCase}, charSide="${charSide}"`
      )

      if (charSide === movingSide) {
        // Same side as mover: this is a flip (revealing own piece)
        console.log(`Result: flip="${char}", capture=null`)
        return { flipChar: char, captureChar: null }
      } else {
        // Different side: this is a capture (eating opponent's piece)
        console.log(`Result: flip=null, capture="${char}"`)
        return { flipChar: null, captureChar: char }
      }
    } else if (extension.length === 2) {
      // 6 characters total: first is flip, second is capture
      console.log(
        `Two char extension: flip="${extension[0]}", capture="${extension[1]}"`
      )
      return { flipChar: extension[0], captureChar: extension[1] }
    }

    console.log(`Result: flip=null, capture=null`)
    return { flipChar: null, captureChar: null }
  }

  // Parse captures from game history (both known and unknown pieces)
  const parseCaptures = () => {
    const myCaptured: CapturedPiece[] = []
    const opponentCaptured: CapturedPiece[] = []

    if (!isHumanVsAiMode.value || !history.value) {
      return { myCaptured, opponentCaptured }
    }

    const humanSide = aiSide.value === 'red' ? 'black' : 'red'

    console.log('=== parseCaptures DEBUG ===')
    console.log('Human side:', humanSide)
    console.log('AI side:', aiSide.value)
    console.log('Current move index:', currentMoveIndex.value)
    console.log('History length:', history.value.length)

    // Parse history up to current move
    for (
      let i = 0;
      i <= currentMoveIndex.value && i < history.value.length;
      i++
    ) {
      const move = history.value[i]
      if (!move.data || move.type !== 'move') continue

      const uciMove = move.data

      // Calculate move number based on the actual move sequence
      // If red starts first, move 0,2,4... are red moves, 1,3,5... are black moves
      // If black starts first, move 0,2,4... are black moves, 1,3,5... are red moves
      let moveNumber: number
      if (i === 0) {
        // First move is always move 1
        moveNumber = 1
      } else {
        // For subsequent moves, check if this is a new full move
        const prevFen = gameState.history.value[i - 1].fen
        const fenParts = prevFen.split(' ')
        const prevColorField = fenParts[1] || 'w'
        const currentFen = move.fen
        const currentFenParts = currentFen.split(' ')
        const currentColorField = currentFenParts[1] || 'w'

        // If color changed from 'w' to 'b', this is a new full move
        if (prevColorField === 'w' && currentColorField === 'b') {
          // This is the start of a new full move
          moveNumber = Math.floor(i / 2) + 1
        } else {
          // This is the second move of the current full move
          moveNumber = Math.floor((i - 1) / 2) + 1
        }
      }

      // Determine whose move this is based on the FEN color field before this move
      let isHumanMove: boolean
      if (i === 0) {
        // For the first move, check the initial FEN
        const initialFenParts = gameState.initialFen.value.split(' ')
        const colorField = initialFenParts[1] || 'w'
        const firstMover = colorField === 'w' ? 'red' : 'black'
        isHumanMove = firstMover === humanSide
      } else {
        // For subsequent moves, check the FEN before this move
        const prevFen = gameState.history.value[i - 1].fen
        const fenParts = prevFen.split(' ')
        const colorField = fenParts[1] || 'w'
        const mover = colorField === 'w' ? 'red' : 'black'
        isHumanMove = mover === humanSide
      }

      // Determine moving side from the FEN color field before this move
      let movingSide: 'red' | 'black'
      if (i === 0) {
        // For the first move, check the initial FEN
        const initialFenParts = gameState.initialFen.value.split(' ')
        const colorField = initialFenParts[1] || 'w'
        movingSide = colorField === 'w' ? 'red' : 'black'
      } else {
        // For subsequent moves, check the FEN before this move
        const prevFen = gameState.history.value[i - 1].fen
        const fenParts = prevFen.split(' ')
        const colorField = fenParts[1] || 'w'
        movingSide = colorField === 'w' ? 'red' : 'black'
      }

      console.log(`\nMove ${i}: ${uciMove}`)
      console.log(`Move number: ${moveNumber}`)
      console.log(`Is human move: ${isHumanMove}`)
      console.log(`Moving side: ${movingSide}`)

      // Check for captures from UCI extended format (dark pieces)
      const { captureChar } = parseUciExtended(uciMove, movingSide)
      console.log(`UCI extended capture: ${captureChar || 'none'}`)

      // Check for captures from basic UCI (revealed pieces captured)
      const basicCapture = checkBasicCapture(uciMove, i)
      console.log(`Basic capture: ${basicCapture || 'none'}`)

      // No need for special hidden capture detection since UCI format is now complete

      // Handle captures - both UCI extension and basic captures can occur simultaneously
      // (e.g., dark piece eating revealed piece = flip + capture)
      let captureHandled = false

      if (captureChar) {
        // Dark piece capture (from UCI extension)
        if (isHumanMove) {
          // Human captured a dark piece - show what they captured
          const pieceName = getPieceNameFromChar(captureChar)
          if (pieceName) {
            myCaptured.push({ name: pieceName, moveNumber })
            console.log(`Added dark piece capture to myCaptured: ${pieceName}`)
            captureHandled = true
          }
        } else {
          // AI captured a dark piece - in human vs AI mode, don't reveal what was captured
          if (isHumanVsAiMode.value) {
            opponentCaptured.push({ name: 'unknown', moveNumber })
            console.log(
              `Added dark piece capture to opponentCaptured: unknown (hidden from human)`
            )
          } else {
            // In normal mode, show what was captured
            const pieceName = getPieceNameFromChar(captureChar)
            if (pieceName) {
              opponentCaptured.push({ name: pieceName, moveNumber })
              console.log(
                `Added dark piece capture to opponentCaptured: ${pieceName}`
              )
            }
          }
          captureHandled = true
        }
      }

      if (basicCapture) {
        // Revealed piece capture (from board position change)
        // This can happen even when captureChar exists (dark piece eating revealed piece)
        if (isHumanMove) {
          // Human captured a revealed piece - show what they captured
          // Only add if we haven't already added a capture for this move
          if (!captureHandled) {
            myCaptured.push({ name: basicCapture, moveNumber })
            console.log(
              `Added revealed piece capture to myCaptured: ${basicCapture}`
            )
          } else {
            console.log(
              `Basic capture detected but already handled via UCI extension: ${basicCapture}`
            )
          }
        } else {
          // AI captured a revealed piece - show what was captured (it was visible)
          // For AI moves, basic capture should override UCI extension (show actual piece instead of unknown)
          if (captureHandled) {
            // Replace the 'unknown' entry with the actual piece
            const lastEntry = opponentCaptured[opponentCaptured.length - 1]
            if (
              lastEntry &&
              lastEntry.name === 'unknown' &&
              lastEntry.moveNumber === moveNumber
            ) {
              lastEntry.name = basicCapture
              console.log(
                `Replaced unknown capture with revealed piece: ${basicCapture}`
              )
            }
          } else {
            opponentCaptured.push({ name: basicCapture, moveNumber })
            console.log(
              `Added revealed piece capture to opponentCaptured: ${basicCapture}`
            )
          }
        }
      } else if (!captureHandled) {
        console.log('No capture detected')
      }
    }

    console.log('Final results:')
    console.log('My captured:', myCaptured)
    console.log('Opponent captured:', opponentCaptured)
    console.log('=== END parseCaptures DEBUG ===\n')

    return { myCaptured, opponentCaptured }
  }

  // Check if a basic UCI move captured a revealed piece by comparing board states
  const checkBasicCapture = (
    uciMove: string,
    moveIndex: number
  ): string | null => {
    // Accept both 4-character moves and longer moves (extract first 4 characters)
    if (uciMove.length < 4) return null
    const basicUci = uciMove.slice(0, 4) // Extract basic move part

    // Get board state before this move
    let fenBefore: string
    if (moveIndex === 0) {
      fenBefore =
        gameState.initialFen ||
        'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1'
    } else {
      fenBefore = history.value[moveIndex - 1].fen
    }

    // Parse target position from UCI
    const toFile = basicUci[2]
    const toRank = basicUci[3]
    const toCol = toFile.charCodeAt(0) - 'a'.charCodeAt(0)
    const toRow = 9 - parseInt(toRank) // Convert UCI rank to row index (rank 1 = row 8, rank 9 = row 0)

    // DEBUG: Log input parameters
    console.log('=== checkBasicCapture DEBUG ===')
    console.log('Full UCI move:', uciMove)
    console.log('Basic UCI (first 4 chars):', basicUci)
    console.log('Move index:', moveIndex)
    console.log('Target file:', toFile, 'rank:', toRank)
    console.log('Calculated col:', toCol, 'row:', toRow, '(FIXED: 9 - rank)')
    console.log('FEN before move:', fenBefore)

    // Check if there was a revealed piece at the target position
    try {
      // Parse FEN to get piece positions (simplified parsing for capture detection)
      const fenParts = fenBefore.split(' ')
      const boardPart = fenParts[0]
      const rows = boardPart.split('/')

      console.log('FEN parts:', fenParts)
      console.log('Board part:', boardPart)
      console.log('Rows:', rows)
      console.log('Target row index:', toRow, 'Row exists:', !!rows[toRow])

      if (rows[toRow]) {
        const targetRow = rows[toRow]
        console.log('Target row string:', targetRow)

        let col = 0
        for (let i = 0; i < targetRow.length; i++) {
          const char = targetRow[i]
          console.log(
            `Position ${i}: char='${char}', current col=${col}, target col=${toCol}`
          )

          if (char >= '1' && char <= '9') {
            const spaces = parseInt(char)
            console.log(`Found number ${char}, adding ${spaces} spaces`)
            col += spaces
          } else if (char !== 'x' && char !== 'X') {
            // Found a revealed piece
            console.log(`Found revealed piece '${char}' at col ${col}`)
            if (col === toCol) {
              const pieceName = getPieceNameFromChar(char)
              console.log(`MATCH! Captured revealed piece: ${pieceName}`)
              console.log('=== END DEBUG ===')
              return pieceName
            }
            col++
          } else {
            console.log(`Found dark piece '${char}' at col ${col}`)
            col++
          }
        }
        console.log(`No piece found at target position (col ${toCol})`)
      } else {
        console.log('Target row does not exist!')
      }
    } catch (error) {
      console.warn('Failed to parse FEN for capture detection:', error)
      console.log('=== END DEBUG ===')
    }

    console.log('=== END DEBUG ===')
    return null
  }

  // Helper function to convert piece character to name
  const getPieceNameFromChar = (char: string): string | null => {
    const charMap: Record<string, string> = {
      K: 'red_king',
      k: 'black_king',
      A: 'red_advisor',
      a: 'black_advisor',
      B: 'red_elephant',
      b: 'black_elephant',
      N: 'red_horse',
      n: 'black_horse',
      R: 'red_chariot',
      r: 'black_chariot',
      C: 'red_cannon',
      c: 'black_cannon',
      P: 'red_pawn',
      p: 'black_pawn',
    }
    return charMap[char] || null
  }

  // Computed properties for captured pieces
  const myCapturedPieces = computed(() => parseCaptures().myCaptured)
  const opponentCapturedPieces = computed(
    () => parseCaptures().opponentCaptured
  )
</script>

<style scoped lang="scss">
  .capture-history {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .capture-section {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 4px;
    padding: 8px;
  }

  .capture-title {
    font-size: 0.9rem;
    font-weight: bold;
    margin-bottom: 8px;
    color: rgb(var(--v-theme-on-surface));
  }

  .captured-pieces {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    min-height: 32px;
    align-items: center;
  }

  .captured-piece {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .captured-piece-img {
    width: 30px;
    height: 30px;
    border-radius: 2px;

    &.unknown {
      opacity: 0.6;
      filter: grayscale(100%);
    }
  }

  .capture-move {
    font-size: 0.7rem;
    color: rgb(var(--v-theme-on-surface-variant));
  }

  .no-captures {
    font-size: 0.8rem;
    color: rgb(var(--v-theme-on-surface-variant));
    font-style: italic;
  }
</style>
