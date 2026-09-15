/**
 * Email block registry — typed block specs for the GrapesJS editor.
 *
 * Built-in blocks cover the core newsletter content types. Modules and plugins
 * can register additional data blocks via `registerEmailBlock`.
 */

export interface EmailBlockSpec {
  type: string
  label: string
  icon: string
  category: string
  defaultContent: string
}

const BUILTIN_BLOCKS: EmailBlockSpec[] = [
  {
    type: 'text',
    label: 'Text',
    icon: 'T',
    category: 'basic',
    defaultContent: '<p>Edit your text here...</p>',
  },
  {
    type: 'heading',
    label: 'Heading',
    icon: 'H',
    category: 'basic',
    defaultContent: '<h2>Section Heading</h2>',
  },
  {
    type: 'image',
    label: 'Image',
    icon: 'img',
    category: 'basic',
    defaultContent: '<img src="https://via.placeholder.com/400x200" alt="Image" />',
  },
  {
    type: 'button',
    label: 'Button',
    icon: 'btn',
    category: 'basic',
    defaultContent:
      '<a href="https://example.org" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:4px">Click here</a>',
  },
  {
    type: 'spacer',
    label: 'Spacer',
    icon: 'sp',
    category: 'basic',
    defaultContent: '<div style="height:24px">&nbsp;</div>',
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: '---',
    category: 'basic',
    defaultContent: '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />',
  },
  {
    type: 'columns',
    label: 'Columns',
    icon: 'cols',
    category: 'layout',
    defaultContent:
      '<table style="width:100%"><tr><td style="width:50%;padding:8px">Left column</td><td style="width:50%;padding:8px">Right column</td></tr></table>',
  },
]

const registeredBlocks = new Map<string, EmailBlockSpec>()

export function getBuiltinBlocks(): EmailBlockSpec[] {
  return [...BUILTIN_BLOCKS]
}

export function registerEmailBlock(block: EmailBlockSpec): void {
  if (registeredBlocks.has(block.type)) {
    throw new Error(`Email block type already registered: ${block.type}`)
  }
  registeredBlocks.set(block.type, block)
}

export function getRegisteredBlocks(): EmailBlockSpec[] {
  return [...registeredBlocks.values()]
}

export function getAllEmailBlocks(): EmailBlockSpec[] {
  return [...BUILTIN_BLOCKS, ...registeredBlocks.values()]
}

export function getEmailBlock(type: string): EmailBlockSpec | undefined {
  return [...BUILTIN_BLOCKS, ...registeredBlocks.values()].find((b) => b.type === type)
}

export function clearRegisteredBlocks(): void {
  registeredBlocks.clear()
}

export function getEmailBlockSpec(type: string): EmailBlockSpec | undefined {
  return getEmailBlock(type)
}
