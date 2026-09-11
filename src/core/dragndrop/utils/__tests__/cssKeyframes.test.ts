import { describe, it, expect } from 'vitest';
import { cssKeyframes } from '../cssKeyframes';

describe('cssKeyframes', () => {
  it('exports keyframe strings for drag animations', () => {
    expect(cssKeyframes).toBeDefined();
    expect(typeof cssKeyframes.dragEnter).toBe('string');
    expect(typeof cssKeyframes.dragLeave).toBe('string');
    expect(typeof cssKeyframes.dragOver).toBe('string');
    expect(typeof cssKeyframes.dragPreview).toBe('string');
  });

  it('dragEnter keyframe animates opacity and transform', () => {
    expect(cssKeyframes.dragEnter).toContain('@keyframes');
    expect(cssKeyframes.dragEnter).toContain('dnd-drag-enter');
    expect(cssKeyframes.dragEnter).toContain('opacity');
    expect(cssKeyframes.dragEnter).toContain('transform');
  });

  it('dragLeave keyframe animates opacity and transform', () => {
    expect(cssKeyframes.dragLeave).toContain('@keyframes');
    expect(cssKeyframes.dragLeave).toContain('dnd-drag-leave');
    expect(cssKeyframes.dragLeave).toContain('opacity');
    expect(cssKeyframes.dragLeave).toContain('transform');
  });

  it('dragOver keyframe animates background and border', () => {
    expect(cssKeyframes.dragOver).toContain('@keyframes');
    expect(cssKeyframes.dragOver).toContain('dnd-drag-over');
    expect(cssKeyframes.dragOver).toContain('background');
    expect(cssKeyframes.dragOver).toContain('border');
  });

  it('dragPreview keyframe animates scale and box-shadow', () => {
    expect(cssKeyframes.dragPreview).toContain('@keyframes');
    expect(cssKeyframes.dragPreview).toContain('dnd-drag-preview');
    expect(cssKeyframes.dragPreview).toContain('scale');
    expect(cssKeyframes.dragPreview).toContain('box-shadow');
  });

  it('respects reduced motion preference', () => {
    expect(cssKeyframes.dragEnter).toContain('prefers-reduced-motion');
    expect(cssKeyframes.dragLeave).toContain('prefers-reduced-motion');
    expect(cssKeyframes.dragOver).toContain('prefers-reduced-motion');
    expect(cssKeyframes.dragPreview).toContain('prefers-reduced-motion');
  });
});