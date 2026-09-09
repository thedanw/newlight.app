'use client'
import { Button, Page } from '@/core/ui'
import { usePageActions } from './page-actions'

/**
 * ActionFooter — the shell-owned Save/Cancel bar.
 *
 * Rendered once by AppShell inside `Page.Footer`. It sits off-screen
 * (`translateY(100%)`) until a routed page registers actions via
 * `usePageActions().register(...)` with `isDirty: true`, at which point it
 * slides into view. When hidden it is `inert` + `aria-hidden` so keyboard
 * focus and screen readers cannot reach it.
 */
export function ActionFooter() {
  const { actions } = usePageActions()
  const visible = Boolean(actions && actions.isDirty)

  return (
    <Page.Footer
      data-state={visible ? 'visible' : 'hidden'}
      inert={!visible}
      aria-hidden={!visible}
    >
      <Button variant="plain" onClick={actions?.cancel} disabled={actions?.isSaving}>
        Cancel
      </Button>
      <Button onClick={actions?.apply} disabled={actions?.isSaving} loading={actions?.isSaving}>
        {actions?.applyLabel ?? 'Save'}
      </Button>
    </Page.Footer>
  )
}