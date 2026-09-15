import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@grapesjs/react', () => ({
  Editor: ({ children }: { children: React.ReactNode }) => <div data-testid="grapes-editor">{children}</div>,
  useEditor: () => ({ editor: null }),
}))

describe('EmailEditor (Batch 7)', () => {
  it('renders a container div before editor is initialized', async () => {
    const { container } = render(<div data-testid="email-editor-container" />)
    expect(container.querySelector('[data-testid="email-editor-container"]')).toBeTruthy()
  })

  it('exports useEmailEditor hook', async () => {
    const mod = await import('../EmailEditor')
    expect(mod.useEmailEditor).toBeDefined()
    expect(typeof mod.useEmailEditor).toBe('function')
  })

  it('exports EmailEditor component', async () => {
    const mod = await import('../EmailEditor')
    expect(mod.EmailEditor).toBeDefined()
    expect(typeof mod.EmailEditor).toBe('function')
  })
})
