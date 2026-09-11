/**
 * CSS keyframe animations for drag-and-drop interactions.
 * These keyframes are designed to be added to global CSS (src/index.css).
 * All animations respect prefers-reduced-motion.
 */

export const cssKeyframes = {
  /**
   * Animation for when a draggable item enters a drop zone.
   * Fades in and scales up slightly.
   */
  dragEnter: `
@keyframes dnd-drag-enter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  @keyframes dnd-drag-enter {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 1; transform: scale(1); }
  }
}
`,

  /**
   * Animation for when a draggable item leaves a drop zone.
   * Fades out and scales down slightly.
   */
  dragLeave: `
@keyframes dnd-drag-leave {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

@media (prefers-reduced-motion: reduce) {
  @keyframes dnd-drag-leave {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 1; transform: scale(1); }
  }
}
`,

  /**
   * Animation for drop zone hover state during drag.
   * Pulses background and border color.
   */
  dragOver: `
@keyframes dnd-drag-over {
  0%, 100% {
    background-color: var(--dnd-drop-bg, transparent);
    border-color: var(--dnd-drop-border, transparent);
  }
  50% {
    background-color: var(--dnd-drop-bg-hover, rgba(59, 130, 246, 0.1));
    border-color: var(--dnd-drop-border-hover, rgb(59, 130, 246));
  }
}

@media (prefers-reduced-motion: reduce) {
  @keyframes dnd-drag-over {
    0%, 100% {
      background-color: var(--dnd-drop-bg, transparent);
      border-color: var(--dnd-drop-border, transparent);
    }
    50% {
      background-color: var(--dnd-drop-bg, transparent);
      border-color: var(--dnd-drop-border, transparent);
    }
  }
}
`,

  /**
   * Animation for the drag preview (ghost element).
   * Scales up and adds elevation shadow.
   */
  dragPreview: `
@keyframes dnd-drag-preview {
  from {
    transform: scale(1);
    box-shadow: var(--dnd-preview-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
  }
  to {
    transform: scale(1.02);
    box-shadow: var(--dnd-preview-shadow-lg, 0 25px 50px -12px rgb(0 0 0 / 0.25));
  }
}

@media (prefers-reduced-motion: reduce) {
  @keyframes dnd-drag-preview {
    from { transform: scale(1); box-shadow: var(--dnd-preview-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05)); }
    to { transform: scale(1); box-shadow: var(--dnd-preview-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05)); }
  }
}
`,

  /**
   * Combined keyframes string for easy injection into global CSS.
   */
  get all(): string {
    return [
      this.dragEnter,
      this.dragLeave,
      this.dragOver,
      this.dragPreview,
    ].join('\n');
  },
};