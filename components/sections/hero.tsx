'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { siteConfig } from '@/lib/site-config';
import { MagneticButton } from '@/components/magnetic-button';

function RotatingRoles() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % siteConfig.roles.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  if (reduceMotion) {
    return <span className="text-primary">{siteConfig.roles[0]}</span>;
  }

  return (
    <span className="relative inline-flex">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          className="text-primary"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -24, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {siteConfig.roles[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function Hero() {
  const reduceMotion = useReducedMotion();

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-16"
    >
      <div className="absolute inset-0 -z-10 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute left-1/2 top-1/3 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full glow-ambient" />

      <div className="mx-auto w-full max-w-4xl px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reduceMotion ? 0 : 0.2 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur glow-sm"
        >
          <span className="flex h-2 w-2 rounded-full bg-success glow-sm" />
          Available for freelance work
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: reduceMotion ? 0 : 0.3 }}
          className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
        >
          Hi, I&apos;m Yanmife. I design and build{' '}
          <span className="text-primary glow-text">clean, easy-to-use</span> websites and
          apps.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reduceMotion ? 0 : 0.5 }}
          className="mt-6 text-lg text-muted-foreground sm:text-xl"
        >
          <span>I&apos;m a </span>
          <RotatingRoles />
          <span> based in Lagos, Nigeria.</span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: reduceMotion ? 0 : 0.6 }}
          className="mx-auto mt-4 max-w-xl text-balance text-sm text-muted-foreground sm:text-base"
        >
          I help businesses and individuals turn ideas into thoughtful, accessible
          digital experiences — from first wireframe to final deploy.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reduceMotion ? 0 : 0.7 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <MagneticButton
            onClick={() => scrollTo('#work')}
            className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-shadow hover:glow-lg glow-sm"
          >
            View my work
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </MagneticButton>
          <MagneticButton
            onClick={() => scrollTo('#contact')}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-card px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary hover:glow-sm"
          >
            Hire me
          </MagneticButton>
        </motion.div>
      </div>

      {!reduceMotion && (
        <motion.button
          onClick={() => scrollTo('#work')}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          aria-label="Scroll to work"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-xs">Scroll</span>
            <ArrowDown className="h-4 w-4" />
          </motion.div>
        </motion.button>
      )}
    </section>
  );
}
