'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';

/**
 * Same as framer-motion's useReducedMotion, but safe for server rendering.
 * The server cannot know the visitor's setting, so the first render always
 * returns false. After the page mounts it switches to the real value.
 * This keeps the server HTML and the first browser render identical,
 * which avoids hydration errors.
 */
export function useReducedMotion(): boolean {
  const prefersReduced = useFramerReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? Boolean(prefersReduced) : false;
}
