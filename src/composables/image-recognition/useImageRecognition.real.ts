import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import * as ort from 'onnxruntime-web'
// Import types from the new file
import { LABELS, type DetectionBox, type ProcessedImage } from './types'

export const useImageRecognition = () => {
  const { t } = useI18n()
  const session = ref<ort.InferenceSession | null>(null)
  const isModelLoading = ref(false)
  const isProcessing = ref(false)
  const status = ref('')
  const detectedBoxes = ref<DetectionBox[]>([])
  const inputImage = ref<HTMLImageElement | null>(null)
  const outputCanvas = ref<HTMLCanvasElement | null>(null)
  const showBoundingBoxes = ref(true)

  // Initialize model
  const initializeModel = async (): Promise<void> => {
    if (session.value) return

    try {
      isModelLoading.value = true
      status.value = t('positionEditor.imageRecognitionStatus.loadingModel')
      // Set the "directory path" for WASM/JSEP runtime code to /ort/ (accessible by both vite dev and build)
      // ORT will load *.jsep.mjs / *.jsep.wasm etc. under this directory using default filenames
      const base = (import.meta as any).env?.BASE_URL || '/'
      ort.env.wasm.wasmPaths = base + 'ort/'
      session.value = await ort.InferenceSession.create(
        base + 'models/best.onnx',
        {
          executionProviders: ['wasm'],
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

  // Utility functions
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

  const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x))

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

  // Image preprocessing
  const preprocess = async (
    image: HTMLImageElement
  ): Promise<{ tensor: ort.Tensor; meta: ProcessedImage['meta'] }> => {
    const modelW = 640
    const modelH = 640

    const { canvas, meta } = letterbox(image, [modelH, modelW], 114)

    const context = canvas.getContext('2d')!
    const imageData = context.getImageData(0, 0, modelW, modelH)
    const { data } = imageData

    const red = new Float32Array(modelW * modelH)
    const green = new Float32Array(modelW * modelH)
    const blue = new Float32Array(modelW * modelH)

    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      red[p] = data[i] / 255
      green[p] = data[i + 1] / 255
      blue[p] = data[i + 2] / 255
    }

    const input = new Float32Array(modelW * modelH * 3)
    input.set(red, 0)
    input.set(green, modelW * modelH)
    input.set(blue, modelW * modelH * 2)

    const tensor = new ort.Tensor('float32', input, [1, 3, modelH, modelW])
    return { tensor, meta }
  }

  // Post-processing results (Compatible with YOLOv11: supports CxN and NxC layouts, automatically detects normalized coordinates)
  const postprocess = (
    outputDataRaw: any,
    outShape: number[],
    meta: ProcessedImage['meta']
  ): DetectionBox[] => {
    // Unify TypedArray/number[] for Float32Array access
    const outputData =
      outputDataRaw instanceof Float32Array
        ? outputDataRaw
        : Float32Array.from(outputDataRaw as number[])

    const num_classes = 34
    const num_coords = 4

    const { r, dw, dh, imgW, imgH, newW, newH } = meta

    const confThresh = 0.25
    const iouThresh = 0.7
    const classAgnostic = false

    // ---------- Branch 3: xyxy+score+classIdx ----------
    // Format like [1, N, 6] or [N, 6], where each row is [x1,y1,x2,y2,score,cls]
    const handleXYXYFormat = (
      data: Float32Array,
      shape: number[]
    ): DetectionBox[] => {
      let N: number
      let stride: number
      let offset = 0
      if (shape.length === 3 && shape[2] === 6) {
        N = shape[1]
        stride = 6
      } else if (shape.length === 2 && shape[1] === 6) {
        N = shape[0]
        stride = 6
      } else {
        return []
      }

      // Sample to determine if coordinates are normalized
      let maxAbsCoord = 0
      const sample = Math.min(N, 64)
      for (let i = 0; i < sample; i++) {
        const base = offset + i * stride
        const x1 = Math.abs(data[base + 0])
        const y1 = Math.abs(data[base + 1])
        const x2 = Math.abs(data[base + 2])
        const y2 = Math.abs(data[base + 3])
        maxAbsCoord = Math.max(maxAbsCoord, x1, y1, x2, y2)
      }
      const coordsAreNormalized = maxAbsCoord <= 1.5

      const boxes: DetectionBox[] = []
      for (let i = 0; i < N; i++) {
        const base = offset + i * stride
        let x1 = data[base + 0]
        let y1 = data[base + 1]
        let x2 = data[base + 2]
        let y2 = data[base + 3]
        const score = data[base + 4]
        const clsIdx = Math.round(data[base + 5])

        if (score < confThresh) continue

        if (coordsAreNormalized) {
          x1 *= newW
          y1 *= newH
          x2 *= newW
          y2 *= newH
        }

        // Convert back to xywh
        let cx = (x1 + x2) / 2
        let cy = (y1 + y2) / 2
        let w = Math.max(0, x2 - x1)
        let h = Math.max(0, y2 - y1)

        // Remove letterbox padding (restore to original image)
        let bx = (cx - w / 2 - dw) / r
        let by = (cy - h / 2 - dh) / r
        let bw = w / r
        let bh = h / r

        // Clip to original image bounds
        bx = Math.max(0, Math.min(bx, imgW - 1))
        by = Math.max(0, Math.min(by, imgH - 1))
        bw = Math.max(0, Math.min(bw, imgW - bx))
        bh = Math.max(0, Math.min(bh, imgH - by))

        boxes.push({ box: [bx, by, bw, bh], score, labelIndex: clsIdx })
      }
      return boxes
    }

    // First try to identify xyxy+score+classIdx output
    if (
      (outShape.length === 3 && outShape[2] === 6) ||
      (outShape.length === 2 && outShape[1] === 6)
    ) {
      return nms(
        handleXYXYFormat(outputData, outShape),
        iouThresh,
        classAgnostic
      )
    }

    // ---------- Branch 1/2: YOLO style (xywh [+obj] + classes) ----------
    // Automatically identify [1,C,N] or [1,N,C]
    const channelsCandidate1 = outShape[1] // C?
    const predsCandidate1 = outShape[2] // N?
    const channelsCandidate2 = outShape[2] // C?
    const predsCandidate2 = outShape[1] // N?

    const matchesChannels = (c: number) =>
      c === num_coords + num_classes || c === num_coords + num_classes + 1

    let layout: 'cf' | 'cl' = 'cf' // 'cf': [1, C, N]；'cl': [1, N, C]
    let num_channels = channelsCandidate1
    let num_predictions = predsCandidate1

    if (matchesChannels(channelsCandidate1)) {
      layout = 'cf'
      num_channels = channelsCandidate1
      num_predictions = predsCandidate1
    } else if (matchesChannels(channelsCandidate2)) {
      layout = 'cl'
      num_channels = channelsCandidate2
      num_predictions = predsCandidate2
    } else {
      // Fallback: treat the larger one as C
      if (channelsCandidate1 >= channelsCandidate2) {
        layout = 'cf'
        num_channels = channelsCandidate1
        num_predictions = predsCandidate1
      } else {
        layout = 'cl'
        num_channels = channelsCandidate2
        num_predictions = predsCandidate2
      }
      console.warn(
        'Unexpected YOLO-like output shape, guessing layout:',
        outShape
      )
    }

    const hasObjectness = num_channels === num_coords + num_classes + 1

    const getVal = (ch: number, i: number): number =>
      layout === 'cf'
        ? outputData[ch * num_predictions + i]
        : outputData[i * num_channels + ch]

    // Sample to determine if classes need sigmoid
    let needSigmoid = false
    {
      const startCh = num_coords + (hasObjectness ? 1 : 0)
      let sampled = 0
      for (
        let ch = startCh;
        ch < num_channels && sampled < 64;
        ch += Math.max(1, Math.floor(num_classes / 8))
      ) {
        const v = getVal(ch, 0)
        if (v < 0 || v > 1) {
          needSigmoid = true
          break
        }
        sampled++
      }
    }

    // Sample to determine if coordinates are normalized
    let maxAbsCoord = 0
    const sampleCount = Math.min(num_predictions, 64)
    const step = Math.max(1, Math.floor(num_predictions / sampleCount))
    for (let i = 0; i < num_predictions && i < sampleCount * step; i += step) {
      const sx = Math.abs(getVal(0, i))
      const sy = Math.abs(getVal(1, i))
      const sw = Math.abs(getVal(2, i))
      const sh = Math.abs(getVal(3, i))
      maxAbsCoord = Math.max(maxAbsCoord, sx, sy, sw, sh)
    }
    const coordsAreNormalized = maxAbsCoord <= 1.5

    const boxes: DetectionBox[] = []
    for (let i = 0; i < num_predictions; i++) {
      let x = getVal(0, i)
      let y = getVal(1, i)
      let w = getVal(2, i)
      let h = getVal(3, i)

      if (coordsAreNormalized) {
        x *= newW
        y *= newH
        w *= newW
        h *= newH
      }

      let obj = 1.0
      let clsStart = 4
      if (hasObjectness) {
        obj = getVal(4, i)
        if (needSigmoid) obj = sigmoid(obj)
        clsStart = 5
      }

      let maxScore = -Infinity
      let maxIndex = -1
      for (let c = 0; c < num_classes; c++) {
        let s = getVal(clsStart + c, i)
        if (needSigmoid) s = sigmoid(s)
        const clsConf = hasObjectness ? obj * s : s
        if (clsConf > maxScore) {
          maxScore = clsConf
          maxIndex = c
        }
      }

      if (maxScore >= confThresh) {
        // cxcywh -> xywh
        let bx = x - w / 2
        let by = y - h / 2
        let bw = w
        let bh = h

        // Remove padding & restore to original image
        bx = (bx - dw) / r
        by = (by - dh) / r
        bw = bw / r
        bh = bh / r

        // Clip
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
    }

    return nms(boxes, iouThresh, classAgnostic)
  }

  // Sync canvas with image display size
  const syncCanvasToImage = (
    imgElement: HTMLImageElement,
    canvasElement: HTMLCanvasElement
  ) => {
    const dispW = imgElement.clientWidth
    const dispH = imgElement.clientHeight

    canvasElement.style.position = 'absolute'
    canvasElement.style.left = '0'
    canvasElement.style.top = '0'
    canvasElement.style.width = dispW + 'px'
    canvasElement.style.height = dispH + 'px'
    canvasElement.style.pointerEvents = 'none'

    const dpr = window.devicePixelRatio || 1
    canvasElement.width = Math.round(dispW * dpr)
    canvasElement.height = Math.round(dispH * dpr)

    const ctx = canvasElement.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, dispW, dispH)

    const natW = imgElement.naturalWidth || imgElement.width
    const natH = imgElement.naturalHeight || imgElement.height

    const scaleX = dispW / natW
    const scaleY = dispH / natH

    return { dispW, dispH, natW, natH, scaleX, scaleY }
  }

  // Draw bounding boxes
  const drawBoundingBoxes = (
    boxes: DetectionBox[],
    imgElement: HTMLImageElement,
    canvasElement: HTMLCanvasElement
  ) => {
    const { scaleX, scaleY } = syncCanvasToImage(imgElement, canvasElement)
    const ctx = canvasElement.getContext('2d')!

    // Clear canvas first
    const { dispW, dispH } = syncCanvasToImage(imgElement, canvasElement)
    ctx.clearRect(0, 0, dispW, dispH)

    // Only draw if showBoundingBoxes is enabled
    if (!showBoundingBoxes.value) {
      return
    }

    ctx.font = '14px Arial'

    boxes.forEach(({ box, score, labelIndex }) => {
      const label = LABELS[labelIndex]
      if (!label) return

      const x = box[0] * scaleX
      const y = box[1] * scaleY
      const w = box[2] * scaleX
      const h = box[3] * scaleY

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

  // Process image recognition
  const processImage = async (file: File): Promise<void> => {
    try {
      isProcessing.value = true
      status.value = t('positionEditor.imageRecognitionStatus.loadingImage')

      // Initialize model
      await initializeModel()

      // Create image element
      const img = new Image()
      const imageUrl = URL.createObjectURL(file)

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = imageUrl
      })

      inputImage.value = img

      status.value = t(
        'positionEditor.imageRecognitionStatus.preprocessingImage'
      )
      const prep = await preprocess(img)

      status.value = t(
        'positionEditor.imageRecognitionStatus.runningModelInference'
      )
      // More robust selection of input name (many exported YOLO models use 'images' as input name)
      const inputName = session.value!.inputNames.includes('images')
        ? 'images'
        : session.value!.inputNames[0]
      const feeds = { [inputName]: prep.tensor }
      const results = await session.value!.run(feeds)

      const firstOut = results.output0 || results[Object.keys(results)[0]]
      const outputData = firstOut.data as unknown as number[]
      const outShape = firstOut.dims as number[]

      status.value = t(
        'positionEditor.imageRecognitionStatus.postProcessingResults'
      )
      const boxes = postprocess(outputData, outShape, prep.meta)
      detectedBoxes.value = boxes

      status.value = t(
        'positionEditor.imageRecognitionStatus.recognitionCompleted'
      )

      // Do not revoke immediately; keep the blob URL while the image is displayed
    } catch (error) {
      console.error('Image processing failed:', error)
      status.value = t(
        'positionEditor.imageRecognitionStatus.processingFailed',
        {
          error:
            error instanceof Error
              ? error.message
              : t('positionEditor.imageRecognitionStatus.unknownError'),
        }
      )
      throw error
    } finally {
      isProcessing.value = false
    }
  }

  // Update board grid
  const updateBoardGrid = (
    boxes: DetectionBox[]
  ): (DetectionBox | null)[][] => {
    const boardBox = boxes
      .filter(b => LABELS[b.labelIndex]?.name === 'Board')
      .sort((a, b) => b.score - a.score)[0]

    if (!boardBox)
      return Array(10)
        .fill(null)
        .map(() => Array(9).fill(null))

    const piecesOnBoard = boxes.filter(p => {
      if (LABELS[p.labelIndex]?.name === 'Board') return false
      return doBoxesOverlap(p.box, boardBox.box)
    })

    const [bx, by, bw, bh] = boardBox.box
    const p_tl = { x: bx, y: by }
    const p_tr = { x: bx + bw, y: by }
    const p_bl = { x: bx, y: by + bh }
    const p_br = { x: bx + bw, y: by + bh }

    const grid: Array<Array<DetectionBox | null>> = Array(10)
      .fill(null)
      .map(() => Array(9).fill(null))

    for (const piece of piecesOnBoard) {
      const [px, py, pw, ph] = piece.box
      const pieceCenter = { x: px + pw / 2, y: py + ph / 2 }
      let bestPos = { i: -1, j: -1, dist: Infinity }

      for (let j = 0; j < 10; j++) {
        for (let i = 0; i < 9; i++) {
          const u = i / 8
          const v = j / 9

          const topX = (1 - u) * p_tl.x + u * p_tr.x
          const topY = (1 - u) * p_tl.y + u * p_tr.y
          const botX = (1 - u) * p_bl.x + u * p_br.x
          const botY = (1 - u) * p_bl.y + u * p_br.y
          const gridX = (1 - v) * topX + v * botX
          const gridY = (1 - v) * topY + v * botY

          const dist = Math.hypot(pieceCenter.x - gridX, pieceCenter.y - gridY)
          if (dist < bestPos.dist) bestPos = { i, j, dist }
        }
      }

      const { i, j } = bestPos
      if (i !== -1 && (!grid[j][i] || piece.score > grid[j][i]!.score)) {
        grid[j][i] = piece
      }
    }

    return grid
  }

  return {
    session,
    isModelLoading,
    isProcessing,
    status,
    detectedBoxes,
    inputImage,
    outputCanvas,
    showBoundingBoxes,
    processImage,
    drawBoundingBoxes,
    updateBoardGrid,
    initializeModel,
  }
}
