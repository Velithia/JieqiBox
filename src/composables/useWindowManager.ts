import { onMounted, onUnmounted } from 'vue'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { LogicalSize, LogicalPosition } from '@tauri-apps/api/window'
import { useConfigManager } from './useConfigManager'

export interface WindowSettings {
  width: number
  height: number
  x?: number
  y?: number
}

/**
 * Window Manager Composable
 *
 * This composable handles persistent window size and position storage.
 * It automatically:
 * - Restores window size and position when the app starts
 * - Saves window size and position changes to the persistent config
 * - Debounces save operations to avoid performance issues during resizing
 * - Cleans up event listeners properly when the component unmounts
 */
export function useWindowManager() {
  const { getWindowSettings, updateWindowSettings } = useConfigManager()

  let unlisten: (() => void) | null = null

  // Restore window size and position from config
  const restoreWindowState = async (): Promise<void> => {
    try {
      const window = getCurrentWindow()
      const savedSettings = getWindowSettings()

      console.log('Restoring window state:', savedSettings)

      if (savedSettings && savedSettings.width && savedSettings.height) {
        // Wait a bit for the window to be fully initialized
        await new Promise(resolve => setTimeout(resolve, 100))

        // Convert to numbers to ensure proper type
        const width = Number(savedSettings.width)
        const height = Number(savedSettings.height)

        // Restore window size
        await window.setSize(new LogicalSize(width, height))
        console.log('Window size restored to:', width, 'x', height)

        // Restore window position if available
        if (savedSettings.x !== undefined && savedSettings.y !== undefined) {
          const x = Number(savedSettings.x)
          const y = Number(savedSettings.y)
          await window.setPosition(new LogicalPosition(x, y))
          console.log('Window position restored to:', x, ',', y)
        }
      } else {
        console.log('No saved window settings found, using defaults')
      }
    } catch (error) {
      console.error('Failed to restore window state:', error)
    }
  }

  // Save current window state to config
  const saveWindowState = async (): Promise<void> => {
    try {
      const window = getCurrentWindow()
      const size = await window.innerSize()
      const position = await window.outerPosition()

      const windowSettings: WindowSettings = {
        width: size.width,
        height: size.height,
        x: position.x,
        y: position.y,
      }

      await updateWindowSettings(windowSettings)
    } catch (error) {
      console.error('Failed to save window state:', error)
    }
  }

  // Set up window event listeners
  const setupWindowListeners = async (): Promise<void> => {
    try {
      const window = getCurrentWindow()

      // Listen for window resize events
      unlisten = await window.onResized(() => {
        // Debounce the save operation to avoid too frequent saves
        debouncedSaveWindowState()
      })
    } catch (error) {
      console.error('Failed to set up window listeners:', error)
    }
  }

  // Debounced save function to avoid too frequent saves during resize
  let saveTimeout: number | null = null
  const debouncedSaveWindowState = (): void => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    saveTimeout = window.setTimeout(() => {
      saveWindowState()
    }, 500) // Save 500ms after the last resize event
  }

  // Clean up resources
  const cleanup = (): void => {
    if (unlisten) {
      unlisten()
      unlisten = null
    }
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
    }
  }

  // Set up listeners when component mounts
  onMounted(async () => {
    await setupWindowListeners()
  })

  // Clean up when component unmounts
  onUnmounted(() => {
    cleanup()
    // Save final state before unmounting
    saveWindowState()
  })

  return {
    restoreWindowState,
    saveWindowState,
    setupWindowListeners,
    cleanup,
  }
}
