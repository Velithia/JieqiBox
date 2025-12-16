// Centralized chess piece image resolver to keep Vite asset bundling working
// even when piece names/styles are determined at runtime.
import blackAdvisor from '@/assets/black_advisor.svg'
import blackCannon from '@/assets/black_cannon.svg'
import blackChariot from '@/assets/black_chariot.svg'
import blackElephant from '@/assets/black_elephant.svg'
import blackHorse from '@/assets/black_horse.svg'
import blackKing from '@/assets/black_king.svg'
import blackPawn from '@/assets/black_pawn.svg'
import redAdvisor from '@/assets/red_advisor.svg'
import redCannon from '@/assets/red_cannon.svg'
import redChariot from '@/assets/red_chariot.svg'
import redElephant from '@/assets/red_elephant.svg'
import redHorse from '@/assets/red_horse.svg'
import redKing from '@/assets/red_king.svg'
import redPawn from '@/assets/red_pawn.svg'
import darkPiece from '@/assets/dark_piece.svg'

import intlBlackAdvisor from '@/assets/internationalized/black_advisor.svg'
import intlBlackCannon from '@/assets/internationalized/black_cannon.svg'
import intlBlackChariot from '@/assets/internationalized/black_chariot.svg'
import intlBlackElephant from '@/assets/internationalized/black_elephant.svg'
import intlBlackHorse from '@/assets/internationalized/black_horse.svg'
import intlBlackKing from '@/assets/internationalized/black_king.svg'
import intlBlackPawn from '@/assets/internationalized/black_pawn.svg'
import intlRedAdvisor from '@/assets/internationalized/red_advisor.svg'
import intlRedCannon from '@/assets/internationalized/red_cannon.svg'
import intlRedChariot from '@/assets/internationalized/red_chariot.svg'
import intlRedElephant from '@/assets/internationalized/red_elephant.svg'
import intlRedHorse from '@/assets/internationalized/red_horse.svg'
import intlRedKing from '@/assets/internationalized/red_king.svg'
import intlRedPawn from '@/assets/internationalized/red_pawn.svg'

const baseImages: Record<string, string> = {
  black_advisor: blackAdvisor,
  black_cannon: blackCannon,
  black_chariot: blackChariot,
  black_elephant: blackElephant,
  black_horse: blackHorse,
  black_king: blackKing,
  black_pawn: blackPawn,
  red_advisor: redAdvisor,
  red_cannon: redCannon,
  red_chariot: redChariot,
  red_elephant: redElephant,
  red_horse: redHorse,
  red_king: redKing,
  red_pawn: redPawn,
  dark_piece: darkPiece,
}

const internationalizedImages: Record<string, string> = {
  black_advisor: intlBlackAdvisor,
  black_cannon: intlBlackCannon,
  black_chariot: intlBlackChariot,
  black_elephant: intlBlackElephant,
  black_horse: intlBlackHorse,
  black_king: intlBlackKing,
  black_pawn: intlBlackPawn,
  red_advisor: intlRedAdvisor,
  red_cannon: intlRedCannon,
  red_chariot: intlRedChariot,
  red_elephant: intlRedElephant,
  red_horse: intlRedHorse,
  red_king: intlRedKing,
  red_pawn: intlRedPawn,
}

type PieceStyle = 'default' | 'internationalized' | string | undefined

const normalizeName = (name: string | undefined | null) => {
  if (!name) return 'dark_piece'
  if (
    name === 'unknown' ||
    name === 'red_unknown' ||
    name === 'black_unknown'
  ) {
    return 'dark_piece'
  }
  return name
}

export const resolvePieceImage = (name: string, style?: PieceStyle): string => {
  const normalized = normalizeName(name)
  const useIntl = style === 'internationalized'
  const map = useIntl ? internationalizedImages : baseImages

  return (
    map[normalized] ||
    // fall back to default style if internationalized asset is missing
    (!useIntl ? undefined : baseImages[normalized]) ||
    baseImages.dark_piece
  )
}

// Convenience helper for callers that only need the default style
export const resolveDefaultPieceImage = (name: string) =>
  resolvePieceImage(name, 'default')
