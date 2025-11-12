<template>
  <v-card class="opening-book-panel" v-if="showPanel">
    <v-card-title class="d-flex align-center pa-3">
      <v-icon class="mr-2" size="20">mdi-book-open-variant</v-icon>
      <span class="text-subtitle-1">{{ $t('openingBook.title') }}</span>
      <v-spacer />
      <v-btn
        icon
        size="small"
        @click="openDetailDialog"
        :title="$t('openingBook.manage')"
      >
        <v-icon size="16">mdi-cog</v-icon>
      </v-btn>
    </v-card-title>

    <v-card-text class="pa-2">
      <div
        v-if="!gameState.openingBook.isInitialized.value"
        class="text-center py-4"
      >
        <v-progress-circular indeterminate size="24" />
        <p class="text-caption mt-2">{{ $t('openingBook.initializing') }}</p>
      </div>

      <div v-if="currentMoves.length > 0">
        <div class="mb-2 d-flex align-center">
          <span class="text-caption text-grey">
            {{ $t('openingBook.foundMoves', { count: currentMoves.length }) }}
          </span>
        </div>

        <v-list density="compact" class="opening-moves-list">
          <v-list-item
            v-for="(move, index) in displayMoves"
            :key="index"
            @click="playMove(move.uci_move)"
            :class="{ 'move-disabled': !move.allowed }"
            class="opening-move-item"
          >
            <template v-slot:prepend>
              <v-chip
                :color="move.allowed ? 'success' : 'error'"
                variant="tonal"
                size="small"
                class="move-chip"
              >
                {{ getDisplayMoveText(move) }}
              </v-chip>
            </template>

            <v-list-item-title class="d-flex align-center">
              <v-chip
                :color="getPriorityColor(move.priority)"
                variant="tonal"
                size="x-small"
                class="mr-2"
              >
                {{ move.priority }}
              </v-chip>

              <span class="text-caption text-grey">
                {{ move.wins }}/{{ move.draws }}/{{ move.losses }}
              </span>
            </v-list-item-title>

            <v-list-item-subtitle v-if="move.comment" class="text-caption">
              {{ truncateComment(move.comment) }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-icon v-if="!move.allowed" size="16" color="error">
                mdi-close
              </v-icon>
            </template>
          </v-list-item>
        </v-list>

        <div
          v-if="currentMoves.length > maxDisplayMoves"
          class="text-center mt-2"
        >
          <v-btn variant="text" size="small" @click="showMore = !showMore">
            {{ showMore ? $t('common.showLess') : $t('common.showMore') }}
            <v-icon>{{
              showMore ? 'mdi-chevron-up' : 'mdi-chevron-down'
            }}</v-icon>
          </v-btn>
        </div>
      </div>

      <div v-else class="text-center py-4">
        <v-icon color="grey" size="32">mdi-book-search</v-icon>
        <p class="text-caption mt-2 text-grey">
          {{ $t('openingBook.noMoves') }}
        </p>
      </div>

      <v-divider class="my-2" />

      <div class="d-flex gap-1">
        <v-btn
          size="small"
          variant="tonal"
          color="secondary"
          @click="getBookMove"
          :disabled="allowedMoves.length === 0"
          :title="$t('openingBook.getBookMove')"
        >
          <v-icon size="16">mdi-auto-fix</v-icon>
        </v-btn>

        <v-btn
          size="small"
          variant="tonal"
          color="primary"
          @click="addMarkedMoves"
          :title="$t('openingBook.addMarkedMoves')"
        >
          <v-icon size="16">mdi-plus-box-multiple</v-icon>
        </v-btn>

        <v-spacer />

        <v-switch
          v-model="showBookMoves"
          hide-details
          density="compact"
          :label="$t('openingBook.show')"
          color="primary"
          class="show-switch"
        />
      </div>
    </v-card-text>
  </v-card>

  <!-- Add Marked Moves Dialog -->
  <v-dialog v-model="showAddMarkedMovesDialog" max-width="500px">
    <v-card>
      <v-card-title>
        <v-icon class="mr-2">mdi-plus-box-multiple</v-icon>
        {{ $t('openingBook.addMarkedMovesTitle') }}
      </v-card-title>
      <v-card-text>
        <div v-if="markedMoves.length === 0" class="text-center py-4">
          <v-icon color="grey" size="32">mdi-emoticon-sad-outline</v-icon>
          <p class="text-caption mt-2 text-grey">
            {{ $t('openingBook.noMarkedMoves') }}
          </p>
        </div>

        <div v-else>
          <p class="text-body-2 mb-4">
            {{
              $t('openingBook.markedMovesCount', { count: markedMoves.length })
            }}
          </p>

          <v-form ref="batchFormRef" v-model="batchFormValid">
            <v-text-field
              v-model="batchFormState.priority"
              :label="$t('openingBook.priority')"
              type="number"
              min="1"
              max="200"
              step="1"
              inputmode="numeric"
              :rules="priorityRules"
            />

            <v-switch
              v-model="batchFormState.allowed"
              :label="$t('openingBook.allowed')"
              color="primary"
            />

            <v-textarea
              v-model="batchFormState.comment"
              :label="$t('openingBook.comment')"
              rows="2"
              auto-grow
            />
          </v-form>

          <v-divider class="my-4" />

          <div class="text-subtitle-2 mb-2">
            {{ $t('openingBook.batchSettings') }}:
          </div>
          <div class="marked-moves-list">
            <v-chip
              v-for="move in markedMoves"
              :key="move"
              variant="outlined"
              size="small"
              class="mr-1 mb-1"
            >
              {{ getDisplayMoveTextFromUci(move) }}
            </v-chip>
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="showAddMarkedMovesDialog = false">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          @click="confirmAddMarkedMoves"
          :disabled="!batchFormValid || markedMoves.length === 0"
          :loading="addingMarkedMoves"
        >
          {{ $t('common.add') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { ref, inject, computed, watch } from 'vue'
  import type { MoveData } from '@/types/openingBook'
  import { useInterfaceSettings } from '@/composables/useInterfaceSettings'
  import { uciToChineseMoves } from '@/utils/chineseNotation'

  // Props
  interface Props {
    showPanel?: boolean
  }

  defineProps<Props>()

  // Emits
  const emit = defineEmits<{
    'open-detail-dialog': []
    'play-move': [move: string]
  }>()

  // Inject game state
  const gameState = inject('game-state') as any

  // Local state
  const showMore = ref(false)
  const maxDisplayMoves = 5
  const showAddMarkedMovesDialog = ref(false)
  const addingMarkedMoves = ref(false)
  const markedMoves = ref<string[]>([])
  const batchFormValid = ref(false)
  const batchFormRef = ref()
  const batchFormState = ref({
    priority: 100,
    allowed: true,
    comment: '',
  })

  // Computed properties
  const currentMoves = computed(() => {
    return gameState?.currentBookMoves?.value || []
  })

  const allowedMoves = computed(() => {
    return currentMoves.value.filter((move: MoveData) => move.allowed)
  })

  // Display preferences
  const { showChineseNotation, showBookMoves } = useInterfaceSettings()

  const getDisplayMoveText = (move: MoveData): string => {
    try {
      if (!showChineseNotation.value) return move.uci_move
      const fen = gameState?.generateFen ? gameState.generateFen() : ''
      if (!fen) return move.uci_move
      const converted = uciToChineseMoves(fen, [move.uci_move])
      return converted && converted.length > 0 ? converted[0] : move.uci_move
    } catch {
      return move.uci_move
    }
  }

  const getDisplayMoveTextFromUci = (uciMove: string): string => {
    try {
      if (!showChineseNotation.value) return uciMove
      const fen = gameState?.generateFen ? gameState.generateFen() : ''
      if (!fen) return uciMove
      const converted = uciToChineseMoves(fen, [uciMove])
      return converted && converted.length > 0 ? converted[0] : uciMove
    } catch {
      return uciMove
    }
  }

  const displayMoves = computed(() => {
    const moves = currentMoves.value
    if (showMore.value || moves.length <= maxDisplayMoves) {
      return moves
    }
    return moves.slice(0, maxDisplayMoves)
  })

  // Validation rules
  const priorityRules = [
    (v: string) => {
      const num = parseInt(v, 10)
      return (num >= 1 && num <= 200) || '优先级必须在 1-200 之间'
    },
  ]

  // Methods
  const getPriorityColor = (priority: number) => {
    if (priority >= 150) return 'red'
    if (priority >= 100) return 'orange'
    if (priority >= 50) return 'yellow'
    return 'green'
  }

  const truncateComment = (comment: string, maxLength: number = 30) => {
    if (comment.length <= maxLength) return comment
    return comment.substring(0, maxLength) + '...'
  }

  const playMove = (uciMove: string) => {
    if (gameState?.playMoveFromUci) {
      gameState.playMoveFromUci(uciMove)
    }
    emit('play-move', uciMove)
  }

  const getBookMove = async () => {
    if (gameState?.getOpeningBookMove) {
      try {
        const move = await gameState.getOpeningBookMove()
        if (move) {
          playMove(move)
        }
      } catch (error) {
        console.error('Error getting book move:', error)
      }
    }
  }

  const openDetailDialog = () => {
    emit('open-detail-dialog')
  }

  const addMarkedMoves = () => {
    // Get user-drawn arrow moves (UCI format)
    const arrowMoves: string[] = gameState.getUserArrowMovesUci
      ? gameState.getUserArrowMovesUci()
      : []

    // Get all legal moves for current position
    const allLegalMoves: string[] = gameState.getAllLegalMovesForCurrentPosition
      ? gameState.getAllLegalMovesForCurrentPosition()
      : []

    // Intersect arrow moves with legal moves
    const arrowSet = new Set(arrowMoves)
    markedMoves.value = allLegalMoves.filter(m => arrowSet.has(m))

    // Reset form state
    batchFormState.value = {
      priority: 100,
      allowed: true,
      comment: '',
    }

    showAddMarkedMovesDialog.value = true
  }

  const confirmAddMarkedMoves = async () => {
    if (!batchFormValid.value || markedMoves.value.length === 0) return

    try {
      addingMarkedMoves.value = true

      const { priority, allowed, comment } = batchFormState.value

      // Add each marked move to the opening book
      for (const uciMove of markedMoves.value) {
        await gameState.addPositionToOpeningBook(
          uciMove,
          priority,
          0, // wins
          0, // draws
          0, // losses
          allowed,
          comment
        )
      }

      // Refresh the opening book moves
      if (gameState.queryOpeningBookMoves) {
        await gameState.queryOpeningBookMoves()
      }

      showAddMarkedMovesDialog.value = false
    } catch (error) {
      console.error('Error adding marked moves to opening book:', error)
    } finally {
      addingMarkedMoves.value = false
    }
  }

  // Watch for book moves changes to auto-refresh
  watch(
    () => gameState?.currentBookMoves?.value,
    () => {
      showMore.value = false
    }
  )

  // When language setting toggles Chinese notation, no need to recompute list, chips read from getter
</script>

<style scoped>
  .opening-book-panel {
    border-radius: 8px;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .opening-moves-list {
    max-height: 300px;
    overflow-y: auto;
  }

  .opening-move-item {
    cursor: pointer;
    transition: background-color 0.2s;
    border-radius: 4px;
    margin-bottom: 2px;
  }

  .opening-move-item:hover {
    background-color: rgba(var(--v-theme-primary), 0.08);
  }

  .move-disabled {
    opacity: 0.6;
  }

  .move-disabled .move-chip {
    opacity: 0.8;
  }

  .move-chip {
    min-width: 56px;
    font-family: inherit;
    font-size: 0.875rem;
    letter-spacing: 0.2px;
  }

  .show-switch {
    font-size: 0.75rem;
  }

  :deep(.v-switch__track) {
    height: 16px;
  }

  :deep(.v-switch__thumb) {
    width: 12px;
    height: 12px;
  }

  .marked-moves-list {
    max-height: 120px;
    overflow-y: auto;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 4px;
    padding: 8px;
  }
</style>
