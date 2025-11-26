// src/composables/image-recognition.ts
import { ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import * as ort from 'onnxruntime-web'
// Import types from the new file
import { LABELS, type DetectionBox, type ProcessedImage } from './types'

// 导出必要的常量给外部使用
export { LABELS, type DetectionBox }

// ========== Reusable Buffer Pool (Module-level Singleton) ==========
// Pre-allocate buffers to avoid GC during high-FPS processing
const MODEL_SIZE = 640
const BUFFER_SIZE = 3 * MODEL_SIZE * MODEL_SIZE // 1,228,800 floats

// Singleton Float32Array buffer for inference input
let sharedInputBuffer: Float32Array | null = null

const getSharedInputBuffer = (): Float32Array => {
  if (!sharedInputBuffer) {
    sharedInputBuffer = new Float32Array(BUFFER_SIZE)
  }
  return sharedInputBuffer
}

export const useImageRecognition = () => {
  const { t } = useI18n()
  const session = ref<ort.InferenceSession | null>(null)
  const isModelLoading = ref(false)
  const isProcessing = ref(false)
  const status = ref('')
  const detectedBoxes = ref<DetectionBox[]>([])
  // Use shallowRef for DOM elements since we don't need deep reactivity
  const inputImage = shallowRef<HTMLImageElement | null>(null)
  const outputCanvas = shallowRef<HTMLCanvasElement | null>(null)
  const showBoundingBoxes = ref(true)

  // ========== Board Locking Feature ==========
  const isBoardLocked = ref(false)
  let cachedBoardBox: DetectionBox | null = null

  // Initialize model
  const initializeModel = async (): Promise<void> => {
    if (session.value) return

    try {
      isModelLoading.value = true
      status.value = t('positionEditor.imageRecognitionStatus.loadingModel')
      const base = (import.meta as any).env?.BASE_URL || '/'
      ort.env.wasm.wasmPaths = base + 'ort/'
      session.value = await ort.InferenceSession.create(
        base + 'models/best.onnx',
        {
          executionProviders: ['webgpu', 'webgl', 'wasm'],
          graphOptimizationLevel: 'all',
        }
      )
      status.value = t(
        'positionEditor.imageRecognitionStatus.modelLoadedSuccessfully'
      )
    } catch (error) {
      console.error('Model loading failed:', error)
      status.value = t(
        'positionEditor.imageRecognitionStatus.modelLoadingFailed',
        {
          error:
            error instanceof Error
              ? error.message
              : t('positionEditor.imageRecognitionStatus.unknownError'),
        }
      )
      throw error
    } finally {
      isModelLoading.value = false
    }
  }

  // --- 原有 Utility Functions (Letterbox, Sigmoid, IOU, NMS, Overlap) ---

  const letterbox = (
    image: HTMLImageElement,
    newShape = [640, 640],
    color = 114
  ): ProcessedImage => {
    const [newH, newW] = newShape
    const imgW = image.naturalWidth || image.width
    const imgH = image.naturalHeight || image.height

    const r = Math.min(newW / imgW, newH / imgH)
    const newUnpadW = Math.round(imgW * r)
    const newUnpadH = Math.round(imgH * r)
    const dw = (newW - newUnpadW) / 2
    const dh = (newH - newUnpadH) / 2

    const canvas = document.createElement('canvas')
    canvas.width = newW
    canvas.height = newH
    const context = canvas.getContext('2d')!

    context.fillStyle = `rgb(${color}, ${color}, ${color})`
    context.fillRect(0, 0, newW, newH)

    context.drawImage(
      image,
      0,
      0,
      imgW,
      imgH,
      Math.round(dw),
      Math.round(dh),
      newUnpadW,
      newUnpadH
    )

    return {
      canvas,
      context,
      meta: { r, dw, dh, newW, newH, imgW, imgH },
    }
  }

  const iou = (boxA: DetectionBox, boxB: DetectionBox): number => {
    const [x1A, y1A, wA, hA] = boxA.box
    const [x1B, y1B, wB, hB] = boxB.box
    const x2A = x1A + wA,
      y2A = y1A + hA
    const x2B = x1B + wB,
      y2B = y1B + hB
    const intersectX1 = Math.max(x1A, x1B)
    const intersectY1 = Math.max(y1A, y1B)
    const intersectX2 = Math.min(x2A, x2B)
    const intersectY2 = Math.min(y2A, y2B)
    const iw = Math.max(0, intersectX2 - intersectX1)
    const ih = Math.max(0, intersectY2 - intersectY1)
    const inter = iw * ih
    const union = wA * hA + wB * hB - inter
    return union > 0 ? inter / union : 0
  }

  const nms = (
    boxes: DetectionBox[],
    iouThresh = 0.7,
    classAgnostic = false
  ): DetectionBox[] => {
    boxes.sort((a, b) => b.score - a.score)
    const result: DetectionBox[] = []
    const removed = new Array(boxes.length).fill(false)
    for (let i = 0; i < boxes.length; i++) {
      if (removed[i]) continue
      const a = boxes[i]
      result.push(a)
      for (let j = i + 1; j < boxes.length; j++) {
        if (removed[j]) continue
        const b = boxes[j]
        if (!classAgnostic && a.labelIndex !== b.labelIndex) continue
        if (iou(a, b) > iouThresh) removed[j] = true
      }
    }
    return result
  }

  const doBoxesOverlap = (
    boxA: [number, number, number, number],
    boxB: [number, number, number, number]
  ): boolean => {
    const [x1A, y1A, wA, hA] = boxA
    const [x1B, y1B, wB, hB] = boxB
    const x2A = x1A + wA,
      y2A = y1A + hA
    const x2B = x1B + wB,
      y2B = y1B + hB
    return !(x2A < x1B || x1A > x2B || y2A < y1B || y1A > y2B)
  }

  // --- 原有 Image Preprocessing (保留给 processImage/processImageDirect) ---
  // Optimized to use shared buffer to minimize GC during high-FPS processing
  const preprocess = async (
    image: HTMLImageElement
  ): Promise<{ tensor: ort.Tensor; meta: ProcessedImage['meta'] }> => {
    const modelW = MODEL_SIZE
    const modelH = MODEL_SIZE
    const { canvas, meta } = letterbox(image, [modelH, modelW], 114)
    const context = canvas.getContext('2d')!
    const imageData = context.getImageData(0, 0, modelW, modelH)
    const { data } = imageData

    // Use shared buffer to avoid GC
    const input = getSharedInputBuffer()
    const pixelCount = modelW * modelH

    // Direct write to planar NCHW format (R plane, G plane, B plane)
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      input[p] = data[i] / 255 // R channel
      input[pixelCount + p] = data[i + 1] / 255 // G channel
      input[2 * pixelCount + p] = data[i + 2] / 255 // B channel
    }

    const tensor = new ort.Tensor('float32', input, [1, 3, modelH, modelW])
    return { tensor, meta }
  }

  // --- Post-processing for standard YOLOv8/v11 output ---
  // Assumes output shape: [1, 4 + num_classes, 8400] (channel-first format)
  // Directly iterates over Float32Array without conversion to JS arrays
  const postprocess = (
    outputDataRaw: ort.Tensor['data'],
    outShape: readonly number[],
    meta: ProcessedImage['meta']
  ): DetectionBox[] => {
    // ONNX Runtime returns Float32Array for float tensors
    // This is safe because we only use float32 models
    const outputData = outputDataRaw as Float32Array

    const num_classes = 34
    const num_coords = 4
    const expectedChannels = num_coords + num_classes // 38

    const { r, dw, dh, imgW, imgH } = meta
    const confThresh = 0.25
    const iouThresh = 0.7

    // Validate output shape matches expected YOLOv8/v11 format
    // Shape should be [1, 38, num_predictions] for 34 classes
    if (outShape.length !== 3 || outShape[0] !== 1) {
      console.warn('Unexpected output shape:', outShape)
      return []
    }

    const num_channels = outShape[1]
    const num_predictions = outShape[2]

    // Validate channel count matches expected classes
    if (num_channels !== expectedChannels) {
      console.warn(`Expected ${expectedChannels} channels, got ${num_channels}`)
      return []
    }

    const boxes: DetectionBox[] = []

    // Iterate over each prediction
    for (let i = 0; i < num_predictions; i++) {
      // Read coordinates (center x, center y, width, height)
      const x = outputData[0 * num_predictions + i]
      const y = outputData[1 * num_predictions + i]
      const w = outputData[2 * num_predictions + i]
      const h = outputData[3 * num_predictions + i]

      // Find the best class score directly from Float32Array
      let maxScore = -Infinity
      let maxIndex = -1
      for (let c = 0; c < num_classes; c++) {
        const score = outputData[(num_coords + c) * num_predictions + i]
        if (score > maxScore) {
          maxScore = score
          maxIndex = c
        }
      }

      // Skip low confidence detections
      if (maxScore < confThresh) continue

      // Convert from letterbox coordinates back to original image coordinates
      let bx = (x - w / 2 - dw) / r
      let by = (y - h / 2 - dh) / r
      let bw = w / r
      let bh = h / r

      // Clamp to image bounds
      bx = Math.max(0, Math.min(bx, imgW - 1))
      by = Math.max(0, Math.min(by, imgH - 1))
      bw = Math.max(0, Math.min(bw, imgW - bx))
      bh = Math.max(0, Math.min(bh, imgH - by))

      boxes.push({
        box: [bx, by, bw, bh],
        score: maxScore,
        labelIndex: maxIndex,
      })
    }

    return nms(boxes, iouThresh, false)
  }

  // --- Visualization (syncCanvasToImage, drawBoundingBoxes) ---
  const syncCanvasToImage = (
    imgElement: HTMLImageElement,
    canvasElement: HTMLCanvasElement
  ) => {
    const dispW = imgElement.clientWidth
    const dispH = imgElement.clientHeight
    canvasElement.style.width = dispW + 'px'
    canvasElement.style.height = dispH + 'px'
    const dpr = window.devicePixelRatio || 1
    canvasElement.width = Math.round(dispW * dpr)
    canvasElement.height = Math.round(dispH * dpr)
    const ctx = canvasElement.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, dispW, dispH)
    const natW = imgElement.naturalWidth || imgElement.width
    const natH = imgElement.naturalHeight || imgElement.height
    return {
      dispW,
      dispH,
      natW,
      natH,
      scaleX: dispW / natW,
      scaleY: dispH / natH,
    }
  }

  const drawBoundingBoxes = (
    boxes: DetectionBox[],
    imgElement: HTMLImageElement,
    canvasElement: HTMLCanvasElement
  ) => {
    const { scaleX, scaleY, dispW, dispH } = syncCanvasToImage(
      imgElement,
      canvasElement
    )
    const ctx = canvasElement.getContext('2d')!
    ctx.clearRect(0, 0, dispW, dispH)
    if (!showBoundingBoxes.value) return
    ctx.font = '14px Arial'
    boxes.forEach(({ box, score, labelIndex }) => {
      const label = LABELS[labelIndex]
      if (!label) return
      const x = box[0] * scaleX,
        y = box[1] * scaleY,
        w = box[2] * scaleX,
        h = box[3] * scaleY
      ctx.strokeStyle = label.color
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, w, h)
      const text = `${label.name}: ${score.toFixed(2)}`
      const textWidth = ctx.measureText(text).width
      ctx.fillStyle = label.color
      ctx.fillRect(x - 1, y - 18, textWidth + 8, 18)
      ctx.fillStyle = 'white'
      ctx.fillText(text, x + 3, y - 4)
    })
  }

  // --- Inference Logic ---
  const runInference = async (
    img: HTMLImageElement
  ): Promise<DetectionBox[]> => {
    const prep = await preprocess(img)
    const inputName = session.value!.inputNames.includes('images')
      ? 'images'
      : session.value!.inputNames[0]
    const results = await session.value!.run({ [inputName]: prep.tensor })
    const firstOut = results.output0 || results[Object.keys(results)[0]]
    return postprocess(firstOut.data, firstOut.dims, prep.meta)
  }

  // --- Public Methods (processImage, updateBoardGrid) ---
  const processImage = async (file: File): Promise<void> => {
    try {
      isProcessing.value = true
      status.value = t('positionEditor.imageRecognitionStatus.loadingImage')
      await initializeModel()
      const img = new Image()
      const imageUrl = URL.createObjectURL(file)
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = imageUrl
      })
      inputImage.value = img
      status.value = t(
        'positionEditor.imageRecognitionStatus.runningModelInference'
      )
      const boxes = await runInference(img)
      detectedBoxes.value = boxes
      status.value = t(
        'positionEditor.imageRecognitionStatus.recognitionCompleted'
      )
    } catch (error) {
      console.error(error)
      throw error
    } finally {
      isProcessing.value = false
    }
  }

  // ========== Board Locking Methods ==========
  /**
   * Lock or unlock the board detection.
   * When locked, the cached board bounding box is reused instead of searching for it.
   * Useful for processing sequences where camera and board position never change.
   */
  const lockBoard = (shouldLock: boolean): void => {
    isBoardLocked.value = shouldLock
    if (!shouldLock) {
      // Clear cache when unlocking
      cachedBoardBox = null
    }
  }

  const updateBoardGrid = (
    boxes: DetectionBox[]
  ): (DetectionBox | null)[][] => {
    let boardBox: DetectionBox | undefined

    if (isBoardLocked.value && cachedBoardBox) {
      // Use cached board when locked
      boardBox = cachedBoardBox
    } else {
      // Find board from detection results
      boardBox = boxes
        .filter(b => LABELS[b.labelIndex]?.name === 'Board')
        .sort((a, b) => b.score - a.score)[0]

      // Cache the board box if found (for potential future locking)
      if (boardBox) {
        cachedBoardBox = boardBox
      }
    }

    if (!boardBox)
      return Array(10)
        .fill(null)
        .map(() => Array(9).fill(null))

    const piecesOnBoard = boxes.filter(p => {
      if (LABELS[p.labelIndex]?.name === 'Board') return false
      return doBoxesOverlap(p.box, boardBox!.box)
    })

    const [bx, by, bw, bh] = boardBox.box
    const grid: Array<Array<DetectionBox | null>> = Array(10)
      .fill(null)
      .map(() => Array(9).fill(null))

    // Linear mapping for flat 2D images (no perspective transform needed)
    // Note: This assumes flat/scanned images without perspective distortion.
    // For camera images with perspective, bilinear interpolation would be more accurate.
    for (const piece of piecesOnBoard) {
      const [px, py, pw, ph] = piece.box
      const cx = px + pw / 2
      const cy = py + ph / 2

      let bestPos = { i: -1, j: -1, dist: Infinity }
      for (let j = 0; j < 10; j++) {
        for (let i = 0; i < 9; i++) {
          const u = i / 8
          const v = j / 9

          // Simple linear interpolation for rectangular board
          const gx = bx + u * bw
          const gy = by + v * bh

          const dist = Math.hypot(cx - gx, cy - gy)
          if (dist < bestPos.dist) {
            bestPos = { i, j, dist }
          }
        }
      }

      const { i, j } = bestPos
      if (i !== -1 && (!grid[j][i] || piece.score > grid[j][i]!.score)) {
        grid[j][i] = piece
      }
    }
    return grid
  }

  const processImageDirect = async (img: HTMLImageElement): Promise<void> => {
    if (!session.value) await initializeModel()
    try {
      isProcessing.value = true
      detectedBoxes.value = await runInference(img)
    } finally {
      isProcessing.value = false
    }
  }

  // ========== High-performance Raw Data Processing ==========
  // Optimized for high-FPS processing with reusable buffer to minimize GC
  // Expects pre-resized 640x640 RGB data from Rust/native code
  const processRawData = async (
    data: Uint8Array,
    width: number,
    height: number
  ) => {
    if (!session.value) await initializeModel()

    // Validate input dimensions match expected model size
    const pixelCount = width * height
    if (width !== MODEL_SIZE || height !== MODEL_SIZE) {
      throw new Error(
        `processRawData expects ${MODEL_SIZE}x${MODEL_SIZE} images, got ${width}x${height}`
      )
    }

    // Use shared buffer to avoid GC during high-FPS processing
    const float32Data = getSharedInputBuffer()

    // Convert Uint8 [0-255] to Float32 [0-1] in NCHW format
    // Direct write to planar format (R plane, G plane, B plane)
    for (let i = 0; i < pixelCount; i++) {
      float32Data[i] = data[i * 3] / 255.0 // R channel
      float32Data[pixelCount + i] = data[i * 3 + 1] / 255.0 // G channel
      float32Data[2 * pixelCount + i] = data[i * 3 + 2] / 255.0 // B channel
    }

    // Run inference
    const inputName = session.value!.inputNames.includes('images')
      ? 'images'
      : session.value!.inputNames[0]
    const tensor = new ort.Tensor('float32', float32Data, [1, 3, height, width])
    const results = await session.value!.run({ [inputName]: tensor })

    // Postprocess with identity transform (no letterbox padding)
    const meta = {
      r: 1,
      dw: 0,
      dh: 0,
      newW: width,
      newH: height,
      imgW: width,
      imgH: height,
    }

    const firstOut = results.output0 || results[Object.keys(results)[0]]
    const boxes = postprocess(firstOut.data, firstOut.dims, meta)

    detectedBoxes.value = boxes
  }

  return {
    // State
    session,
    isModelLoading,
    isProcessing,
    status,
    detectedBoxes,
    inputImage,
    outputCanvas,
    showBoundingBoxes,
    // Board locking
    isBoardLocked,
    lockBoard,
    // Processing methods
    processImage,
    processImageDirect,
    processRawData,
    // Visualization and grid
    drawBoundingBoxes,
    updateBoardGrid,
    initializeModel,
  }
}
