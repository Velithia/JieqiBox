import i18n from '../i18n'

/**
 * Jieqi UCI to Chinese notation converter
 */

type Side = 'w' | 'b'

interface GameState {
  board: string[][] // [rank][file], rank 0 bottom (Red home), file 0 = 'a'
  sideToMove: Side // 'w' (Red) or 'b' (Black)
  pool: Record<string, number> // remaining dark-piece pool counts like { R:2, r:2, ... }
  halfmove: number
  fullmove: number
}

const FILES = 'abcdefghi'
const RED_FILE_NUM = ['九', '八', '七', '六', '五', '四', '三', '二', '一'] // index 0..8
const RED_STEPS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'] // use 1..9
const FW_DIGITS = ['０', '１', '２', '３', '４', '５', '６', '７', '８', '９'] // full-width, use 1..9

const TRADITIONAL_MAP: Record<string, string> = {
  马: '馬',
  车: '車',
  帅: '帥',
  将: '將',
  进: '進',
  后: '後',
}

function toTraditional(text: string): string {
  // Check if current locale is traditional Chinese
  // @ts-ignore
  const locale = i18n.global.locale.value
  if (locale !== 'zh_tw') return text
  return text
    .split('')
    .map(char => TRADITIONAL_MAP[char] || char)
    .join('')
}

// ----- Chinese names -----
function cnName(letter: string): string {
  const L = letter
  switch (L) {
    case 'R':
    case 'r':
      return '车'
    case 'N':
    case 'n':
      return '马'
    case 'B':
      return '相'
    case 'b':
      return '象'
    case 'A':
      return '仕'
    case 'a':
      return '士'
    case 'C':
    case 'c':
      return '炮'
    case 'P':
      return '兵'
    case 'p':
      return '卒'
    case 'K':
      return '帅'
    case 'k':
      return '将'
    default:
      return '?'
  }
}

function isUpper(ch: string) {
  return ch >= 'A' && ch <= 'Z'
}
function isLower(ch: string) {
  return ch >= 'a' && ch <= 'z'
}
function isHidden(ch: string) {
  return ch === 'X' || ch === 'x'
}

// ----- Coordinates helpers -----
function fileIdx(fileChar: string): number {
  const i = FILES.indexOf(fileChar)
  if (i < 0) throw new Error(`Bad file: ${fileChar}`)
  return i
}
function rankIdx(rankChar: string): number {
  const n = Number(rankChar)
  if (!(n >= 0 && n <= 9)) throw new Error(`Bad rank: ${rankChar}`)
  return n
}
function redFileNumChar(f: number) {
  return RED_FILE_NUM[f]
} // for Red file
function blackFileNumChar(f: number) {
  return FW_DIGITS[f + 1]
} // '１'..'９'
function redStepChar(n: number) {
  return RED_STEPS[n]
} // '一'..'九'
function blackDigitChar(n: number) {
  return FW_DIGITS[n]
} // '１'..'９'

// ----- Starting-square piece type mapping (by coordinates) -----
const startTypeByKey = (() => {
  // key = `${f},${r}`
  const m = new Map<string, string>()

  // Red (bottom)
  const put = (f: number, r: number, ch: string) => m.set(`${f},${r}`, ch)
  put(0, 0, 'R')
  put(8, 0, 'R')
  put(1, 0, 'N')
  put(7, 0, 'N')
  put(2, 0, 'B')
  put(6, 0, 'B')
  put(3, 0, 'A')
  put(5, 0, 'A')
  put(4, 0, 'K')
  put(1, 2, 'C')
  put(7, 2, 'C')
  ;[0, 2, 4, 6, 8].forEach(f => put(f, 3, 'P'))

  // Black (top)
  put(0, 9, 'r')
  put(8, 9, 'r')
  put(1, 9, 'n')
  put(7, 9, 'n')
  put(2, 9, 'b')
  put(6, 9, 'b')
  put(3, 9, 'a')
  put(5, 9, 'a')
  put(4, 9, 'k')
  put(1, 7, 'c')
  put(7, 7, 'c')
  ;[0, 2, 4, 6, 8].forEach(f => put(f, 6, 'p'))

  return m
})()

function startingTypeAt(f: number, r: number): string | null {
  return startTypeByKey.get(`${f},${r}`) ?? null
}

// ----- FEN parsing / formatting -----
export function parseJieqiFEN(fen: string): GameState {
  const parts = fen.trim().split(/\s+/)
  if (parts.length < 5) throw new Error('Bad FEN: missing fields')
  const [boardStr, sideStr, poolStr, halfStr, fullStr] = parts

  // Parse board: FEN ranks are top→bottom; we store bottom→top
  const board: string[][] = Array.from({ length: 10 }, () => Array(9).fill('.'))
  const ranks = boardStr.split('/')
  if (ranks.length !== 10) throw new Error('Bad FEN board (need 10 ranks)')
  for (let rTop = 0; rTop < 10; rTop++) {
    const row = ranks[rTop]
    let f = 0
    for (const ch of row) {
      if (/\d/.test(ch)) {
        f += Number(ch)
      } else {
        const r = 9 - rTop // convert to bottom-based rank
        if (f > 8) throw new Error('Bad FEN row overflow')
        board[r][f] = ch
        f++
      }
    }
    if (f !== 9) throw new Error('Bad FEN row width')
  }

  // Parse side
  const sideToMove: Side =
    sideStr === 'w'
      ? 'w'
      : sideStr === 'b'
        ? 'b'
        : (() => {
            throw new Error('Bad FEN side')
          })()

  // Parse pool like "R2r2N2n2...P5p5"
  const pool: Record<string, number> = {}
  const re = /([A-Za-z])(\d+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(poolStr))) {
    pool[m[1]] = Number(m[2])
  }

  const halfmove = Number(halfStr) || 0
  const fullmove = Number(fullStr) || 1

  return { board, sideToMove, pool, halfmove, fullmove }
}

// ----- Disambiguation on same file (前/中/后 / 前中后二三四五 for pawns) -----
function fileLabelForMove(
  state: GameState,
  fromF: number,
  fromR: number,
  notationLetter: string
): { useLabel: boolean; labelOrFileNum: string; prefixIsLabel: boolean } {
  const side: Side = isUpper(notationLetter) ? 'w' : 'b'

  // Collect same-type pieces on this file BEFORE the move.
  const sameFileSameType: number[] = []
  for (let r = 0; r <= 9; r++) {
    const ch = state.board[r][fromF]
    if (ch === '.') continue
    if (isHidden(ch)) {
      const st = startingTypeAt(fromF, r)
      if (!st) continue
      if (st === notationLetter) sameFileSameType.push(r)
    } else if (ch === notationLetter) {
      sameFileSameType.push(r)
    }
  }

  // If unique on this file, use file number.
  if (sameFileSameType.length <= 1) {
    const num = side === 'w' ? redFileNumChar(fromF) : blackFileNumChar(fromF)
    return { useLabel: false, labelOrFileNum: num, prefixIsLabel: false }
  }

  // Sort by "frontness": Red front = higher rank; Black front = lower rank.
  const sorted = sameFileSameType
    .slice()
    .sort((a, b) => (side === 'w' ? b - a : a - b))
  const idx = sorted.indexOf(fromR)
  const count = sorted.length
  const isPawn = notationLetter.toLowerCase() === 'p'

  if (!isPawn) {
    // Non-pawn pieces in Jieqi can be up to 3 on the same file.
    // 2 => 前/后; 3 => 前/中/后; fallback for 4+ => 前/中/后 heuristic.
    let label = ''
    if (count === 2) {
      label = idx === 0 ? '前' : '后'
    } else if (count === 3) {
      label = ['前', '中', '后'][idx] ?? '中'
    } else {
      // Fallback (should be rare/impossible for non-pawns): map to 前/中/后 by position.
      label = idx === 0 ? '前' : idx === count - 1 ? '后' : '中'
    }
    return { useLabel: true, labelOrFileNum: label, prefixIsLabel: true }
  }

  // Pawn special labelling: support up to 6 on a file in Jieqi.
  let label = ''
  if (count === 2) {
    label = idx === 0 ? '前' : '后'
  } else if (count === 3) {
    label = ['前', '中', '后'][idx] ?? '中'
  } else if (count === 4) {
    label = ['前', '二', '三', '后'][idx] ?? '二'
  } else if (count === 5) {
    label = ['前', '二', '三', '四', '后'][idx] ?? '二'
  } else if (count === 6) {
    label = ['前', '二', '三', '四', '五', '后'][idx] ?? '二'
  } else {
    // 7+ extremely unlikely; use a robust fallback.
    label = idx === 0 ? '前' : idx === count - 1 ? '后' : '中'
  }
  return { useLabel: true, labelOrFileNum: label, prefixIsLabel: true }
}

// ----- Main conversion -----
function sideOf(state: GameState): Side {
  return state.sideToMove
}

function moveDirection(
  side: Side,
  fromR: number,
  toR: number
): '平' | '进' | '退' {
  if (fromR === toR) return '平'
  if (side === 'w') return toR > fromR ? '进' : '退'
  return toR < fromR ? '进' : '退'
}

function fourthChar(
  _state: GameState,
  pieceLetter: string,
  side: Side,
  dir: '平' | '进' | '退',
  _fromF: number,
  toF: number,
  fromR: number,
  toR: number
): string {
  if (dir === '平') {
    return side === 'w' ? redFileNumChar(toF) : blackFileNumChar(toF)
  }
  const t = pieceLetter.toLowerCase()
  if (t === 'r' || t === 'c' || t === 'p' || t === 'k') {
    const steps = Math.abs(toR - fromR)
    return side === 'w' ? redStepChar(steps) : blackDigitChar(steps)
  }
  // N, B, A use destination file number for 进/退
  return side === 'w' ? redFileNumChar(toF) : blackFileNumChar(toF)
}

function pieceLetterForNotation(
  state: GameState,
  fromF: number,
  fromR: number
): string {
  const ch = state.board[fromR][fromF]
  if (isHidden(ch)) {
    const st = startingTypeAt(fromF, fromR)
    if (!st)
      throw new Error(`Hidden piece on a non-start square at ${fromF},${fromR}`)
    return st
  }
  if (ch === '.') throw new Error('No piece on from-square')
  return ch
}

function applyMoveOnBoard(
  state: GameState,
  fromF: number,
  fromR: number,
  toF: number,
  toR: number,
  flipChar: string | null,
  capChar: string | null
) {
  // Remove captured piece (if any) on destination
  const dest = state.board[toR][toF]
  if (dest !== '.') {
    // If captured a hidden piece and UCI specified its identity, reduce opponent pool
    if (isHidden(dest) && capChar) {
      state.pool[capChar] = (state.pool[capChar] ?? 0) - 1
      if (state.pool[capChar] < 0) state.pool[capChar] = 0
    }
    // If captured a revealed piece, nothing to do with pools
  }

  // Move/flip the mover
  const src = state.board[fromR][fromF]
  let placed: string
  if (flipChar) {
    // Flipped: consume from mover's pool
    placed = flipChar
    state.pool[flipChar] = (state.pool[flipChar] ?? 0) - 1
    if (state.pool[flipChar] < 0) state.pool[flipChar] = 0
  } else {
    if (isHidden(src)) {
      // In Jieqi rules, a hidden piece must flip when it moves; if we arrive here it means
      // UCI omitted flip info. We still place a placeholder reveal by using starting type,
      // but DO NOT change pool (since unknown). This keeps the board consistent for next moves.
      const st = startingTypeAt(fromF, fromR)
      placed = st ?? src // fallback
    } else {
      placed = src // revealed piece moves as-is
    }
  }

  state.board[toR][toF] = placed
  state.board[fromR][fromF] = '.'

  // Toggle side / move counters
  state.sideToMove = state.sideToMove === 'w' ? 'b' : 'w'
  state.halfmove += 1
  if (state.sideToMove === 'w') state.fullmove += 1
}

function parseFlipAndCaptureLetters(
  move: string,
  moverSide: Side
): { flip: string | null; cap: string | null } {
  if (move.length === 4) return { flip: null, cap: null }
  if (move.length === 5) {
    const L = move[4]
    if (moverSide === 'w') {
      return isUpper(L) ? { flip: L, cap: null } : { flip: null, cap: L }
    } else {
      return isLower(L) ? { flip: L, cap: null } : { flip: null, cap: L }
    }
  }
  if (move.length === 6) {
    const L1 = move[4],
      L2 = move[5]
    // By spec: first is flip (same color as mover), second is captured (opponent)
    return { flip: L1, cap: L2 }
  }
  throw new Error(`Bad UCI move length: ${move}`)
}

function composeChineseNotation(
  state: GameState,
  fromF: number,
  fromR: number,
  toF: number,
  toR: number,
  notationLetter: string,
  extraFlip: string | null,
  extraCap: string | null
): string {
  const side = isUpper(notationLetter) ? 'w' : 'b'
  const pieceName = cnName(notationLetter)

  // Second "word": either file-number OR label (前/后/中/…)
  const lab = fileLabelForMove(state, fromF, fromR, notationLetter)
  const dir = moveDirection(side, fromR, toR)
  const fourth = fourthChar(
    state,
    notationLetter,
    side,
    dir,
    fromF,
    toF,
    fromR,
    toR
  )

  let core = ''
  if (lab.useLabel && lab.prefixIsLabel) {
    // e.g., "前炮进四" / "后马退六" / "中兵平五"
    core = `${lab.labelOrFileNum}${pieceName}${dir}${fourth}`
  } else {
    // e.g., "炮二平五" / "车九进一"
    core = `${pieceName}${lab.labelOrFileNum}${dir}${fourth}`
  }

  // Append extras only if UCI explicitly contains them
  const extras: string[] = []
  if (extraFlip) extras.push(`翻${cnName(extraFlip)}`)
  if (extraCap) extras.push(`吃${cnName(extraCap)}`)
  if (extras.length) core += extras.join('')

  return toTraditional(core)
}

/**
 * Convert a space-separated UCI move string or array into Chinese notation strings.
 * Updates internal state as it goes (including flips/captures and pools).
 */
export function uciToChineseMoves(
  fen: string,
  moves: string | string[]
): string[] {
  const state = parseJieqiFEN(fen)
  const list = Array.isArray(moves)
    ? moves
    : moves.trim().split(/\s+/).filter(Boolean)
  const out: string[] = []

  for (const mv of list) {
    if (!(mv.length === 4 || mv.length === 5 || mv.length === 6)) {
      throw new Error(`Bad UCI move: ${mv}`)
    }
    const fromF = fileIdx(mv[0])
    const fromR = rankIdx(mv[1])
    const toF = fileIdx(mv[2])
    const toR = rankIdx(mv[3])

    // Determine the piece used for notation (before making the move)
    const notationLetter = pieceLetterForNotation(state, fromF, fromR)

    // Parse extra letters (flip/cap) from UCI (if any)
    const { flip, cap } = parseFlipAndCaptureLetters(mv, sideOf(state))

    // Compose notation BEFORE mutating the board (since disambiguation needs pre-move positions)
    const note = composeChineseNotation(
      state,
      fromF,
      fromR,
      toF,
      toR,
      notationLetter,
      flip,
      cap
    )
    out.push(note)

    // Apply the move to the board
    applyMoveOnBoard(state, fromF, fromR, toF, toR, flip, cap)
  }

  return out
}
