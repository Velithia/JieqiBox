import { reactive, toRefs, watch } from 'vue'

interface PanelState {
  id: string
  isDocked: boolean
  x: number
  y: number
  width: number
  height: number
}

const PANELS_STORAGE_KEY = 'jieqibox-panels-layout'

const defaultPanelStates: Record<string, Omit<PanelState, 'id'>> = {
  'dark-piece-pool': {
    isDocked: true,
    x: 0,
    y: 0,
    width: 300,
    height: 250,
  },
  'capture-history': {
    isDocked: true,
    x: 0,
    y: 0,
    width: 300,
    height: 200,
  },
  'engine-analysis': {
    isDocked: true,
    x: 0,
    y: 0,
    width: 400,
    height: 200,
  },
  'luck-index': { isDocked: true, x: 0, y: 0, width: 400, height: 120 },
  notation: { isDocked: true, x: 0, y: 0, width: 400, height: 200 },
  'move-comments': { isDocked: true, x: 0, y: 0, width: 400, height: 250 },
  'engine-log': { isDocked: true, x: 0, y: 0, width: 400, height: 200 },
  'opening-book': { isDocked: true, x: 0, y: 0, width: 400, height: 260 },
}

const store = reactive<{
  panels: Record<string, PanelState>
}>({
  panels: {},
})

function saveStateToLocalStorage() {
  try {
    localStorage.setItem(PANELS_STORAGE_KEY, JSON.stringify(store.panels))
  } catch (e) {
    console.error('Failed to save panel states to local storage', e)
  }
}

function loadStateFromLocalStorage(): Record<string, PanelState> {
  try {
    const savedState = localStorage.getItem(PANELS_STORAGE_KEY)
    if (savedState) {
      const parsed = JSON.parse(savedState)
      // Basic validation to ensure loaded data is not malformed
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed
      }
    }
  } catch (e) {
    console.error('Failed to load panel states from local storage', e)
  }
  return {}
}

export function usePanelManager() {
  const initialize = () => {
    const loadedPanels = loadStateFromLocalStorage()
    const initialPanels: Record<string, PanelState> = {}

    Object.keys(defaultPanelStates).forEach(panelId => {
      const defaultState = defaultPanelStates[panelId]
      const loadedState = loadedPanels[panelId]

      initialPanels[panelId] = {
        ...(loadedState || defaultState),
        id: panelId,
      }
    })

    store.panels = initialPanels

    watch(
      () => store.panels,
      () => {
        saveStateToLocalStorage()
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
    undockPanel,
    restoreDefaultLayout,
  }
}
