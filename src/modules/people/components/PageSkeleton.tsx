import { Skeleton, SkeletonText } from '@/core/ui'

type PageSkeletonProps = {
  /** Number of content lines to render below the header. */
  lines?: number
}

/**
 * Reusable loading placeholder for People pages: a header bar plus a block of
 * skeleton text lines. Replaces bare `Loader`/text loading states.
 */
export function PageSkeleton({ lines = 4 }: PageSkeletonProps) {
  return (
    <div>
      <Skeleton height="8" width="40%" />
      <SkeletonText noOfLines={lines} />
    </div>
  )
}
