import { onMounted, onUnmounted } from 'vue'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { LogicalSize, LogicalPosition } from '@tauri-apps/api/window'
import { useConfigManager } from './useConfigManager'

export interface WindowSettings {
  width: number
  height: number
  x?: number
  y?: number
  isMaximized?: boolean
  scaleFactor?: number // Store the DPI scale factor when the window was saved
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
      const tauriWindow = getCurrentWindow()
      const savedSettings = getWindowSettings()

      console.log('Restoring window state:', savedSettings)

      // Additional validation for window settings
      const validateWindowSettings = (settings: WindowSettings) => {
        if (!settings || !settings.width || !settings.height) return false

        const width = Number(settings.width)
        const height = Number(settings.height)
        const x = Number(settings.x || 0)
        const y = Number(settings.y || 0)

        // Check for abnormal values that would cause window issues
        const isAbnormal =
          width <= 0 ||
          height <= 0 || // Invalid dimensions
          x < -10000 ||
          y < -10000 || // Window positioned far off-screen
          x > 10000 ||
          y > 10000 || // Window positioned far off-screen
          isNaN(width) ||
          isNaN(height) ||
          isNaN(x) ||
          isNaN(y) // Invalid numbers

        if (isAbnormal) {
          console.warn(
            'Abnormal window settings detected during restore, skipping:',
            settings
          )
          return false
        }

        return true
      }

      if (savedSettings && validateWindowSettings(savedSettings)) {
        // Restore maximized state first if it was maximized
        if (savedSettings.isMaximized) {
          await tauriWindow.maximize()
          console.log('Window maximized state restored')
          return // Don't set size/position if maximized
        }

        // Get current scale factor from browser window
        const currentScaleFactor =
          (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1
        const savedScaleFactor = savedSettings.scaleFactor || 1

        // Debug logging to understand what we're restoring
        console.log('=== RESTORING WINDOW STATE DEBUG ===')
        console.log('Saved settings:', savedSettings)
        console.log('Current scaleFactor:', currentScaleFactor)
        console.log('Saved scaleFactor:', savedScaleFactor)

        // Convert to numbers to ensure proper type
        let width = Number(savedSettings.width)
        let height = Number(savedSettings.height)

        console.log('Original saved size:', width, 'x', height)

        // Since we now save logical pixels, we need to handle DPI changes properly
        if (Math.abs(currentScaleFactor - savedScaleFactor) > 0.01) {
          // The saved values are logical pixels at the saved scale factor
          // We need to convert them to logical pixels at the current scale factor
          // Physical pixels = logical pixels × scale factor (constant)
          // So: logical_new = logical_old × (scale_old / scale_new)
          const scalingRatio = savedScaleFactor / currentScaleFactor
          width = width * scalingRatio
          height = height * scalingRatio

          console.log(
            `DPI scale factor changed from ${savedScaleFactor} to ${currentScaleFactor}`
          )
          console.log(`Scaling ratio: ${scalingRatio}`)
          console.log(
            `Adjusted window size from ${savedSettings.width}x${savedSettings.height} to ${width}x${height}`
          )
        } else {
          console.log(
            'No DPI scaling adjustment needed - using saved logical size'
          )
        }

        // Restore window size using logical dimensions
        await tauriWindow.setSize(new LogicalSize(width, height))
        console.log('Window size set to LogicalSize:', width, 'x', height)

        // Restore window position if available
        if (savedSettings.x !== undefined && savedSettings.y !== undefined) {
          let x = Number(savedSettings.x)
          let y = Number(savedSettings.y)

          console.log('Original saved position:', x, ',', y)

          // Apply the same scaling ratio to position if DPI changed
          if (Math.abs(currentScaleFactor - savedScaleFactor) > 0.01) {
            const scalingRatio = savedScaleFactor / currentScaleFactor
            x = x * scalingRatio
            y = y * scalingRatio
            console.log(
              `Position adjusted for DPI change: (${savedSettings.x}, ${savedSettings.y}) -> (${x}, ${y})`
            )
          } else {
            console.log(
              'No position DPI adjustment needed - using saved logical position'
            )
          }

          await tauriWindow.setPosition(new LogicalPosition(x, y))
          console.log('Window position set to LogicalPosition:', x, ',', y)
        }
        console.log('=== END RESTORE DEBUG ===')
      } else {
        console.log('No valid window settings found, using defaults')
      }
    } catch (error) {
      console.error('Failed to restore window state:', error)
    }
  }

  // Save current window state to config
  const saveWindowState = async (): Promise<void> => {
    try {
      const tauriWindow = getCurrentWindow()
      const size = await tauriWindow.innerSize()
      const position = await tauriWindow.outerPosition()
      const isMaximized = await tauriWindow.isMaximized()

      // Get current scale factor from browser window to save along with dimensions
      const scaleFactor =
        (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1

      // Debug logging to understand what we're actually getting
      console.log('=== SAVING WINDOW STATE DEBUG ===')
      console.log('innerSize():', size.width, 'x', size.height)
      console.log('outerPosition():', position.x, ',', position.y)
      console.log('scaleFactor:', scaleFactor)
      console.log(
        'Converting size to logical:',
        size.width / scaleFactor,
        'x',
        size.height / scaleFactor
      )
      console.log(
        'Converting position to logical:',
        position.x / scaleFactor,
        ',',
        position.y / scaleFactor
      )

      // Convert physical pixels to logical pixels for storage
      // innerSize() and outerPosition() return physical pixels
      // We need to store logical pixels to work with LogicalSize/LogicalPosition
      const windowSettings: WindowSettings = {
        width: size.width / scaleFactor,
        height: size.height / scaleFactor,
        x: position.x / scaleFactor,
        y: position.y / scaleFactor,
        isMaximized: isMaximized,
        scaleFactor: scaleFactor, // Save current scale factor
      }

      console.log('Final windowSettings to save:', windowSettings)
      console.log('=== END SAVE DEBUG ===')

      await updateWindowSettings(windowSettings)
    } catch (error) {
      console.error('Failed to save window state:', error)
    }
  }

  // Set up window event listeners
  const setupWindowListeners = async (): Promise<void> => {
    try {
      const tauriWindow = getCurrentWindow()

      // Listen for window resize events
      unlisten = await tauriWindow.onResized(() => {
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
