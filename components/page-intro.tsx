'use client';

import { useEffect, useState } from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  type MotionValue,
} from 'framer-motion';
import {
  Bug,
  Globe,
  Keyboard,
  Lightbulb,
  MapPin,
  Palette,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/** One of these shows under the loading bar. Each visit shows a different one. */
const MESSAGES: { icon: LucideIcon; text: string }[] = [
  { icon: Lightbulb, text: 'I sketch the idea in Figma first, then I write the code.' },
  { icon: Globe, text: 'A copy of the very first website is still online today.' },
  { icon: Bug, text: 'In 1947, engineers found a real moth stuck inside a computer.' },
  { icon: Keyboard, text: 'Tip: press Tab to move around this site without a mouse.' },
  { icon: Palette, text: 'Good design is mostly small details people only notice when they are missing.' },
  { icon: MapPin, text: 'Designed and built in Lagos, Nigeria.' },
  { icon: Smartphone, text: 'On a phone? Swipe sideways on a row of projects to see more.' },
];

const STORAGE_KEY = 'portfolio-intro-last-message';

/**
 * Picks the message for this visit. The first visit is random. After that it
 * moves to the next one in the list, so it is never the same twice in a row.
 * If the browser blocks storage, it falls back to a random pick.
 */
function pickMessageIndex(): number {
  const count = MESSAGES.length;
  const random = Math.floor(Math.random() * count);
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const last = stored === null ? -1 : parseInt(stored, 10);
    const next = Number.isNaN(last) || last < 0 ? random : (last + 1) % count;
    window.localStorage.setItem(STORAGE_KEY, String(next));
    return next;
  } catch {
    return random;
  }
}

/** Shows the whole-number percentage. Only this tiny piece re-renders while loading. */
function Percent({ value }: { value: MotionValue<number> }) {
  const [percent, setPercent] = useState(0);
  useMotionValueEvent(value, 'change', (latest) => setPercent(Math.round(latest * 100)));
  return <>{percent}</>;
}

export function PageIntro() {
  const [show, setShow] = useState(true);
  // Chosen after the page loads, so the server and the browser render the same thing first.
  const [messageIndex, setMessageIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(0);

  useEffect(() => {
    setMessageIndex(pickMessageIndex());
  }, []);

  // Keep the page from scrolling behind the intro, which is easy to trigger on a phone.
  useEffect(() => {
    if (!show) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [show]);

  // The bar and the number share one value, so they always agree and nothing re-renders.
  useEffect(() => {
    progress.set(0);
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const controls = animate(progress, 1, {
      duration: reduceMotion ? 0.3 : 2,
      ease: 'easeInOut',
      onComplete: () => {
        hideTimer = setTimeout(() => setShow(false), 250);
      },
    });
    return () => {
      controls.stop();
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [progress, reduceMotion]);

  const rise = reduceMotion ? 0 : 16;
  const message = messageIndex === null ? null : MESSAGES[messageIndex];
  const MessageIcon = message?.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          aria-label="Loading the portfolio"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-6"
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5 }}
        >
          <div className="flex w-full max-w-xs flex-col items-center gap-6 text-center">
            <p
              aria-label="Yanmife"
              className="flex items-center text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
            >
              {'Yanmife'.split('').map((char, i) => (
                <motion.span
                  key={i}
                  aria-hidden="true"
                  className={i < 4 ? 'text-primary' : undefined}
                  initial={{ opacity: 0, y: rise }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.1 + i * 0.05, duration: reduceMotion ? 0 : 0.4, ease: 'easeOut' }}
                >
                  {char}
                </motion.span>
              ))}
            </p>

            <motion.p
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0, y: rise / 2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.6, duration: reduceMotion ? 0 : 0.4 }}
            >
              UI/UX designer and web developer
            </motion.p>

            <div className="flex w-full flex-col items-center gap-2">
              <div className="h-1.5 w-full max-w-[16rem] overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full w-full origin-left bg-gradient-to-r from-primary to-primary/60"
                  style={{ scaleX: progress }}
                />
              </div>
              <p aria-hidden="true" className="w-12 text-center font-mono text-xs tabular-nums text-muted-foreground">
                <Percent value={progress} />%
              </p>
            </div>

            {/* Reserved height, so the text fading in never pushes anything. */}
            <div className="min-h-[6.5rem] w-full">
              {message && MessageIcon && (
                <motion.div
                  key={messageIndex}
                  className="flex flex-col items-center gap-2"
                  initial={{ opacity: 0, y: rise / 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.8, duration: reduceMotion ? 0 : 0.4 }}
                >
                  <MessageIcon aria-hidden="true" className="h-5 w-5 text-primary" />
                  <p className="text-sm leading-relaxed text-muted-foreground">{message.text}</p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
