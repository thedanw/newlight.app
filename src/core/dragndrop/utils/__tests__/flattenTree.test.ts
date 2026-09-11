import { describe, it, expect } from 'vitest';
import { flattenTree } from '../flattenTree';

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  data?: Record<string, unknown>;
}

describe('flattenTree', () => {
  it('flattens a simple tree to flat array with depth and path', () => {
    const tree: TreeNode[] = [
      { id: '1', label: 'Root 1', children: [
        { id: '1-1', label: 'Child 1-1' },
        { id: '1-2', label: 'Child 1-2', children: [
          { id: '1-2-1', label: 'Grandchild 1-2-1' }
        ]}
      ]},
      { id: '2', label: 'Root 2' }
    ];

    const result = flattenTree(tree);

    expect(result.items).toHaveLength(5);
    expect(result.items[0]).toEqual({ id: '1', label: 'Root 1', depth: 0, path: ['1'], parentId: null, data: undefined });
    expect(result.items[1]).toEqual({ id: '1-1', label: 'Child 1-1', depth: 1, path: ['1', '1-1'], parentId: '1', data: undefined });
    expect(result.items[2]).toEqual({ id: '1-2', label: 'Child 1-2', depth: 1, path: ['1', '1-2'], parentId: '1', data: undefined });
    expect(result.items[3]).toEqual({ id: '1-2-1', label: 'Grandchild 1-2-1', depth: 2, path: ['1', '1-2', '1-2-1'], parentId: '1-2', data: undefined });
    expect(result.items[4]).toEqual({ id: '2', label: 'Root 2', depth: 0, path: ['2'], parentId: null, data: undefined });
  });

  it('returns itemMap for O(1) lookups', () => {
    const tree: TreeNode[] = [
      { id: '1', label: 'Root 1', children: [
        { id: '1-1', label: 'Child 1-1' }
      ]}
    ];

    const result = flattenTree(tree);

    expect(result.itemMap.get('1')).toBeDefined();
    expect(result.itemMap.get('1-1')).toBeDefined();
    expect(result.itemMap.get('1')?.depth).toBe(0);
    expect(result.itemMap.get('1-1')?.depth).toBe(1);
  });

  it('handles empty tree', () => {
    const result = flattenTree([]);
    expect(result.items).toHaveLength(0);
    expect(result.itemMap.size).toBe(0);
  });

  it('preserves custom data', () => {
    const tree: TreeNode[] = [
      { id: '1', label: 'Root', data: { custom: 'value' } }
    ];

    const result = flattenTree(tree);
    expect(result.items[0].data).toEqual({ custom: 'value' });
  });

  it('handles deep nesting', () => {
    const tree: TreeNode[] = [
      { id: '1', label: 'Level 1', children: [
        { id: '2', label: 'Level 2', children: [
          { id: '3', label: 'Level 3', children: [
            { id: '4', label: 'Level 4' }
          ]}
        ]}
      ]}
    ];

    const result = flattenTree(tree);
    expect(result.items).toHaveLength(4);
    expect(result.items[3].depth).toBe(3);
    expect(result.items[3].path).toEqual(['1', '2', '3', '4']);
  });
});