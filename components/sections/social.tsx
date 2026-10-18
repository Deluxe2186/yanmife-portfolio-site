'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { motion } from 'framer-motion';
import { socialLinks } from '@/lib/site-config';
import { SectionReveal } from '@/components/section-reveal';
import { SectionHeading } from '@/components/section-heading';

export function SocialSection() {
  const reduceMotion = useReducedMotion();

  return (
    <SectionReveal className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <SectionHeading
        eyebrow="Connect"
        title="Find me elsewhere"
        subtitle="I'm active on these platforms — let's connect."
      />

      <div className="flex flex-wrap gap-3 sm:gap-4">
        {socialLinks.map((link, i) => {
          const Icon = link.icon;
          return (
            <motion.a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-medium transition-all hover:border-primary hover:glow-sm"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              whileHover={reduceMotion ? undefined : { y: -3 }}
              aria-label={link.name}
            >
              {link.wordmark ? (
                <Icon className="h-4 w-[3.25rem] text-muted-foreground transition-colors group-hover:text-primary" />
              ) : (
                <>
                  <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                  <span className="transition-colors group-hover:text-primary">
                    {link.name}
                  </span>
                </>
              )}
            </motion.a>
          );
        })}
      </div>
    </SectionReveal>
  );
}
