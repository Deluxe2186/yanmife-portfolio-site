'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { motion, type Variants } from 'framer-motion';
import { type ReactNode, useRef } from 'react';

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
  as?: 'section' | 'div';
}

export function SectionReveal({
  children,
  className,
  delay = 0,
  id,
  as = 'section',
}: SectionRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const variants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const MotionTag = as === 'section' ? motion.section : motion.div;

  return (
    <MotionTag
      ref={ref as any}
      id={id}
      className={className}
      variants={reduceMotion ? undefined : variants}
      initial={reduceMotion ? false : 'hidden'}
      whileInView={reduceMotion ? undefined : 'visible'}
      viewport={{ once: true, margin: '-80px' }}
    >
      {children}
    </MotionTag>
  );
}
