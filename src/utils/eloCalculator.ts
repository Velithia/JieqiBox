/**
 * Elo Performance Rating Calculator
 * Based on WLD (Wins-Losses-Draws) statistics
 */

export interface EloRatingResult {
  performance: number
  errorMargin: number
  confidenceInterval: [number, number]
  scoreRate: number
  standardError: number
  totalGames: number
}

/**
 * Calculate Elo performance rating based on WLD statistics
 * @param wins Number of wins
 * @param losses Number of losses
 * @param draws Number of draws
 * @returns EloRatingResult or null if no games played
 */
export function calculateEloRating(
  wins: number,
  losses: number,
  draws: number
): EloRatingResult | null {
  const W = wins
  const L = losses
  const D = draws
  const N = W + L + D

  // If no games played, return null
  if (N === 0) return null

  // Step 1: Calculate average score rate (μ)
  const mu = (W + 0.5 * D) / N

  // Handle edge cases where mu is 0 or 1
  if (mu === 0) {
    // All losses - return negative infinity equivalent
    return {
      performance: -Infinity,
      errorMargin: 0,
      confidenceInterval: [-Infinity, -Infinity],
      scoreRate: mu,
      standardError: 0,
      totalGames: N,
    }
  }

  if (mu === 1) {
    // All wins - return positive infinity equivalent
    return {
      performance: Infinity,
      errorMargin: 0,
      confidenceInterval: [Infinity, Infinity],
      scoreRate: mu,
      standardError: 0,
      totalGames: N,
    }
  }

  // Step 2: Calculate standard error of the mean (σ_μ)
  // First calculate variance of individual game scores
  const variance =
    (W / N) * Math.pow(1 - mu, 2) +
    (L / N) * Math.pow(0 - mu, 2) +
    (D / N) * Math.pow(0.5 - mu, 2)

  // Then calculate standard error
  const sigmaMu = Math.sqrt(variance / N)

  // Step 3: Convert performance to Elo difference
  // ΔElo(P) = -400 × log₁₀(1/P - 1)
  const deltaElo = -400 * Math.log10(1 / mu - 1)

  // Step 4: Calculate 95% confidence interval
  const muMin = mu - 1.959963984540054 * sigmaMu
  const muMax = mu + 1.959963984540054 * sigmaMu

  // Handle edge cases for confidence interval calculation
  let eloMin, eloMax

  if (muMin <= 0) {
    eloMin = -Infinity
  } else if (muMin >= 1) {
    eloMin = Infinity
  } else {
    eloMin = -400 * Math.log10(1 / muMin - 1)
  }

  if (muMax <= 0) {
    eloMax = -Infinity
  } else if (muMax >= 1) {
    eloMax = Infinity
  } else {
    eloMax = -400 * Math.log10(1 / muMax - 1)
  }

  // Calculate error margin (half the width of the confidence interval)
  const errorMargin = (eloMax - eloMin) / 2

  return {
    performance: parseFloat(deltaElo.toFixed(2)),
    errorMargin: parseFloat(errorMargin.toFixed(2)),
    confidenceInterval: [
      parseFloat(eloMin.toFixed(2)),
      parseFloat(eloMax.toFixed(2)),
    ],
    scoreRate: mu,
    standardError: sigmaMu,
    totalGames: N,
  }
}

/**
 * Calculate Elo performance rating based on PTNML pair results.
 * Inputs are pair counts in the order: [LL, LD+DL, LW+DD+WL, DW+WD, WW].
 * This computes the mean per-game score using pair sums only, and derives
 * a standard error from the variance of pair sums (treated as independent pairs).
 */
export function calculateEloRatingFromPTNML(
  ll: number,
  lddl: number,
  center: number,
  dwwd: number,
  ww: number
): EloRatingResult | null {
  const P = (ll || 0) + (lddl || 0) + (center || 0) + (dwwd || 0) + (ww || 0)
  if (P === 0) return null

  // Pair sum scores S_pair can be {0, 0.5, 1, 1.5, 2}
  const sVals = [0, 0.5, 1, 1.5, 2]
  const counts = [ll || 0, lddl || 0, center || 0, dwwd || 0, ww || 0]

  const meanPair = counts.reduce((acc, c, i) => acc + sVals[i] * c, 0) / P
  // Per-game mean
  const mu = meanPair / 2

  // Variance of pair sums, then standard error of per-game mean
  const meanPairSq =
    counts.reduce((acc, c, i) => acc + sVals[i] ** 2 * c, 0) / P
  const varPair = Math.max(meanPairSq - meanPair ** 2, 0)
  const sigmaMu = Math.sqrt(varPair / P) / 2

  // Convert to Elo and 95% CI
  if (mu <= 0) {
    return {
      performance: -Infinity,
      errorMargin: 0,
      confidenceInterval: [-Infinity, -Infinity],
      scoreRate: 0,
      standardError: 0,
      totalGames: 2 * P,
    }
  }
  if (mu >= 1) {
    return {
      performance: Infinity,
      errorMargin: 0,
      confidenceInterval: [Infinity, Infinity],
      scoreRate: 1,
      standardError: 0,
      totalGames: 2 * P,
    }
  }

  const deltaElo = -400 * Math.log10(1 / mu - 1)
  const muMin = mu - 1.959963984540054 * sigmaMu
  const muMax = mu + 1.959963984540054 * sigmaMu

  let eloMin: number, eloMax: number
  if (muMin <= 0) eloMin = -Infinity
  else if (muMin >= 1) eloMin = Infinity
  else eloMin = -400 * Math.log10(1 / muMin - 1)

  if (muMax <= 0) eloMax = -Infinity
  else if (muMax >= 1) eloMax = Infinity
  else eloMax = -400 * Math.log10(1 / muMax - 1)

  const errorMargin = (eloMax - eloMin) / 2

  return {
    performance: parseFloat(deltaElo.toFixed(2)),
    errorMargin: parseFloat(errorMargin.toFixed(2)),
    confidenceInterval: [
      parseFloat(eloMin.toFixed(2)),
      parseFloat(eloMax.toFixed(2)),
    ],
    scoreRate: mu,
    standardError: sigmaMu,
    totalGames: 2 * P,
  }
}

/**
 * Format Elo rating for display
 * @param rating EloRatingResult
 * @returns Formatted string for display
 */
export function formatEloRating(rating: EloRatingResult): string {
  if (rating.performance === Infinity) {
    return '+∞'
  } else if (rating.performance === -Infinity) {
    return '-∞'
  } else {
    const sign = rating.performance > 0 ? '+' : ''
    return `${sign}${rating.performance.toFixed(2)}`
  }
}

/**
 * Format error margin for display
 * @param rating EloRatingResult
 * @returns Formatted error margin string
 */
export function formatErrorMargin(rating: EloRatingResult): string {
  if (rating.errorMargin === Infinity || rating.errorMargin === -Infinity) {
    return ''
  }
  return `± ${rating.errorMargin.toFixed(2)}`
}

/**
 * Format confidence interval for display
 * @param rating EloRatingResult
 * @returns Formatted confidence interval string
 */
export function formatConfidenceInterval(rating: EloRatingResult): string {
  const formatValue = (value: number): string => {
    if (value === Infinity) return '+∞'
    if (value === -Infinity) return '-∞'
    return value.toFixed(2)
  }

  const min = formatValue(rating.confidenceInterval[0])
  const max = formatValue(rating.confidenceInterval[1])

  return `(${min} - ${max})`
}

// LOS and Draw Ratio helpers

/**
 * Fast approximation of the error function erf(x).
 * Abramowitz and Stegun formula 7.1.26
 */
function erfApprox(x: number): number {
  // Use native implementation if available
  const mathAny = Math as unknown as { erf?: (z: number) => number }
  if (typeof mathAny.erf === 'function') {
    return mathAny.erf(x)
  }

  if (!Number.isFinite(x)) return Math.sign(x)
  if (x === 0) return 0

  const sign = x < 0 ? -1 : 1
  const ax = Math.abs(x)

  // Constants
  const twoDivSqrtPi = 2 / Math.sqrt(Math.PI)
  const invSqrtPi = 1 / Math.sqrt(Math.PI)

  // 1) Small |x|: Taylor series to near machine precision
  if (ax < 0.5) {
    const xx = ax * ax
    let term = ax // n = 0 term: x
    let sum = term
    // Iterate until convergence
    for (let n = 1; n < 200; n++) {
      // term_{n} = term_{n-1} * x^2 * (2n-1) / (n * (2n+1))
      term *= (xx * (2 * n - 1)) / (n * (2 * n + 1))
      // Alternating signs: subtract on odd n, add on even n
      sum += n % 2 === 1 ? -term : term
      if (Math.abs(term) * twoDivSqrtPi < 1e-16) break
    }
    return sign * twoDivSqrtPi * sum
  }

  // 2) Large |x|: Asymptotic series for erfc, then erf = 1 - erfc
  if (ax > 4) {
    // erfc(x) ~ exp(-x^2)/(x*sqrt(pi)) * [1 + sum_{n>=1} (-1)^n (2n-1)!! / ( (2x^2)^n )]
    // Compute the bracketed series iteratively
    const xx = ax * ax
    let term = 1
    let seriesSum = 1
    for (let n = 1; n < 50; n++) {
      term *= -((2 * n - 1) / (2 * xx))
      seriesSum += term
      if (Math.abs(term) < 1e-16) break
    }
    const erfc = Math.exp(-xx) * (invSqrtPi / ax) * seriesSum
    const erf = 1 - erfc
    return sign * erf
  }

  // 3) Midrange: fast Abramowitz-Stegun 7.1.26 (good to ~1e-7)
  // This keeps performance acceptable while small/large ranges are near machine precision
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const t = 1 / (1 + p * ax)
  const y =
    1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax)
  return sign * y
}

/**
 * Standard normal CDF Φ(x) using erf approximation.
 */
function normalCdf(x: number): number {
  return 0.5 * (1 + erfApprox(x / Math.SQRT2))
}

/**
 * Compute LOS (Likelihood of Superiority) given mean score rate (mu) and
 * its standard error (sigmaMu). Returns a probability between 0 and 1.
 */
export function computeLOSFromMeanAndSE(mu: number, sigmaMu: number): number {
  if (!isFinite(mu) || !isFinite(sigmaMu)) return NaN
  if (sigmaMu <= 0) {
    if (mu > 0.5) return 1
    if (mu < 0.5) return 0
    return 0.5
  }
  const z = (mu - 0.5) / sigmaMu
  return normalCdf(z)
}

/**
 * Exact draw ratio from WDL.
 */
export function drawRatioFromWDL(
  wins: number,
  losses: number,
  draws: number
): number {
  const W = wins || 0
  const L = losses || 0
  const D = draws || 0
  const N = W + L + D
  if (N <= 0) return 0
  return D / N
}

/**
 * Draw ratio lower/upper bounds from PTNML pair counts.
 * - LD+DL and DW+WD each contribute exactly 1 draw per pair.
 * - Center bucket (LW+DD+WL) contributes between 0 draws (all LW/WL) and 2 draws (all DD).
 * - LL and WW contribute 0 draws.
 * Returns [minDrawRatio, maxDrawRatio] as per-game ratios in [0,1].
 */
export function drawRatioBoundsFromPTNML(
  ll: number,
  lddl: number,
  center: number,
  dwwd: number,
  ww: number
): [number, number] {
  const LL = ll || 0
  const LDDL = lddl || 0
  const C = center || 0
  const DWWD = dwwd || 0
  const WW = ww || 0
  const P = LL + LDDL + C + DWWD + WW
  if (P <= 0) return [0, 0]

  const minDrawsPerPairs = LDDL + DWWD // center contributes 0
  const maxDrawsPerPairs = LDDL + DWWD + 2 * C // center contributes 2

  const denomGames = 2 * P
  const minRatio = minDrawsPerPairs / denomGames
  const maxRatio = maxDrawsPerPairs / denomGames
  return [minRatio, maxRatio]
}
