import { Skeleton } from '@/components/ui/skeleton';

/** Same widths as the cards in a project row, so nothing jumps when data arrives. */
export const ROW_CARD_WIDTH =
  'w-[72%] flex-none snap-start sm:w-[calc((100%_-_1rem)/2)] md:w-[calc((100%_-_2rem)/3)] lg:w-[calc((100%_-_3rem)/4)]';

export function ProjectSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-3 sm:p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-4/5" />
      </div>
    </div>
  );
}

/** A placeholder row while projects load: a title, a button and a few cards. */
export function ProjectRowSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
        <div>
          <Skeleton className="h-6 w-32 sm:h-7 sm:w-40" />
          <Skeleton className="mt-2 h-3 w-20" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="-mx-4 flex gap-4 overflow-hidden px-4 sm:-mx-6 sm:px-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={ROW_CARD_WIDTH}>
            <ProjectSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}
