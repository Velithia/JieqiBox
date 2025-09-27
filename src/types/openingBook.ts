// Opening book types and interfaces for JieqiBox
export interface MoveData {
  uci_move: string
  priority: number
  wins: number
  draws: number
  losses: number
  allowed: boolean
  comment: string
}

export interface OpeningBookEntry {
  key: string
  fen: string
  moves: MoveData[]
}

export interface OpeningBookStats {
  totalPositions: number
  totalMoves: number
  allowedMoves: number
  disallowedMoves: number
}

export interface OpeningBookImportResult {
  success: boolean
  imported: number
  errors: string[]
  duplicates: number
}

export interface OpeningBookExportOptions {
  format: 'jbb' | 'json' | 'pgn'
  includeComments: boolean
  includeStats: boolean
  onlyAllowedMoves: boolean
}

export interface JieqiOpeningBookConfig {
  dbPath: string
  autoLoad: boolean
  enableInGame: boolean
  showBookMoves: boolean
  preferHighPriority: boolean
}

// Hash generation utilities interface
export interface HashUtilities {
  generateKeyFromFen(fen: string): string
  normalizeFen(fen: string): string
  flipBoard(fenString: string): string
  swapColorsFen(normalizedFen: string): string
}

// Move conversion utilities interface
export interface MoveUtilities {
  uciToInt(uci: string): number
  intToUci(moveInt: number): string
}

// Pool parsing utilities for FEN normalization
export interface PoolParsingResult {
  redPool: Record<string, number>
  blackPool: Record<string, number>
}

export interface FenNormalizationResult {
  normalizedFen: string
  key: string
  variations: string[]
}
