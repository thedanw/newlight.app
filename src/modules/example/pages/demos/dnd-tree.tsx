'use client'
import { useState, type ReactNode } from 'react'
import { Heading, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { SortableTree } from '@/core/dragndrop'
import type { TreeNode } from '@/core/dragndrop/types'

/* ---------------------------------------------------------------------------
   Drag & Drop Tree Demo — hierarchical reorder with @dnd-kit.
   Two trees: a nested category tree (3+ levels) and a people org chart.
   Drag the handle to reorder siblings or reparent; use the chevron to
   expand/collapse branches.
--------------------------------------------------------------------------- */

// Nested categories — 3 levels deep
const categoryTree: TreeNode[] = [
  {
    id: 'ministries',
    label: 'Ministries',
    children: [
      {
        id: 'children-youth',
        label: 'Children & Youth',
        children: [
          { id: 'kindy', label: 'Kindy' },
          { id: 'primary', label: 'Primary' },
          { id: 'youth', label: 'Youth Group' },
        ],
      },
      {
        id: 'worship',
        label: 'Worship',
        children: [
          { id: 'band', label: 'Band' },
          { id: 'sound-av', label: 'Sound & AV' },
        ],
      },
      { id: 'pastoral', label: 'Pastoral Care' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    children: [
      { id: 'facilities', label: 'Facilities' },
      { id: 'finance', label: 'Finance' },
    ],
  },
  { id: 'missions', label: 'Missions' },
]

// People org chart — reporting lines
const orgChart: TreeNode[] = [
  {
    id: 'lead-pastor',
    label: 'Lead Pastor',
    children: [
      {
        id: 'ministry-lead',
        label: 'Ministry Lead',
        children: [
          { id: 'children-lead', label: "Children's Ministry Lead" },
          { id: 'worship-lead', label: 'Worship Lead' },
        ],
      },
      {
        id: 'ops-lead',
        label: 'Operations Lead',
        children: [
          { id: 'facilities-coord', label: 'Facilities Coordinator' },
          { id: 'finance-admin', label: 'Finance Admin' },
        ],
      },
    ],
  },
]

export function DndTreeDemo() {
  const [categories, setCategories] = useState<TreeNode[]>(categoryTree)
  const [org, setOrg] = useState<TreeNode[]>(orgChart)

  return (
    <Stack gap="6" width="full">
      <Stack gap="2">
        <Heading textStyle="md">Categories</Heading>
        <Text textStyle="sm" color="fg.muted">
          Drag the handle to reorder siblings or move a node to a new parent.
          Use the chevron to expand or collapse a branch.
        </Text>
        <SortableTree tree={categories} onReorder={setCategories} />
      </Stack>

      <Stack gap="2">
        <Heading textStyle="md">People Org Chart</Heading>
        <Text textStyle="sm" color="fg.muted">
          A hierarchical org chart — drag to restructure reporting lines.
        </Text>
        <SortableTree tree={org} onReorder={setOrg} />
      </Stack>
    </Stack>
  )
}

export const dndTreeDemos: Record<string, ReactNode> = {
  SortableTree: <DndTreeDemo />,
}