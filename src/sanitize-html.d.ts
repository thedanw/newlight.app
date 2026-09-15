declare module 'sanitize-html' {
  export interface SanitizeHtmlOptions {
    allowedTags?: string[]
    allowedAttributes?: Record<string, string[]>
    selfClosing?: string[]
    disallowedTagsMode?: 'discard' | 'escape' | 'recursiveEscape' | 'sync' | 'build'
    allowedSchemes?: string[]
    allowedSchemesAppliedToAttributes?: string[]
  }

  export default function sanitizeHtml(html: string, options?: SanitizeHtmlOptions): string
}
