'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, MousePointerClick, X, ExternalLink, Figma } from 'lucide-react';
import { useProjects, useCategories } from '@/hooks/use-data';
import type { Project } from '@/lib/types';
import { COVER_WIDTH, COVER_HEIGHT } from '@/lib/image-sizes';
import { SectionReveal } from '@/components/section-reveal';
import { SectionHeading } from '@/components/section-heading';
import { ProjectSkeleton } from '@/components/project-skeleton';
import { Button } from '@/components/ui/button';

export function WorkSection() {
  const { projects, loading, error } = useProjects();
  const { categories: categoryRows } = useCategories();
  const [chosen, setFilter] = useState('All');
  const [selected, setSelected] = useState<Project | null>(null);
  const reduceMotion = useReducedMotion();

  // Filter buttons come from your categories, in your order. A category with
  // no projects is left out, so nobody clicks into an empty list.
  const categories = useMemo(() => {
    const used = new Set(projects.map((p) => p.category).filter(Boolean));
    const ordered = categoryRows.map((c) => c.name).filter((name) => used.has(name));
    const extra = Array.from(used).filter((name) => !ordered.includes(name));
    return ['All', ...ordered, ...extra];
  }, [projects, categoryRows]);

  // If the chosen category disappears (for example it was removed), go back to All.
  const filter = categories.includes(chosen) ? chosen : 'All';

  const filtered = useMemo(() => {
    if (filter === 'All') return projects;
    return projects.filter((p) => p.category === filter);
  }, [projects, filter]);

  return (
    <SectionReveal id="work" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <SectionHeading
        eyebrow="Work"
        title="Selected Projects"
        subtitle="Some of my UI/UX and web work. Click a project to read more."
      />

      {/* One category (or none) means there is nothing to filter, so hide the buttons. */}
      <div className={`mb-10 flex flex-wrap items-center gap-2 ${categories.length <= 2 ? 'hidden' : ''}`}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === cat
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {filter === cat && (
              <motion.div
                layoutId="filter-pill"
                className="absolute inset-0 rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10">{cat}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Something went wrong loading projects. Please try again later.
          {process.env.NODE_ENV === 'development' && (
            <span className="mt-2 block font-mono text-xs opacity-80">{error}</span>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProjectSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 p-12 text-center">
          <p className="text-muted-foreground">No projects in this category yet.</p>
        </div>
      ) : (
        <motion.div
          className="grid gap-6 sm:grid-cols-2"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => setSelected(project)}
                reduceMotion={reduceMotion}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {selected && (
          <ProjectModal project={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </SectionReveal>
  );
}

function ProjectCard({
  project,
  onClick,
  reduceMotion,
}: {
  project: Project;
  onClick: () => void;
  reduceMotion: boolean | null;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      whileHover={reduceMotion ? undefined : { y: -6 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg hover:glow-sm"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {project.cover_image_url && (
          <motion.img
            src={project.cover_image_url}
            alt={project.title}
            width={COVER_WIDTH}
            height={COVER_HEIGHT}
            className="h-full w-full object-cover"
            animate={reduceMotion ? undefined : { scale: hovered ? 1.05 : 1 }}
            transition={{ duration: 0.4 }}
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="absolute right-3 top-3">
          <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
            {project.category}
          </span>
        </div>
        {hovered && !reduceMotion && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur"
          >
            <MousePointerClick className="h-3.5 w-3.5" />
            Click to view
          </motion.div>
        )}
        <motion.div
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground glow-sm"
          animate={reduceMotion ? undefined : { scale: hovered ? 1 : 0, x: hovered ? 0 : 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <ArrowUpRight className="h-4 w-4" />
        </motion.div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold tracking-tight">{project.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
          {project.overview}
        </p>
      </div>
    </motion.div>
  );
}

function ProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative my-8 w-full max-w-3xl overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-xl glow-lg"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur transition-colors hover:bg-background"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {project.cover_image_url && (
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={project.cover_image_url}
              alt={project.title}
              width={COVER_WIDTH}
              height={COVER_HEIGHT}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="max-h-[50vh] overflow-y-auto p-6 sm:p-8">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {project.category}
            </span>
            {project.featured && (
              <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                Featured
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {project.title}
          </h2>
          <p className="mt-3 text-muted-foreground">{project.overview}</p>

          {project.description && (
            <p className="mt-4 text-sm leading-relaxed text-foreground/80">
              {project.description}
            </p>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {project.role && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  My Role
                </p>
                <p className="mt-1 text-sm font-medium">{project.role}</p>
              </div>
            )}
            {project.tools.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tools Used
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {project.tools.map((tool) => (
                    <span
                      key={tool}
                      className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {project.live_url && (
              <Button asChild>
                <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View live
                </a>
              </Button>
            )}
            {project.figma_url && (
              <Button variant="outline" asChild>
                <a href={project.figma_url} target="_blank" rel="noopener noreferrer">
                  <Figma className="mr-2 h-4 w-4" />
                  View in Figma
                </a>
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
