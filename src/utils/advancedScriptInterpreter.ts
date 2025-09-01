/**
 * Safe mini-interpreter for advanced analysis scripts
 * Supports only whitelisted operations to prevent arbitrary code execution
 */

export interface AdvLimits {
  movetime?: number
  depth?: number
  nodes?: number
  maxThinkTime?: number
}

export interface PrevContext {
  exists(): boolean
  movetime: number
  depth: number
  nodes: number
  score: number
  timeUsed: number
  prev: PrevContext
}

/**
 * Evaluate user-provided advanced script in a safe, whitelisted mini-interpreter.
 * Supports:
 * - assignments: movetime=..., depth=..., nodes=..., maxThinkTime=...
 * - numeric expressions: + - * / % & | ^ ~ ! parentheses
 * - comparisons and logical ops: < <= > >= == != && ||
 * - if/else blocks with braces
 * - prev chains: prev.movetime, prev.prev.score, etc. (up to depth 10)
 */
export function evaluateAdvancedScript(
  code: string,
  prevCtx: PrevContext
): AdvLimits {
  const input = String(code || '')
  let i = 0

  const peek = () => input[i] || ''
  const next = () => input[i++] || ''
  const isWhitespace = (ch: string) =>
    ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n'
  const isAlpha = (ch: string) => /[A-Za-z_]/.test(ch)
  const isDigit = (ch: string) => /[0-9]/.test(ch)

  const skipSpacesAndComments = () => {
    while (i < input.length) {
      if (isWhitespace(peek())) {
        i++
        continue
      }
      if (peek() === '#') {
        while (i < input.length && next() !== '\n') {
          /*skip*/
        }
        continue
      }
      if (peek() === '/' && input[i + 1] === '/') {
        while (i < input.length && next() !== '\n') {
          /*skip*/
        }
        continue
      }
      break
    }
  }

  type Tok = { type: string; value?: string }
  const readNumber = (): Tok => {
    let s = ''
    while (isDigit(peek())) s += next()
    if (peek() === '.') {
      s += next()
      while (isDigit(peek())) s += next()
    }
    return { type: 'num', value: s }
  }
  const readIdent = (): Tok => {
    let s = ''
    if (isAlpha(peek())) s += next()
    while (isAlpha(peek()) || isDigit(peek())) s += next()
    return { type: 'id', value: s }
  }
  const readOp = (): Tok => {
    const two = input.slice(i, i + 2)
    const three = input.slice(i, i + 3)
    const ops3 = ['>>>']
    const ops2 = ['&&', '||', '==', '!=', '<=', '>=']
    // single-char ops are handled by default fallback below
    if (ops3.includes(three)) {
      i += 3
      return { type: 'op', value: three }
    }
    if (ops2.includes(two)) {
      i += 2
      return { type: 'op', value: two }
    }
    const ch = next()
    return { type: 'op', value: ch }
  }
  const tokens: Tok[] = []
  while (i < input.length) {
    skipSpacesAndComments()
    if (i >= input.length) break
    const ch = peek()
    if (isDigit(ch)) tokens.push(readNumber())
    else if (isAlpha(ch)) tokens.push(readIdent())
    else tokens.push(readOp())
  }
  tokens.push({ type: 'eof' })

  let p = 0
  const cur: () => Tok = () => tokens[p]
  const eat: (t?: string, v?: string) => Tok = (t?: string, v?: string) => {
    const tok = cur()
    if (t && tok.type !== t)
      throw new Error(`Unexpected token ${tok.type}, expected ${t}`)
    if (v && tok.value !== v)
      throw new Error(`Unexpected token value ${tok.value}, expected ${v}`)
    p++
    return tok
  }
  const advance: () => void = () => {
    p++
  }
  const isTok: (t: string, v?: string) => boolean = (t: string, v?: string) =>
    cur().type === t && (v ? cur().value === v : true)

  // Expression parser (Pratt)
  const PRECEDENCE: Record<string, number> = {
    '||': 1,
    '&&': 2,
    '==': 3,
    '!=': 3,
    '<': 4,
    '<=': 4,
    '>': 4,
    '>=': 4,
    '+': 5,
    '-': 5,
    '*': 6,
    '/': 6,
    '%': 6,
  }

  const parsePrimary = (): any => {
    if (isTok('op', '(')) {
      eat('op', '(')
      const val = parseExpr()
      eat('op', ')')
      return val
    }
    if (isTok('op', '!')) {
      eat('op', '!')
      const v = parsePrimary()
      return !toBool(v) ? 1 : 0
    }
    if (isTok('op', '~')) {
      eat('op', '~')
      const v = parsePrimary()
      return ~toNum(v)
    }
    if (isTok('op', '+')) {
      eat('op', '+')
      const v = parsePrimary()
      return +toNum(v)
    }
    if (isTok('op', '-')) {
      eat('op', '-')
      const v = parsePrimary()
      return -toNum(v)
    }
    if (isTok('num')) {
      return +eat('num').value!
    }
    if (isTok('id')) {
      const id = eat('id').value!
      if (id === 'prev') {
        // prev chain
        let obj: any = prevCtx
        let depth = 0
        while (isTok('op', '.')) {
          eat('op', '.')
          const prop = eat('id').value!
          depth++
          if (depth > 10) throw new Error('prev chain too deep')
          if (prop === 'prev') {
            obj = obj?.prev
          } else if (prop === 'exists') {
            // Support prev.prev.exists or prev.prev.exists()
            // Optional zero-arg call syntax
            if (isTok('op', '(')) {
              eat('op', '(')
              eat('op', ')')
            }
            const existsVal =
              typeof obj?.exists === 'function'
                ? obj.exists()
                  ? 1
                  : 0
                : obj && (obj as any).exists
                  ? 1
                  : 0
            obj = existsVal
            // After exists, further property access is meaningless
            break
          } else if (
            ['movetime', 'depth', 'nodes', 'score', 'timeUsed'].includes(prop)
          ) {
            obj = obj?.[prop]
          } else {
            // Disallow any other properties
            obj = undefined
          }
        }
        return toNum(obj)
      }
      // allowed variables
      if (['movetime', 'depth', 'nodes', 'maxThinkTime'].includes(id)) {
        return toNum(env[id as keyof AdvLimits])
      }
      // Unknown identifier -> treat as 0
      return 0
    }
    throw new Error('Invalid expression')
  }

  const parseBinary = (left: any, minPrec: number): any => {
    while (true) {
      const op = cur().type === 'op' ? cur().value || '' : ''
      const prec = PRECEDENCE[op]
      if (!prec || prec < minPrec) break
      eat('op')
      let right = parsePrimary()
      while (true) {
        const nextOp = cur().type === 'op' ? cur().value || '' : ''
        const nextPrec = PRECEDENCE[nextOp]
        if (!nextPrec || nextPrec <= prec) break
        right = parseBinary(right, nextPrec)
      }
      left = applyBinary(op, left, right)
    }
    return left
  }
  const parseExpr = (): any => {
    const left = parsePrimary()
    return parseBinary(left, 1)
  }

  const applyBinary = (op: string, a: any, b: any): any => {
    const A = toNum(a)
    const B = toNum(b)
    switch (op) {
      case '||':
        return toBool(A) || toBool(B) ? 1 : 0
      case '&&':
        return toBool(A) && toBool(B) ? 1 : 0
      case '==':
        return A === B ? 1 : 0
      case '!=':
        return A !== B ? 1 : 0
      case '<':
        return A < B ? 1 : 0
      case '<=':
        return A <= B ? 1 : 0
      case '>':
        return A > B ? 1 : 0
      case '>=':
        return A >= B ? 1 : 0
      case '+':
        return A + B
      case '-':
        return A - B
      case '*':
        return A * B
      case '/':
        return B === 0 ? 0 : A / B
      case '%':
        return B === 0 ? 0 : A % B
      case '&':
        return (A | 0) & (B | 0)
      case '|':
        return A | 0 | (B | 0)
      case '^':
        return (A | 0) ^ (B | 0)
      default:
        throw new Error('Unsupported operator')
    }
  }

  const toNum = (v: any): number => {
    const n = typeof v === 'number' ? v : Number(v || 0)
    return isFinite(n) ? n : 0
  }
  const toBool = (v: any): boolean => toNum(v) !== 0

  const env: AdvLimits = {}

  const parseStatement = (): void => {
    if (isTok('id', 'if')) {
      eat('id', 'if')
      eat('op', '(')
      const cond = parseExpr()
      eat('op', ')')
      const thenBlock = parseBlock()
      let elseBlock: (() => void) | null = null
      if (isTok('id', 'else')) {
        eat('id', 'else')
        elseBlock = parseBlock()
      }
      if (toBool(cond)) thenBlock()
      else if (elseBlock) elseBlock()
      // Optional semicolon after block (tolerate)
      if (isTok('op', ';')) eat('op', ';')
      return
    }
    // assignment: identifier '=' expr
    if (isTok('id')) {
      const id = eat('id').value!
      if (!['movetime', 'depth', 'nodes', 'maxThinkTime'].includes(id)) {
        // ignore unknown target
        // consume until EOL or ';'
        while (!isTok('eof') && !isTok('op', ';') && !isTok('op', '}'))
          advance()
        if (isTok('op', ';')) {
          advance()
        }
        return
      }
      eat('op', '=')
      const value = parseExpr()
      if (isTok('op', ';')) {
        advance()
      }
      ;(env as any)[id] = toNum(value)
      return
    }
    // skip stray tokens
    if (!isTok('eof')) advance()
  }

  const parseBlock = (): (() => void) => {
    if (isTok('op', '{')) {
      eat('op', '{')
      const fns: Array<() => void> = []
      while (!isTok('eof') && !isTok('op', '}')) {
        const start = p
        fns.push(() => {
          p = start
          parseStatement()
        })
        // advance tokens for this pass
        parseStatement()
      }
      eat('op', '}')
      return () => {
        for (const fn of fns) fn()
      }
    } else {
      // single statement as block
      const start = p
      const fn = () => {
        p = start
        parseStatement()
      }
      // consume once
      parseStatement()
      return fn
    }
  }

  // Parse all statements
  try {
    while (!isTok('eof')) {
      parseStatement()
    }
  } catch (_) {
    // On any parse/eval error, return empty limits so caller can fallback
    return {}
  }

  return env
}
