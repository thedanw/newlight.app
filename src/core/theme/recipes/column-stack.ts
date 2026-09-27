import { defineRecipe } from '@pandacss/dev'

/**
 * ColumnStack Recipe - A flexible column/grid layout component
 * 
 * Usage Examples:
 * 
 * // Basic vertical stack (default)
 * <ColumnStack>
 *   <Item>1</Item>
 *   <Item>2</Item>
 *   <Item>3</Item>
 * </ColumnStack>
 * 
 * // 2 equal columns, stack on medium screens and below
 * <ColumnStack layout="2" stack="md">
 *   <Item>1</Item>
 *   <Item>2</Item>
 * </ColumnStack>
 * 
 * // 3 equal columns, stack on large screens and below
 * <ColumnStack layout="3" stack="lg">
 *   <Item>1</Item>
 *   <Item>2</Item>
 *   <Item>3</Item>
 * </ColumnStack>
 * 
 * // 4 equal columns, stack on small screens and below
 * <ColumnStack layout="4" stack="sm">
 *   <Item>1</Item>
 *   <Item>2</Item>
 *   <Item>3</Item>
 *   <Item>4</Item>
 * </ColumnStack>
 * 
 * // 1-4-1 layout (sidebar + content + sidebar), stack on medium
 * <ColumnStack layout="1-4-1" stack="md">
 *   <Sidebar>Left</Sidebar>
 *   <Content>Main</Content>
 *   <Sidebar>Right</Sidebar>
 * </ColumnStack>
 * 
 * // 1-3-1 layout (narrow sidebar + content + narrow sidebar), stack on large
 * <ColumnStack layout="1-3-1" stack="lg">
 *   <Sidebar>Left</Sidebar>
 *   <Content>Main</Content>
 *   <Sidebar>Right</Sidebar>
 * </ColumnStack>
 * 
 * // 1-2 layout (1/3 + 2/3), stack on medium
 * <ColumnStack layout="1-2" stack="md">
 *   <Sidebar>Nav</Sidebar>
 *   <Content>Main</Content>
 * </ColumnStack>
 * 
 * // 2-1 layout (2/3 + 1/3), stack on small
 * <ColumnStack layout="2-1" stack="sm">
 *   <Content>Main</Content>
 *   <Sidebar>Aside</Sidebar>
 * </ColumnStack>
 * 
 * // 1-3 layout (1/4 + 3/4), no responsive stacking
 * <ColumnStack layout="1-3">
 *   <Sidebar>Nav</Sidebar>
 *   <Content>Main</Content>
 * </ColumnStack>
 * 
 * // 3-1 layout (3/4 + 1/4), stack on large
 * <ColumnStack layout="3-1" stack="lg">
 *   <Content>Main</Content>
 *   <Sidebar>Aside</Sidebar>
 * </ColumnStack>
 * 
 * // 2-3 layout (2/5 + 3/5), stack on medium
 * <ColumnStack layout="2-3" stack="md">
 *   <Content>Main</Content>
 *   <Sidebar>Aside</Sidebar>
 * </ColumnStack>
 * 
 * // 3-2 layout (3/5 + 2/5), stack on small
 * <ColumnStack layout="3-2" stack="sm">
 *   <Content>Main</Content>
 *   <Sidebar>Aside</Sidebar>
 * </ColumnStack>
 * 
 * // With custom spacing and alignment
 * <ColumnStack layout="3" stack="md" spacing="lg" align="center" justify="between">
 *   <Item>1</Item>
 *   <Item>2</Item>
 *   <Item>3</Item>
 * </ColumnStack>
 * 
 * // With dividers between items
 * <ColumnStack layout="2" stack="md" divider>
 *   <Item>1</Item>
 *   <Item>2</Item>
 * </ColumnStack>
 * 
 * // With grow (children fill available space)
 * <ColumnStack layout="2" stack="md" grow>
 *   <Item>1</Item>
 *   <Item>2</Item>
 * </ColumnStack>
 * 
 * Layout Options:
 * - "stack" (default) - vertical stack
 * - "2" - 2 equal columns (50% each)
 * - "3" - 3 equal columns (33.333% each)
 * - "4" - 4 equal columns (25% each)
 * - "1-4-1" - 1/6 + 4/6 + 1/6 (16.666% + 66.666% + 16.666%)
 * - "1-3-1" - 1/5 + 3/5 + 1/5 (20% + 60% + 20%)
 * - "1-2" - 1/3 + 2/3 (33.333% + 66.666%)
 * - "2-1" - 2/3 + 1/3 (66.666% + 33.333%)
 * - "1-3" - 1/4 + 3/4 (25% + 75%)
 * - "3-1" - 3/4 + 1/4 (75% + 25%)
 * - "2-3" - 2/5 + 3/5 (40% + 60%)
 * - "3-2" - 3/5 + 2/5 (60% + 40%)
 * 
 * Stack Breakpoints:
 * - "sm" - stack at ≤640px
 * - "md" - stack at ≤768px
 * - "lg" - stack at ≤1024px
 */

export const columnStack = defineRecipe({
  className: 'column-stack',
  base: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    gap: '4',
    width: 'full',
    '& > *': {
      _focusVisible: {
        zIndex: 1,
      },
    },
  },
  defaultVariants: {
    spacing: 'md',
    align: 'stretch',
    layout: 'stack',
  },
  variants: {
    spacing: {
      none: { gap: '0' },
      xs: { gap: '1' },
      sm: { gap: '2' },
      md: { gap: '4' },
      lg: { gap: '6' },
      xl: { gap: '8' },
    },
    align: {
      start: { alignItems: 'flex-start' },
      center: { alignItems: 'center' },
      end: { alignItems: 'flex-end' },
      stretch: { alignItems: 'stretch' },
      baseline: { alignItems: 'baseline' },
    },
    justify: {
      start: { justifyContent: 'flex-start' },
      center: { justifyContent: 'center' },
      end: { justifyContent: 'flex-end' },
      between: { justifyContent: 'space-between' },
      around: { justifyContent: 'space-around' },
      evenly: { justifyContent: 'space-evenly' },
    },
    grow: {
      true: {
        '& > *': {
          flex: 1,
        },
      },
    },
    divider: {
      true: {
        '& > *:not(:last-child)': {
          borderBottomWidth: '1px',
          borderColor: 'border',
          paddingBottom: '4',
        },
      },
    },
    layout: {
      stack: {
        flexDirection: 'column',
        '& > *': { width: 'full' },
      },
      '2': {
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
      '3': {
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
      '4': {
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
      '1-4-1': {
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
      '1-3-1': {
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
      '1-2': {
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
      '2-1': {
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
      '1-3': {
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
      '3-1': {
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
      '2-3': {
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
      '3-2': {
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
    },
    // Responsive breakpoint variant - stack on breakpoint or smaller
    stack: {
      sm: {
        '@media (max-width: 640px)': {
          flexDirection: 'column',
          '& > *': { width: 'full', flex: 'none' },
        },
      },
      md: {
        '@media (max-width: 768px)': {
          flexDirection: 'column',
          '& > *': { width: 'full', flex: 'none' },
        },
      },
      lg: {
        '@media (max-width: 1024px)': {
          flexDirection: 'column',
          '& > *': { width: 'full', flex: 'none' },
        },
      },
    },
  },
  compoundVariants: [
    {
      grow: true,
      justify: 'between',
      css: {
        '& > *:first-child': { marginTop: 'auto' },
        '& > *:last-child': { marginBottom: 'auto' },
      },
    },
    // Layout-specific child sizing using flex ratios (Option 1: flex: 1 1 0% fills remaining space, naturally handling gap)
    // Equal columns: flex: 1 distributes space equally
    { layout: '2', css: { flexDirection: 'row', flexWrap: 'wrap', '& > *': { flex: '1 1 0%', minWidth: '0' } } },
    { layout: '3', css: { flexDirection: 'row', flexWrap: 'wrap', '& > *': { flex: '1 1 0%', minWidth: '0' } } },
    { layout: '4', css: { flexDirection: 'row', flexWrap: 'wrap', '& > *': { flex: '1 1 0%', minWidth: '0' } } },
    // Unequal columns using flex ratios (proportional distribution handles gap automatically)
    { layout: '1-4-1', css: { flexDirection: 'row', flexWrap: 'wrap', '& > *:nth-child(1)': { flex: '1 1 0%' }, '& > *:nth-child(2)': { flex: '4 1 0%' }, '& > *:nth-child(3)': { flex: '1 1 0%' }, '& > *': { minWidth: '0' } } },
    { layout: '1-3-1', css: { flexDirection: 'row', flexWrap: 'wrap', '& > *:nth-child(1)': { flex: '1 1 0%' }, '& > *:nth-child(2)': { flex: '3 1 0%' }, '& > *:nth-child(3)': { flex: '1 1 0%' }, '& > *': { minWidth: '0' } } },
    { layout: '1-2', css: { flexDirection: 'row', flexWrap: 'wrap', '& > *:nth-child(1)': { flex: '1 1 0%' }, '& > *:nth-child(2)': { flex: '2 1 0%' }, '& > *': { minWidth: '0' } } },
    { layout: '2-1', css: { flexDirection: 'row', flexWrap: 'wrap', '& > *:nth-child(1)': { flex: '2 1 0%' }, '& > *:nth-child(2)': { flex: '1 1 0%' }, '& > *': { minWidth: '0' } } },
    { layout: '1-3', css: { flexDirection: 'row', flexWrap: 'wrap', '& > *:nth-child(1)': { flex: '1 1 0%' }, '& > *:nth-child(2)': { flex: '3 1 0%' }, '& > *': { minWidth: '0' } } },
    { layout: '3-1', css: { flexDirection: 'row', flexWrap: 'wrap', '& > *:nth-child(1)': { flex: '3 1 0%' }, '& > *:nth-child(2)': { flex: '1 1 0%' }, '& > *': { minWidth: '0' } } },
    { layout: '2-3', css: { flexDirection: 'row', flexWrap: 'wrap', '& > *:nth-child(1)': { flex: '2 1 0%' }, '& > *:nth-child(2)': { flex: '3 1 0%' }, '& > *': { minWidth: '0' } } },
    { layout: '3-2', css: { flexDirection: 'row', flexWrap: 'wrap', '& > *:nth-child(1)': { flex: '3 1 0%' }, '& > *:nth-child(2)': { flex: '2 1 0%' }, '& > *': { minWidth: '0' } } },
    // Responsive stacking for all column layouts
    ...['2', '3', '4', '1-4-1', '1-3-1', '1-2', '2-1', '1-3', '3-1', '2-3', '3-2'].flatMap(layout => [
      { layout, stack: 'sm', css: { '@media (max-width: 640px)': { flexDirection: 'column', '& > *': { width: 'full', flex: 'none' } } } },
      { layout, stack: 'md', css: { '@media (max-width: 768px)': { flexDirection: 'column', '& > *': { width: 'full', flex: 'none' } } } },
      { layout, stack: 'lg', css: { '@media (max-width: 1024px)': { flexDirection: 'column', '& > *': { width: 'full', flex: 'none' } } } },
    ]),
  ],
})