'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { siteConfig } from '@/lib/site-config';
import { SectionReveal } from '@/components/section-reveal';
import { SectionHeading } from '@/components/section-heading';
import { SlotNumber } from '@/components/slot-number';
import { User } from 'lucide-react';
import { useProfilePhoto } from '@/hooks/use-data';

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
        <SlotNumber value={value} suffix="+" />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function AboutSection() {
  const { url: photoUrl } = useProfilePhoto();
  const [photoBroken, setPhotoBroken] = useState(false);

  return (
    <SectionReveal id="about" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="grid gap-10 sm:grid-cols-[1fr_2fr] lg:gap-16">
        <div className="sm:col-span-2">
          <SectionHeading
            eyebrow="About"
            title="A bit about me"
            subtitle="Who I am and what I do."
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative aspect-square w-full max-w-xs"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5" />
          <div className="absolute inset-0 overflow-hidden rounded-3xl border border-border bg-card">
            {photoUrl && !photoBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={`Portrait of ${siteConfig.name}`}
                onError={() => setPhotoBroken(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-24 w-24 text-muted-foreground/40" />
              </div>
            )}
          </div>
          {(!photoUrl || photoBroken) && process.env.NODE_ENV === 'development' && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
              Photo placeholder. Upload yours in Admin, then Profile.
            </p>
          )}
        </motion.div>

        <div>
          <p className="text-balance text-lg leading-relaxed text-foreground/90">
            {siteConfig.bio}
          </p>
          <p className="mt-4 text-balance text-base leading-relaxed text-muted-foreground">
            Lately I&apos;ve been learning data cleaning and normalization,
            mostly in Excel. I like projects where I have to think hard about
            how people will actually use the thing.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {siteConfig.stats.map((stat) => (
              <Stat key={stat.label} value={stat.value} label={stat.label} />
            ))}
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
