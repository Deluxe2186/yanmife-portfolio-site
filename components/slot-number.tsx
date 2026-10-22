'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface ReelProps {
  digit: number;
  /** How many full 0-9 turns the reel makes before it lands. */
  turns: number;
  delay: number;
  run: boolean;
  instant: boolean;
}

/**
 * One column of digits that rolls like a slot machine reel.
 * It starts at a pace the eye can follow, then slows down smoothly
 * (an ease-out) and comes to rest on `digit`.
 */
function Reel({ digit, turns, delay, run, instant }: ReelProps) {
  const landIndex = turns * 10 + digit;
  const count = landIndex + 1;
  const digits = Array.from({ length: count }, (_, i) => i % 10);
  // Position is a percent of the strip's own height.
  const landAt = `${-(landIndex / count) * 100}%`;
  // Roughly 3 digits per second on average, never shorter than 3.2 seconds
  // and never longer than 5. The ease-out makes the start a little faster
  // and the end very slow, so the last few digits are easy to read.
  const duration = Math.min(5, Math.max(3.2, landIndex / 3.2));

  return (
    <span
      aria-hidden="true"
      className="relative inline-block h-[1.1em] overflow-hidden align-top leading-[1.1em]"
    >
      <motion.span
        className="flex flex-col"
        initial={{ y: '0%' }}
        animate={{ y: run ? landAt : '0%' }}
        transition={
          instant
            ? { duration: 0 }
            : { duration, delay, ease: [0.25, 0.6, 0.3, 1] }
        }
      >
        {digits.map((n, i) => (
          <span key={i} className="block h-[1.1em] leading-[1.1em] tabular-nums">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/**
 * Shows a number as slot machine reels. When it scrolls into view the
 * reels roll slowly and come to rest one by one, left to right, on the real value.
 */
export function SlotNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduceMotion = useReducedMotion();
  const digits = String(Math.max(0, Math.floor(value))).split('').map(Number);

  return (
    <span ref={ref} className="inline-flex items-start">
      <span className="sr-only">
        {value}
        {suffix}
      </span>
      {digits.map((digit, i) => (
        <Reel
          key={i}
          digit={digit}
          turns={1}
          delay={0.2 + i * 0.5}
          run={inView}
          instant={reduceMotion}
        />
      ))}
      {suffix && (
        <span aria-hidden="true" className="leading-[1.1em]">
          {suffix}
        </span>
      )}
    </span>
  );
}
