import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '@/core/theme/ThemeContext'

vi.mock('@grapesjs/studio-sdk/style', () => ({}))

vi.mock('@grapesjs/studio-sdk/react', () => ({
  StudioEditor: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="studio-editor">{children}</div>
  ),
  useStudioEditor: () => undefined,
}))

const renderWithTheme = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>)

describe('EmailEditor (Batch 7)', () => {
  it('renders a container div before editor is initialized', async () => {
    const { container } = renderWithTheme(<div data-testid="email-editor-container" />)
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

  it('exports DEFAULT_EDITOR_CONFIG', async () => {
    const mod = await import('../EmailEditor')
    expect(mod.DEFAULT_EDITOR_CONFIG).toBeDefined()
    expect(mod.DEFAULT_EDITOR_CONFIG.theme).toBe('light')
  })
})
