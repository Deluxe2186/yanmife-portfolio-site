'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useSkills } from '@/hooks/use-data';
import { SectionReveal } from '@/components/section-reveal';
import { SectionHeading } from '@/components/section-heading';
import { Skeleton } from '@/components/ui/skeleton';
import type { SkillCategory } from '@/lib/types';

const categoryOrder: SkillCategory[] = ['Design', 'Development', 'Data'];

const categoryIcons: Record<SkillCategory, string> = {
  Design: 'Design tools and methods I use to craft interfaces.',
  Development: 'Technologies I build with.',
  Data: 'Tools for cleaning and making sense of data.',
};

export function SkillsSection() {
  const { skills, loading, error } = useSkills();
  const reduceMotion = useReducedMotion();

  const grouped = categoryOrder.map((cat) => ({
    category: cat,
    items: skills.filter((s) => s.category === cat),
  }));

  return (
    <SectionReveal id="skills" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <SectionHeading
        eyebrow="Skills"
        title="What I work with"
        subtitle="A growing toolkit across design, development, and data."
      />

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Something went wrong loading skills. Please try again later.
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6">
                <Skeleton className="h-6 w-24" />
                <div className="mt-4 flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-8 w-20 rounded-full" />
                  ))}
                </div>
              </div>
            ))
          : grouped.map((group, gi) => (
              <div
                key={group.category}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <h3 className="text-lg font-semibold tracking-tight">
                  {group.category}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {categoryIcons[group.category]}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((skill, si) => (
                    <motion.span
                      key={skill.id}
                      className="rounded-full border border-border bg-secondary px-3.5 py-1.5 text-sm font-medium text-secondary-foreground transition-all hover:border-primary hover:text-primary hover:glow-sm"
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                      whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.3,
                        delay: reduceMotion ? 0 : gi * 0.1 + si * 0.05,
                        type: 'spring',
                        stiffness: 200,
                      }}
                    >
                      {skill.name}
                    </motion.span>
                  ))}
                </div>
              </div>
            ))}
      </div>
    </SectionReveal>
  );
}
