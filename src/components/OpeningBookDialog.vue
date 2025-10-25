<template>
  <v-dialog v-model="visible" max-width="900px" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-book-open-variant</v-icon>
        {{ $t('openingBook.title') }}
        <v-spacer />
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-tabs v-model="activeTab" align-tabs="center">
          <v-tab value="moves">{{ $t('openingBook.currentMoves') }}</v-tab>
          <v-tab value="manage">{{ $t('openingBook.manage') }}</v-tab>
          <v-tab value="settings">{{ $t('openingBook.settings') }}</v-tab>
          <v-tab value="stats">{{ $t('openingBook.statistics') }}</v-tab>
        </v-tabs>

        <v-card-text>
          <v-window v-model="activeTab">
            <!-- Current Position Moves Tab -->
            <v-window-item value="moves">
              <div
                v-if="gameState.currentBookMoves.value.length === 0"
                class="text-center my-8"
              >
                <v-icon size="64" color="grey">mdi-book-search</v-icon>
                <p class="mt-4 text-grey">{{ $t('openingBook.noMoves') }}</p>
              </div>

              <v-data-table
                v-else
                :headers="moveHeaders"
                :items="gameState.currentBookMoves.value"
                :sort-by="[{ key: 'priority', order: 'desc' }]"
                class="elevation-1"
                density="compact"
              >
                <template v-slot:item.uci_move="{ item }">
                  <v-chip
                    :color="(item as any).allowed ? 'green' : 'red'"
                    variant="tonal"
                    size="small"
                    @click="playMove((item as any).uci_move)"
                    style="cursor: pointer"
                  >
                    {{ getDisplayMoveText(item as any) }}
                  </v-chip>
                </template>

                <template v-slot:item.priority="{ item }">
                  <v-chip
                    :color="getPriorityColor((item as any).priority)"
                    variant="tonal"
                    size="small"
                  >
                    {{ (item as any).priority }}
                  </v-chip>
                </template>

                <template v-slot:item.stats="{ item }">
                  <span class="text-caption">
                    {{ (item as any).wins }}/{{ (item as any).draws }}/{{
                      (item as any).losses
                    }}
                  </span>
                </template>

                <template v-slot:item.allowed="{ item }">
                  <v-icon :color="(item as any).allowed ? 'green' : 'red'">
                    {{ (item as any).allowed ? 'mdi-check' : 'mdi-close' }}
                  </v-icon>
                </template>

                <template v-slot:item.actions="{ item }">
                  <v-btn icon size="small" @click="editMove(item as any)">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn icon size="small" @click="deleteMove(item as any)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>

              <v-row class="mt-4">
                <v-col>
                  <v-btn
                    color="primary"
                    @click="addCurrentPosition"
                    :disabled="!gameState.generateFen"
                  >
                    <v-icon class="mr-2">mdi-plus</v-icon>
                    {{ $t('openingBook.addPosition') }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-window-item>

            <!-- Manage Tab -->
            <v-window-item value="manage">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-card class="mb-4">
                    <v-card-title>{{ $t('openingBook.import') }}</v-card-title>
                    <v-card-text>
                      <v-btn
                        color="primary"
                        @click="importFromFile"
                        :loading="importing"
                      >
                        <v-icon class="mr-2">mdi-upload</v-icon>
                        {{ $t('openingBook.import') }}
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-card class="mb-4">
                    <v-card-title>{{ $t('openingBook.export') }}</v-card-title>
                    <v-card-text>
                      <v-select
                        v-model="exportFormat"
                        :items="exportFormats"
                        :label="$t('openingBook.format')"
                        class="mb-3"
                      />
                      <v-btn
                        color="secondary"
                        @click="exportToFile"
                        :loading="exporting"
                      >
                        <v-icon class="mr-2">mdi-download</v-icon>
                        {{ $t('openingBook.export') }}
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <v-card>
                <v-card-title class="text-error">
                  {{ $t('openingBook.dangerZone') }}
                </v-card-title>
                <v-card-text>
                  <v-btn color="error" @click="clearAllConfirm = true">
                    <v-icon class="mr-2">mdi-delete-sweep</v-icon>
                    {{ $t('openingBook.clearAll') }}
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-window-item>

            <!-- Settings Tab -->
            <v-window-item value="settings">
              <v-card>
                <v-card-text>
                  <v-switch
                    v-model="openingBookEnableInGame"
                    :label="$t('openingBook.enableInGame')"
                    color="primary"
                  />

                  <v-switch
                    v-model="showBookMoves"
                    :label="$t('openingBook.showMoves')"
                    color="primary"
                  />

                  <v-switch
                    v-model="openingBookPreferHighPriority"
                    :label="$t('openingBook.preferHighPriority')"
                    color="primary"
                  />
                </v-card-text>
              </v-card>
            </v-window-item>

            <!-- Statistics Tab -->
            <v-window-item value="stats">
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-card>
                    <v-card-text class="text-center">
                      <v-icon size="48" color="primary">mdi-chess-king</v-icon>
                      <div class="text-h4 mt-2">
                        {{ gameState.openingBook.stats.value.totalPositions }}
                      </div>
                      <div class="text-subtitle-1">
                        {{ $t('openingBook.totalPositions') }}
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>

                <v-col cols="12" sm="6" md="3">
                  <v-card>
                    <v-card-text class="text-center">
                      <v-icon size="48" color="success"
                        >mdi-chess-knight</v-icon
                      >
                      <div class="text-h4 mt-2">
                        {{ gameState.openingBook.stats.value.totalMoves }}
                      </div>
                      <div class="text-subtitle-1">
                        {{ $t('openingBook.totalMoves') }}
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>

                <v-col cols="12" sm="6" md="3">
                  <v-card>
                    <v-card-text class="text-center">
                      <v-icon size="48" color="green">mdi-check</v-icon>
                      <div class="text-h4 mt-2">
                        {{ gameState.openingBook.stats.value.allowedMoves }}
                      </div>
                      <div class="text-subtitle-1">
                        {{ $t('openingBook.allowedMoves') }}
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>

                <v-col cols="12" sm="6" md="3">
                  <v-card>
                    <v-card-text class="text-center">
                      <v-icon size="48" color="red">mdi-close</v-icon>
                      <div class="text-h4 mt-2">
                        {{ gameState.openingBook.stats.value.disallowedMoves }}
                      </div>
                      <div class="text-subtitle-1">
                        {{ $t('openingBook.disallowedMoves') }}
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <v-card class="mt-4">
                <v-card-title>{{
                  $t('openingBook.refreshStats')
                }}</v-card-title>
                <v-card-text>
                  <v-btn
                    color="primary"
                    @click="refreshStats"
                    :loading="refreshingStats"
                  >
                    <v-icon class="mr-2">mdi-refresh</v-icon>
                    {{ $t('openingBook.refresh') }}
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeDialog">{{ $t('common.close') }}</v-btn>
      </v-card-actions>
    </v-card>

    <!-- Add/Edit Move Dialog -->
    <v-dialog v-model="editMoveDialog" max-width="500px">
      <v-card>
        <v-card-title>
          {{
            editingMove ? $t('openingBook.editMove') : $t('openingBook.addMove')
          }}
        </v-card-title>
        <v-card-text>
          <v-form ref="moveFormRef" v-model="moveFormValid">
            <v-text-field
              v-model="moveFormState.uci_move"
              :label="$t('openingBook.moveUci')"
              :rules="uciRules"
              required
            />

            <v-text-field
              v-model="moveFormState.priority"
              :label="$t('openingBook.priority')"
              type="number"
              min="1"
              max="200"
              step="1"
              inputmode="numeric"
            />

            <v-row>
              <v-col cols="4">
                <v-text-field
                  v-model="moveFormState.wins"
                  :label="$t('openingBook.wins')"
                  type="number"
                  min="0"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model="moveFormState.draws"
                  :label="$t('openingBook.draws')"
                  type="number"
                  min="0"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model="moveFormState.losses"
                  :label="$t('openingBook.losses')"
                  type="number"
                  min="0"
                />
              </v-col>
            </v-row>

            <v-switch
              v-model="moveFormState.allowed"
              :label="$t('openingBook.allowed')"
              color="primary"
            />

            <v-textarea
              v-model="moveFormState.comment"
              :label="$t('openingBook.comment')"
              rows="3"
              auto-grow
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="editMoveDialog = false">{{
            $t('common.cancel')
          }}</v-btn>
          <v-btn
            color="primary"
            @click="saveMoveChanges"
            :disabled="!moveFormValid"
          >
            {{ $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Clear All Confirmation Dialog -->
    <v-dialog v-model="clearAllConfirm" max-width="400px">
      <v-card>
        <v-card-title class="text-error">
          {{ $t('openingBook.confirmClear') }}
        </v-card-title>
        <v-card-text>
          {{ $t('openingBook.clearWarning') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="clearAllConfirm = false">{{
            $t('common.cancel')
          }}</v-btn>
          <v-btn color="error" @click="clearAllData" :loading="clearing">
            {{ $t('openingBook.clearAll') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteMoveConfirm" max-width="400px">
      <v-card>
        <v-card-title class="text-error">
          {{ $t('openingBook.confirmDelete') }}
        </v-card-title>
        <v-card-text>
          {{ $t('openingBook.deleteWarning') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="deleteMoveConfirm = false">{{
            $t('common.cancel')
          }}</v-btn>
          <v-btn color="error" @click="confirmDeleteMove" :loading="deleting">
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup lang="ts">
  import { ref, inject, computed, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { save, open } from '@tauri-apps/plugin-dialog'
  import { invoke } from '@tauri-apps/api/core'
  import type { MoveData } from '@/types/openingBook'
  import { uciToChineseMoves } from '@/utils/chineseNotation'
  import { useInterfaceSettings } from '@/composables/useInterfaceSettings'

  const { t } = useI18n()
  const {
    showBookMoves,
    openingBookEnableInGame,
    openingBookPreferHighPriority,
  } = useInterfaceSettings()

  // Props
  interface Props {
    modelValue: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
  })

  // Emits
  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
  }>()

  // Inject game state
  const gameState = inject('game-state') as any
  const { showChineseNotation } = useInterfaceSettings()

  const validatedUciMove = ref<string | null>(null)

  // Local state
  const visible = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value),
  })

  const activeTab = ref('moves')
  const importing = ref(false)
  const exporting = ref(false)
  const clearing = ref(false)
  const deleting = ref(false)
  const refreshingStats = ref(false)

  // Import/Export
  // Removed manual file input; we'll use system open dialog directly
  const exportFormat = ref('jb')
  const exportFormats = [{ title: 'JB (Binary)', value: 'jb' }]

  // Edit move dialog
  const editMoveDialog = ref(false)
  const editingMove = ref<MoveData | null>(null)
  const moveFormValid = ref(false)
  const moveFormRef = ref()
  const moveFormState = ref({
    uci_move: '',
    priority: 100 as number,
    wins: 0 as number,
    draws: 0 as number,
    losses: 0 as number,
    allowed: true,
    comment: '',
  })

  watch(
    () => moveFormState.value.uci_move,
    () => {
      validatedUciMove.value = null
    }
  )

  // Clear confirmation
  const clearAllConfirm = ref(false)

  // Delete confirmation
  const deleteMoveConfirm = ref(false)
  const moveToDelete = ref<MoveData | null>(null)

  // Table headers for moves
  const moveHeaders = computed(() => [
    { title: t('openingBook.move'), key: 'uci_move', sortable: false },
    { title: t('openingBook.priority'), key: 'priority', sortable: true },
    { title: t('openingBook.stats'), key: 'stats', sortable: false },
    { title: t('openingBook.allowed'), key: 'allowed', sortable: true },
    { title: t('openingBook.comment'), key: 'comment', sortable: false },
    { title: t('common.actions'), key: 'actions', sortable: false },
  ])

  const toFullWidth = (str: string): string => {
    return str.replace(/[0-9]/g, s => {
      return String.fromCharCode(s.charCodeAt(0) - 48 + 65296)
    })
  }

  const isChineseNotationFormat = (move: string): boolean => {
    return /[\u4e00-\u9fa5]/.test(move)
  }

  const isValidMove = (move: string): boolean => {
    if (!move || !gameState?.getAllLegalMovesForCurrentPosition) {
      return false
    }

    const legalMoves = gameState.getAllLegalMovesForCurrentPosition()
    if (!legalMoves) {
      validatedUciMove.value = null
      return false
    }

    // Check if it's UCI format
    if (/^[a-i][0-9][a-i][0-9]$/.test(move)) {
      const isValid = legalMoves.includes(move)
      validatedUciMove.value = isValid ? move : null
      return isValid
    }

    // Check if it's Chinese notation
    if (isChineseNotationFormat(move)) {
      const fen = gameState.generateFen ? gameState.generateFen() : ''
      if (!fen) {
        validatedUciMove.value = null
        return false
      }

      const normalizedMove = toFullWidth(move)

      for (const uci of legalMoves) {
        try {
          const chineseMoveArray = uciToChineseMoves(fen, [uci])
          if (chineseMoveArray && chineseMoveArray.length > 0) {
            const chineseMove = chineseMoveArray[0]
            // Also normalize numbers from converter result for safer comparison.
            if (toFullWidth(chineseMove) === normalizedMove) {
              validatedUciMove.value = uci
              return true
            }
          }
        } catch (e) {
          // uciToChineseMoves can throw errors for some moves/positions.
          // Ignore and continue.
        }
      }
    }

    validatedUciMove.value = null
    return false
  }

  // UCI validation rules
  const uciRules = [
    (v: string) => !!v || t('openingBook.moveRequired'),
    (v: string) => {
      const isUciFormat = /^[a-i][0-9][a-i][0-9]$/.test(v)
      return (
        isUciFormat ||
        isChineseNotationFormat(v) ||
        t('openingBook.invalidMoveFormat')
      )
    },
    (v: string) => isValidMove(v) || t('openingBook.invalidLegalMove'),
  ]

  // Methods
  const closeDialog = () => {
    visible.value = false
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 150) return 'red'
    if (priority >= 100) return 'orange'
    if (priority >= 50) return 'yellow'
    return 'green'
  }

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

  const playMove = (uciMove: string) => {
    if (gameState?.playMoveFromUci) {
      gameState.playMoveFromUci(uciMove)
    }
  }

  const addCurrentPosition = () => {
    moveFormState.value = {
      uci_move: '',
      priority: 100,
      wins: 0,
      draws: 0,
      losses: 0,
      allowed: true,
      comment: '',
    }
    validatedUciMove.value = null
    editingMove.value = null
    editMoveDialog.value = true
  }

  const editMove = (move: MoveData) => {
    moveFormState.value = {
      uci_move: move.uci_move || '',
      priority: (move as any).priority,
      wins: (move as any).wins,
      draws: (move as any).draws,
      losses: (move as any).losses,
      allowed: Boolean((move as any).allowed),
      comment: (move as any).comment ?? '',
    }
    validatedUciMove.value = null
    editingMove.value = move
    editMoveDialog.value = true
  }

  const deleteMove = (move: MoveData) => {
    moveToDelete.value = move
    deleteMoveConfirm.value = true
  }

  const confirmDeleteMove = async () => {
    if (!moveToDelete.value) return

    try {
      deleting.value = true
      const success = await gameState.deletePositionFromOpeningBook(
        moveToDelete.value.uci_move
      )

      if (success) {
        await gameState.queryOpeningBookMoves()
        await refreshStats()
      } else {
        console.error('Failed to delete move')
      }
    } catch (error) {
      console.error('Error deleting move:', error)
    } finally {
      deleting.value = false
      deleteMoveConfirm.value = false
      moveToDelete.value = null
    }
  }

  const saveMoveChanges = async () => {
    if (!moveFormValid.value) return

    // Trigger validation to ensure validatedUciMove is up-to-date
    const validationResult = await moveFormRef.value?.validate()
    if (!validationResult.valid) {
      return
    }

    const uciToSave = validatedUciMove.value
    if (!uciToSave) {
      // Should not happen if validation passed
      console.error('Failed to get UCI move to save.')
      return
    }

    try {
      // Data cleaning and range limitation
      const toInt = (v: unknown, def = 0) => {
        const n = parseInt(String(v as any), 10)
        return Number.isFinite(n) ? n : def
      }
      const clamp = (n: number, min: number, max: number) =>
        Math.min(max, Math.max(min, n))

      const prio = clamp(
        toInt((moveFormState.value as any).priority, 100),
        1,
        200
      )
      const wins = Math.max(0, toInt((moveFormState.value as any).wins, 0))
      const draws = Math.max(0, toInt((moveFormState.value as any).draws, 0))
      const losses = Math.max(0, toInt((moveFormState.value as any).losses, 0))
      const allowed = Boolean((moveFormState.value as any).allowed)
      const comment = ((moveFormState.value as any).comment ?? '') as string

      const success = await gameState.addPositionToOpeningBook(
        uciToSave,
        prio,
        wins,
        draws,
        losses,
        allowed,
        comment
      )

      if (success) {
        editMoveDialog.value = false
        await gameState.queryOpeningBookMoves()
        await refreshStats()
      } else {
        // Show error message
        console.error('Failed to save move')
      }
    } catch (error) {
      console.error('Error saving move:', error)
    }
  }

  // Removed handleFileImport - no longer needed

  const importFromFile = async () => {
    try {
      importing.value = true

      // Only use system open dialog to get a real filesystem path
      let filePath: string | null = null

      // Fall back to Tauri's open dialog to obtain a real filesystem path
      if (!filePath) {
        const selectedUnknown = (await open({
          multiple: false,
          filters: [
            {
              name: 'JieqiBox Opening Book',
              extensions: ['jb'],
            },
          ],
        })) as unknown

        if (typeof selectedUnknown === 'string') {
          filePath = selectedUnknown
        } else if (Array.isArray(selectedUnknown)) {
          const arr = selectedUnknown as string[]
          if (arr.length > 0) filePath = arr[0]
        }
      }

      if (!filePath) {
        console.error('No file selected for import.')
        return
      }

      await invoke('opening_book_import_db', {
        sourcePath: filePath,
      })
      await refreshStats()
      await gameState.queryOpeningBookMoves()
    } catch (error) {
      console.error('Import error:', error)
    } finally {
      importing.value = false
    }
  }

  const exportToFile = async () => {
    try {
      exporting.value = true

      const filePath = await save({
        filters: [
          {
            name: 'JieqiBox Opening Book',
            extensions: ['jb'],
          },
        ],
        defaultPath: 'jieqi_openings.jb',
      })

      if (filePath) {
        const success = await invoke('opening_book_export_db', {
          destinationPath: filePath,
        })
        console.log('Export result:', success)
      }
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      exporting.value = false
    }
  }

  const clearAllData = async () => {
    try {
      clearing.value = true
      await gameState.openingBook.clearAll()
      await refreshStats()
      await gameState.queryOpeningBookMoves()
      clearAllConfirm.value = false
    } catch (error) {
      console.error('Clear error:', error)
    } finally {
      clearing.value = false
    }
  }

  const refreshStats = async () => {
    try {
      refreshingStats.value = true
      await gameState.openingBook.updateStats()
    } catch (error) {
      console.error('Refresh stats error:', error)
    } finally {
      refreshingStats.value = false
    }
  }

  // Watch for dialog open to refresh data
  watch(visible, newValue => {
    if (newValue) {
      refreshStats()
      gameState.queryOpeningBookMoves()
    }
  })
</script>

<style scoped>
  .v-card {
    border-radius: 8px;
  }

  .v-chip {
    cursor: pointer;
  }

  .elevation-1 {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
</style>
