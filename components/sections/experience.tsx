'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Briefcase } from 'lucide-react';
import { useExperience } from '@/hooks/use-data';
import { SectionReveal } from '@/components/section-reveal';
import { SectionHeading } from '@/components/section-heading';
import { Skeleton } from '@/components/ui/skeleton';

function formatDate(dateStr: string | null, isCurrent?: boolean): string {
  if (!dateStr && isCurrent) return 'Present';
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const mi = parseInt(month, 10) - 1;
  if (mi < 0 || mi > 11) return dateStr;
  return `${months[mi]} ${year}`;
}

export function ExperienceSection() {
  const { experience, loading, error } = useExperience();
  const reduceMotion = useReducedMotion();

  return (
    <SectionReveal id="experience" className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
      <SectionHeading
        eyebrow="Experience"
        title="Where I've worked"
        subtitle="My journey so far — from internship to freelance."
      />

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Something went wrong loading experience. Please try again later.
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-6">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="mt-2 h-4 w-32" />
                <Skeleton className="mt-3 h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-2 bottom-2 w-px bg-border" aria-hidden />

          <div className="space-y-10">
            {experience.map((exp, i) => (
              <motion.div
                key={exp.id}
                className="relative flex gap-6"
                initial={reduceMotion ? false : { opacity: 0, x: -20 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background glow-sm">
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>

                <div className="flex-1 pb-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg font-semibold tracking-tight">
                      {exp.role}
                    </h3>
                    <span className="text-xs font-medium text-muted-foreground">
                      {formatDate(exp.start_date)} —{' '}
                      {formatDate(exp.end_date, !exp.end_date)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-primary">{exp.company}</p>
                  {exp.description && (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {exp.description}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </SectionReveal>
  );
}
