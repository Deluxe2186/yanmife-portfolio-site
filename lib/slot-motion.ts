/**
 * Motion for the slot machine numbers. It is plain maths with no React in
 * it, so it can be tested and drawn frame by frame.
 *
 * Every digit is a reel. A reel starts still, speeds up, spins at full speed
 * (drawn as a vertical blur), then slows down gently and drops onto its
 * final digit. Reels start from the right and stop from the right, so the
 * last digit lands first and the first digit lands last.
 */

export const SLOT = {
  /** Wait before the first reel starts, in seconds. */
  delay: 0.2,
  /** Gap between one reel starting and the next one (right to left). */
  startGap: 0.3,
  /** Speeding up. */
  ramp: 0.5,
  /** Full speed, drawn as blur. */
  cruise: 0.9,
  /** Slowing down. The last part of this is easy to read. */
  decel: 2.0,
  /** Fastest speed, in digits per second. */
  peak: 24,
  /** At this speed the blur is at its strongest. */
  blurFullSpeed: 16,
};

/** Seconds one reel takes from its start to coming to rest. */
export const REEL_SECONDS = SLOT.ramp + SLOT.cruise + SLOT.decel;

export interface ReelPlan {
  /** The digits that scroll past, in order. The first is shown at rest, the last is the answer. */
  seq: number[];
  /** When this reel starts, in seconds. */
  start: number;
  /** Highest speed in digits per second. */
  vmax: number;
}

/** A small repeatable random number generator (the same numbers every time). */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** How far a reel travels, in digits, for a given top speed. */
const distance = (vmax: number) =>
  vmax * (SLOT.ramp / 2 + SLOT.cruise + SLOT.decel / 3);

/**
 * @param finalDigit the digit the reel lands on
 * @param k          how far the reel is from the right edge (0 = last digit)
 */
export function planReel(finalDigit: number, k: number): ReelPlan {
  const steps = Math.round(distance(SLOT.peak)) + k * 2; // a whole number of digits
  const vmax = steps / (SLOT.ramp / 2 + SLOT.cruise + SLOT.decel / 3);
  const random = mulberry32(finalDigit * 7919 + k * 104729 + 17);

  const seq: number[] = [0];
  for (let i = 1; i < steps; i++) {
    let next = Math.floor(random() * 10);
    if (next === seq[i - 1]) next = (next + 1 + Math.floor(random() * 8)) % 10;
    seq.push(next);
  }
  // Never end on the same digit twice in a row, so the landing is a real move.
  if (seq[steps - 1] === finalDigit) seq[steps - 1] = (finalDigit + 5) % 10;
  seq.push(finalDigit);

  return { seq, start: SLOT.delay + k * SLOT.startGap, vmax };
}

export interface ReelState {
  /** Position along the sequence. A whole number means a digit sits exactly in view. */
  u: number;
  /** Speed in digits per second. */
  speed: number;
  done: boolean;
}

/** Where a reel is, and how fast it is going, at time t (seconds). */
export function reelState(plan: ReelPlan, t: number): ReelState {
  const last = plan.seq.length - 1;
  const s = t - plan.start;
  const { ramp, cruise, decel } = SLOT;
  const v = plan.vmax;

  if (s <= 0) return { u: 0, speed: 0, done: false };
  if (s < ramp) {
    return { u: (v * s * s) / (2 * ramp), speed: (v * s) / ramp, done: false };
  }
  if (s < ramp + cruise) {
    return { u: v * (ramp / 2 + (s - ramp)), speed: v, done: false };
  }
  if (s < ramp + cruise + decel) {
    const p = (s - ramp - cruise) / decel; // 0 to 1
    const left = 1 - p;
    return {
      u: v * (ramp / 2 + cruise) + (v * decel * (1 - left * left * left)) / 3,
      speed: v * left * left,
      done: false,
    };
  }
  return { u: last, speed: 0, done: true };
}

export interface GlyphDraw {
  digit: number;
  /** Vertical position in percent of one digit's height. Positive is down. */
  y: number;
  stretch: number;
  opacity: number;
  shadow: string;
  visible: boolean;
}

export interface ReelFrame {
  glyphs: [GlyphDraw, GlyphDraw];
  done: boolean;
  /** 0 (sharp) to 1 (full blur). */
  blur: number;
}

function smear(blur: number): string {
  if (blur < 0.05) return 'none';
  // Soft copies of the digit above and below it melt into one vertical streak,
  // like a camera shutter staying open on something moving fast.
  const color = 'color-mix(in srgb, currentColor 26%, transparent)';
  const softness = (0.05 + 0.12 * blur).toFixed(3);
  const offsets = [0.15, 0.35, 0.6, 0.9];
  return offsets
    .flatMap((o) => [
      `0 ${(-o * blur).toFixed(3)}em ${softness}em ${color}`,
      `0 ${(o * blur).toFixed(3)}em ${softness}em ${color}`,
    ])
    .join(', ');
}

/** What to draw for a reel at time t: two digits (the one leaving and the one arriving). */
export function reelFrame(plan: ReelPlan, t: number): ReelFrame {
  const { u, speed, done } = reelState(plan, t);
  const last = plan.seq.length - 1;
  const blur = Math.min(1, speed / SLOT.blurFullSpeed);
  const stretch = 1 + 1.4 * blur;
  const opacity = 1 - 0.5 * blur;
  const shadow = smear(blur);

  if (done || u >= last) {
    return {
      done: true,
      blur: 0,
      glyphs: [
        { digit: plan.seq[last], y: 0, stretch: 1, opacity: 1, shadow: 'none', visible: true },
        { digit: 0, y: -100, stretch: 1, opacity: 1, shadow: 'none', visible: false },
      ],
    };
  }

  const j = Math.floor(u);
  const frac = u - j;
  return {
    done: false,
    blur,
    glyphs: [
      { digit: plan.seq[j], y: frac * 100, stretch, opacity, shadow, visible: true },
      { digit: plan.seq[Math.min(j + 1, last)], y: (frac - 1) * 100, stretch, opacity, shadow, visible: true },
    ],
  };
}

/** The style text for one digit. Used both on the page and in test pictures. */
export function glyphCss(g: GlyphDraw): string {
  if (!g.visible) return 'display:none';
  return [
    'display:block',
    `transform:translate3d(0,${g.y.toFixed(2)}%,0) scaleY(${g.stretch.toFixed(3)})`,
    `opacity:${g.opacity.toFixed(3)}`,
    `text-shadow:${g.shadow}`,
  ].join(';');
}
