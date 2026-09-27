import { describe, expect, it } from 'vitest'

describe('email renderer (Studio SDK)', () => {
  describe('renderSnapshot', () => {
    it('returns empty string for null input', async () => {
      const { renderSnapshot } = await import('../lib/renderer')
      expect(renderSnapshot(null)).toBe('')
    })

    it('returns empty string for empty object', async () => {
      const { renderSnapshot } = await import('../lib/renderer')
      expect(renderSnapshot({})).toBe('')
    })

    it('renders a simple page with component', async () => {
      const { renderSnapshot } = await import('../lib/renderer')
      const project = {
        pages: [
          {
            id: 'page1',
            name: 'Page 1',
            component: {
              type: 'p',
              content: 'Hello world',
            },
          },
        ],
        assets: [],
        settings: {},
      }
      const result = renderSnapshot(project)
      expect(result).toContain('Hello world')
    })

    it('renders multiple pages', async () => {
      const { renderSnapshot } = await import('../lib/renderer')
      const project = {
        pages: [
          {
            id: 'page1',
            name: 'Page 1',
            component: {
              type: 'p',
              content: 'First',
            },
          },
          {
            id: 'page2',
            name: 'Page 2',
            component: {
              type: 'p',
              content: 'Second',
            },
          },
        ],
        assets: [],
        settings: {},
      }
      const result = renderSnapshot(project)
      expect(result).toContain('First')
      expect(result).toContain('Second')
    })

    it('renders nested components', async () => {
      const { renderSnapshot } = await import('../lib/renderer')
      const project = {
        pages: [
          {
            id: 'page1',
            name: 'Page 1',
            component: {
              type: 'div',
              components: [
                { type: 'p', content: 'Nested content' },
              ],
            },
          },
        ],
        assets: [],
        settings: {},
      }
      const result = renderSnapshot(project)
      expect(result).toContain('Nested content')
    })

    it('renders image with attributes', async () => {
      const { renderSnapshot } = await import('../lib/renderer')
      const project = {
        pages: [
          {
            id: 'page1',
            name: 'Page 1',
            component: {
              type: 'img',
              attributes: { src: 'https://example.org/img.png', alt: 'My Image' },
            },
          },
        ],
        assets: [],
        settings: {},
      }
      const result = renderSnapshot(project)
      expect(result).toContain('img.png')
      expect(result).toContain('My Image')
    })

    it('strips script tags for security', async () => {
      const { renderSnapshot } = await import('../lib/renderer')
      const project = {
        pages: [
          {
            id: 'page1',
            name: 'Page 1',
            component: {
              type: 'script',
              content: 'alert("xss")',
            },
          },
        ],
        assets: [],
        settings: {},
      }
      const result = renderSnapshot(project)
      // renderComponent returns empty string for script tags
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
    })

    it('sanitizes unsafe content within text', async () => {
      const { renderSnapshot } = await import('../lib/renderer')
      const project = {
        pages: [
          {
            id: 'page1',
            name: 'Page 1',
            component: {
              type: 'p',
              content: '<p>Safe text</p>',
            },
          },
        ],
        assets: [],
        settings: {},
      }
      const result = renderSnapshot(project)
      expect(result).toContain('Safe text')
    })
  })
})
