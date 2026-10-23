'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useInView } from 'framer-motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { glyphCss, planReel, reelFrame } from '@/lib/slot-motion';

type ReelNodes = { a: HTMLSpanElement | null; b: HTMLSpanElement | null };

const GLYPH = 'absolute inset-0 block text-center leading-[1.1em] tabular-nums will-change-transform';

/**
 * Shows a number as slot machine reels. When it scrolls into view, every
 * digit spins as a blur of vertical streaks, then slows down and drops onto
 * its real value. The digit on the right starts and lands first, the digit
 * on the left lands last. See lib/slot-motion.ts for the motion itself.
 *
 * The animation writes straight to the page every frame instead of going
 * through React, which keeps it smooth.
 */
export function SlotNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduceMotion = useReducedMotion();
  const nodes = useRef<ReelNodes[]>([]);

  const digits = useMemo(
    () => String(Math.max(0, Math.floor(value))).split('').map(Number),
    [value]
  );
  // k = how far the digit is from the right edge. The last digit has k = 0.
  const plans = useMemo(() => digits.map((d, i) => planReel(d, digits.length - 1 - i)), [digits]);

  // People who asked for less motion get the real number straight away.
  useEffect(() => {
    if (!reduceMotion) return;
    digits.forEach((digit, i) => {
      const reel = nodes.current[i];
      if (!reel?.a || !reel.b) return;
      reel.a.textContent = String(digit);
      reel.a.style.cssText = '';
      reel.b.style.cssText = 'display:none';
    });
  }, [reduceMotion, digits]);

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const shown = digits.map(() => [-1, -1]); // what each node shows, to skip needless writes
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = (now - startedAt) / 1000;
      let allDone = true;
      plans.forEach((plan, i) => {
        const reel = nodes.current[i];
        if (!reel?.a || !reel.b) return;
        const drawn = reelFrame(plan, t);
        if (!drawn.done) allDone = false;
        [reel.a, reel.b].forEach((node, g) => {
          const glyph = drawn.glyphs[g];
          if (shown[i][g] !== glyph.digit) {
            node.textContent = String(glyph.digit);
            shown[i][g] = glyph.digit;
          }
          node.style.cssText = glyphCss(glyph);
        });
      });
      if (!allDone) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduceMotion, plans, digits]);

  const setNode = (i: number, which: 'a' | 'b') => (node: HTMLSpanElement | null) => {
    if (!nodes.current[i]) nodes.current[i] = { a: null, b: null };
    nodes.current[i][which] = node;
  };

  return (
    <span ref={ref} className="inline-flex items-start">
      <span className="sr-only">
        {value}
        {suffix}
      </span>
      {digits.map((digit, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="relative inline-block h-[1.1em] overflow-hidden align-top leading-[1.1em]"
        >
          {/* Invisible copy of the real digit. It gives the reel its width and height. */}
          <span className="invisible block h-[1.1em] leading-[1.1em] tabular-nums">{digit}</span>
          <span ref={setNode(i, 'a')} className={GLYPH}>
            0
          </span>
          <span ref={setNode(i, 'b')} className={`${GLYPH} hidden`} />
        </span>
      ))}
      {suffix && (
        <span aria-hidden="true" className="leading-[1.1em]">
          {suffix}
        </span>
      )}
    </span>
  );
}
