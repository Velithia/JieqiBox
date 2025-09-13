// Real version for yolo-enabled builds
// This file is used when YOLO functionality is enabled

// Import the real implementation
import { useImageRecognition as useImageRecognitionReal } from './useImageRecognition.real'

// Export the real implementation
export const useImageRecognition = useImageRecognitionReal

// Also, re-export the shared types so consumers can import them from one place.
export * from './types'
