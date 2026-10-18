'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export function PageIntro() {
  const [show, setShow] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), reduceMotion ? 0 : 1400);
    return () => clearTimeout(timer);
  }, [reduceMotion]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5 }}
        >
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="flex items-center gap-1 text-2xl font-bold tracking-tight text-foreground"
            >
              {'Yanmife'.split('').map((char, i) => (
                <motion.span
                  key={i}
                  className={i < 4 ? 'text-primary' : ''}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.div>
            <motion.div
              className="h-0.5 w-16 overflow-hidden rounded-full bg-muted"
            >
              <motion.div
                className="h-full bg-primary"
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{ duration: 1, ease: 'easeInOut' }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
