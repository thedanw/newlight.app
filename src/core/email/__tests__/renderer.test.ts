import { describe, expect, it } from 'vitest'

describe('email renderer (Batch 7)', () => {
  describe('renderSnapshot', () => {
    it('returns empty string for null input', async () => {
      const { renderSnapshot } = await import('../lib/renderer')
      expect(renderSnapshot(null)).toBe('')
    })

    it('returns empty string for empty object', async () => {
      const { renderSnapshot } = await import('../lib/renderer')
      expect(renderSnapshot({})).toBe('')
    })

    it('renders a simple root node', async () => {
      const { renderSnapshot } = await import('../lib/renderer')
      const json = { root: [{ type: 'p', content: 'Hello world' }] }
      const result = renderSnapshot(json)
      expect(result).toContain('Hello world')
    })

    it('renders multiple root nodes', async () => {
      const { renderSnapshot } = await import('../lib/renderer')
      const json = { root: [{ type: 'p', content: 'First' }, { type: 'p', content: 'Second' }] }
      const result = renderSnapshot(json)
      expect(result).toContain('First')
      expect(result).toContain('Second')
    })

    it('renders a built-in block by type', async () => {
      const { renderSnapshot } = await import('../lib/renderer')
      const json = { root: [{ type: 'text' }] }
      const result = renderSnapshot(json)
      expect(result).toContain('Edit your text here')
    })

    it('renders a button block with default content', async () => {
      const { renderSnapshot } = await import('../lib/renderer')
      const json = { root: [{ type: 'button' }] }
      const result = renderSnapshot(json)
      expect(result).toContain('Click here')
      expect(result).toContain('href=')
    })

    it('renders an image node with attrs', async () => {
      const { renderSnapshot } = await import('../lib/renderer')
      const json = {
        root: [
          {
            type: 'img',
            attrs: { src: 'https://example.org/img.png', alt: 'My Image' },
          },
        ],
      }
      const result = renderSnapshot(json)
      expect(result).toContain('img.png')
      expect(result).toContain('My Image')
    })

    it('strips script tags', async () => {
      const { renderSnapshot } = await import('../lib/renderer')
      const json = {
        root: [{ type: 'script', content: 'alert("xss")' }],
      }
      const result = renderSnapshot(json)
      expect(result).not.toContain('script')
      expect(result).not.toContain('alert')
    })

    it('sanitizes unsafe content within text', async () => {
      const { renderSnapshot } = await import('../lib/renderer')
      const json = {
        root: [{ type: 'p', content: '<p>Safe text</p>' }],
      }
      const result = renderSnapshot(json)
      expect(result).toContain('Safe text')
    })

    it('handles nodes array format', async () => {
      const { renderSnapshot } = await import('../lib/renderer')
      const json = {
        nodes: [{ type: 'p', content: 'from nodes array' }],
      }
      const result = renderSnapshot(json)
      expect(result).toContain('from nodes array')
    })

    it('handles blocks array format', async () => {
      const { renderSnapshot } = await import('../lib/renderer')
      const json = {
        blocks: [{ type: 'p', content: 'from blocks array' }],
      }
      const result = renderSnapshot(json)
      expect(result).toContain('from blocks array')
    })
  })
})
