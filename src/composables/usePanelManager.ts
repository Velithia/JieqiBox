import { reactive, toRefs, watch } from 'vue'
import { useConfigManager } from '@/composables/useConfigManager'

interface PanelState {
  id: string
  isDocked: boolean
  x: number
  y: number
  width: number
  height: number
  order: number
}

const defaultPanelStates: Record<string, Omit<PanelState, 'id'>> = {
  'dark-piece-pool': {
    isDocked: true,
    x: 0,
    y: 0,
    width: 300,
    height: 250,
    order: 0,
  },
  'engine-analysis': {
    isDocked: true,
    x: 0,
    y: 0,
    width: 400,
    height: 200,
    order: 1,
  },
  'opening-book': {
    isDocked: true,
    x: 0,
    y: 0,
    width: 400,
    height: 260,
    order: 2,
  },
  'luck-index': {
    isDocked: true,
    x: 0,
    y: 0,
    width: 400,
    height: 120,
    order: 3,
  },
  notation: { isDocked: true, x: 0, y: 0, width: 400, height: 200, order: 4 },
  'move-comments': {
    isDocked: true,
    x: 0,
    y: 0,
    width: 400,
    height: 250,
    order: 5,
  },
  'engine-log': {
    isDocked: true,
    x: 0,
    y: 0,
    width: 400,
    height: 200,
    order: 6,
  },
  'capture-history': {
    isDocked: true,
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    order: 7,
  },
}

const store = reactive<{
  panels: Record<string, PanelState>
}>({
  panels: {},
})

export function usePanelManager() {
  const { getPanelLayout, updatePanelLayout, isConfigLoaded } =
    useConfigManager()

  const initialize = () => {
    const loadPanelsFromConfig = () => {
      const loadedPanels = getPanelLayout()
      const initialPanels: Record<string, PanelState> = {}

      Object.keys(defaultPanelStates).forEach(panelId => {
        const defaultState = defaultPanelStates[panelId]
        const loadedState = loadedPanels ? loadedPanels[panelId] : undefined

        initialPanels[panelId] = {
          ...(loadedState || defaultState),
          id: panelId,
          // Ensure order is set even if loaded state is missing it (migration)
          order:
            loadedState?.order !== undefined
              ? loadedState.order
              : defaultState.order,
        }
      })

      store.panels = initialPanels
    }

    // If config is already loaded, initialize immediately
    if (isConfigLoaded.value) {
      loadPanelsFromConfig()
    } else {
      // Otherwise, wait for config to load
      watch(
        isConfigLoaded,
        loaded => {
          if (loaded) {
            loadPanelsFromConfig()
          }
        },
        { immediate: true }
      )
    }

    watch(
      () => store.panels,
      () => {
        // Convert reactive panel state to plain object for storage
        const layoutToSave: Record<string, any> = {}
        Object.values(store.panels).forEach(panel => {
          layoutToSave[panel.id] = {
            isDocked: panel.isDocked,
            x: panel.x,
            y: panel.y,
            width: panel.width,
            height: panel.height,
            order: panel.order,
          }
        })
        updatePanelLayout(layoutToSave)
      },
      { deep: true }
    )
  }

  const getPanelState = (panelId: string) => {
    if (!store.panels[panelId]) {
      console.warn(`Panel with id ${panelId} not found.`)
      return null
    }
    return toRefs(store.panels[panelId])
  }

  const updatePanelState = (panelId: string, newState: Partial<PanelState>) => {
    if (store.panels[panelId]) {
      Object.assign(store.panels[panelId], newState)
    }
  }

  const dockPanel = (panelId: string) => {
    if (store.panels[panelId]) {
      store.panels[panelId].isDocked = true
    }
  }

  const movePanelToOrder = (panelId: string, targetIndex: number) => {
    if (!store.panels[panelId]) return

    const panelsArray = Object.values(store.panels).sort(
      (a, b) => a.order - b.order
    )
    const currentIndex = panelsArray.findIndex(p => p.id === panelId)

    if (currentIndex === -1) return

    // Remove from current position
    panelsArray.splice(currentIndex, 1)

    // Clamp target index
    const clampedIndex = Math.max(0, Math.min(targetIndex, panelsArray.length))

    // Insert at new position
    panelsArray.splice(clampedIndex, 0, store.panels[panelId])

    // Reassign orders sequentially (0, 1, 2, ...)
    panelsArray.forEach((p, index) => {
      if (store.panels[p.id]) {
        store.panels[p.id].order = index
      }
    })
  }

  const undockPanel = (
    panelId: string,
    position?: { x: number; y: number; width: number; height: number }
  ) => {
    if (store.panels[panelId]) {
      store.panels[panelId].isDocked = false
      if (position) {
        store.panels[panelId].x = position.x
        store.panels[panelId].y = position.y
        store.panels[panelId].width = position.width
        store.panels[panelId].height = position.height
      }
    }
  }

  const restoreDefaultLayout = () => {
    Object.keys(defaultPanelStates).forEach(panelId => {
      if (store.panels[panelId]) {
        Object.assign(store.panels[panelId], defaultPanelStates[panelId])
      }
    })
  }

  return {
    panels: toRefs(store).panels,
    initialize,
    getPanelState,
    updatePanelState,
    dockPanel,
    movePanelToOrder,
    undockPanel,
    restoreDefaultLayout,
  }
}
