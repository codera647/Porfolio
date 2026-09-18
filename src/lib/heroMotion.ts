/**
 * The hero's numbers, in one place. Everything here is from docs/HANDOFF.md
 * sections 5.7 to 5.9. CSS-side values live in src/styles/tokens.css; these are
 * the ones JavaScript needs to do arithmetic with.
 */
import { signatureTiming } from "./signatureTiming";

/** Entrance choreography (s5.7). Seconds from the moment the intro starts. */
export const choreography = {
  /** 0.00 - 0.12s calm black, then the signature draws to 2.44s. */
  signatureDraw: signatureTiming.draw,
  /** 2.44 - 2.60s the completed signature holds. */
  signatureHold: signatureTiming.hold,
  /** 2.60 - 2.95s the intro layer and signature fade. */
  introFadeStart: 2.6,
  introFadeMs: 350,
  /** 2.60 - 3.40s the card reveals from nearly edge on and settles front on. */
  cardRevealAt: 2.6,
  cardRevealMs: 800,
  /** Text runs on its own schedule so nothing is read while distorted. */
  navAt: 2.98,
  nameAt: 3.04,
  sentenceAt: 3.25,
  roleAt: 3.38,
  ctaAt: 3.48,
  bottomAt: 3.58,
  /** After 3.65s the hero is stable and the pointer takes over. */
  settledAt: 3.65,
} as const;

/**
 * Reduced motion replaces the perspective entrance with a short fade and rise
 * (s5.10), and mobile does the same. Nothing waits on a 3.65s schedule there.
 */
export const calmEntrance = { fadeMs: 520, risePx: 12 } as const;

/** Name pointer response (s5.8). */
export const nameResponse = {
  /** At rest every letter sits at a readable hairline, not an invisible one. */
  weightRest: 280,
  /** The pointer nearest letter. */
  weightPeak: 780,
  /** Immediate neighbours, giving a soft wave rather than a single hot letter.
      Not fed in directly: `falloff` is shaped to land on it at one glyph
      advance, so the wave stays one continuous curve. Verified in the browser. */
  weightNeighbour: 500,
  /** Horizontal glyph scale, rest to maximum. */
  scaleRest: 0.88,
  scalePeak: 1.03,
  /** Falloff radius in px at desktop size (s5.8: 140-180). */
  radius: 160,
  /** Approach the target over 180-260ms, ease back over 350-450ms. */
  attackMs: 220,
  releaseMs: 400,
} as const;

/** Pointer gradient (s5.9). Sizes and opacities are CSS tokens; these are the lags. */
export const glow = {
  /** Primary follows with 180-260ms of eased lag, secondary 300-450ms. */
  primaryLagMs: 220,
  secondaryLagMs: 380,
  /** The secondary sits offset from the primary for depth and asymmetry. */
  secondaryOffset: { x: 78, y: -52 },
  /** On pointer leave, return gently over 800-1200ms. */
  returnMs: 1000,
  /** At rest, a very faint glow near 62% / 43% with a slow 10-14s drift. */
  restX: 0.62,
  restY: 0.43,
  driftSeconds: 12,
  driftPx: 40,
} as const;

/**
 * Exponential smoothing toward a target, framerate independent.
 * `lagMs` is the time to close ~63% of the remaining distance.
 */
export function approach(current: number, target: number, lagMs: number, dtMs: number) {
  if (lagMs <= 0) return target;
  const k = 1 - Math.exp(-dtMs / lagMs);
  return current + (target - current) * k;
}

/**
 * Emphasis at `distance` from the pointer: 1 at the centre, 0 at `radius`.
 *
 * The exponent is not arbitrary. The brief pins three things at desktop size:
 * the nearest letter goes to ~780, its immediate neighbours to ~500, and the
 * falloff radius is ~160px (s5.8). One glyph advance at the 180px name is
 * 0.645em = 116px, so the curve has to pass through
 *
 *     f(116 / 160) = (500 - 280) / (780 - 280) = 0.44
 *
 * and 1 - u^1.8 does, where a smoothstep would give 0.19 and leave the
 * neighbours barely moving. It is also flat at the centre, so the emphasis does
 * not spike as the pointer crosses a letter, and it reaches exactly zero at the
 * radius, so there is no rim.
 */
const FALLOFF_EXPONENT = 1.8;

export function falloff(distance: number, radius: number) {
  if (distance >= radius) return 0;
  const u = distance / radius;
  return 1 - Math.pow(u, FALLOFF_EXPONENT);
}
