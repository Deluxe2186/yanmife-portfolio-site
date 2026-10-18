'use client';

import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Lets framer-motion handle the visitor's "reduce motion" setting by itself:
 * movement and scaling are skipped, but fades still play, so content always
 * ends up visible.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
