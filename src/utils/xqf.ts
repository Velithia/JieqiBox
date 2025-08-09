/**
 * XQF (象棋演播室) Binary Chess Notation Format Library
 * TypeScript implementation for reading and writing XQF files
 */

// Types for GameNotation compatibility
export type HistoryEntry = {
  type: 'move' | 'adjust'
  data: string
  fen: string
  comment?: string
  engineScore?: number
  engineTime?: number
}

export interface GameNotation {
  metadata: {
    event?: string
    site?: string
    date?: string
    round?: string
    white?: string
    black?: string
    result?: string
    initialFen?: string
    flipMode?: 'random' | 'free'
    currentFen?: string
  }
  moves: HistoryEntry[]
}

// XQF specific types
interface XQFHeader {
  Version: number
  KeyMask: number
  KeyOr: number[]
  KeySum: number
  KeyXYp: number
  KeyXYf: number
  KeyXYt: number
  QiziXY: number[]
  PlayStepNo: number
  WhoPlay: number
  PlayResult: number
  PlayNodes: number[]
  PTreePos: number[]
  Type: number
  Title?: string
  MatchName?: string
  MatchTime?: string
  MatchAddr?: string
  RedPlayer?: string
  BlkPlayer?: string
  TimeRule?: string
  RedTime?: string
  BlkTime?: string
  RMKWriter?: string
  Author?: string
}

interface XQFKeys {
  F32: number[]
  XYp: number
  XYf: number
  XYt: number
  RMK: number
}

// Chess piece mapping for 32 pieces in order
const FEN_PIECES = "RNBAKABNRCCPPPPPrnbakabnrccppppp"

// Board coordinate system - a9 to i0 mapping
const COORD_MAP = [
  'a9', 'b9', 'c9', 'd9', 'e9', 'f9', 'g9', 'h9', 'i9',
  'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8', 'i8',
  'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7', 'i7',
  'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6', 'i6',
  'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5', 'i5',
  'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4', 'i4',
  'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3', 'i3',
  'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2', 'i2',
  'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1', 'i1',
  'a0', 'b0', 'c0', 'd0', 'e0', 'f0', 'g0', 'h0', 'i0'
]

// Create reverse mapping for coordinate lookup
const COORD_TO_INDEX = new Map<string, number>()
COORD_MAP.forEach((coord, index) => COORD_TO_INDEX.set(coord, index))

/**
 * Convert coordinate string to board index (0-89)
 */
function coordToIndex(coord: string): number {
  return COORD_TO_INDEX.get(coord) ?? -1
}

/**
 * Convert board index to coordinate string
 */
function indexToCoord(index: number): string {
  return COORD_MAP[index] || ''
}

/**
 * Convert position code to board coordinates
 */
function positionCodeToCoord(posCode: number): { x: number; y: number; index: number } {
  const x = Math.floor(posCode / 10)
  const y = 9 - (posCode % 10)
  const index = y * 9 + x
  return { x, y, index }
}

/**
 * Convert board coordinates to position code
 */
// Commented out as currently unused - may be needed for future enhancements
// function coordToPositionCode(x: number, y: number): number {
//   return x * 10 + (9 - y)
// }

/**
 * Read little-endian 16-bit integer
 */
function readLE16(buffer: Uint8Array, offset: number): number {
  return buffer[offset] | (buffer[offset + 1] << 8)
}

/**
 * Read little-endian 32-bit integer
 */
function readLE32(buffer: Uint8Array, offset: number): number {
  return buffer[offset] | 
         (buffer[offset + 1] << 8) | 
         (buffer[offset + 2] << 16) | 
         (buffer[offset + 3] << 24)
}

/**
 * Write little-endian 16-bit integer
 */
function writeLE16(buffer: Uint8Array, offset: number, value: number): void {
  buffer[offset] = value & 0xFF
  buffer[offset + 1] = (value >> 8) & 0xFF
}

/**
 * Write little-endian 32-bit integer
 */
function writeLE32(buffer: Uint8Array, offset: number, value: number): void {
  buffer[offset] = value & 0xFF
  buffer[offset + 1] = (value >> 8) & 0xFF
  buffer[offset + 2] = (value >> 16) & 0xFF
  buffer[offset + 3] = (value >> 24) & 0xFF
}

/**
 * Convert bytes to string
 */ 
function bytesToString(bytes: number[]): string {
  const clean: number[] = []
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0) break
    clean.push(bytes[i])
  }
  if (clean.length === 0) return ''
  let out = ''
  for (let i = 0; i < clean.length; i++) {
    out += String.fromCharCode(clean[i] & 0xff)
  }
  return out.trim()
}

/**
 * Convert string to bytes
 */
function stringToBytes(text: string, maxLength: number): number[] {
  if (!text) return []
  const bytes: number[] = []
  for (let i = 0; i < text.length && bytes.length < maxLength; i++) {
    const code = text.charCodeAt(i) & 0xff
    bytes.push(code)
  }
  return bytes
}

// 已移除按字符到 GBK 字节的映射，写入时直接使用低 8 位

/**
 * Parse XQF file header (1024 bytes)
 */
function parseXQFHeader(buffer: Uint8Array): XQFHeader {
  const readString = (offset: number, lengthOffset: number): string => {
    const length = buffer[lengthOffset]
    if (length === 0) return ''
    const bytes = Array.from(buffer.slice(offset, offset + length))
    return bytesToString(bytes)
  }

  return {
    Version: buffer[2],
    KeyMask: buffer[3],
    KeyOr: [buffer[8], buffer[9], buffer[10], buffer[11]],
    KeySum: buffer[12],
    KeyXYp: buffer[13],
    KeyXYf: buffer[14],
    KeyXYt: buffer[15],
    QiziXY: Array.from(buffer.slice(16, 48)),
    PlayStepNo: readLE16(buffer, 48),
    WhoPlay: buffer[50],
    PlayResult: buffer[51],
    PlayNodes: [buffer[52], buffer[53], buffer[54], buffer[55]],
    PTreePos: [buffer[56], buffer[57], buffer[58], buffer[59]],
    Type: buffer[64],
    Title: readString(81, 80),
    MatchName: readString(209, 208),
    MatchTime: readString(273, 272),
    MatchAddr: readString(289, 288),
    RedPlayer: readString(305, 304),
    BlkPlayer: readString(321, 320),
    TimeRule: readString(337, 336),
    RedTime: readString(401, 400),
    BlkTime: readString(417, 416),
    RMKWriter: readString(465, 464),
    Author: readString(481, 480)
  }
}

/**
 * Calculate encryption keys from header
 */
function calculateKeys(header: XQFHeader): XQFKeys {
  const keys: XQFKeys = {
    F32: new Array(32).fill(0),
    XYp: 0,
    XYf: 0,
    XYt: 0,
    RMK: 0
  }

  if (header.Version <= 15) {
    return keys // No encryption for older versions
  }

  // Calculate FKey array
  const FKey = [
    (header.KeySum & header.KeyMask) | header.KeyOr[0],
    (header.KeyXYp & header.KeyMask) | header.KeyOr[1],
    (header.KeyXYf & header.KeyMask) | header.KeyOr[2],
    (header.KeyXYt & header.KeyMask) | header.KeyOr[3]
  ]

  // Generate F32 mask using watermark
  const WATERMARK = "[(C) Copyright Mr. Dong Shiwei.]"
  for (let i = 0; i < 32; i++) {
    keys.F32[i] = FKey[i % 4] & WATERMARK.charCodeAt(i)
  }

  // Calculate position disturbance values
  keys.XYp = ((header.KeyXYp * header.KeyXYp * 54 + 221) * header.KeyXYp) & 0xFF
  keys.XYf = ((header.KeyXYf * header.KeyXYf * 54 + 221) * keys.XYp) & 0xFF
  keys.XYt = ((header.KeyXYt * header.KeyXYt * 54 + 221) * keys.XYf) & 0xFF

  // Calculate RMK value
  keys.RMK = (((header.KeySum << 8) + header.KeyXYp) % 32000 + 767) & 0xFFFF

  return keys
}

/**
 * Decrypt data block if needed
 */
function decryptData(data: Uint8Array, keys: XQFKeys, version: number): Uint8Array {
  if (version <= 15) {
    return data // No decryption needed
  }

  const decrypted = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++) {
    decrypted[i] = (data[i] - keys.F32[i % 32]) & 0xFF
  }
  return decrypted
}

/**
 * Encrypt data block if needed
 */
function encryptData(data: Uint8Array, keys: XQFKeys, version: number): Uint8Array {
  if (version <= 15) {
    return data // No encryption needed
  }

  const encrypted = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++) {
    encrypted[i] = (data[i] + keys.F32[i % 32]) & 0xFF
  }
  return encrypted
}

/**
 * Parse piece positions from QiziXY array
 */
function parsePiecePositions(header: XQFHeader, keys: XQFKeys): string[] {
  const board = new Array(90).fill('*')
  
  for (let i = 0; i < 32; i++) {
    let pieceKey: number
    let piecePos: number

    if (header.Version > 11) {
      pieceKey = (keys.XYp + i + 1) & 31
      piecePos = (header.QiziXY[i] - keys.XYp) & 0xFF
    } else {
      pieceKey = i
      piecePos = header.QiziXY[i]
    }

    if (piecePos < 90) {
      const { index } = positionCodeToCoord(piecePos)
      if (index >= 0 && index < 90) {
        board[index] = FEN_PIECES[pieceKey]
      }
    }
  }

  return board
}

/**
 * Convert board array to FEN position string
 */
function boardToFenPosition(board: string[]): string {
  let fen = ''
  
  for (let rank = 0; rank < 10; rank++) {
    let emptyCount = 0
    let rankStr = ''
    
    for (let file = 0; file < 9; file++) {
      const index = rank * 9 + file
      const piece = board[index]
      
      if (piece === '*') {
        emptyCount++
      } else {
        if (emptyCount > 0) {
          rankStr += emptyCount.toString()
          emptyCount = 0
        }
        rankStr += piece
      }
    }
    
    if (emptyCount > 0) {
      rankStr += emptyCount.toString()
    }
    
    fen += (rank > 0 ? '/' : '') + rankStr
  }
  
  return fen
}

/**
 * Generate initial FEN string from board and header
 */
function generateInitialFen(board: string[], header: XQFHeader): string {
  const position = boardToFenPosition(board)
  const sideToMove = header.WhoPlay === 1 ? 'b' : 'w'
  const fullmoveNumber = Math.max(1, Math.floor(header.PlayStepNo / 2))
  
  return `${position} ${sideToMove} - - 0 ${fullmoveNumber}`
}

/**
 * Parse FEN position string to board array
 */
function fenPositionToBoard(fenPosition: string): string[] {
  const board = new Array(90).fill('*')
  const ranks = fenPosition.split('/')
  
  for (let rank = 0; rank < Math.min(10, ranks.length); rank++) {
    const rankStr = ranks[rank]
    let file = 0
    
    for (let i = 0; i < rankStr.length && file < 9; i++) {
      const char = rankStr[i]
      if (char >= '1' && char <= '9') {
        const emptySquares = parseInt(char)
        file += emptySquares
      } else {
        const index = rank * 9 + file
        if (index < 90) {
          board[index] = char
        }
        file++
      }
    }
  }
  
  return board
}

/**
 * Generate piece positions array for XQF header
 */
function generatePiecePositions(board: string[], version: number, XYp: number): number[] {
  const qiziXY = new Array(32).fill(255) // Use 255 for missing pieces
  
  // Create reverse mapping from piece character to index in FEN_PIECES
  const pieceToIndex = new Map<string, number[]>()
  for (let i = 0; i < FEN_PIECES.length; i++) {
    const piece = FEN_PIECES[i]
    if (!pieceToIndex.has(piece)) {
      pieceToIndex.set(piece, [])
    }
    pieceToIndex.get(piece)!.push(i)
  }
  
  // Find each piece on the board
  for (let boardIndex = 0; boardIndex < board.length; boardIndex++) {
    const piece = board[boardIndex]
    if (piece === '*') continue
    
    const pieceIndices = pieceToIndex.get(piece)
    if (!pieceIndices || pieceIndices.length === 0) continue
    
    // Use the first available index for this piece type
    const pieceIndex = pieceIndices.shift()!
    
    // Convert board index to position code
    const file = boardIndex % 9
    const rank = Math.floor(boardIndex / 9)
    const y = 9 - rank
    const posCode = file * 10 + y
    
    // Apply disturbance if version > 11
    let finalPosCode = posCode
    if (version > 11) {
      finalPosCode = (posCode + XYp) & 0xFF
    }
    
    qiziXY[pieceIndex] = finalPosCode
  }
  
  return qiziXY
}

/**
 * Create XQF header from GameNotation
 */
function createXQFHeader(notation: GameNotation, version: number = 11): { header: XQFHeader; keys: XQFKeys } {
  // Parse initial FEN to get board state
  const initialFen = notation.metadata.initialFen || 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1'
  const fenParts = initialFen.split(' ')
  const board = fenPositionToBoard(fenParts[0])
  const sideToMove = fenParts[1] === 'b' ? 1 : 0
  const fullmoveNumber = parseInt(fenParts[5]) || 1
  
  // Generate keys for encryption (simplified - use fixed values for compatibility)
  const keys: XQFKeys = {
    F32: new Array(32).fill(0),
    XYp: 0,
    XYf: 0,
    XYt: 0,
    RMK: 0
  }
  
  // Create basic header
  const header: XQFHeader = {
    Version: version,
    KeyMask: 0,
    KeyOr: [0, 0, 0, 0],
    KeySum: 0,
    KeyXYp: 0,
    KeyXYf: 0,
    KeyXYt: 0,
    QiziXY: generatePiecePositions(board, version, keys.XYp),
    PlayStepNo: (fullmoveNumber - 1) * 2 + (sideToMove === 1 ? 1 : 0),
    WhoPlay: sideToMove,
    PlayResult: 0,
    PlayNodes: [0, 0, 0, 0],
    PTreePos: [0, 4, 0, 0], // Standard value: 1024
    Type: 0,
    Title: notation.metadata.event || '象棋对局',
    MatchName: notation.metadata.event || '象棋对局',
    MatchTime: notation.metadata.date || new Date().toISOString().split('T')[0],
    MatchAddr: notation.metadata.site || '',
    RedPlayer: notation.metadata.white || '红方',
    BlkPlayer: notation.metadata.black || '黑方',
    TimeRule: '',
    RedTime: '',
    BlkTime: '',
    RMKWriter: '',
    Author: ''
  }
  
  return { header, keys }
}

/**
 * Write string to buffer with length prefix
 */
function writeStringToBuffer(buffer: Uint8Array, text: string, lengthOffset: number, dataOffset: number, maxLength: number): void {
  const bytes = stringToBytes(text, maxLength)
  buffer[lengthOffset] = Math.min(bytes.length, 255)
  
  for (let i = 0; i < bytes.length && i < maxLength; i++) {
    buffer[dataOffset + i] = bytes[i]
  }
}

/**
 * Create XQF header buffer (1024 bytes)
 */
function createHeaderBuffer(header: XQFHeader): Uint8Array {
  const buffer = new Uint8Array(1024)
  buffer.fill(0)
  
  // Set signature and version
  buffer[0] = 0x58 // 'X'
  buffer[1] = 0x51 // 'Q'
  buffer[2] = header.Version
  buffer[3] = header.KeyMask
  
  // Key data
  buffer[8] = header.KeyOr[0]
  buffer[9] = header.KeyOr[1]
  buffer[10] = header.KeyOr[2]
  buffer[11] = header.KeyOr[3]
  buffer[12] = header.KeySum
  buffer[13] = header.KeyXYp
  buffer[14] = header.KeyXYf
  buffer[15] = header.KeyXYt
  
  // Piece positions
  for (let i = 0; i < 32; i++) {
    buffer[16 + i] = header.QiziXY[i]
  }
  
  // Game data
  writeLE16(buffer, 48, header.PlayStepNo)
  buffer[50] = header.WhoPlay
  buffer[51] = header.PlayResult
  
  for (let i = 0; i < 4; i++) {
    buffer[52 + i] = header.PlayNodes[i]
  }
  for (let i = 0; i < 4; i++) {
    buffer[56 + i] = header.PTreePos[i]
  }
  
  buffer[64] = header.Type
  
  // Text fields
  writeStringToBuffer(buffer, header.Title || '', 80, 81, 127)
  writeStringToBuffer(buffer, header.MatchName || '', 208, 209, 63)
  writeStringToBuffer(buffer, header.MatchTime || '', 272, 273, 15)
  writeStringToBuffer(buffer, header.MatchAddr || '', 288, 289, 15)
  writeStringToBuffer(buffer, header.RedPlayer || '', 304, 305, 15)
  writeStringToBuffer(buffer, header.BlkPlayer || '', 320, 321, 15)
  writeStringToBuffer(buffer, header.TimeRule || '', 336, 337, 63)
  writeStringToBuffer(buffer, header.RedTime || '', 400, 401, 15)
  writeStringToBuffer(buffer, header.BlkTime || '', 416, 417, 15)
  writeStringToBuffer(buffer, header.RMKWriter || '', 464, 465, 15)
  writeStringToBuffer(buffer, header.Author || '', 480, 481, 15)
  
  return buffer
}

/**
 * Create move data buffer from GameNotation moves
 */
function createMoveDataBuffer(moves: HistoryEntry[], keys: XQFKeys, version: number): Uint8Array {
  const records: Uint8Array[] = []
  
  // Add initial comment record if needed
  const initialComment = '' // Could extract from metadata if needed
  if (initialComment) {
    const commentBytes = stringToBytes(initialComment, 1000)
    let commentLen = commentBytes.length
    if (version > 10) {
      commentLen += keys.RMK
    }
    
    const record = new Uint8Array(8 + commentBytes.length)
    record[0] = 0 // fromByte (no move)
    record[1] = 0 // toByte (no move)
    record[2] = 0 // flags
    record[3] = 0 // reserved
    writeLE32(record, 4, commentLen)
    
    for (let i = 0; i < commentBytes.length; i++) {
      record[8 + i] = commentBytes[i]
    }
    
    records.push(record)
  }
  
  // Process each move
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]
    if (move.type !== 'move' || move.data.length < 4) continue
    
    // Parse move coordinates
    const fromCoord = move.data.substring(0, 2)
    const toCoord = move.data.substring(2, 4)
    
    const fromIndex = coordToIndex(fromCoord)
    const toIndex = coordToIndex(toCoord)
    
    if (fromIndex < 0 || toIndex < 0) continue
    
    // Convert to position codes
    const fromFile = fromIndex % 9
    const fromRank = Math.floor(fromIndex / 9)
    const fromY = 9 - fromRank
    const fromPosCode = fromFile * 10 + fromY
    
    const toFile = toIndex % 9
    const toRank = Math.floor(toIndex / 9)
    const toY = 9 - toRank
    const toPosCode = toFile * 10 + toY
    
    // Apply disturbance
    const fromByte = (fromPosCode + 24 + keys.XYf) & 0xFF
    const toByte = (toPosCode + 32 + keys.XYt) & 0xFF
    
    // Prepare comment
    const commentBytes = move.comment ? stringToBytes(move.comment, 1000) : []
    let commentLen = commentBytes.length
    if (version > 10 && commentLen > 0) {
      commentLen += keys.RMK
    }
    
    // Set flags (simplified - just indicate if this is the last move)
    const hasNext = i < moves.length - 1 ? (version > 10 ? 0x80 : 0xF0) : 0
    const flags = hasNext
    
    // Create record
    const record = new Uint8Array(8 + commentBytes.length)
    record[0] = fromByte
    record[1] = toByte
    record[2] = flags
    record[3] = 0 // reserved
    writeLE32(record, 4, commentLen)
    
    for (let j = 0; j < commentBytes.length; j++) {
      record[8 + j] = commentBytes[j]
    }
    
    records.push(record)
  }
  
  // Combine all records
  const totalLength = records.reduce((sum, record) => sum + record.length, 0)
  const buffer = new Uint8Array(totalLength)
  let offset = 0
  
  for (const record of records) {
    buffer.set(record, offset)
    offset += record.length
  }
  
  return buffer
}

/**
 * Read XQF file and convert to GameNotation format
 */
export function readXQF(buffer: Uint8Array): GameNotation {
  if (buffer.length < 1024) {
    throw new Error('Invalid XQF file: too small')
  }

  // Parse header
  const header = parseXQFHeader(buffer)
  const keys = calculateKeys(header)

  // Parse piece positions and generate initial FEN
  const board = parsePiecePositions(header, keys)
  const initialFen = generateInitialFen(board, header)

  // Parse move data
  const rawMoveData = buffer.slice(1024)
  const moveData = decryptData(rawMoveData, keys, header.Version)
  
  const moves: HistoryEntry[] = []
  let pos = 0
  let currentFen = initialFen

  // Parse moves from data block
  while (pos < moveData.length) {
    if (pos + 4 > moveData.length) break

    // Read minimal record header
    const fromByte = moveData[pos]
    const toByte = moveData[pos + 1]
    const flags = moveData[pos + 2]
    // pos + 3 is reserved

    // Determine comment presence and compute comment length/next offset
    let commentLen = 0
    let nextOffset = 0
    let comment = ''

    if (header.Version > 10) {
      const hasComment = (flags & 0x20) !== 0
      if (hasComment) {
        if (pos + 8 > moveData.length) break
        const commentLenLE = readLE32(moveData, pos + 4)
        let adjusted = commentLenLE - keys.RMK
        if (adjusted < 0 || adjusted > 100000) adjusted = 0
        commentLen = adjusted
        if (commentLen > 0 && pos + 8 + commentLen <= moveData.length) {
          const commentBytes = Array.from(moveData.slice(pos + 8, pos + 8 + commentLen))
          comment = bytesToString(commentBytes)
        }
        nextOffset = 8 + commentLen
      } else {
        // No comment: record is only 4 bytes
        nextOffset = 4
      }
    } else {
      // Version <= 10: always has 4-byte length + data
      if (pos + 8 > moveData.length) break
      const commentLenLE = readLE32(moveData, pos + 4)
      let adjusted = commentLenLE
      if (adjusted < 0 || adjusted > 100000) adjusted = 0
      commentLen = adjusted
      if (commentLen > 0 && pos + 8 + commentLen <= moveData.length) {
        const commentBytes = Array.from(moveData.slice(pos + 8, pos + 8 + commentLen))
        comment = bytesToString(commentBytes)
      }
      nextOffset = 8 + commentLen
    }

    // Treat the first record as game-level comment block (common in XQF)
    if (pos === 0) {
      pos += nextOffset
      continue
    }

    // Decode move coordinates
    const Pf = (fromByte - 24 - keys.XYf) & 0xFF
    const Pt = (toByte - 32 - keys.XYt) & 0xFF
    const fromCoord = positionCodeToCoord(Pf)
    const toCoord = positionCodeToCoord(Pt)
    
    if (fromCoord.index >= 0 && fromCoord.index < 90 && 
        toCoord.index >= 0 && toCoord.index < 90) {
      const moveStr = indexToCoord(fromCoord.index) + indexToCoord(toCoord.index)
      moves.push({
        type: 'move',
        data: moveStr,
        fen: currentFen,
        comment
      })
    }

    pos += nextOffset
  }

  return {
    metadata: {
      event: header.MatchName || '象棋对局',
      site: 'XQF Import',
      date: header.MatchTime || new Date().toISOString().split('T')[0],
      white: header.RedPlayer || '红方',
      black: header.BlkPlayer || '黑方',
      result: '*',
      initialFen: initialFen
    },
    moves
  }
}

/**
 * Convert GameNotation to XQF file buffer
 */
export function writeXQF(notation: GameNotation, version: number = 11): Uint8Array {
  // Create header and keys
  const { header, keys } = createXQFHeader(notation, version)
  
  // Create header buffer
  const headerBuffer = createHeaderBuffer(header)
  
  // Create move data buffer
  const moveDataBuffer = createMoveDataBuffer(notation.moves, keys, version)
  
  // Encrypt move data if needed
  const encryptedMoveData = encryptData(moveDataBuffer, keys, version)
  
  // Combine header and move data
  const totalLength = 1024 + encryptedMoveData.length
  const result = new Uint8Array(totalLength)
  
  result.set(headerBuffer, 0)
  result.set(encryptedMoveData, 1024)
  
  return result
}

/**
 * Low-level reader that exposes raw board and move records for adapters (e.g., Jieqi)
 * - Returns actual piece board (pieces revealed, no hidden markers)
 * - Returns parsed move records as from/to board indices plus decoded comment
 */
export function readXQFRaw(buffer: Uint8Array): {
  header: ReturnType<typeof parseXQFHeader>
  keys: ReturnType<typeof calculateKeys>
  pieceBoard: string[]
  moves: Array<{ fromIndex: number; toIndex: number; flags: number; comment: string }>
} {
  if (buffer.length < 1024) {
    throw new Error('Invalid XQF file: too small')
  }

  // Parse header/keys
  const header = parseXQFHeader(buffer)
  const keys = calculateKeys(header)

  // Actual board with pieces revealed (RNBAKCP/rnbakcp or '*')
  const pieceBoard = parsePiecePositions(header, keys)

  // Parse move block
  const rawMoveData = buffer.slice(1024)
  const moveData = decryptData(rawMoveData, keys, header.Version)

  const moves: Array<{ fromIndex: number; toIndex: number; flags: number; comment: string }> = []
  let pos = 0

  while (pos < moveData.length) {
    if (pos + 4 > moveData.length) break

    const fromByte = moveData[pos]
    const toByte = moveData[pos + 1]
    const flags = moveData[pos + 2]

    let nextOffset = 0
    let comment = ''

    if (header.Version > 10) {
      const hasComment = (flags & 0x20) !== 0
      if (hasComment) {
        if (pos + 8 > moveData.length) break
        const commentLenLE = readLE32(moveData, pos + 4)
        let adjusted = commentLenLE - keys.RMK
        if (adjusted < 0 || adjusted > 100000) adjusted = 0
        const commentLen = adjusted
        if (commentLen > 0 && pos + 8 + commentLen <= moveData.length) {
          const commentBytes = Array.from(moveData.slice(pos + 8, pos + 8 + commentLen))
          comment = bytesToString(commentBytes)
        }
        nextOffset = 8 + commentLen
      } else {
        nextOffset = 4
      }
    } else {
      if (pos + 8 > moveData.length) break
      const commentLenLE = readLE32(moveData, pos + 4)
      let adjusted = commentLenLE
      if (adjusted < 0 || adjusted > 100000) adjusted = 0
      const commentLen = adjusted
      if (commentLen > 0 && pos + 8 + commentLen <= moveData.length) {
        const commentBytes = Array.from(moveData.slice(pos + 8, pos + 8 + commentLen))
        comment = bytesToString(commentBytes)
      }
      nextOffset = 8 + commentLen
    }

    // Skip first record (commonly file-level comment)
    if (pos === 0) {
      pos += nextOffset
      continue
    }

    // Decode to board indices
    const Pf = (fromByte - 24 - keys.XYf) & 0xFF
    const Pt = (toByte - 32 - keys.XYt) & 0xFF
    const from = positionCodeToCoord(Pf)
    const to = positionCodeToCoord(Pt)

    if (
      from.index >= 0 && from.index < 90 &&
      to.index >= 0 && to.index < 90
    ) {
      moves.push({ fromIndex: from.index, toIndex: to.index, flags, comment })
    }

    pos += nextOffset
  }

  return { header, keys, pieceBoard, moves }
}

// ===== Jieqi adapter (merged from xqf-jieqi.ts) =====
type FlipMode = 'random' | 'free'

function indexToUci(index: number): string {
  const file = index % 9
  const rank = Math.floor(index / 9)
  const fileChar = String.fromCharCode('a'.charCodeAt(0) + file)
  const rankChar = String(9 - rank)
  return fileChar + rankChar
}

// Standard Xiangqi start shape (board part only)
const START_BOARD_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR'

function parseBoardOccupancy(fenBoard: string): boolean[] {
  const occupied: boolean[] = new Array(90).fill(false)
  const ranks = fenBoard.split('/')
  for (let r = 0; r < 10; r++) {
    const row = ranks[r]
    let c = 0
    for (const ch of row) {
      if (ch >= '1' && ch <= '9') {
        c += parseInt(ch, 10)
      } else {
        occupied[r * 9 + c] = true
        c += 1
      }
    }
  }
  return occupied
}

export function convertXQFToJieqiNotation(
  buffer: Uint8Array,
  opts?: { flipMode?: FlipMode }
): GameNotation {
  const { header, pieceBoard, moves: rawMoves } = readXQFRaw(buffer)

  // Build initial hidden board: kings revealed, others hidden as X/x
  const hiddenBoard = new Array<string>(90).fill('*')
  const startOccupied = parseBoardOccupancy(START_BOARD_FEN)
  for (let i = 0; i < 90; i++) {
    const ch = pieceBoard[i]
    if (ch === '*' || !ch) continue
    if (ch === 'K') {
      hiddenBoard[i] = 'K'
    } else if (ch === 'k') {
      hiddenBoard[i] = 'k'
    } else {
      // Shape rule: if not in original start shape position, consider revealed
      if (!startOccupied[i]) {
        hiddenBoard[i] = ch
      } else {
        hiddenBoard[i] = ch === ch.toUpperCase() ? 'X' : 'x'
      }
    }
  }

  // Hidden pool counts: counts only for positions that remain hidden (X/x)
  const currentHiddenCounts: Record<string, number> = {
    R: 0, N: 0, B: 0, A: 0, K: 0, C: 0, P: 0,
    r: 0, n: 0, b: 0, a: 0, k: 0, c: 0, p: 0,
  }
  for (let i = 0; i < 90; i++) {
    const mask = hiddenBoard[i]
    if (mask === 'X' || mask === 'x') {
      const actual = pieceBoard[i]
      if (actual && actual !== '*' && currentHiddenCounts[actual] !== undefined) {
        currentHiddenCounts[actual]++
      }
    }
  }
  const initialHiddenCounts = { ...currentHiddenCounts }
  const initialHiddenBoard = hiddenBoard.slice()

  const hiddenOrder = 'RNBAKCP'
  const buildHiddenPart = (counts: Record<string, number>): string => {
    let s = ''
    for (const u of hiddenOrder) {
      const red = counts[u] || 0
      const black = counts[u.toLowerCase()] || 0
      if (red > 0) s += u + String(red)
      if (black > 0) s += u.toLowerCase() + String(black)
    }
    return s || '-'
  }

  const sideToMove = header.WhoPlay === 1 ? 'b' : 'w'
  const fullmoveStart = Math.max(1, Math.floor((header as any).PlayStepNo ? (header as any).PlayStepNo / 2 : 1))
  let halfmoveClock = 0
  let fullmoveNumber = fullmoveStart
  let sideToMoveLocal: 'w' | 'b' = sideToMove as 'w' | 'b'

  const generateCurrentFen = (): string => {
    const boardFen = boardToFenPosition(hiddenBoard)
    const hiddenPart = buildHiddenPart(currentHiddenCounts)
    return `${boardFen} ${sideToMoveLocal} ${hiddenPart} ${halfmoveClock} ${fullmoveNumber}`
  }

  const flipMode: FlipMode = opts?.flipMode ?? 'random'

  const moves: HistoryEntry[] = []

  for (const rec of rawMoves) {
    const from = rec.fromIndex
    const to = rec.toIndex

    const movingMask = hiddenBoard[from]
    const capturedMask = hiddenBoard[to]

    // Reveal if moving from hidden
    const actualPiece = pieceBoard[from]
    if ((movingMask === 'X' || movingMask === 'x') && actualPiece && actualPiece !== '*') {
      hiddenBoard[from] = actualPiece
      if (currentHiddenCounts[actualPiece] !== undefined) {
        currentHiddenCounts[actualPiece] = Math.max(0, currentHiddenCounts[actualPiece] - 1)
      }
      halfmoveClock = 0
    } else if (capturedMask !== '*') {
      // Capture resets halfmoveClock
      halfmoveClock = 0
    } else {
      halfmoveClock++
    }

    // Execute move
    hiddenBoard[to] = hiddenBoard[from]
    hiddenBoard[from] = '*'

    // If captured a hidden piece, adjust pool (random mode only)
    if ((capturedMask === 'X' || capturedMask === 'x') && flipMode === 'random') {
      const isRedHidden = capturedMask === 'X'
      // pool candidates of that side still > 0
      const poolChars = Object.keys(currentHiddenCounts).filter(k => {
        const cnt = currentHiddenCounts[k]
        if (cnt <= 0) return false
        return isRedHidden ? (k === k.toUpperCase()) : (k === k.toLowerCase())
      })
      if (poolChars.length > 0) {
        const pick = Math.floor(Math.random() * poolChars.length)
        const key = poolChars[pick]
        currentHiddenCounts[key] = Math.max(0, currentHiddenCounts[key] - 1)
      }
    }

    // Build move string (uci)
    const moveUci = indexToUci(from) + indexToUci(to)

    // Engine data extraction from comment
    const comment = rec.comment || ''
    const scoreMatch = comment.match(/\bs:(-?\d+)\b/)
    const timeMatch = comment.match(/\bt:(\d+)\b/)
    const engineScore = scoreMatch ? parseInt(scoreMatch[1], 10) : undefined
    const engineTime = timeMatch ? parseInt(timeMatch[1], 10) : undefined

    // Increment fullmove after black's move (since fen stores side to move)
    if (sideToMoveLocal === 'b') {
      fullmoveNumber++
    }
    // Toggle side to move for fen after this move
    sideToMoveLocal = sideToMoveLocal === 'w' ? 'b' : 'w'

    // Snapshot fen AFTER the move, to match app semantics
    const fenAfter = generateCurrentFen()

    moves.push({
      type: 'move',
      data: moveUci,
      fen: fenAfter,
      comment: comment || undefined,
      engineScore,
      engineTime,
    })
  }

  // Initial FEN (before any move) for metadata
  const initialHiddenPart = buildHiddenPart(initialHiddenCounts)
  const initialSide = header.WhoPlay === 1 ? 'b' : 'w'
  const initialFen = `${boardToFenPosition(initialHiddenBoard)} ${initialSide} ${initialHiddenPart} 0 ${fullmoveStart}`

  // Build metadata
  const event = header.MatchName || '揭棋对局'
  const date = header.MatchTime || new Date().toISOString().split('T')[0]
  const redPlayer = header.RedPlayer || '红方'
  const blackPlayer = header.BlkPlayer || '黑方'

  return {
    metadata: {
      event,
      site: 'jieqibox',
      date,
      white: redPlayer,
      black: blackPlayer,
      result: '*',
      initialFen,
      flipMode: opts?.flipMode ?? 'random',
      currentFen: moves.length > 0 ? moves[moves.length - 1].fen : initialFen,
    },
    moves,
  }
}