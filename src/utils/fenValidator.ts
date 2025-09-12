/**
 * Validates a Jieqi FEN string according to both new and old formats.
 *
 * New Format: [Board] [Side to Move] [Dark Piece Pool] [Captured Dark Piece Pool] [Halfmove Clock] [Fullmove Number]
 * Old Format: [Board] [Dark Piece Pool] [Side to Move] [Castling] [En Passant] [Halfmove Clock] [Fullmove Number]
 *
 * Also handles formats with "position fen" prefix and "moves" suffix as used in the existing code.
 *
 * @param fen - The FEN string to validate
 * @returns boolean - Whether the FEN is valid
 */
export function validateJieqiFen(fen: string): boolean {
  if (!fen || typeof fen !== 'string') {
    return false
  }

  // Trim whitespace
  let trimmedFen = fen.trim()
  if (!trimmedFen) {
    return false
  }

  // Remove "position fen " or "fen " prefix if present
  if (trimmedFen.startsWith('position fen ')) {
    trimmedFen = trimmedFen.substring(13) // "position fen " length is 13
  } else if (trimmedFen.startsWith('fen ')) {
    trimmedFen = trimmedFen.substring(4) // "fen " length is 4
  } else if (trimmedFen.startsWith('position ')) {
    trimmedFen = trimmedFen.substring(9) // "position " length is 9
  }

  // Replace "startpos" with the actual start FEN
  if (trimmedFen.startsWith('startpos')) {
    if (trimmedFen === 'startpos') {
      trimmedFen =
        'xxxxkxxxx/9/1x5x1/x1x1x1x1x/9/9/X1X1X1X1X/1X5X1/9/XXXXKXXXX w A2B2N2R2C2P5a2b2n2r2c2p5 - 0 1'
    } else if (trimmedFen.startsWith('startpos ')) {
      // If there are additional parts after "startpos", keep them
      const remainingPart = trimmedFen.substring(9) // "startpos " length is 9
      // Check if the remaining part contains "moves"
      if (remainingPart.startsWith('moves ')) {
        // For "startpos moves ..." format, we need to handle it specially
        trimmedFen =
          'xxxxkxxxx/9/1x5x1/x1x1x1x1x/9/9/X1X1X1X1X/1X5X1/9/XXXXKXXXX w A2B2N2R2C2P5a2b2n2r2c2p5 - 0 1 ' +
          remainingPart
      } else {
        // For other formats, just append
        trimmedFen =
          'xxxxkxxxx/9/1x5x1/x1x1x1x1x/9/9/X1X1X1X1X/1X5X1/9/XXXXKXXXX w A2B2N2R2C2P5a2b2n2r2c2p5 - 0 1' +
          remainingPart
      }
    }
  }

  // Check if contains move history information
  const movesIndex = trimmedFen.indexOf(' moves ')
  let fenPart: string

  if (movesIndex !== -1) {
    // Separate FEN part and move history part
    fenPart = trimmedFen.substring(0, movesIndex).trim()
  } else {
    fenPart = trimmedFen
  }

  // Split into parts
  const parts = fenPart.split(' ')
  if (parts.length < 2) {
    return false // Minimum requirement: board and side to move
  }

  // Detect format: if second part is 'w' or 'b', it's new format
  const isNewFormat =
    parts.length >= 2 && (parts[1] === 'w' || parts[1] === 'b')

  try {
    if (isNewFormat) {
      return validateNewFormat(parts)
    } else {
      return validateOldFormat(parts)
    }
  } catch (error) {
    console.error('FEN validation error:', error)
    return false
  }
}

/**
 * Validates the new FEN format
 */
function validateNewFormat(parts: string[]): boolean {
  let boardPart: string,
    sidePart: string,
    hiddenPart: string = '-',
    capturedHiddenPart: string = '-',
    halfmove: string = '0',
    fullmove: string = '1'

  // New FEN format parsing (matching the logic in useChessGame.ts)
  if (parts.length >= 6) {
    // Format: board color hiddenPart capturedHiddenPart halfmove fullmove
    ;[boardPart, sidePart, hiddenPart, capturedHiddenPart, halfmove, fullmove] =
      parts
  } else if (parts.length === 5) {
    // Format: board color hiddenPart halfmove fullmove (no captured hidden)
    ;[boardPart, sidePart, hiddenPart, halfmove, fullmove] = parts
    capturedHiddenPart = '-'
  } else if (parts.length === 4) {
    // Format: board color hiddenPart capturedHiddenPart (missing moves)
    ;[boardPart, sidePart, hiddenPart, capturedHiddenPart] = parts
    halfmove = '0'
    fullmove = '1'
  } else if (parts.length === 3) {
    // Format: board color hiddenPart (missing captured and moves)
    ;[boardPart, sidePart, hiddenPart] = parts
    capturedHiddenPart = '-'
    halfmove = '0'
    fullmove = '1'
  } else if (parts.length === 2) {
    // Format: board color (minimal)
    ;[boardPart, sidePart] = parts
    hiddenPart = '-'
    capturedHiddenPart = '-'
    halfmove = '0'
    fullmove = '1'
  } else {
    // Not enough parts
    return false
  }

  // Validate board part (required)
  if (!validateBoardPart(boardPart)) {
    return false
  }

  // Validate side to move (required)
  if (!validateSideToMove(sidePart)) {
    return false
  }

  // Validate dark piece pool (optional, defaults to '-')
  if (hiddenPart !== undefined && !validateDarkPiecePool(hiddenPart)) {
    return false
  }

  // Validate captured dark piece pool (optional, defaults to '-')
  if (
    capturedHiddenPart !== undefined &&
    !validateCapturedDarkPiecePool(capturedHiddenPart)
  ) {
    return false
  }

  // Validate halfmove clock (optional, defaults to 0)
  if (halfmove !== undefined && !validateHalfmoveClock(halfmove)) {
    return false
  }

  // Validate fullmove number (optional, defaults to 1)
  if (fullmove !== undefined && !validateFullmoveNumber(fullmove)) {
    return false
  }

  return true
}

/**
 * Validates the old FEN format
 */
function validateOldFormat(parts: string[]): boolean {
  // Old format can have different arrangements:
  // Minimum: board side
  // With pool: board hiddenPart side
  // Full: board hiddenPart side castling enpassant halfmove fullmove

  const boardPart = parts[0]
  let sidePart: string
  let hiddenPart = '-'

  // Validate board part (required)
  if (!validateBoardPart(boardPart)) {
    return false
  }

  if (parts.length === 2) {
    // board side
    sidePart = parts[1]
  } else if (parts.length >= 3) {
    // board hiddenPart side [...]
    hiddenPart = parts[1]
    sidePart = parts[2]

    // Validate dark piece pool
    if (!validateDarkPiecePool(hiddenPart)) {
      return false
    }
  } else {
    return false
  }

  // Validate side to move
  if (!validateSideToMove(sidePart)) {
    return false
  }

  // For full old format (7 parts)
  if (parts.length === 7) {
    const [, , , castlingPart, enPassantPart, halfmove, fullmove] = parts

    // Validate castling (placeholder, should be '-')
    if (castlingPart !== undefined && castlingPart !== '-') {
      // In old format, castling is just a placeholder
    }

    // Validate en passant (placeholder, should be '-')
    if (enPassantPart !== undefined && enPassantPart !== '-') {
      // In old format, en passant is just a placeholder
    }

    // Validate halfmove clock
    if (halfmove !== undefined && !validateHalfmoveClock(halfmove)) {
      return false
    }

    // Validate fullmove number
    if (fullmove !== undefined && !validateFullmoveNumber(fullmove)) {
      return false
    }
  } else if (parts.length === 6) {
    // board hiddenPart side castling enpassant halfmove
    const [, , , castlingPart, enPassantPart, halfmove] = parts

    // Validate castling (placeholder)
    if (castlingPart !== undefined && castlingPart !== '-') {
      // In old format, castling is just a placeholder
    }

    // Validate en passant (placeholder)
    if (enPassantPart !== undefined && enPassantPart !== '-') {
      // In old format, en passant is just a placeholder
    }

    // Validate halfmove clock
    if (halfmove !== undefined && !validateHalfmoveClock(halfmove)) {
      return false
    }
  }

  return true
}

/**
 * Validates the board part of the FEN string
 */
function validateBoardPart(boardPart: string): boolean {
  if (!boardPart || typeof boardPart !== 'string') {
    return false
  }

  const rows = boardPart.split('/')
  if (rows.length !== 10) {
    return false // Jieqi board has 10 rows
  }

  // Valid characters: X (red dark), x (black dark), numbers 1-9 (empty), and piece letters
  const validChars = /^[Xx1-9RNBAKCPrnbackcp]+$/

  for (const row of rows) {
    if (!row) {
      return false // Empty row
    }

    // Check each character
    let colCount = 0
    for (let i = 0; i < row.length; i++) {
      const char = row[i]

      if (/\d/.test(char)) {
        // Number represents empty squares
        const num = parseInt(char, 10)
        if (num < 1 || num > 9) {
          return false // Invalid number
        }
        colCount += num
      } else if (validChars.test(char)) {
        // Valid piece character
        colCount += 1

        // Validate piece letters
        if (/[RNBAKCP]/.test(char)) {
          // Red pieces (uppercase)
          // Valid
        } else if (/[rnbackcp]/.test(char)) {
          // Black pieces (lowercase)
          // Valid
        } else if (char === 'X' || char === 'x') {
          // Dark pieces
          // Valid
        } else {
          return false // Invalid character
        }
      } else {
        return false // Invalid character
      }
    }

    if (colCount !== 9) {
      return false // Each row should have exactly 9 columns
    }
  }

  return true
}

/**
 * Validates the side to move part
 */
function validateSideToMove(sidePart: string): boolean {
  return sidePart === 'w' || sidePart === 'b'
}

/**
 * Validates the dark piece pool part
 */
function validateDarkPiecePool(hiddenPart: string): boolean {
  if (hiddenPart === '-') {
    return true // Empty pool is valid
  }

  // Allow empty string (no pieces)
  if (hiddenPart === '') {
    return true
  }

  // Check if it matches the pattern: letter followed by number, repeated
  // e.g., "R2N2B2A2K1C2P5r2n2b2a2k1c2p5"
  const pattern = /^[RNBAKCPrnbackcp]\d+([RNBAKCPrnbackcp]\d+)*$/

  if (!pattern.test(hiddenPart)) {
    return false
  }

  // Validate that each piece type appears only once
  const pieceTypes: { [key: string]: boolean } = {}

  // Use a loop to process each piece type and count pair
  let i = 0
  while (i < hiddenPart.length) {
    const char = hiddenPart[i]

    // Check if it's a valid piece character
    if (!/[RNBAKCPrnbackcp]/.test(char)) {
      return false
    }

    // Check for duplicate piece types
    if (pieceTypes[char]) {
      return false // Duplicate piece type
    }
    pieceTypes[char] = true

    // Move to the number part
    i++

    // Extract the number
    let numStr = ''
    while (i < hiddenPart.length && /\d/.test(hiddenPart[i])) {
      numStr += hiddenPart[i]
      i++
    }

    // Validate the number
    if (numStr === '') {
      return false // Missing count
    }

    const count = parseInt(numStr, 10)
    if (isNaN(count) || count < 0) {
      return false
    }
  }

  return true
}

/**
 * Validates the captured dark piece pool part
 */
function validateCapturedDarkPiecePool(capturedHiddenPart: string): boolean {
  // Same validation as dark piece pool
  return validateDarkPiecePool(capturedHiddenPart)
}

/**
 * Validates the halfmove clock part
 */
function validateHalfmoveClock(halfmove: string): boolean {
  const num = parseInt(halfmove, 10)
  return !isNaN(num) && num >= 0
}

/**
 * Validates the fullmove number part
 */
function validateFullmoveNumber(fullmove: string): boolean {
  const num = parseInt(fullmove, 10)
  return !isNaN(num) && num >= 1
}
