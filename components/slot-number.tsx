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

/** One column of digits that spins like a slot machine reel and lands on `digit`. */
function Reel({ digit, turns, delay, run, instant }: ReelProps) {
  const count = turns * 10 + digit + 1;
  const digits = Array.from({ length: count }, (_, i) => i % 10);
  // Percent of the strip's own height, so the move equals (count - 1) digits.
  const landAt = `${-((count - 1) / count) * 100}%`;

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
            : { duration: 1.3 + turns * 0.3, delay, ease: [0.16, 1, 0.3, 1] }
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
 * reels spin and stop one by one, left to right, on the real value.
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
          turns={2 + i}
          delay={i * 0.14}
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
