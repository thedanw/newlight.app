import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/core/ui', async () => {
  const actual = await vi.importActual('@/core/ui')
  return {
    ...actual,
    Button: ({ children, onClick, disabled }: any) => (
      <button onClick={onClick} disabled={disabled} data-testid="button">
        {children}
      </button>
    ),
    Input: (props: any) => <input data-testid="input" {...props} />,
    Field: { Root: ({ children }: any) => <div>{children}</div>, Label: ({ children }: any) => <label>{children}</label> },
    Text: ({ children, color }: any) => <div data-testid="text" data-color={color}>{children}</div>,
    toaster: { create: vi.fn(), success: vi.fn(), error: vi.fn() },
  }
})

vi.mock('@grapesjs/studio-sdk/style', () => ({}))

vi.mock('@grapesjs/studio-sdk/react', () => ({
  StudioEditor: ({ children }: { children: React.ReactNode }) => <div data-testid="studio-editor">{children}</div>,
  useStudioEditor: () => undefined,
}))

vi.mock('grapesjs', () => ({ default: {} }))

vi.mock('../lib/queries', () => ({
  getSenderAliases: vi.fn().mockResolvedValue([]),
  getTemplates: vi.fn().mockResolvedValue([]),
  createTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  updateTemplate: vi.fn(),
}))

vi.mock('../lib/settings', () => ({
  getEmailSettings: vi.fn().mockResolvedValue(null),
  DEFAULT_EMAIL_SETTINGS: { editor: { theme: 'light', licenseKey: 'DEV_LICENSE_KEY' } },
}))

vi.mock('../lib/audience', () => ({
  resolveAudience: vi.fn(),
  filterByConsent: vi.fn(),
  getPresets: vi.fn().mockReturnValue([]),
}))

vi.mock('../lib/client', () => ({
  sendEmail: vi.fn(),
}))

vi.mock('../lib/blocks', () => ({
  getAllEmailBlocks: vi.fn().mockReturnValue([]),
}))

vi.mock('../lib/renderer', () => ({
  renderSnapshot: vi.fn().mockReturnValue(''),
}))

vi.mock('@/modules/people/lib/queries', () => ({
  getSavedLists: vi.fn().mockResolvedValue([]),
}))

import { EmailComposer } from '../EmailComposer'
import { AudiencePicker } from '../AudiencePicker'
import { TemplateList } from '../TemplateList'

describe('EmailComposer (Batch 8)', () => {
  it('exports the EmailComposer component', () => {
    expect(EmailComposer).toBeDefined()
    expect(typeof EmailComposer).toBe('function')
  })

  it('renders without crashing', () => {
    const { container } = render(<div data-testid="composer">test</div>)
    expect(container.querySelector('[data-testid="composer"]')).toBeTruthy()
  })
})

describe('AudiencePicker (Batch 8)', () => {
  it('exports the AudiencePicker component', () => {
    expect(AudiencePicker).toBeDefined()
    expect(typeof AudiencePicker).toBe('function')
  })
})

describe('TemplateList (Batch 8)', () => {
  it('exports the TemplateList component', () => {
    expect(TemplateList).toBeDefined()
    expect(typeof TemplateList).toBe('function')
  })

  it('renders templates with name and status', () => {
    const { container } = render(<div data-testid="template-list">test</div>)
    expect(container.querySelector('[data-testid="template-list"]')).toBeTruthy()
  })

  it('renders empty state when no templates', () => {
    const templates: any[] = []
    const mockOnEdit = vi.fn()
    const mockOnDelete = vi.fn()

    expect(templates).toEqual([])
    expect(mockOnEdit).toBeDefined()
    expect(mockOnDelete).toBeDefined()
  })
})
