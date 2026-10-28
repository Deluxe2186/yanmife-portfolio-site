'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Code, Palette, Box, Sparkles, Zap, MousePointerClick } from 'lucide-react';

const ICONS = [Code, Palette, Box, Sparkles, Zap, MousePointerClick];

export function PageIntro() {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const duration = reduceMotion ? 0 : 2000;
    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);
      if (p >= 1) {
        clearInterval(interval);
        const timer = setTimeout(() => setShow(false), 300);
        return () => clearTimeout(timer);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [reduceMotion]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6 }}
        >
          <div className="relative">
            {/* Floating geometric shapes */}
            {!reduceMotion && (
              <>
                <FloatingShape size={80} x={10} y={15} delay={0} color="primary" />
                <FloatingShape size={60} x={85} y={10} delay={0.2} color="primary/50" />
                <FloatingShape size={45} x={5} y={70} delay={0.4} color="primary/30" />
                <FloatingShape size={55} x={90} y={80} delay={0.6} color="primary/40" />
                <FloatingShape size={35} x={20} y={85} delay={0.8} color="primary/20" />
                <FloatingShape size={70} x={75} y={40} delay={1.0} color="primary/60" />
              </>
            )}

            <motion.div
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.5 }}
            >
              <div className="flex flex-col items-center gap-6 p-8">
                {/* Fun bouncing icons */}
                {!reduceMotion && (
                  <motion.div
                    className="flex items-center gap-3"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {ICONS.map((Icon, i) => (
                      <motion.div
                        key={i}
                        className="text-primary/60"
                        initial={{ opacity: 0, scale: 0, rotate: -90 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2 + i * 0.08, duration: 0.5, type: 'spring', stiffness: 200 }}
                        whileHover={{ scale: 1.3, rotate: 180, transition: { duration: 0.2 } }}
                      >
                        <Icon className="h-8 w-8" />
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Name animation */}
                <motion.div
                  className="flex items-center gap-1 text-3xl sm:text-4xl font-bold tracking-tight text-foreground"
                >
                  {'Yanmife'.split('').map((char, i) => (
                    <motion.span
                      key={i}
                      className={i < 4 ? 'text-primary' : ''}
                      initial={{ opacity: 0, y: 30, rotateX: -90 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{ delay: 0.4 + i * 0.06, duration: 0.4, type: 'spring', stiffness: 180 }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </motion.div>

                {/* Tagline */}
                <motion.p
                  className="text-sm text-muted-foreground max-w-xs text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.4 }}
                >
                  Crafting digital experiences with code & creativity
                </motion.p>

                {/* Progress bar with fun animation */}
                <div className="relative w-64 h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-primary/70 to-primary/40"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: reduceMotion ? 0 : 1.5, ease: 'easeOut' }}
                  />
                  {/* Glowing spark on progress */}
                  {!reduceMotion && (
                    <motion.div
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary/80 blur-sm"
                      animate={{ x: `${progress * 100}%`, opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  )}
                </div>

                {/* Percentage text */}
                <motion.p
                  className="text-xs text-muted-foreground font-mono"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {Math.round(progress * 100)}%
                </motion.p>

                {/* Fun fact / tip */}
                <motion.p
                  className="text-xs text-muted-foreground/70 text-center max-w-xs mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.4 }}
                >
                  {funFacts[Math.floor(Math.random() * funFacts.length)]}
                </motion.p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const funFacts = [
  'Did you know? The first computer bug was an actual moth! 🦋',
  'Fun fact: "Yanmife" means "God has given me joy" in Yoruba ✨',
  'Pro tip: Press Tab to navigate, Enter to activate 🎯',
  'Loading creativity... ████████░░ 80% 🎨',
  'Fun fact: The first website is still online! 🌐',
  'Did you know? CSS stands for Cascading Style Sheets 🎨',
  'Easter egg: Konami code works here! ↑↑↓↓←→←→BA 🎮',
];

function FloatingShape({ size, x, y, delay, color }: { size: number; x: number; y: number; delay: number; color: string }) {
  return (
    <motion.div
      className="absolute rounded-full opacity-20 pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        backgroundColor: `var(--${color})`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0.1, 0.2, 0.1],
        scale: [0.8, 1.2, 0.8],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 8 + Math.random() * 4,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  );
}
