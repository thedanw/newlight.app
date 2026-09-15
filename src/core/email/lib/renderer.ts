import type { Json } from '@/core/lib/database.types'
import { getEmailBlockSpec } from './blocks'
import sanitizeHtml from 'sanitize-html'

type GrapesNode = {
  type?: string
  tag?: string
  content?: string
  children?: GrapesNode[]
  attrs?: Record<string, string>
  className?: string
  text?: string
  src?: string
  href?: string
  cells?: GrapesNode[]
}

function isGrapesNode(obj: unknown): obj is GrapesNode {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
}

function getChildren(node: GrapesNode): GrapesNode[] {
  if (node.children) return node.children.filter(isGrapesNode)
  if (node.cells) return node.cells.filter(isGrapesNode)
  return []
}

function attrsToHtml(attrs: Record<string, string> | undefined): string {
  if (!attrs) return ''
  return Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}="${v.replace(/"/g, '&quot;')}"`)
    .join(' ')
}

function renderNode(node: GrapesNode): string {
  if (!isGrapesNode(node)) return ''

  const tag = node.tag ?? node.type ?? 'div'
  const attrStr = attrsToHtml(node.attrs)

  if (node.content !== undefined) {
    const safeContent = sanitizeHtml(node.content).trim()
    if (tag === 'img') {
      return `<img${attrStr ? ` ${attrStr}` : ''} src="${(node.attrs?.src ?? node.src ?? '').replace(/"/g, '&quot;')}" alt="${(node.attrs?.alt ?? '').replace(/"/g, '&quot;')}" />`
    }
    if (tag === 'br') return '<br />'
    if (tag === 'hr') return `<hr${attrStr ? ` ${attrStr}` : ''} />`
    return `<${tag}${attrStr ? ` ${attrStr}` : ''}>${safeContent}</${tag}>`
  }

  if (tag === 'img') {
    return `<img${attrStr ? ` ${attrStr}` : ''} />`
  }
  if (tag === 'br') return '<br />'
  if (tag === 'hr') return `<hr${attrStr ? ` ${attrStr}` : ''} />`

  const children = getChildren(node)
  const childHtml = children.map(renderNode).join('')

  if (tag === 'text' || tag === 'p') {
    const text = node.text ?? ''
    return `<p>${sanitizeHtml(text)}</p>`
  }

  if (tag === 'script' || tag === 'style' || tag === 'iframe') {
    return ''
  }

  return `<${tag}${attrStr ? ` ${attrStr}` : ''}>${childHtml}</${tag}>`
}

export function renderSnapshot(editorJson: Json | null): string {
  if (!editorJson || typeof editorJson !== 'object') return ''

  const root = editorJson as {
    root?: GrapesNode | GrapesNode[]
    nodes?: GrapesNode[]
    blocks?: GrapesNode[]
    components?: GrapesNode | GrapesNode[]
  }

  let nodes: GrapesNode[] = []
  if (root.root) {
    nodes = Array.isArray(root.root) ? root.root : [root.root]
  } else if (root.components) {
    nodes = Array.isArray(root.components) ? root.components : [root.components]
  } else if (root.nodes) {
    nodes = root.nodes
  } else if (root.blocks) {
    nodes = root.blocks
  } else {
    nodes = Object.values(root).filter(isGrapesNode) as GrapesNode[]
  }

  const rendered = nodes
    .filter((n) => n.type !== 'script' && n.type !== 'style')
    .map((n) => {
      const block = n.type && getEmailBlockSpec(n.type)
      if (block && n.content === undefined) {
        const nodeToRender = { ...n, content: block.defaultContent }
        return renderNode(nodeToRender)
      }
      return renderNode(n)
    })
    .filter(Boolean)
    .join('\n')

  return sanitizeHtml(rendered, {
    allowedTags: [
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'br',
      'strong', 'em', 'u', 'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td',
      'tbody', 'thead', 'hr', 'blockquote', 'pre', 'code',
    ],
    allowedAttributes: {
      '*': ['style', 'href', 'src', 'alt', 'width', 'height', 'class'],
      a: ['href', 'style', 'class'],
      img: ['src', 'alt', 'width', 'height', 'style', 'class'],
      td: ['style', 'width', 'class'],
      div: ['style', 'class'],
      span: ['style', 'class'],
      p: ['style', 'class'],
      table: ['style', 'class', 'width'],
      tr: ['style'],
      hr: ['style'],
    },
    selfClosing: ['br', 'img', 'hr'],
    disallowedTagsMode: 'recursiveEscape',
  })
}
