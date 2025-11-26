import { ref, readonly, shallowRef } from 'vue'
import type { DetectionBox } from './types'

// This is the stub implementation. It returns the same structure
// but with disabled/default values and functions that do nothing.
export const useImageRecognition = () => {
  const status = readonly(ref('Image recognition is disabled in this build.'))

  // Return an API-compatible object
  return {
    session: readonly(ref(null)),
    isModelLoading: readonly(ref(false)),
    isProcessing: readonly(ref(false)),
    status,
    detectedBoxes: ref<DetectionBox[]>([]),
    inputImage: readonly(shallowRef<HTMLImageElement | null>(null)),
    outputCanvas: readonly(shallowRef<HTMLCanvasElement | null>(null)),
    showBoundingBoxes: ref(false), // Can still be toggled, won't do anything
    // Board locking (stub)
    isBoardLocked: readonly(ref(false)),
    lockBoard: (_shouldLock: boolean): void => {
      /* Do nothing */
    },
    processImage: async (_file: File): Promise<void> => {
      console.warn('Image recognition is disabled in this build.')
      return Promise.resolve()
    },
    processImageDirect: async (_img: HTMLImageElement): Promise<void> => {
      console.warn('Image recognition is disabled in this build.')
      return Promise.resolve()
    },
    processRawData: async (
      _data: Uint8Array,
      _width: number,
      _height: number
    ): Promise<void> => {
      console.warn('Image recognition is disabled in this build.')
      return Promise.resolve()
    },
    drawBoundingBoxes: (
      _boxes: DetectionBox[],
      _imgElement: HTMLImageElement,
      _canvasElement: HTMLCanvasElement
    ) => {
      /* Do nothing */
    },
    updateBoardGrid: (_boxes: DetectionBox[]) =>
      Array(10)
        .fill(null)
        .map(() => Array(9).fill(null)),
    initializeModel: async (): Promise<void> => {
      console.warn('Image recognition is disabled in this build.')
      return Promise.resolve()
    },
  }
}
