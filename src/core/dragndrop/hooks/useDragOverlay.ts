import React from 'react';
import { DragOverlay } from '@dnd-kit/core';

interface UseDragOverlayOptions {
  /** Callback to render the overlay content */
  children: (source: { id: string; data: Record<string, unknown> } | null) => React.ReactNode;
  /** Drop animation (use null for CSS keyframes) */
  dropAnimation?: React.ComponentProps<typeof DragOverlay>['dropAnimation'];
}

/**
 * Hook for drag overlay functionality using dnd-kit v8+.
 * 
 * Usage:
 * ```tsx
 * const { DragOverlay: DragOverlayComponent } = useDragOverlay({
 *   children: ({ source }) => (
 *     <div>{source?.data?.label}</div>
 *   ),
 *   dropAnimation: null,
 * });
 * 
 * return <DragOverlayComponent />;
 * ```
 */
export function useDragOverlay({ children, dropAnimation = null }: UseDragOverlayOptions) {
  // The DragOverlay component is used directly in JSX
  // This hook just provides a consistent API
  return {
    DropAnimation: dropAnimation,
    children,
  };
}

/**
 * Pre-configured drag overlay with common styling.
 * 
 * Usage:
 * ```tsx
 * const DragOverlayComponent = useDefaultDragOverlay((source) => (
 *   <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--colors-bg-surface)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
 *     <span style={{ fontWeight: 500 }}>{source?.data?.label}</span>
 *     {source && source.data.childCount > 0 && (
 *       <span style={{ background: 'var(--colors-accent-default)', color: 'var(--colors-accent-fg)', borderRadius: 9999, padding: '0 6px', fontSize: '12px' }}>
 *         {source.data.childCount}
 *       </span>
 *     )}
 *   </div>
 * ));
 * 
 * return <DragOverlayComponent />;
 * ```
 */
export function useDefaultDragOverlay(
  renderContent: (source: { id: string; data: Record<string, unknown> } | null) => React.ReactNode
) {
  return {
    dropAnimation: null,
    children: renderContent,
  };
}