'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useProjects, useCategories } from '@/hooks/use-data';
import type { Project } from '@/lib/types';
import { COVER_WIDTH, COVER_HEIGHT } from '@/lib/image-sizes';
import { SectionReveal } from '@/components/section-reveal';
import { SectionHeading } from '@/components/section-heading';
import { ProjectRowSkeleton, ROW_CARD_WIDTH } from '@/components/project-skeleton';
import { ProjectDetail } from '@/components/project-detail';

interface CategoryGroup {
  name: string;
  projects: Project[];
}

function countLabel(count: number) {
  return `${count} ${count === 1 ? 'project' : 'projects'}`;
}

export function WorkSection() {
  const { projects, loading, error } = useProjects();
  const { categories: categoryRows } = useCategories();
  const [selected, setSelected] = useState<Project | null>(null);
  // The category whose full list is open ("See more"). null means the rows.
  const [expanded, setExpanded] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const openedFromLink = useRef(false);

  const openProject = useCallback((project: Project) => {
    setSelected(project);
    window.history.replaceState(null, '', `#project-${encodeURIComponent(project.slug)}`);
  }, []);
  const closeProject = useCallback(() => {
    setSelected(null);
    window.history.replaceState(null, '', '#work');
  }, []);

  // A link like /#project-my-project opens that project when the page loads.
  useEffect(() => {
    if (openedFromLink.current || projects.length === 0) return;
    openedFromLink.current = true;
    const match = window.location.hash.match(/^#project-(.+)$/);
    if (!match) return;
    const found = projects.find((p) => p.slug === decodeURIComponent(match[1]));
    if (found) setSelected(found);
  }, [projects]);

  // One row per category, in the order you set in the admin. A category with
  // no projects is left out, so nobody scrolls an empty row.
  const groups = useMemo<CategoryGroup[]>(() => {
    const byName = new Map<string, Project[]>();
    for (const project of projects) {
      const name = project.category?.trim() || 'Other';
      const list = byName.get(name);
      if (list) list.push(project);
      else byName.set(name, [project]);
    }
    const ordered = categoryRows.map((c) => c.name).filter((name) => byName.has(name));
    const extra = Array.from(byName.keys()).filter((name) => !ordered.includes(name));
    return [...ordered, ...extra].map((name) => ({ name, projects: byName.get(name) ?? [] }));
  }, [projects, categoryRows]);

  // If the open category disappears (for example it was removed), show the rows again.
  const expandedGroup = groups.find((g) => g.name === expanded) ?? null;

  const scrollToWork = useCallback(() => {
    requestAnimationFrame(() => {
      document
        .getElementById('work')
        ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  }, [reduceMotion]);

  const seeMore = useCallback(
    (name: string) => {
      setExpanded(name);
      scrollToWork();
    },
    [scrollToWork],
  );
  const backToRows = useCallback(() => {
    setExpanded(null);
    scrollToWork();
  }, [scrollToWork]);

  return (
    <SectionReveal id="work" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <SectionHeading
        eyebrow="Work"
        title="Selected Projects"
        subtitle="Here is some of what I have made. Browse each row, then open a project to read the full story."
      />

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Something went wrong loading projects. Please try again later.
          {process.env.NODE_ENV === 'development' && (
            <span className="mt-2 block font-mono text-xs opacity-80">{error}</span>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-10 sm:space-y-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProjectRowSkeleton key={i} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 p-12 text-center">
          <p className="text-muted-foreground">No projects here yet. Check back soon.</p>
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={expandedGroup ? `all-${expandedGroup.name}` : 'rows'}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
          >
            {expandedGroup ? (
              <CategoryGrid group={expandedGroup} onBack={backToRows} onOpen={openProject} />
            ) : (
              <div className="space-y-10 sm:space-y-12">
                {groups.map((group) => (
                  <ProjectRow
                    key={group.name}
                    group={group}
                    onOpen={openProject}
                    onSeeMore={() => seeMore(group.name)}
                    reduceMotion={reduceMotion}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {selected && <ProjectDetail project={selected} onClose={closeProject} />}
      </AnimatePresence>
    </SectionReveal>
  );
}

/** One category as a sideways row, with arrows at both ends and a See more button. */
function ProjectRow({
  group,
  onOpen,
  onSeeMore,
  reduceMotion,
}: {
  group: CategoryGroup;
  onOpen: (project: Project) => void;
  onSeeMore: () => void;
  reduceMotion: boolean;
}) {
  const headingId = useId();
  const scroller = useRef<HTMLDivElement>(null);
  // Both start as true so no arrows show until we have measured the row.
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 4;
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 4;
    setEdges((prev) => (prev.atStart === atStart && prev.atEnd === atEnd ? prev : { atStart, atEnd }));
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure, group.projects.length]);

  const page = (direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({
      left: direction * el.clientWidth * 0.85,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
        <div className="min-w-0">
          <h3 id={headingId} className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
            {group.name}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            {countLabel(group.projects.length)}
          </p>
        </div>
        <button
          type="button"
          onClick={onSeeMore}
          aria-label={`See more ${group.name} projects`}
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          See more
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* flow-root keeps the scroller's negative margins from leaking out of this box. */}
      <div className="group/row relative flow-root">
        <div
          ref={scroller}
          onScroll={measure}
          className="scrollbar-hide -mx-4 -my-4 flex snap-x snap-proximity scroll-px-4 gap-4 overflow-x-auto overscroll-x-contain px-4 py-4 sm:-mx-6 sm:scroll-px-6 sm:px-6"
        >
          {group.projects.map((project) => (
            <div key={project.id} className={ROW_CARD_WIDTH}>
              <ProjectCard project={project} onOpen={() => onOpen(project)} />
            </div>
          ))}
        </div>

        {!edges.atStart && <ArrowButton direction="left" onClick={() => page(-1)} />}
        {!edges.atEnd && <ArrowButton direction="right" onClick={() => page(1)} />}
      </div>
    </section>
  );
}

/**
 * The strip at either end of a row. On a phone it is always there (there is no
 * hover on touch). On a computer it fades in when the mouse is over the row.
 */
function ArrowButton({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
  const left = direction === 'left';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={left ? 'Show earlier projects' : 'Show more projects'}
      className={`absolute inset-y-0 z-10 flex w-11 items-center transition-opacity duration-200 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none sm:w-14 md:opacity-0 md:group-hover/row:opacity-100 ${
        left
          ? 'left-0 justify-start bg-gradient-to-r from-background/95 to-transparent pl-1'
          : 'right-0 justify-end bg-gradient-to-l from-background/95 to-transparent pr-1'
      }`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-md backdrop-blur transition-colors [@media(hover:hover)]:hover:border-primary [@media(hover:hover)]:hover:text-primary">
        {left ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </span>
    </button>
  );
}

/** All the projects in one category, as a grid. */
function CategoryGrid({
  group,
  onBack,
  onOpen,
}: {
  group: CategoryGroup;
  onBack: () => void;
  onOpen: (project: Project) => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" />
        All projects
      </button>
      <div className="mb-6">
        <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">{group.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{countLabel(group.projects.length)}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {group.projects.map((project) => (
          <ProjectCard key={project.id} project={project} onOpen={() => onOpen(project)} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const image = project.cover_image_url ?? project.images?.[0]?.url ?? null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group/card block w-full overflow-hidden rounded-xl border border-border bg-card text-left transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:border-primary/40 [@media(hover:hover)]:hover:shadow-lg motion-reduce:[@media(hover:hover)]:hover:translate-y-0"
    >
      <span className="relative block aspect-[4/3] overflow-hidden bg-muted">
        {image && (
          // The title below already names the project, so the picture needs no alt text.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            width={COVER_WIDTH}
            height={COVER_HEIGHT}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 motion-reduce:transition-none [@media(hover:hover)]:group-hover/card:scale-105 motion-reduce:[@media(hover:hover)]:group-hover/card:scale-100"
          />
        )}
      </span>
      <span className="block p-3 sm:p-4">
        <span className="block truncate text-sm font-semibold sm:text-base">{project.title}</span>
        <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground sm:text-sm">
          {project.overview}
        </span>
      </span>
    </button>
  );
}
