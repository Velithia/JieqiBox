// Opening book composable for managing opening book functionality
import { ref, computed, reactive, watch } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import type {
  MoveData,
  OpeningBookEntry,
  OpeningBookStats,
  OpeningBookImportResult,
  JieqiOpeningBookConfig,
} from '@/types/openingBook'
import { useInterfaceSettings } from './useInterfaceSettings'

export function useOpeningBook() {
  const isInitialized = ref(true) // SQLite database is always available
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Get persistent settings
  const {
    showBookMoves,
    openingBookEnableInGame,
    openingBookPreferHighPriority,
  } = useInterfaceSettings()

  // Configuration - now uses persistent settings
  const config = reactive<JieqiOpeningBookConfig>({
    dbPath: 'jieqi_openings.jb',
    autoLoad: true,
    enableInGame: openingBookEnableInGame.value,
    showBookMoves: showBookMoves.value,
    preferHighPriority: openingBookPreferHighPriority.value,
  })

  // Sync config with persistent settings
  watch(
    [openingBookEnableInGame, showBookMoves, openingBookPreferHighPriority],
    ([newEnableInGame, newShowBookMoves, newPreferHighPriority]) => {
      config.enableInGame = newEnableInGame
      config.showBookMoves = newShowBookMoves
      config.preferHighPriority = newPreferHighPriority
    }
  )

  // Statistics
  const stats = ref<OpeningBookStats>({
    totalPositions: 0,
    totalMoves: 0,
    allowedMoves: 0,
    disallowedMoves: 0,
  })

  // Current position book moves
  const currentBookMoves = ref<MoveData[]>([])

  // Initialize the opening book (just update stats since SQLite is always available)
  const initialize = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      await updateStats()
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to initialize opening book'
      console.error('Opening book initialization error:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Add a new entry to the opening book
  const addEntry = async (
    fen: string,
    uciMove: string,
    priority: number = 100,
    wins: number = 0,
    draws: number = 0,
    losses: number = 0,
    allowed: boolean = true,
    comment: string = ''
  ): Promise<boolean> => {
    try {
      const success = await invoke<boolean>('opening_book_add_entry', {
        request: {
          fen,
          uci_move: uciMove,
          priority,
          wins,
          draws,
          losses,
          allowed,
          comment,
        },
      })
      if (success) {
        await updateStats()
      }
      return success
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add entry'
      console.error('Opening book add entry error:', err)
      return false
    }
  }

  // Delete an entry from the opening book
  const deleteEntry = async (
    fen: string,
    uciMove: string
  ): Promise<boolean> => {
    try {
      const success = await invoke<boolean>('opening_book_delete_entry', {
        fen,
        uciMove,
      })
      if (success) {
        await updateStats()
      }
      return success
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to delete entry'
      console.error('Opening book delete entry error:', err)
      return false
    }
  }

  // Query moves for a given position (independent from enableInGame; UI controls visibility)
  const queryMoves = async (fen: string): Promise<MoveData[]> => {
    try {
      const moves = await invoke<MoveData[]>('opening_book_query_moves', {
        fen,
      })
      currentBookMoves.value = moves
      return moves
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to query moves'
      console.error('Opening book query moves error:', err)
      return []
    }
  }

  // Get the best move for a position (used for auto-play when enableInGame is true)
  const getBestMove = async (fen: string): Promise<string | null> => {
    // Check if opening book is enabled in game
    if (!config.enableInGame) {
      return null
    }

    const moves = await queryMoves(fen)
    if (moves.length === 0) return null

    // Filter allowed moves only
    const allowedMoves = moves.filter(move => move.allowed)
    if (allowedMoves.length === 0) return null

    if (config.preferHighPriority) {
      const maxPriority = Math.max(...allowedMoves.map(m => m.priority))
      const topMoves = allowedMoves.filter(m => m.priority === maxPriority)
      // Randomize among same-priority moves
      const randomIndex = Math.floor(Math.random() * topMoves.length)
      return topMoves[randomIndex].uci_move
    }

    // Random selection from allowed moves
    const randomIndex = Math.floor(Math.random() * allowedMoves.length)
    return allowedMoves[randomIndex].uci_move
  }

  // Import opening book data
  const importData = async (
    data: OpeningBookEntry[]
  ): Promise<OpeningBookImportResult> => {
    try {
      const jsonData = JSON.stringify(data)
      const [imported, errors] = await invoke<[number, string[]]>(
        'opening_book_import_entries',
        {
          jsonData,
        }
      )

      await updateStats()

      return {
        success: errors.length === 0,
        imported,
        errors,
        duplicates: 0, // SQLite handles duplicates automatically
      }
    } catch (err) {
      return {
        success: false,
        imported: 0,
        errors: [err instanceof Error ? err.message : 'Import failed'],
        duplicates: 0,
      }
    }
  }

  // Export opening book data
  const exportData = async (): Promise<OpeningBookEntry[]> => {
    try {
      const jsonData = await invoke<string>('opening_book_export_all')
      return JSON.parse(jsonData)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to export data'
      console.error('Opening book export error:', err)
      return []
    }
  }

  // Update statistics
  const updateStats = async (): Promise<void> => {
    try {
      const raw = await invoke<any>('opening_book_get_stats')
      // Map snake_case from backend to camelCase used in frontend
      const mapped: OpeningBookStats = {
        totalPositions:
          (raw && (raw.totalPositions ?? raw.total_positions)) ?? 0,
        totalMoves: (raw && (raw.totalMoves ?? raw.total_moves)) ?? 0,
        allowedMoves: (raw && (raw.allowedMoves ?? raw.allowed_moves)) ?? 0,
        disallowedMoves:
          (raw && (raw.disallowedMoves ?? raw.disallowed_moves)) ?? 0,
      }
      stats.value = mapped
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to update stats'
      console.error('Opening book stats error:', err)
    }
  }

  // Clear all data
  const clearAll = async (): Promise<boolean> => {
    try {
      await invoke<void>('opening_book_clear_all')
      await updateStats()
      currentBookMoves.value = []
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to clear data'
      console.error('Opening book clear error:', err)
      return false
    }
  }

  // Computed properties
  const hasBookMoves = computed(() => currentBookMoves.value.length > 0)
  const allowedBookMoves = computed(() =>
    currentBookMoves.value.filter(move => move.allowed)
  )
  const isBookLoaded = computed(() => stats.value.totalMoves > 0)

  // Cleanup (no-op for SQLite backend)
  const cleanup = (): void => {
    currentBookMoves.value = []
    error.value = null
  }

  return {
    // State
    isInitialized,
    isLoading,
    error,
    config,
    stats,
    currentBookMoves,

    // Actions
    initialize,
    addEntry,
    deleteEntry,
    queryMoves,
    getBestMove,
    importData,
    exportData,
    updateStats,
    clearAll,
    cleanup,

    // Computed
    hasBookMoves,
    allowedBookMoves,
    isBookLoaded,
  }
}
