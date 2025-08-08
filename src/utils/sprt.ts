// Probability distribution type: list of tuples (ai, pi)
// where ai are strictly ascending and pi sum to 1
export type PDF = Array<[number, number]>;

export const NELO_DIVIDED_BY_NT = 800 / Math.log(10);

/**
 * Brent's method for root-finding.
 * Finds a root of f(x) in the interval [a, b].
 */
function brentq(
  f: (x: number) => number,
  a: number,
  b: number,
  tol: number = 1e-12,
  maxIter: number = 100
): number {
  let fa = f(a);
  let fb = f(b);

  if (!(fa * fb < 0)) {
    throw new Error("Root not bracketed: f(a) and f(b) must have opposite signs");
  }

  let c = a;
  let fc = fa;
  let d = b - a;
  let e = d;

  for (let iter = 0; iter < maxIter; iter++) {
    if (Math.abs(fc) < Math.abs(fb)) {
      a = b; b = c; c = a;
      fa = fb; fb = fc; fc = fa;
    }

    const tol1 = 2 * Number.EPSILON * Math.abs(b) + tol / 2;
    const xm = (c - b) / 2;

    if (Math.abs(xm) <= tol1 || fb === 0) {
      return b;
    }

    if (Math.abs(e) >= tol1 && Math.abs(fa) > Math.abs(fb)) {
      // Attempt inverse quadratic interpolation
      let s: number;
      const m = fb / fa;
      if (a === c) {
        // Secant method
        s = b - m * (b - a);
      } else {
        // Inverse quadratic interpolation
        const q = fa / fc;
        const r = fb / fc;
        s = b - (m * (b - a) * q - (b - c) * (r - 1)) / ((q - 1) * (r - 1));
      }

      // Conditions to accept the interpolation
      const cond1 = (s < (3 * a + b) / 4 || s > b);
      const cond2 = (e < tol1 && Math.abs(s - b) >= tol1);
      const cond3 = (e >= tol1 && Math.abs(s - b) >= Math.abs(b - c) / 2);
      const cond4 = (e >= tol1 && Math.abs(b - c) < tol1);
      const cond5 = (e >= tol1 && Math.abs(c - d) < tol1);

      if (cond1 || cond2 || cond3 || cond4 || cond5) {
        // Bisection
        e = xm;
        d = xm;
      } else {
        e = d;
        d = s - b;
      }
    } else {
      // Bisection
      e = xm;
      d = xm;
    }

    a = b;
    fa = fb;
    if (Math.abs(d) > tol1) {
      b += d;
    } else {
      b += (xm > 0 ? tol1 : -tol1);
    }
    fb = f(b);

    if ((fb > 0 && fc > 0) || (fb < 0 && fc < 0)) {
      c = a;
      fc = fa;
      e = b - a;
      d = e;
    }
  }

  throw new Error("Brent's method failed to converge");
}

function secular(pdf: PDF): number {
  const epsilon = 1e-9;
  const values = pdf.map(([ai]) => ai);
  const v = Math.min(...values);
  const w = Math.max(...values);

  // We require v < 0 < w to make bounds meaningful.
  if (!(v < 0 && w > 0)) {
    // In theory this should hold for the constructed problems; if it doesn't,
    // it's safer to throw than silently return 0 (which would force LLR to 0).
    throw new Error("Secular equation bounds invalid: need v<0<w");
  }

  const lower_bound = -1 / w + epsilon;
  const upper_bound = -1 / v - epsilon;

  const f = (x: number) => pdf.reduce((sum, [ai, pi]) => sum + (pi * ai) / (1 + x * ai), 0);
  return brentq(f, lower_bound, upper_bound);
}

function uniform(pdf: PDF): PDF {
  const n = pdf.length;
  return pdf.map(([ai]) => [ai, 1 / n]);
}

function stats(pdf: PDF): { s: number; var: number } {
  const epsilon = 1e-9;
  let totalProb = pdf.reduce((sum, [, pi]) => sum + pi, 0);
  if (Math.abs(totalProb - 1.0) > 1e-6) {
    // Normalize if needed
    pdf = pdf.map(([ai, pi]) => [ai, pi / totalProb]);
    totalProb = 1.0;
  }
  if (Math.abs(totalProb - 1.0) > 1e-6) {
    throw new Error("PDF probabilities do not sum to 1");
  }
  const s = pdf.reduce((sum, [ai, pi]) => sum + pi * ai, 0);
  const variance = pdf.reduce((sum, [ai, pi]) => sum + pi * (ai - s) ** 2, 0);
  return { s, var: Math.max(variance, epsilon) };
}

function MLE_expected(pdfhat: PDF, s: number): PDF {
  // pdf1 = (ai - s, pi)
  const pdf1: PDF = pdfhat.map(([ai, pi]) => [ai - s, pi]);
  const x = secular(pdf1);
  const pdf_MLE: PDF = pdfhat.map(([ai, pi]) => [ai, pi / (1 + x * (ai - s))]);
  // Normalize to avoid drift
  const totalProb = pdf_MLE.reduce((sum, [, pi]) => sum + pi, 0);
  return pdf_MLE.map(([ai, pi]) => [ai, pi / totalProb]);
}

function MLE_t_value(pdfhat: PDF, ref: number, s: number): PDF {
  let pdf_MLE = uniform(pdfhat);

  for (let i = 0; i < 20; i++) {
    const prev = pdf_MLE.map(([, pi]) => pi);
    const { s: mu, var: variance } = stats(pdf_MLE);
    const sigma = Math.sqrt(variance);

    const pdf1 = pdfhat.map(([ai, pi]) => {
      const term = ai - ref - s * sigma * (1 + ((mu - ai) / sigma) ** 2) / 2;
      return [term, pi] as [number, number];
    });

    const x = secular(pdf1);
    pdf_MLE = pdfhat.map(([ai, pi], j) => [ai, pi / (1 + x * pdf1[j][0])]);

    // Normalize
    const sumPi = pdf_MLE.reduce((sum, [, pi]) => sum + pi, 0);
    pdf_MLE = pdf_MLE.map(([ai, pi]) => [ai, pi / sumPi]);

    const maxDiff = Math.max(...pdf_MLE.map(([, pi], j) => Math.abs(pi - prev[j])));
    if (maxDiff < 1e-9) break;
  }

  return pdf_MLE;
}

function LLR_core(pdf: PDF, s0: number, s1: number, ref: number | null, statistic: 'expectation' | 't_value'): number {
  let pdf0: PDF, pdf1: PDF;

  if (statistic === 't_value') {
    if (ref === null) throw new Error("ref must be provided for t_value statistic");
    pdf0 = MLE_t_value(pdf, ref, s0);
    pdf1 = MLE_t_value(pdf, ref, s1);
  } else if (statistic === 'expectation') {
    pdf0 = MLE_expected(pdf, s0);
    pdf1 = MLE_expected(pdf, s1);
  } else {
    throw new Error(`Unsupported statistic ${statistic}`);
  }

  const jumps: PDF = pdf.map(([, pi], i) => {
    const p0 = pdf0[i][1];
    const p1 = pdf1[i][1];
    return [Math.log(p1) - Math.log(p0), pi];
  });

  return stats(jumps).s;
}

function L_(x: number): number {
  return 1 / (1 + 10 ** (-x / 400));
}

function regularize(results: number[]): number[] {
  const epsilon = 1e-3;
  let anyZero = false;
  for (const r of results) if (r === 0) { anyZero = true; break; }
  if (!anyZero) return [...results];
  return results.map((r) => (r === 0 ? epsilon : r));
}

function results_to_pdf(results: number[]): { N: number; pdf: PDF } {
  const regularizedResults = regularize(results);
  const N = regularizedResults.reduce((sum, r) => sum + r, 0);
  const count = regularizedResults.length;
  const pdf: PDF = regularizedResults.map((res, i) => [i / (count - 1), res / N]);
  return { N, pdf };
}

/**
 * Generalized log-likelihood ratio for normalized Elo (exact, via t_value MLE).
 */
export function calculateLLR_normalized(nelo0: number, nelo1: number, results: number[]): number | null {
  try {
    if (results.reduce((a, b) => a + b, 0) === 0) return null;
    const nt0 = nelo0 / NELO_DIVIDED_BY_NT;
    const nt1 = nelo1 / NELO_DIVIDED_BY_NT;
    const sqrt2 = Math.SQRT2;
    const { N, pdf } = results_to_pdf(results);

    const [t0, t1] = (results.length === 3)
      ? [nt0, nt1]
      : (results.length === 5)
        ? [nt0 * sqrt2, nt1 * sqrt2]
        : [NaN, NaN];

    if (!isFinite(t0) || !isFinite(t1)) return null;

    return N * LLR_core(pdf, t0, t1, 1 / 2, 't_value');
  } catch (e) {
    console.error("LLR(normalized) calculation failed:", e);
    return null;
  }
}

/**
 * Generalized log-likelihood ratio for logistic Elo.
 */
export function calculateLLR_logistic(elo0: number, elo1: number, results: number[]): number | null {
  try {
    if (results.reduce((a, b) => a + b, 0) === 0) return null;
    const s0 = L_(elo0);
    const s1 = L_(elo1);
    const { N, pdf } = results_to_pdf(results);
    return N * LLR_core(pdf, s0, s1, null, 'expectation');
  } catch (e) {
    console.error("LLR(logistic) calculation failed:", e);
    return null;
  }
}

/**
 * Approximate generalized log-likelihood ratio for normalized Elo.
 * Matches LLR_normalized_alt in the reference implementation.
 */
export function calculateLLR_normalized_alt(nelo0: number, nelo1: number, results: number[]): number | null {
  try {
    const { N: count, pdf } = results_to_pdf(results);
    const { s: mu, var: variance } = stats(pdf);
    let sigma_pg: number;
    let games: number;
    if (results.length === 5) {
      sigma_pg = Math.sqrt(2 * variance);
      games = 2 * count;
    } else if (results.length === 3) {
      sigma_pg = Math.sqrt(variance);
      games = count;
    } else {
      return null;
    }
    const nt0 = nelo0 / NELO_DIVIDED_BY_NT;
    const nt1 = nelo1 / NELO_DIVIDED_BY_NT;
    const nt = (mu - 0.5) / sigma_pg;

    return (games / 2) * Math.log(
      (1 + (nt - nt0) * (nt - nt0)) / (1 + (nt - nt1) * (nt - nt1))
    );
  } catch (e) {
    console.error("LLR(normalized_alt) calculation failed:", e);
    return null;
  }
}

/**
 * Summarize results (WDL or PTNML) into mu, variance, per-game sigma (sigma_pg), and total games.
 * This mirrors the mapping used by LLR_normalized_alt.
 */
export function summarizeResults(results: number[]): { mu: number; variance: number; sigma_pg: number; games: number } {
  const { N: count, pdf } = results_to_pdf(results);
  const { s: mu, var: variance } = stats(pdf);
  let sigma_pg: number;
  let games: number;
  if (results.length === 5) {
    sigma_pg = Math.sqrt(2 * variance);
    games = 2 * count;
  } else if (results.length === 3) {
    sigma_pg = Math.sqrt(variance);
    games = count;
  } else {
    throw new Error('Unsupported results length');
  }
  return { mu, variance, sigma_pg, games };
}