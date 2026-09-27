import type { StudioProject, StudioPage, StudioComponent } from './types'
import sanitizeHtml from 'sanitize-html'

function isStudioComponent(obj: unknown): obj is StudioComponent {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj) && 'type' in obj
}

function getChildren(component: StudioComponent): StudioComponent[] {
  if (component.components) return component.components.filter(isStudioComponent)
  return []
}

function attrsToHtml(attrs: Record<string, string> | undefined): string {
  if (!attrs) return ''
  return Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}="${v.replace(/"/g, '"')}"`)
    .join(' ')
}

function renderComponent(component: StudioComponent): string {
  if (!isStudioComponent(component)) return ''

  const tag = component.tagName ?? component.type ?? 'div'
  const attrStr = attrsToHtml(component.attributes)

  // Filter out dangerous tags first
  if (tag === 'script' || tag === 'style' || tag === 'iframe') {
    return ''
  }

  if (component.content !== undefined) {
    const safeContent = sanitizeHtml(component.content).trim()
    if (tag === 'img') {
      return `<img${attrStr ? ` ${attrStr}` : ''} src="${(component.attributes?.src ?? '').replace(/"/g, '"')}" alt="${(component.attributes?.alt ?? '').replace(/"/g, '"')}" />`
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

  const children = getChildren(component)
  const childHtml = children.map(renderComponent).join('')

  if (tag === 'text' || tag === 'p') {
    const text = component.content ?? ''
    return `<p>${sanitizeHtml(text)}</p>`
  }

  return `<${tag}${attrStr ? ` ${attrStr}` : ''}>${childHtml}</${tag}>`
}

function renderPage(page: StudioPage): string {
  if (!page.component) return ''
  return renderComponent(page.component)
}

export function renderSnapshot(project: StudioProject | null): string {
  if (!project || typeof project !== 'object') return ''

  // Studio SDK project format has pages array
  if (!project.pages || !Array.isArray(project.pages)) {
    return ''
  }

  const rendered = project.pages
    .filter((page) => page.component)
    .map(renderPage)
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