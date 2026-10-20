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
 * One column of digits that spins like a slot machine reel.
 * It speeds up, spins blurred, slows down, rolls a little past the number
 * and settles back onto `digit`.
 */
function Reel({ digit, turns, delay, run, instant }: ReelProps) {
  const landIndex = turns * 10 + digit;
  // One extra digit sits after the target, so the small overshoot has something to show.
  const count = landIndex + 2;
  const digits = Array.from({ length: count }, (_, i) => i % 10);
  // Positions are a percent of the strip's own height.
  const at = (index: number) => `${-(index / count) * 100}%`;
  const duration = 1.7 + turns * 0.35;

  return (
    <span
      aria-hidden="true"
      className="relative inline-block h-[1.1em] overflow-hidden align-top leading-[1.1em]"
    >
      <motion.span
        className="flex flex-col"
        initial={{ y: '0%', filter: 'blur(0px)' }}
        animate={
          !run
            ? { y: '0%', filter: 'blur(0px)' }
            : instant
              ? { y: at(landIndex), filter: 'blur(0px)' }
              : {
                  y: ['0%', at(landIndex + 0.25), at(landIndex)],
                  filter: ['blur(0px)', 'blur(1.5px)', 'blur(1.5px)', 'blur(0px)'],
                }
        }
        transition={
          instant
            ? { duration: 0 }
            : {
                y: {
                  duration,
                  delay,
                  times: [0, 0.86, 1],
                  ease: [[0.3, 0.05, 0.2, 1], 'easeOut'],
                },
                filter: {
                  duration,
                  delay,
                  times: [0, 0.1, 0.7, 0.9],
                  ease: 'linear',
                },
              }
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
          delay={i * 0.12}
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
