// Vite replaces import.meta.env.VITE_YOLO_ENABLED with its string value at build time.
const yoloEnabled = import.meta.env.VITE_YOLO_ENABLED === 'true'

// Always import the stub
import { useImageRecognition as useImageRecognitionStub } from './useImageRecognition.stub'

// Conditionally import the real implementation
// When the real file is removed by CI, this import statement won't cause issues
// because the condition will be false at build time
let useImageRecognitionReal = useImageRecognitionStub
if (yoloEnabled) {
  // This import will be tree-shaken out when VITE_YOLO_ENABLED is false
  // and the file won't exist when removed by CI
  try {
    useImageRecognitionReal = require('./useImageRecognition.real').useImageRecognition
  } catch {
    // Fallback to stub if the real implementation is not available
    useImageRecognitionReal = useImageRecognitionStub
  }
}

// Export the appropriate implementation
export const useImageRecognition = yoloEnabled
  ? useImageRecognitionReal
  : useImageRecognitionStub

// Also, re-export the shared types so consumers can import them from one place.
export * from './types'