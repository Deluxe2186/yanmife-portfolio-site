'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { siteConfig } from '@/lib/site-config';
import { SectionReveal } from '@/components/section-reveal';
import { SectionHeading } from '@/components/section-heading';
import { User } from 'lucide-react';

function CountUp({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [count, setCount] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setCount(value);
      return;
    }
    let raf = 0;
    const duration = 1600;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reduceMotion]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
        {count}+
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function AboutSection() {
  return (
    <SectionReveal id="about" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <SectionHeading
        eyebrow="About"
        title="A bit about me"
        subtitle="Get to know the person behind the work."
      />

      <div className="grid items-center gap-10 sm:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto aspect-square w-full max-w-sm"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5" />
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl border border-border bg-card">
            <User className="h-24 w-24 text-muted-foreground/40" />
          </div>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
            Photo placeholder — replace in admin
          </p>
        </motion.div>

        <div>
          <p className="text-balance text-lg leading-relaxed text-foreground/90">
            {siteConfig.bio}
          </p>
          <p className="mt-4 text-balance text-base leading-relaxed text-muted-foreground">
            I&apos;m currently expanding my skills in data cleaning and normalization,
            and I&apos;m always looking for new projects that challenge me to think
            differently about user experience.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {siteConfig.stats.map((stat) => (
              <CountUp key={stat.label} value={stat.value} label={stat.label} />
            ))}
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
