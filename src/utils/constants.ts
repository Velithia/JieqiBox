// Jieqi game constants

/**
 * Standard starting FEN string
 * Format: board layout current side hidden pieces halfmove fullmove (New FEN format)
 */
export const START_FEN =
  'xxxxkxxxx/9/1x5x1/x1x1x1x1x/9/9/X1X1X1X1X/1X5X1/9/XXXXKXXXX w A2B2N2R2C2P5a2b2n2r2c2p5 - 0 1'

/**
 * Piece type mapping table
 */
export const FEN_MAP: { [k: string]: string } = {
  red_chariot: 'R',
  red_horse: 'N',
  red_elephant: 'B',
  red_advisor: 'A',
  red_king: 'K',
  red_cannon: 'C',
  red_pawn: 'P',
  black_chariot: 'r',
  black_horse: 'n',
  black_elephant: 'b',
  black_advisor: 'a',
  black_king: 'k',
  black_cannon: 'c',
  black_pawn: 'p',
}

/**
 * Reverse piece type mapping table
 */
export const REVERSE_FEN_MAP: { [k: string]: string } = {
  R: 'chariot',
  N: 'horse',
  B: 'elephant',
  A: 'advisor',
  K: 'king',
  C: 'cannon',
  P: 'pawn',
  r: 'chariot',
  n: 'horse',
  b: 'elephant',
  a: 'advisor',
  k: 'king',
  c: 'cannon',
  p: 'pawn',
}

/**
 * Initial piece counts
 */
export const INITIAL_PIECE_COUNTS: { [k: string]: number } = {
  R: 2,
  N: 2,
  B: 2,
  A: 2,
  C: 2,
  P: 5,
  K: 1,
  r: 2,
  n: 2,
  b: 2,
  a: 2,
  c: 2,
  p: 5,
  k: 1,
}

/**
 * Language to HTML lang attribute mapping
 */
export const LANGUAGE_TO_HTML_LANG: { [key: string]: string } = {
  zh_cn: 'zh-CN',
  zh_tw: 'zh-TW',
  ja: 'ja-JP',
  en: 'en-US',
  vi: 'vi-VN',
}

/**
 * Base absolute score used to represent mate evaluations.
 * A mate in N plies will be encoded as sign * (MATE_SCORE_BASE - N).
 */
export const MATE_SCORE_BASE = 30000

/**
 * Luck Index (Jieqi win rate model) constants
 */
export const JIEQI_MODEL_FEATURE_DIM = 25

// Piece order: R, N, B, A, C, P, r, n, b, a, c, p
export const JIEQI_MODEL_PIECE_TO_INDEX: Record<string, number> = {
  R: 0,
  N: 1,
  B: 2,
  A: 3,
  C: 4,
  P: 5,
  r: 6,
  n: 7,
  b: 8,
  a: 9,
  c: 10,
  p: 11,
}

export const JIEQI_MODEL_WEIGHTS = [
  0.08772514682756707, -0.24187006347352064, -0.3277591260822385,
  -0.312428548861004, -0.13957569975595147, -0.5124603920014706,
  -0.07820118002491627, 0.21484638534211742, 0.3250864339965009,
  0.2541801314439757, 0.16834379121268697, 0.48605787168400955,
  -0.0006295471076094379, 0.06329823027051631, 0.06209210825092886,
  0.03310532573822678, 0.04841754100544951, -0.019865475136336328,
  0.013743096400146286, -0.04947095317317941, -0.0575693341961395,
  -0.02867090449408315, -0.052352286948066054, 0.04847843129288896,
  -0.0075537611173792036,
]

export const JIEQI_MODEL_INTERCEPT = -0.0597125196819204

export const JIEQI_MODEL_SCALER_MEANS = [
  1.0100588086733773, 0.9824872821733954, 0.9716996788974276, 0.976144604394415,
  0.9974239636324278, 2.419136270159108, 0.9730057365515749, 0.9414799581484288,
  0.9308583179997836, 0.9257278926290724, 0.9482988779449435,
  2.3045712017895155, 5.002417289028394, 4.923108561532634, 4.8646895407150845,
  4.8591478154201395, 4.976534256954216, 3.385792113143558, 5.3134321896309125,
  5.24750153335498, 5.171411047371649, 5.178071219828986, 5.284222679222138,
  4.041461918678068, 14.38089259299347,
]

export const JIEQI_MODEL_SCALER_SCALES = [
  0.790981648494508, 0.7926789915520083, 0.7925629625773608, 0.7959431632239728,
  0.7874895837632937, 1.6042211937577169, 0.7939774680651416, 0.798189505511732,
  0.7989217957150805, 0.7968645359847384, 0.7934708555204867,
  1.6371665393205772, 5.640202636038783, 5.739798544499773, 5.733844115971285,
  5.711851899532759, 5.686190380640218, 3.522031970516342, 5.702074348990358,
  5.8311527974946875, 5.820767759163146, 5.855302986745835, 5.786105625793965,
  3.626781358558223, 8.18111371795009,
]
