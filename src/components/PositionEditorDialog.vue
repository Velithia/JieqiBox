<template>
  <v-dialog
    v-model="isVisible"
    persistent
    max-width="800px"
    :fullscreen="$vuetify.display.smAndDown"
  >
    <v-card>
      <v-card-title class="pb-2">
        <span class="text-h6">{{ $t('positionEditor.title') }}</span>
      </v-card-title>

      <v-card-text class="pt-0">
        <v-container class="pa-0 position-editor-container">
          <!-- Action Buttons -->
          <v-row class="mb-2">
            <v-col cols="12">
              <div class="d-flex gap-1 flex-wrap action-buttons">
                <v-btn
                  @click="flipBoard"
                  color="primary"
                  variant="outlined"
                  size="small"
                >
                  {{ $t('positionEditor.flipBoard') }}
                </v-btn>
                <v-btn
                  @click="mirrorLeftRight"
                  color="primary"
                  variant="outlined"
                  size="small"
                >
                  {{ $t('positionEditor.mirrorLeftRight') }}
                </v-btn>
                <v-btn
                  @click="switchSide"
                  color="secondary"
                  variant="outlined"
                  size="small"
                >
                  {{ $t('positionEditor.switchSide') }}
                </v-btn>
                <v-btn
                  @click="resetOrClearPosition"
                  color="warning"
                  variant="outlined"
                  size="small"
                >
                  {{
                    isInitialPosition
                      ? $t('positionEditor.clearPosition')
                      : $t('positionEditor.resetPosition')
                  }}
                </v-btn>
                <v-btn
                  @click="openImageRecognition"
                  color="info"
                  variant="outlined"
                  size="small"
                  :disabled="isProcessing"
                >
                  {{ $t('positionEditor.recognizeImage') }}
                </v-btn>
              </div>
            </v-col>
          </v-row>

          <!-- Current side indicator + preserve toggle -->
          <v-row class="mb-2 side-to-move">
            <v-col cols="12">
              <div
                class="d-flex flex-wrap align-center justify-space-between gap-2"
              >
                <v-chip
                  :color="editingSideToMove === 'red' ? 'red' : 'black'"
                  text-color="white"
                  size="small"
                  class="side-indicator"
                >
                  {{ $t('positionEditor.currentSide') }}:
                  {{
                    editingSideToMove === 'red'
                      ? $t('positionEditor.redToMove')
                      : $t('positionEditor.blackToMove')
                  }}
                </v-chip>
                <v-switch
                  v-model="preserveDarkPools"
                  :label="$t('positionEditor.preserveDarkPools')"
                  color="primary"
                  density="compact"
                  hide-details
                  class="preserve-switch"
                ></v-switch>
              </div>
            </v-col>
          </v-row>

          <!-- Image Recognition Panel -->
          <v-row v-if="showImageRecognition" class="mb-2">
            <v-col cols="12">
              <v-card variant="outlined">
                <v-card-title class="pb-2">
                  <span class="text-h6">{{
                    $t('positionEditor.imageRecognition')
                  }}</span>
                  <v-spacer></v-spacer>
                  <v-btn
                    icon="mdi-close"
                    size="small"
                    @click="closeImageRecognition"
                  ></v-btn>
                </v-card-title>
                <v-card-text>
                  <div class="image-recognition-container">
                    <!-- Upload Area -->
                    <div
                      class="upload-area"
                      :class="{ 'drag-over': isDragOver }"
                      @dragover.prevent
                      @dragleave.prevent="isDragOver = false"
                      @drop.prevent="handleDrop"
                      @click="triggerFileInput"
                    >
                      <input
                        ref="fileInputRef"
                        type="file"
                        accept="image/*"
                        @change="handleFileSelect"
                        style="display: none"
                      />
                      <div v-if="!inputImage" class="upload-placeholder">
                        <v-icon size="48" class="mb-2">mdi-image</v-icon>
                        <p>{{ $t('positionEditor.clickOrDragImage') }}</p>
                        <p class="text-caption">
                          {{ $t('positionEditor.supportedFormats') }}
                        </p>
                      </div>
                      <div v-else class="image-preview">
                        <div class="image-stage">
                          <img
                            ref="imageDisplayRef"
                            :src="inputImage.src"
                            class="preview-image"
                            alt="Chessboard image"
                          />
                          <canvas
                            ref="canvasRef"
                            class="overlay-canvas"
                          ></canvas>
                        </div>
                      </div>
                    </div>

                    <!-- Status and Controls -->
                    <div class="recognition-controls">
                      <v-alert
                        v-if="recognitionStatus"
                        :type="
                          recognitionStatus.includes('失败') ||
                          recognitionStatus.includes('错误')
                            ? 'error'
                            : 'info'
                        "
                        variant="tonal"
                        density="compact"
                        class="mb-2"
                      >
                        {{ recognitionStatus }}
                      </v-alert>

                      <div class="d-flex gap-2 flex-wrap align-center">
                        <v-btn
                          @click="processCurrentImage"
                          color="primary"
                          :disabled="!inputImage || isProcessing"
                          :loading="isProcessing"
                        >
                          {{ $t('positionEditor.startRecognition') }}
                        </v-btn>
                        <v-btn
                          @click="applyRecognitionResults"
                          color="success"
                          :disabled="detectedBoxes.length === 0 || isProcessing"
                        >
                          {{ $t('positionEditor.applyResults') }}
                        </v-btn>
                        <v-btn
                          @click="clearRecognition"
                          color="error"
                          variant="outlined"
                          :disabled="isProcessing"
                        >
                          {{ $t('positionEditor.clear') }}
                        </v-btn>

                        <!-- Bounding boxes toggle -->
                        <v-switch
                          v-model="showBoundingBoxes"
                          :label="$t('positionEditor.showBoundingBoxes')"
                          color="primary"
                          density="compact"
                          hide-details
                          @change="onBoundingBoxToggle"
                        ></v-switch>
                      </div>
                    </div>

                    <!-- Recognition Results Grid -->
                    <div
                      v-if="boardGrid && boardGrid.length > 0"
                      class="recognition-results"
                    >
                      <h6 class="mb-2">
                        {{ $t('positionEditor.recognitionResults') }}
                      </h6>
                      <div class="board-grid-display">
                        <div
                          v-for="(row, rowIndex) in boardGrid"
                          :key="rowIndex"
                          class="grid-row"
                        >
                          <div
                            v-for="(cell, colIndex) in row"
                            :key="`${rowIndex}-${colIndex}`"
                            class="grid-cell"
                            :class="{ 'has-piece': cell }"
                          >
                            <span v-if="cell">{{
                              getDetectedPieceDisplayName(cell)
                            }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Layout for mobile and desktop -->
          <v-row class="g-0">
            <!-- Board area -->
            <v-col cols="12" md="8" class="pa-1 board-col">
              <div class="position-editor-board">
                <img src="@/assets/xiangqi.png" class="board-bg" alt="board" />

                <!-- Pieces -->
                <div class="pieces">
                  <img
                    v-for="piece in editingPieces"
                    :key="piece.id"
                    :src="getPieceImageUrl(piece.name)"
                    class="piece"
                    :class="{
                      selected: selectedPiece && selectedPiece.id === piece.id,
                    }"
                    :style="rcStyle(piece.row, piece.col)"
                    @click="selectPiece(piece)"
                  />
                </div>

                <!-- Board click area for placing pieces -->
                <div class="board-click-area" @click="handleBoardClick"></div>
              </div>
            </v-col>

            <!-- Piece selector panel -->
            <v-col cols="12" md="4" class="pa-1 selector-col">
              <div class="piece-selector">
                <!-- Selected Piece Info -->
                <div v-if="selectedPiece" class="selected-piece-info mb-3">
                  <h6 class="mb-2">{{ $t('positionEditor.selectedPiece') }}</h6>
                  <div class="selected-piece-display">
                    <img
                      :src="getPieceImageUrl(selectedPiece.name)"
                      :alt="selectedPiece.name"
                      class="piece-img-large"
                    />
                    <span class="piece-name">{{
                      getPieceDisplayName(selectedPiece.name)
                    }}</span>
                  </div>
                  <p class="hint-text">
                    {{ $t('positionEditor.clickToPlace') }}
                  </p>
                  <v-btn
                    @click="removePieceById(selectedPiece.id)"
                    color="error"
                    variant="outlined"
                    size="small"
                    class="mt-2"
                  >
                    {{ $t('common.delete') }}
                  </v-btn>
                </div>

                <h5 class="mb-2 desktop-only">
                  {{ $t('positionEditor.addPieces') }}
                </h5>

                <!-- Known Piece Selection -->
                <div class="piece-category">
                  <h6 class="mb-1 desktop-only">
                    {{ $t('positionEditor.revealedPieces') }}
                  </h6>
                  <div class="piece-grid">
                    <div
                      v-for="piece in knownPieces"
                      :key="piece.name"
                      class="piece-option"
                      @click="selectPieceType(piece.name, true)"
                    >
                      <img
                        :src="getPieceImageUrl(piece.name)"
                        :alt="piece.name"
                        class="piece-img"
                      />
                      <span class="piece-name">{{ piece.displayName }}</span>
                    </div>
                  </div>
                </div>

                <!-- Unknown Piece Selection -->
                <div class="piece-category">
                  <h6 class="mb-1 desktop-only">
                    {{ $t('positionEditor.darkPieces') }}
                  </h6>
                  <div class="piece-grid">
                    <div
                      v-for="piece in unknownPieces"
                      :key="piece.name"
                      class="piece-option"
                      @click="selectPieceType(piece.name, false)"
                    >
                      <img
                        :src="getPieceImageUrl('dark_piece')"
                        :alt="piece.name"
                        class="piece-img"
                      />
                      <span class="piece-name">{{ piece.displayName }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </v-col>
          </v-row>

          <!-- Validation Status -->
          <v-row class="mt-2">
            <v-col cols="12">
              <v-alert
                :type="validationStatus.type as 'success' | 'error'"
                :title="validationStatus.message"
                variant="tonal"
                density="compact"
                class="validation-alert"
              />
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions class="pa-3">
        <v-spacer></v-spacer>
        <v-btn color="error" variant="text" size="small" @click="cancelEdit">
          {{ $t('positionEditor.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          size="small"
          @click="applyChanges"
          :disabled="validationStatus.type !== 'success'"
        >
          {{ $t('positionEditor.applyChanges') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { ref, computed, inject, watch, nextTick } from 'vue'
  import { useI18n } from 'vue-i18n'
  import MersenneTwister from 'mersenne-twister'
  import type { Piece } from '@/composables/useChessGame'
  import { START_FEN, INITIAL_PIECE_COUNTS, FEN_MAP } from '@/utils/constants'
  import {
    useImageRecognition,
    type DetectionBox,
    LABELS,
  } from '@/composables/image-recognition'

  // Create a global instance of Mersenne Twister for this component
  const mt = new MersenneTwister()

  // Set seed based on current date and time for better randomness
  mt.init_seed(new Date().getTime())

  // Custom random function using Mersenne Twister
  const mtRandom = (): number => {
    return mt.random()
  }

  interface Props {
    modelValue: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'position-changed', pieces: Piece[], sideToMove: 'red' | 'black'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const { t } = useI18n()
  const gameState: any = inject('game-state')

  // Layout constants similar to Chessboard.vue
  const PAD_X = 11,
    PAD_Y = 11,
    COLS = 9,
    ROWS = 10,
    GX = 100 - PAD_X,
    GY = 100 - PAD_Y,
    OX = PAD_X / 2,
    OY = PAD_Y / 2

  // Dialog visibility
  const isVisible = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  })

  // Editing state
  const editingPieces = ref<Piece[]>([])
  const editingSideToMove = ref<'red' | 'black'>('red')
  const selectedPiece = ref<Piece | null>(null)
  const preserveDarkPools = ref(false)

  // Image recognition state
  const showImageRecognition = ref(false)
  const isDragOver = ref(false)
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const imageDisplayRef = ref<HTMLImageElement | null>(null)
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const inputImage = ref<HTMLImageElement | null>(null)
  const detectedBoxes = ref<DetectionBox[]>([])
  const boardGrid = ref<(DetectionBox | null)[][] | null>(null)

  // Image recognition composable
  const {
    isProcessing,
    status: recognitionStatus,
    detectedBoxes: recognitionDetectedBoxes,
    showBoundingBoxes,
    processImage,
    drawBoundingBoxes,
    updateBoardGrid,
  } = useImageRecognition()

  // Calculate row/col to percentage coordinates
  const percentFromRC = (row: number, col: number) => ({
    x: OX + (col / (COLS - 1)) * GX,
    y: OY + (row / (ROWS - 1)) * GY,
  })

  const rcStyle = (r: number, c: number) => {
    const { x, y } = percentFromRC(r, c)
    return {
      top: `${y}%`,
      left: `${x}%`,
      transform: 'translate(-50%,-50%)',
    }
  }

  // Piece options
  const knownPieces = computed(() => [
    {
      name: 'red_chariot',
      displayName: t('positionEditor.pieces.red_chariot'),
    },
    { name: 'red_horse', displayName: t('positionEditor.pieces.red_horse') },
    {
      name: 'red_elephant',
      displayName: t('positionEditor.pieces.red_elephant'),
    },
    {
      name: 'red_advisor',
      displayName: t('positionEditor.pieces.red_advisor'),
    },
    { name: 'red_king', displayName: t('positionEditor.pieces.red_king') },
    { name: 'red_cannon', displayName: t('positionEditor.pieces.red_cannon') },
    { name: 'red_pawn', displayName: t('positionEditor.pieces.red_pawn') },
    {
      name: 'black_chariot',
      displayName: t('positionEditor.pieces.black_chariot'),
    },
    {
      name: 'black_horse',
      displayName: t('positionEditor.pieces.black_horse'),
    },
    {
      name: 'black_elephant',
      displayName: t('positionEditor.pieces.black_elephant'),
    },
    {
      name: 'black_advisor',
      displayName: t('positionEditor.pieces.black_advisor'),
    },
    { name: 'black_king', displayName: t('positionEditor.pieces.black_king') },
    {
      name: 'black_cannon',
      displayName: t('positionEditor.pieces.black_cannon'),
    },
    { name: 'black_pawn', displayName: t('positionEditor.pieces.black_pawn') },
  ])

  const unknownPieces = computed(() => [
    { name: 'unknown', displayName: t('positionEditor.pieces.unknown') },
  ])

  // Check if current position is the initial position
  const isInitialPosition = computed(() => {
    if (editingPieces.value.length !== 32) return false

    // Compare with initial FEN layout
    const initialBoard = Array(10)
      .fill(null)
      .map(() => Array(9).fill(null))

    // Parse START_FEN to get initial piece positions
    const fenParts = START_FEN.split(' ')
    const boardPart = fenParts[0]

    boardPart.split('/').forEach((rowStr, rowIndex) => {
      let colIndex = 0
      for (const char of rowStr) {
        if (/\d/.test(char)) {
          colIndex += parseInt(char, 10)
        } else {
          const isRed = char.toUpperCase() === char
          if (char.toLowerCase() === 'x') {
            const tempName = isRed ? 'red_unknown' : 'black_unknown'
            initialBoard[rowIndex][colIndex] = {
              name: tempName,
              isKnown: false,
            }
          } else {
            const pieceName = getPieceNameFromChar(char)
            initialBoard[rowIndex][colIndex] = {
              name: pieceName,
              isKnown: true,
            }
          }
          colIndex++
        }
      }
    })

    // Compare current pieces with initial board
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 9; col++) {
        const currentPiece = getPieceAt(row, col)
        const initialPiece = initialBoard[row][col]

        if (!currentPiece && !initialPiece) continue
        if (!currentPiece || !initialPiece) return false
        if (currentPiece.name !== initialPiece.name) return false
        if (currentPiece.isKnown !== initialPiece.isKnown) return false
      }
    }

    return editingSideToMove.value === 'red'
  })

  // Initialize editing state
  watch(isVisible, visible => {
    if (visible) {
      // Deep copy the current board state
      editingPieces.value = gameState.pieces.value.map((piece: any) => ({
        ...piece,
        id: piece.id,
        isKnown: piece.isKnown,
        name: piece.isKnown
          ? piece.name
          : piece.row >= 5
            ? 'red_unknown'
            : 'black_unknown',
        // Ensure initialRole matches the piece's current square
        initialRole: gameState.getRoleByPosition
          ? gameState.getRoleByPosition(piece.row, piece.col)
          : piece.initialRole,
        initialRow: piece.row,
        initialCol: piece.col,
      }))
      // Reclassify by king halves to avoid any flip-induced mislabeling
      reclassifyAllDarkPieces()
      editingSideToMove.value = gameState.sideToMove.value
      selectedPiece.value = null
      preserveDarkPools.value = false
    }
  })

  // Helper function to get piece name from FEN character
  const getPieceNameFromChar = (char: string): string => {
    const isRed = char === char.toUpperCase()
    const pieceType = char.toLowerCase()
    const typeMap: { [key: string]: string } = {
      r: 'chariot',
      n: 'horse',
      b: 'elephant',
      a: 'advisor',
      k: 'king',
      c: 'cannon',
      p: 'pawn',
    }
    return `${isRed ? 'red' : 'black'}_${typeMap[pieceType]}`
  }

  // Get the piece at a specific position
  const getPieceAt = (row: number, col: number): Piece | null => {
    return editingPieces.value.find(p => p.row === row && p.col === col) || null
  }

  // Helper: compute dark rows for each side based on king positions
  const getDarkRowsByKings = () => {
    const topRegion = [0, 1, 2, 3, 4]
    const bottomRegion = [5, 6, 7, 8, 9]

    const redKing = editingPieces.value.find(
      p => p.isKnown && p.name === 'red_king'
    )
    const blackKing = editingPieces.value.find(
      p => p.isKnown && p.name === 'black_king'
    )

    // Defaults: red bottom, black top
    let redRows = bottomRegion.slice()
    let blackRows = topRegion.slice()

    const isInTop = (row: number) => topRegion.includes(row)
    const isInBottom = (row: number) => bottomRegion.includes(row)

    if (redKing) {
      if (isInTop(redKing.row)) {
        redRows = topRegion.slice()
        blackRows = bottomRegion.slice()
      } else if (isInBottom(redKing.row)) {
        redRows = bottomRegion.slice()
        blackRows = topRegion.slice()
      } else if (blackKing) {
        // Red king in middle rows, decide by black king if possible
        if (isInTop(blackKing.row)) {
          blackRows = topRegion.slice()
          redRows = bottomRegion.slice()
        } else if (isInBottom(blackKing.row)) {
          blackRows = bottomRegion.slice()
          redRows = topRegion.slice()
        }
      }
    } else if (blackKing) {
      // Red king missing, decide by black king
      if (isInTop(blackKing.row)) {
        blackRows = topRegion.slice()
        redRows = bottomRegion.slice()
      } else if (isInBottom(blackKing.row)) {
        blackRows = bottomRegion.slice()
        redRows = topRegion.slice()
      }
    }

    return { redRows, blackRows }
  }

  // Helper: classify unknown color by king-based halves
  const classifyUnknownByKings = (
    row: number
  ): 'red_unknown' | 'black_unknown' => {
    const { redRows } = getDarkRowsByKings()
    return redRows.includes(row) ? 'red_unknown' : 'black_unknown'
  }

  // Helper: reclassify all dark piece names according to current king-based halves
  const reclassifyAllDarkPieces = () => {
    const { redRows } = getDarkRowsByKings()
    editingPieces.value = editingPieces.value.map(p => {
      if (p.isKnown) return p
      const newName = redRows.includes(p.row) ? 'red_unknown' : 'black_unknown'
      if (p.name === newName) return p
      return { ...p, name: newName }
    })
  }

  // Select an existing piece
  const selectPiece = (piece: Piece) => {
    selectedPiece.value = piece
  }

  // Select a piece type from the palette
  const selectPieceType = (pieceName: string, isKnown: boolean) => {
    // Create a temporary piece for selection
    selectedPiece.value = {
      id: Date.now() + mtRandom(),
      name: pieceName,
      row: -1,
      col: -1,
      isKnown,
      initialRole: '',
      initialRow: -1,
      initialCol: -1,
    }
  }

  // Handle board click to place pieces
  const handleBoardClick = (event: MouseEvent) => {
    if (!selectedPiece.value) return

    const boardElement = event.currentTarget as HTMLElement
    const rect = boardElement.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Convert pixel coordinates to board coordinates
    const boardWidth = rect.width
    const boardHeight = rect.height

    // Calculate percentage positions
    const percentX = (x / boardWidth) * 100
    const percentY = (y / boardHeight) * 100

    // Convert percentage to row/col coordinates
    const col = Math.round(((percentX - OX) / GX) * (COLS - 1))
    const row = Math.round(((percentY - OY) / GY) * (ROWS - 1))

    // Validate coordinates
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return

    placePiece(row, col)
  }

  // Place the selected piece at a position
  const placePiece = (row: number, col: number) => {
    if (!selectedPiece.value) return

    const existingPiece = getPieceAt(row, col)
    if (existingPiece) return

    // If it's an existing piece, move it
    if (selectedPiece.value.row !== -1) {
      selectedPiece.value.row = row
      selectedPiece.value.col = col
      // Update initial placement role for dark move logic
      if (gameState.getRoleByPosition) {
        selectedPiece.value.initialRole =
          gameState.getRoleByPosition(row, col) || ''
      }
      selectedPiece.value.initialRow = row
      selectedPiece.value.initialCol = col
      // Reclassify unknown color label based on king halves if it's a dark piece
      if (!selectedPiece.value.isKnown) {
        selectedPiece.value.name = classifyUnknownByKings(row)
      }
      // If a king moved, dark piece halves may change; reclassify
      if (
        selectedPiece.value.name === 'red_king' ||
        selectedPiece.value.name === 'black_king'
      ) {
        reclassifyAllDarkPieces()
      }
    } else {
      // It's a new piece from palette
      let finalPieceName = selectedPiece.value.name
      if (selectedPiece.value.name === 'unknown') {
        // Classify unknown by king-based halves (independent of flip)
        finalPieceName = classifyUnknownByKings(row)
      }

      const newPiece: Piece = {
        id: Date.now() + mtRandom(),
        name: finalPieceName,
        row,
        col,
        isKnown: selectedPiece.value.isKnown,
        initialRole: gameState.getRoleByPosition
          ? gameState.getRoleByPosition(row, col)
          : '',
        initialRow: row,
        initialCol: col,
      }

      editingPieces.value.push(newPiece)
    }

    selectedPiece.value = null
  }

  // Remove a piece by ID
  const removePieceById = (pieceId: number | string) => {
    editingPieces.value = editingPieces.value.filter(p => p.id !== pieceId)
    selectedPiece.value = null
  }

  // Flip the board
  const flipBoard = () => {
    editingPieces.value = editingPieces.value.map(piece => {
      const flippedRow = 9 - piece.row
      const flippedCol = 8 - piece.col
      const flippedInitialRow = 9 - piece.initialRow
      const flippedInitialCol = 8 - piece.initialCol
      return {
        ...piece,
        row: flippedRow,
        col: flippedCol,
        initialRow: flippedInitialRow,
        initialCol: flippedInitialCol,
        // Recompute initialRole based on new square to keep dark move logic consistent with position
        initialRole: gameState.getRoleByPosition
          ? gameState.getRoleByPosition(flippedRow, flippedCol)
          : piece.initialRole,
      }
    })

    // Reclassify dark pieces after coordinates change
    reclassifyAllDarkPieces()

    if (gameState.toggleBoardFlip) {
      gameState.toggleBoardFlip()
    }
  }

  // Mirror left-right (horizontal mirror over central file)
  const mirrorLeftRight = () => {
    editingPieces.value = editingPieces.value.map(piece => {
      const mirroredCol = 8 - piece.col
      const mirroredInitialCol = 8 - piece.initialCol
      const sameRow = piece.row
      const sameInitialRow = piece.initialRow
      return {
        ...piece,
        row: sameRow,
        col: mirroredCol,
        initialRow: sameInitialRow,
        initialCol: mirroredInitialCol,
        initialRole: gameState.getRoleByPosition
          ? gameState.getRoleByPosition(sameRow, mirroredCol)
          : piece.initialRole,
      }
    })

    // Reclassify dark pieces after coordinates change
    reclassifyAllDarkPieces()

    // Do not change board flip orientation for left-right mirror
  }

  // Switch side to move
  const switchSide = () => {
    editingSideToMove.value =
      editingSideToMove.value === 'red' ? 'black' : 'red'
  }

  // Reset or clear position
  const resetOrClearPosition = () => {
    if (isInitialPosition.value) {
      // Clear position
      editingPieces.value = []
      editingSideToMove.value = 'red'
    } else {
      // Reset to initial position
      if (gameState.loadFen) {
        gameState.loadFen(START_FEN, false)

        setTimeout(() => {
          const originalPieces = gameState.pieces.value.map((piece: any) => ({
            ...piece,
            id: piece.id,
            isKnown: piece.isKnown,
            name: piece.isKnown
              ? piece.name
              : piece.row >= 5
                ? 'red_unknown'
                : 'black_unknown',
          }))

          editingPieces.value = originalPieces
          // Ensure correct classification by king halves
          reclassifyAllDarkPieces()
          editingSideToMove.value = 'red'
        }, 0)
      }
    }
    selectedPiece.value = null
  }

  // Validation status with comprehensive checks
  const validationStatus = computed(() => {
    try {
      // Check for duplicate positions
      const positions = editingPieces.value.map(p => `${p.row},${p.col}`)
      const uniquePositions = new Set(positions)
      if (positions.length !== uniquePositions.size) {
        return {
          type: 'error',
          message: t('positionEditor.validationStatus.duplicatePosition'),
        }
      }

      // Check for kings
      const redKings = editingPieces.value.filter(
        p => p.isKnown && p.name === 'red_king'
      )
      const blackKings = editingPieces.value.filter(
        p => p.isKnown && p.name === 'black_king'
      )

      if (redKings.length === 0) {
        return {
          type: 'error',
          message: t('positionEditor.validationStatus.noRedKing'),
        }
      }
      if (blackKings.length === 0) {
        return {
          type: 'error',
          message: t('positionEditor.validationStatus.noBlackKing'),
        }
      }
      if (redKings.length > 1 || blackKings.length > 1) {
        return {
          type: 'error',
          message: t('positionEditor.validationStatus.tooManyPieces'),
        }
      }

      const redKing = redKings[0]
      const blackKing = blackKings[0]

      // Check if kings are in palace
      const isInRedPalace = (row: number, col: number) =>
        row >= 7 && row <= 9 && col >= 3 && col <= 5
      const isInBlackPalace = (row: number, col: number) =>
        row >= 0 && row <= 2 && col >= 3 && col <= 5

      // Check if kings are in wrong palace (will be auto-flipped)
      const redKingInWrongPalace =
        !isInRedPalace(redKing.row, redKing.col) &&
        isInBlackPalace(redKing.row, redKing.col)
      const blackKingInWrongPalace =
        !isInBlackPalace(blackKing.row, blackKing.col) &&
        isInRedPalace(blackKing.row, blackKing.col)

      if (!isInRedPalace(redKing.row, redKing.col)) {
        if (redKingInWrongPalace) {
          // Red king in black palace - will auto-flip, so this is valid
        } else {
          return {
            type: 'error',
            message: t('positionEditor.validationStatus.kingOutOfPalace'),
          }
        }
      }

      if (!isInBlackPalace(blackKing.row, blackKing.col)) {
        if (blackKingInWrongPalace) {
          // Black king in red palace - will auto-flip, so this is valid
        } else {
          return {
            type: 'error',
            message: t('positionEditor.validationStatus.kingOutOfPalace'),
          }
        }
      }

      // Check if kings are facing each other
      if (redKing.col === blackKing.col) {
        const minRow = Math.min(redKing.row, blackKing.row)
        const maxRow = Math.max(redKing.row, blackKing.row)
        const piecesBetweenKings = editingPieces.value.filter(
          p => p.col === redKing.col && p.row > minRow && p.row < maxRow
        )
        if (piecesBetweenKings.length === 0) {
          return {
            type: 'error',
            message: t('positionEditor.validationStatus.kingFacing'),
          }
        }
      }

      // Check piece count limits
      const pieceCounts: { [key: string]: number } = {}
      editingPieces.value.forEach(piece => {
        if (piece.isKnown) {
          const char = FEN_MAP[piece.name]
          if (char) {
            pieceCounts[char] = (pieceCounts[char] || 0) + 1
          }
        }
      })

      for (const [char, count] of Object.entries(pieceCounts)) {
        const maxCount =
          INITIAL_PIECE_COUNTS[char as keyof typeof INITIAL_PIECE_COUNTS]
        if (count > maxCount) {
          return {
            type: 'error',
            message: t('positionEditor.validationStatus.tooManyPieces'),
          }
        }
      }

      // Check total piece count for each side
      const redPieces = editingPieces.value.filter(p =>
        p.name.startsWith('red')
      )
      const blackPieces = editingPieces.value.filter(p =>
        p.name.startsWith('black')
      )

      if (redPieces.length > 16 || blackPieces.length > 16) {
        return {
          type: 'error',
          message: t('positionEditor.validationStatus.tooManyTotalPieces'),
        }
      }

      // Check dark piece positions (validate by king-based halves)
      const darkPieces = editingPieces.value.filter(p => !p.isKnown)
      const { redRows, blackRows } = getDarkRowsByKings()

      for (const piece of darkPieces) {
        const isRedPiece = piece.name.startsWith('red')
        const validRows = isRedPiece ? redRows : blackRows

        if (!validRows.includes(piece.row)) {
          return {
            type: 'error',
            message: t(
              'positionEditor.validationStatus.darkPieceInvalidPosition'
            ),
          }
        }
      }

      // Check if current side is in check using the editing pieces
      // We need to temporarily use the editing pieces for the check calculation
      const originalPieces = gameState.pieces.value
      try {
        // Temporarily set the pieces to the editing state
        gameState.pieces.value = editingPieces.value

        // Now check if the current side is in check
        const currentKing = editingSideToMove.value === 'red' ? 'black' : 'red'
        if (
          gameState.isCurrentPositionInCheck &&
          gameState.isCurrentPositionInCheck(currentKing)
        ) {
          return {
            type: 'error',
            message: t('positionEditor.validationStatus.inCheck'),
          }
        }
      } finally {
        // Always restore the original pieces
        gameState.pieces.value = originalPieces
      }

      return {
        type: 'success',
        message: t('positionEditor.validationStatus.normal'),
      }
    } catch (error) {
      return {
        type: 'error',
        message: t('positionEditor.validationStatus.error'),
      }
    }
  })

  // Get piece image URL
  const getPieceImageUrl = (pieceName: string): string => {
    const imageName =
      pieceName === 'red_unknown' ||
      pieceName === 'black_unknown' ||
      pieceName === 'unknown'
        ? 'dark_piece'
        : pieceName
    return new URL(`../assets/${imageName}.svg`, import.meta.url).href
  }

  // Get piece display name
  const getPieceDisplayName = (pieceName: string): string => {
    const knownPiece = knownPieces.value.find((p: any) => p.name === pieceName)
    if (knownPiece) return knownPiece.displayName

    if (pieceName === 'red_unknown')
      return t('positionEditor.pieces.red_unknown')
    if (pieceName === 'black_unknown')
      return t('positionEditor.pieces.black_unknown')
    if (pieceName === 'unknown') return t('positionEditor.pieces.unknown')

    return pieceName
  }

  // Cancel edit
  const cancelEdit = () => {
    selectedPiece.value = null
    closeImageRecognition()
    isVisible.value = false
  }

  // Image recognition methods
  const openImageRecognition = () => {
    showImageRecognition.value = true
  }

  const closeImageRecognition = () => {
    showImageRecognition.value = false
    clearRecognition()
  }

  const triggerFileInput = () => {
    fileInputRef.value?.click()
  }

  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      loadImage(file)
    }
  }

  const handleDrop = (event: DragEvent) => {
    isDragOver.value = false
    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        loadImage(file)
      }
    }
  }

  // Support paste image from clipboard
  window.addEventListener('paste', (e: ClipboardEvent) => {
    if (!showImageRecognition.value) return
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) loadImage(file)
        break
      }
    }
  })

  const loadImage = async (file: File) => {
    try {
      const img = new Image()
      const imageUrl = URL.createObjectURL(file)
      // Ensure canvas clears when a new image loads
      if (canvasRef.value) {
        const ctx = canvasRef.value.getContext('2d')
        if (ctx)
          ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
      }

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = imageUrl
      })

      inputImage.value = img
      detectedBoxes.value = []
      boardGrid.value = null

      // Do not revoke immediately; keep the blob URL while the image is displayed
    } catch (error) {
      console.error('Image loading failed:', error)
    }
  }

  const processCurrentImage = async () => {
    if (!inputImage.value) return

    try {
      // Convert HTMLImageElement to File object for processing
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = inputImage.value.naturalWidth
      canvas.height = inputImage.value.naturalHeight
      ctx.drawImage(inputImage.value, 0, 0)

      canvas.toBlob(async blob => {
        if (!blob) return

        const file = new File([blob], 'chessboard.jpg', { type: 'image/jpeg' })
        await processImage(file)

        // Update detection results
        await nextTick()
        detectedBoxes.value = recognitionDetectedBoxes.value
        boardGrid.value = updateBoardGrid(detectedBoxes.value)

        // Draw bounding boxes
        await nextTick()
        if (imageDisplayRef.value && canvasRef.value) {
          drawBoundingBoxes(
            detectedBoxes.value,
            imageDisplayRef.value,
            canvasRef.value
          )
        }
      }, 'image/jpeg')
    } catch (error) {
      console.error('Image processing failed:', error)
    }
  }

  const applyRecognitionResults = () => {
    if (!boardGrid.value) return

    // Clear current board
    editingPieces.value = []

    // Convert recognition results to pieces
    for (let row = 0; row < boardGrid.value.length; row++) {
      for (let col = 0; col < boardGrid.value[row].length; col++) {
        const detection = boardGrid.value[row][col]
        if (detection) {
          const pieceName = convertDetectionToPieceName(detection)
          if (pieceName) {
            const piece: Piece = {
              id: Date.now() + mtRandom(),
              name: pieceName,
              row,
              col,
              isKnown: !pieceName.includes('unknown'),
              initialRole: '',
              initialRow: row,
              initialCol: col,
            }
            editingPieces.value.push(piece)
          }
        }
      }
    }

    // Reclassify dark pieces
    reclassifyAllDarkPieces()
  }

  const convertDetectionToPieceName = (
    detection: DetectionBox
  ): string | null => {
    const label = LABELS[detection.labelIndex]
    if (!label) return null

    const labelName = label.name

    // Convert piece name
    if (labelName === 'r_general') return 'red_king'
    if (labelName === 'r_advisor') return 'red_advisor'
    if (labelName === 'r_elephant') return 'red_elephant'
    if (labelName === 'r_horse') return 'red_horse'
    if (labelName === 'r_chariot') return 'red_chariot'
    if (labelName === 'r_cannon') return 'red_cannon'
    if (labelName === 'r_soldier') return 'red_pawn'

    if (labelName === 'b_general') return 'black_king'
    if (labelName === 'b_advisor') return 'black_advisor'
    if (labelName === 'b_elephant') return 'black_elephant'
    if (labelName === 'b_horse') return 'black_horse'
    if (labelName === 'b_chariot') return 'black_chariot'
    if (labelName === 'b_cannon') return 'black_cannon'
    if (labelName === 'b_soldier') return 'black_pawn'

    // Dark pieces
    if (labelName.startsWith('dark_')) {
      const baseName = labelName.substring(5)
      if (baseName === 'r_advisor') return 'red_unknown'
      if (baseName === 'r_cannon') return 'red_unknown'
      if (baseName === 'r_chariot') return 'red_unknown'
      if (baseName === 'r_elephant') return 'red_unknown'
      if (baseName === 'r_general') return 'red_unknown'
      if (baseName === 'r_horse') return 'red_unknown'
      if (baseName === 'r_soldier') return 'red_unknown'

      if (baseName === 'b_advisor') return 'black_unknown'
      if (baseName === 'b_cannon') return 'black_unknown'
      if (baseName === 'b_chariot') return 'black_unknown'
      if (baseName === 'b_elephant') return 'black_unknown'
      if (baseName === 'b_general') return 'black_unknown'
      if (baseName === 'b_horse') return 'black_unknown'
      if (baseName === 'b_soldier') return 'black_unknown'
    }

    if (labelName === 'dark') return 'red_unknown' // Default dark piece to red

    return null
  }

  const getDetectedPieceDisplayName = (detection: DetectionBox): string => {
    const pieceName = convertDetectionToPieceName(detection)
    if (!pieceName) return '?'

    if (pieceName === 'red_unknown' || pieceName === 'black_unknown') {
      return t('positionEditor.darkPiece')
    }

    const piece = knownPieces.value.find(p => p.name === pieceName)
    if (piece) {
      return piece.displayName
    }

    return pieceName
  }

  const clearRecognition = () => {
    inputImage.value = null
    detectedBoxes.value = []
    boardGrid.value = null
    if (canvasRef.value) {
      const ctx = canvasRef.value.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
      }
    }
  }

  const onBoundingBoxToggle = async () => {
    // Redraw the canvas when toggle state changes
    if (
      imageDisplayRef.value &&
      canvasRef.value &&
      detectedBoxes.value.length > 0
    ) {
      await nextTick()
      drawBoundingBoxes(
        detectedBoxes.value,
        imageDisplayRef.value,
        canvasRef.value
      )
    }
  }

  // Apply changes with dark piece pool adjustment and auto-flip if needed
  const applyChanges = () => {
    if (validationStatus.value.type !== 'success') return

    // Check if auto-flip is needed based on king positions
    const isInRedPalace = (row: number, col: number) =>
      row >= 7 && row <= 9 && col >= 3 && col <= 5
    const isInBlackPalace = (row: number, col: number) =>
      row >= 0 && row <= 2 && col >= 3 && col <= 5

    const redKing = editingPieces.value.find(
      p => p.isKnown && p.name === 'red_king'
    )
    const blackKing = editingPieces.value.find(
      p => p.isKnown && p.name === 'black_king'
    )

    let needsAutoFlip = false
    if (redKing && blackKing) {
      const redKingInWrongPalace =
        !isInRedPalace(redKing.row, redKing.col) &&
        isInBlackPalace(redKing.row, redKing.col)
      const blackKingInWrongPalace =
        !isInBlackPalace(blackKing.row, blackKing.col) &&
        isInRedPalace(blackKing.row, blackKing.col)

      // Check if kings are in opposite positions (red on top, black on bottom)
      const redKingOnTop = redKing.row < 5
      const blackKingOnBottom = blackKing.row >= 5
      const kingsInOppositePositions = redKingOnTop && blackKingOnBottom

      if (
        redKingInWrongPalace ||
        blackKingInWrongPalace ||
        kingsInOppositePositions
      ) {
        needsAutoFlip = true
      }
    }

    // Calculate current unrevealed piece counts
    const newUnrevealedCounts: { [key: string]: number } = {}
    'RNBAKCP rnbakcp'
      .split('')
      .filter(c => c !== ' ')
      .forEach(c => (newUnrevealedCounts[c] = 0))

    // Count pieces on board
    const knownPiecesOnBoard: { [key: string]: number } = {}
    const darkPiecesOnBoard = { red: 0, black: 0 }

    editingPieces.value.forEach(piece => {
      if (piece.isKnown) {
        const char = FEN_MAP[piece.name]
        if (char) {
          knownPiecesOnBoard[char] = (knownPiecesOnBoard[char] || 0) + 1
        }
      } else {
        if (piece.name.startsWith('red')) {
          darkPiecesOnBoard.red++
        } else {
          darkPiecesOnBoard.black++
        }
      }
    })

    // Calculate remaining pieces for unrevealed pool
    for (const [char, maxCount] of Object.entries(INITIAL_PIECE_COUNTS)) {
      const onBoard = knownPiecesOnBoard[char] || 0
      const remaining = maxCount - onBoard
      if (remaining > 0) {
        newUnrevealedCounts[char] = remaining
      }
    }

    // Adjust for dark pieces - distribute randomly if needed
    if (darkPiecesOnBoard.red > 0 || darkPiecesOnBoard.black > 0) {
      // If no dark pieces, clear the pool
      if (darkPiecesOnBoard.red === 0) {
        'RNBAKCP'.split('').forEach(c => (newUnrevealedCounts[c] = 0))
      }
      if (darkPiecesOnBoard.black === 0) {
        'rnbakcp'.split('').forEach(c => (newUnrevealedCounts[c] = 0))
      }
    }

    // Apply the changes
    gameState.pieces.value = editingPieces.value
    gameState.sideToMove.value = editingSideToMove.value

    // Auto-flip board if needed
    if (needsAutoFlip && gameState.toggleBoardFlip) {
      gameState.toggleBoardFlip()
    }

    // Update unrevealed piece counts unless user opts to preserve
    if (!preserveDarkPools.value && gameState.unrevealedPieceCounts) {
      gameState.unrevealedPieceCounts.value = newUnrevealedCounts
    }

    // Reset captured dark piece pool unless user opts to preserve
    if (!preserveDarkPools.value && gameState.capturedUnrevealedPieceCounts) {
      const resetCapturedCounts: { [key: string]: number } = {}
      'RNBAKCP rnbakcp'
        .split('')
        .filter(c => c !== ' ')
        .forEach(c => (resetCapturedCounts[c] = 0))
      gameState.capturedUnrevealedPieceCounts.value = resetCapturedCounts
    }

    // Record the edit operation in history
    const editData = `position_edit:${editingPieces.value.length}_pieces${needsAutoFlip ? '_with_flip' : ''}`
    if (gameState.recordAndFinalize) {
      gameState.recordAndFinalize('adjust', editData)
    }

    // Reset the zIndex of all pieces
    gameState.pieces.value.forEach((p: any) => (p.zIndex = undefined))
    if (gameState.updateAllPieceZIndexes) {
      gameState.updateAllPieceZIndexes()
    }

    // Trigger the arrow clear event
    if (gameState.triggerArrowClear) {
      gameState.triggerArrowClear()
    }

    // Force stop engine analysis
    window.dispatchEvent(
      new CustomEvent('force-stop-ai', {
        detail: { reason: 'position-edit' },
      })
    )

    emit('position-changed', editingPieces.value, editingSideToMove.value)
    selectedPiece.value = null
    isVisible.value = false
  }
</script>

<style lang="scss" scoped>
  .position-editor-board {
    position: relative;
    width: 100%;
    aspect-ratio: 9/10;
    margin: 0 auto;
    max-width: 100%;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  .board-bg {
    width: 100%;
    height: 100%;
    display: block;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  .pieces {
    position: absolute;
    inset: 0;
    z-index: 10;
    pointer-events: none; // Disable pointer events on pieces container
  }

  .piece {
    position: absolute;
    width: 12%;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 10;
    pointer-events: auto; // Re-enable pointer events on individual pieces

    &:hover {
      transform: translate(-50%, -50%) scale(1.1);
      z-index: 30;
    }

    &.selected {
      transform: translate(-50%, -50%) scale(1.2);
      filter: drop-shadow(0 0 8px rgba(33, 150, 243, 0.8));
      z-index: 40;
    }
  }

  .board-click-area {
    position: absolute;
    inset: 0;
    z-index: 5; // Lower than pieces
    cursor: crosshair;
  }

  .piece-selector {
    padding: 12px;
    background-color: rgb(var(--v-theme-surface));
    border-radius: 6px;
    height: 100%;
    overflow-y: auto;
    max-height: 500px;

    @media (max-width: 768px) {
      height: auto;
      margin-top: 4px;
      max-height: 250px;
      padding: 6px;
    }
  }

  .selected-piece-info {
    padding: 12px;
    background-color: rgba(var(--v-theme-primary), 0.1);
    border-radius: 6px;
    border: 1px solid rgba(var(--v-theme-primary), 0.3);

    .selected-piece-display {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .piece-img-large {
      width: 32px;
      height: 32px;
    }

    .hint-text {
      font-size: 12px;
      color: rgba(var(--v-theme-on-surface), 0.7);
      margin: 0;
    }

    @media (max-width: 768px) {
      padding: 8px;

      .selected-piece-display {
        gap: 6px;
        margin-bottom: 6px;
      }

      .piece-img-large {
        width: 24px;
        height: 24px;
      }

      .hint-text {
        font-size: 11px;
      }
    }
  }

  .piece-category {
    margin-bottom: 12px;

    h6 {
      margin: 0 0 6px 0;
      color: rgb(var(--v-theme-on-surface));
      font-size: 12px;
    }

    @media (max-width: 768px) {
      margin-bottom: 8px;

      h6 {
        margin: 0 0 4px 0;
        font-size: 11px;
      }
    }
  }

  .piece-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;

    @media (max-width: 768px) {
      grid-template-columns: repeat(8, 1fr);
      gap: 1px;
    }
  }

  .piece-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 4px;
    cursor: pointer;
    background-color: rgb(var(--v-theme-surface));
    transition: all 0.2s ease;

    &:hover {
      background-color: rgba(var(--v-theme-primary), 0.1);
      border-color: #1976d2;
      transform: scale(1.05);
    }

    .piece-img {
      width: 20px;
      height: 20px;
      margin-bottom: 2px;

      @media (max-width: 768px) {
        width: 14px;
        height: 14px;
        margin-bottom: 0;
      }
    }

    .piece-name {
      font-size: 9px;
      text-align: center;
      color: rgb(var(--v-theme-on-surface));

      @media (max-width: 768px) {
        display: none;
      }
    }
  }

  .gap-1 {
    gap: 4px;
  }

  .flex-wrap {
    flex-wrap: wrap;
  }

  .action-buttons {
    @media (max-width: 768px) {
      gap: 2px !important;

      .v-btn {
        font-size: 11px;
        padding: 4px 8px;
        min-width: auto;
      }
    }
  }

  .side-indicator {
    @media (max-width: 768px) {
      font-size: 11px;
      padding: 4px 8px;
    }
  }

  .validation-alert {
    @media (max-width: 768px) {
      font-size: 11px;
      padding: 8px;
    }
  }

  .position-editor-container {
    @media (max-width: 768px) {
      padding: 8px !important;
    }
  }

  .board-col {
    @media (max-width: 768px) {
      padding: 4px !important;
    }
  }

  .selector-col {
    @media (max-width: 768px) {
      padding: 4px !important;
    }
  }

  .side-to-move {
    margin-top: 0 !important;
  }

  // Hide desktop-only elements on mobile
  .desktop-only {
    @media (max-width: 768px) {
      display: none !important;
    }
  }

  // Image recognition styles
  .image-recognition-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .upload-area {
    border: 2px dashed rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 8px;
    padding: 32px;
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.drag-over {
      border-color: rgb(var(--v-theme-primary));
      background-color: rgba(var(--v-theme-primary), 0.05);
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: rgba(var(--v-theme-on-surface), 0.6);

      p {
        margin: 0;
        font-size: 14px;
      }
    }

    .image-preview {
      display: flex;
      justify-content: center;

      .image-stage {
        position: relative;
        display: inline-block;
        max-width: 100%;
      }

      .preview-image {
        display: block;
        max-width: 100%;
        max-height: 400px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .overlay-canvas {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
    }
  }

  .recognition-controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .recognition-results {
    .board-grid-display {
      display: grid;
      grid-template-columns: repeat(9, 1fr);
      gap: 2px;
      max-width: 300px;
      margin: 0 auto;

      .grid-row {
        display: contents;
      }

      .grid-cell {
        aspect-ratio: 1;
        border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        background-color: rgb(var(--v-theme-surface));
        min-height: 24px;

        &.has-piece {
          background-color: rgba(var(--v-theme-primary), 0.1);
          color: rgb(var(--v-theme-primary));
        }
      }
    }
  }

  // More compact layout for mobile portrait
  @media (max-width: 768px) {
    .piece-selector {
      padding: 6px;
      max-height: 250px;
    }

    .selected-piece-info {
      padding: 6px;
      margin-bottom: 8px;

      .selected-piece-display {
        gap: 4px;
        margin-bottom: 4px;
      }

      .piece-img-large {
        width: 20px;
        height: 20px;
      }

      .hint-text {
        font-size: 10px;
      }
    }

    .piece-category {
      margin-bottom: 6px;
    }

    .piece-grid {
      grid-template-columns: repeat(8, 1fr);
      gap: 1px;
    }

    .piece-option {
      padding: 3px;

      .piece-img {
        width: 14px;
        height: 14px;
      }
    }

    .action-buttons {
      gap: 1px !important;

      .v-btn {
        font-size: 10px;
        padding: 2px 6px;
        min-width: auto;
        height: 28px;
      }
    }

    .side-indicator {
      font-size: 10px;
      padding: 2px 6px;
      height: 24px;
    }

    .validation-alert {
      font-size: 10px;
      padding: 6px;
      margin-top: 4px;
    }

    .position-editor-container {
      padding: 4px !important;
    }

    .board-col {
      padding: 2px !important;
    }

    .selector-col {
      padding: 2px !important;
    }

    // Reduce dialog padding on mobile
    .v-card-text {
      padding: 8px !important;
    }

    .v-card-actions {
      padding: 8px !important;
    }

    // Mobile image recognition styles
    .upload-area {
      padding: 16px;
      min-height: 120px;

      .upload-placeholder {
        p {
          font-size: 12px;
        }
      }

      .preview-image {
        max-height: 200px;
      }
    }

    .recognition-controls {
      gap: 8px;

      .v-btn {
        font-size: 12px;
        padding: 4px 12px;
        min-width: auto;
      }
    }

    .board-grid-display {
      grid-template-columns: repeat(9, 1fr);
      gap: 1px;

      .grid-cell {
        min-height: 20px;
        font-size: 10px;
      }
    }
  }
</style>
