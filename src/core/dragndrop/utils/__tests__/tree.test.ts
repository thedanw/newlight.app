import { describe, it, expect } from 'vitest';
import {
  flattenTree,
  buildTree,
  getDragDepth,
  getProjection,
  getDescendants,
} from '../tree';
import type { TreeNode } from '../../types';

const tree: TreeNode[] = [
  {
    id: '1',
    label: 'Root 1',
    children: [
      { id: '1-1', label: 'Child 1-1' },
      {
        id: '1-2',
        label: 'Child 1-2',
        children: [{ id: '1-2-1', label: 'Grandchild 1-2-1' }],
      },
    ],
  },
  { id: '2', label: 'Root 2' },
];

describe('flattenTree', () => {
  it('flattens a nested tree with parentId/depth/index', () => {
    const flat = flattenTree(tree);
    expect(flat.map((i) => i.id)).toEqual(['1', '1-1', '1-2', '1-2-1', '2']);
    expect(flat[0]).toMatchObject({ parentId: null, depth: 0, index: 0 });
    expect(flat[1]).toMatchObject({ parentId: '1', depth: 1, index: 0 });
    expect(flat[2]).toMatchObject({ parentId: '1', depth: 1, index: 1 });
    expect(flat[3]).toMatchObject({ parentId: '1-2', depth: 2, index: 0 });
    expect(flat[4]).toMatchObject({ parentId: null, depth: 0, index: 1 });
  });

  it('preserves children arrays for hasChildren checks', () => {
    const flat = flattenTree(tree);
    expect(flat[0].children).toHaveLength(2); // Root 1 → [1-1, 1-2]
    expect(flat[2].children).toHaveLength(1); // 1-2 → [1-2-1]
    expect(flat[1].children).toBeUndefined(); // 1-1 is a leaf
  });

  it('returns empty array for empty tree', () => {
    expect(flattenTree([])).toEqual([]);
  });
});

describe('buildTree', () => {
  it('rebuilds a nested tree from flattened items', () => {
    const flat = flattenTree(tree);
    const rebuilt = buildTree(flat);
    expect(rebuilt).toEqual(tree);
  });

  it('handles reordered flattened items', () => {
    const flat = flattenTree(tree);
    // Move 2 to be a child of 1
    const modified = flat.map((item) =>
      item.id === '2' ? { ...item, parentId: '1', depth: 1 } : item
    );
    const rebuilt = buildTree(modified);
    expect(rebuilt[0].children?.map((c) => c.id)).toContain('2');
  });

  it('promotes orphans to roots when parent is missing', () => {
    const flat = flattenTree(tree);
    const orphan = flat.map((item) =>
      item.id === '1-1' ? { ...item, parentId: 'nonexistent' } : item
    );
    const rebuilt = buildTree(orphan);
    // 1-1 should be a root since its parent doesn't exist
    expect(rebuilt.map((r) => r.id)).toContain('1-1');
  });
});

describe('getDragDepth', () => {
  it('rounds offset to nearest depth level', () => {
    expect(getDragDepth(0, 24)).toBe(0);
    expect(getDragDepth(24, 24)).toBe(1);
    expect(getDragDepth(30, 24)).toBe(1);
    expect(getDragDepth(48, 24)).toBe(2);
    expect(getDragDepth(-24, 24)).toBe(-1);
  });
});

describe('getProjection', () => {
  const flat = flattenTree(tree); // [1(d0), 1-1(d1), 1-2(d1), 1-2-1(d2), 2(d0)]

  it('returns null parent for depth 0', () => {
    const proj = getProjection(flat, '2', 0);
    expect(proj.depth).toBe(0);
    expect(proj.parentId).toBeNull();
  });

  it('nests an item under the previous item when depth exceeds its depth', () => {
    // Drag 2 over 1-1 with projected depth 1 → parent should be 1
    const proj = getProjection(flat, '1-1', 1);
    expect(proj.depth).toBe(1);
    expect(proj.parentId).toBe('1');
  });

  it('keeps sibling depth when projected depth matches previous sibling', () => {
    // Drag 2 over 1-2-1 with projected depth 1 → sibling of 1-2 under 1
    const proj = getProjection(flat, '1-2-1', 1);
    expect(proj.depth).toBe(1);
    expect(proj.parentId).toBe('1');
  });

  it('clamps depth to maxDepth', () => {
    // Drag 1-1 over 1-2 with projected depth 3 → clamped to 2
    const proj = getProjection(flat, '1-2', 3);
    expect(proj.depth).toBe(2);
    expect(proj.parentId).toBe('1-1');
  });

  it('clamps depth to minDepth', () => {
    // Drag 1-2-1 over 1-1 with projected depth 0 → clamped up to 1
    const proj = getProjection(flat, '1-1', 0);
    expect(proj.depth).toBe(1);
    expect(proj.parentId).toBe('1');
  });
});

describe('getDescendants', () => {
  it('returns all descendants recursively', () => {
    const flat = flattenTree(tree);
    const descendants = getDescendants(flat, '1');
    expect([...descendants]).toEqual(['1-1', '1-2', '1-2-1']);
  });

  it('returns empty set for leaf nodes', () => {
    const flat = flattenTree(tree);
    expect(getDescendants(flat, '1-1').size).toBe(0);
  });
});
