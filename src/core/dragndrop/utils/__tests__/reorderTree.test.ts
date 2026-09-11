import { describe, it, expect } from 'vitest';
import { reorderTree } from '../reorderTree';

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  data?: Record<string, unknown>;
}

describe('reorderTree', () => {
  const tree: TreeNode[] = [
    { id: '1', label: 'Root 1', children: [
      { id: '1-1', label: 'Child 1-1' },
      { id: '1-2', label: 'Child 1-2' }
    ]},
    { id: '2', label: 'Root 2', children: [
      { id: '2-1', label: 'Child 2-1' }
    ]}
  ];

  it('reorders items within the same parent', () => {
    const result = reorderTree(tree, '1-2', '1-1'); // Move 1-2 before 1-1

    expect(result[0].children?.[0].id).toBe('1-2');
    expect(result[0].children?.[1].id).toBe('1-1');
  });

  it('moves item to a different parent', () => {
    const result = reorderTree(tree, '1-1', '2-1'); // Move 1-1 to be child of 2

    expect(result[0].children).toHaveLength(1);
    expect(result[0].children?.[0].id).toBe('1-2');
    expect(result[1].children).toHaveLength(2);
    expect(result[1].children?.[0].id).toBe('2-1');
    expect(result[1].children?.[1].id).toBe('1-1');
  });

  it('moves item to root level', () => {
    const result = reorderTree(tree, '1-1', null); // Move 1-1 to root

    expect(result).toHaveLength(3);
    expect(result.find(n => n.id === '1-1')).toBeDefined();
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children?.[0].id).toBe('1-2');
  });

  it('moves root item to be child of another root', () => {
    const result = reorderTree(tree, '2', '1'); // Move root 2 to be child of 1

    expect(result).toHaveLength(1);
    expect(result[0].children).toHaveLength(3);
    expect(result[0].children?.map(c => c.id)).toEqual(['1-1', '1-2', '2']);
  });

  it('does not mutate original tree', () => {
    const originalTree = JSON.parse(JSON.stringify(tree));
    reorderTree(tree, '1-2', '1-1');
    expect(tree).toEqual(originalTree);
  });

  it('handles moving to end of children list', () => {
    const result = reorderTree(tree, '1-1', '1-2'); // Move 1-1 after 1-2 (same position)

    expect(result[0].children?.[0].id).toBe('1-1');
    expect(result[0].children?.[1].id).toBe('1-2');
  });

  it('throws when item not found', () => {
    expect(() => reorderTree(tree, 'nonexistent', '1-1')).toThrow('Item not found: nonexistent');
  });

  it('throws when target not found', () => {
    expect(() => reorderTree(tree, '1-1', 'nonexistent')).toThrow('Target not found: nonexistent');
  });

  it('throws when moving item to be its own descendant', () => {
    expect(() => reorderTree(tree, '1', '1-1')).toThrow('Cannot move item to be its own descendant');
  });

  it('preserves data and other properties', () => {
    const treeWithData: TreeNode[] = [
      { id: '1', label: 'Root', data: { custom: 'value' }, children: [
        { id: '1-1', label: 'Child', data: { childData: true } }
      ]}
    ];

    const result = reorderTree(treeWithData, '1-1', null);
    expect(result.find(n => n.id === '1-1')?.data).toEqual({ childData: true });
    expect(result.find(n => n.id === '1')?.data).toEqual({ custom: 'value' });
  });
});