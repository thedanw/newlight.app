import { forwardRef } from 'react'
import { Box, Grid, VStack } from 'styled-system/jsx'
import { css } from 'styled-system/css'
import { DroppableZone } from '@/core/dragndrop'
import type { FormFieldDraft } from '../lib/queries'

export interface ColumnContainerProps {
  /** The column_container field this container renders. */
  container: FormFieldDraft
  /** Child fields that live inside this container's columns. */
  children: React.ReactNode
  /** True when the container is the drop target for a dragged field. */
  isDraggingOver?: boolean
  /** Optional className */
  className?: string
}

const columnGridCss = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: '4',
  padding: '4',
  border: '1px dashed var(--colors-border)',
  borderRadius: 'l2',
  background: 'var(--colors-background-subtle)',
})

const emptyColumnCss = css({
  gridColumn: '1 / -1',
  minHeight: '40px',
})

/**
 * ColumnContainer — a `column_container` field rendered as a 12-column CSS grid.
 *
 * Child `column_span`-aware fields are laid out here via the consumer-supplied
 * `children` (each child carries its own `gridColumn` span and drag handle).
 * A top-level `DroppableZone` covers the whole row so fields can still be
 * dropped into the container from the palette.
 */
export const ColumnContainer = forwardRef<HTMLDivElement, ColumnContainerProps>(
  ({ container, children, isDraggingOver = false, className }, ref) => {
    return (
      <Box
        ref={ref}
        data-column-container={container.id}
        className={className}
        data-dragging-over={isDraggingOver ? 'true' : 'false'}
      >
        <VStack align="stretch" gap="2">
          <DroppableZone
            zoneId={`column-${container.id}-root`}
            accepts={['field']}
            className={emptyColumnCss}
          />
          <Grid className={columnGridCss}>{children}</Grid>
        </VStack>
      </Box>
    )
  }
)
ColumnContainer.displayName = 'ColumnContainer'

