'use client'
import { type ComponentProps, useState, useRef, useEffect, useId, isValidElement, cloneElement, type ReactElement } from 'react'
import { mainListSlotClassNames, mainListOverlay } from './main-list-context'
import { RowToolbar } from './main-list-row-toolbar'
import { RowContent } from './main-list-row-content'

export type RowProps<T> = ComponentProps<typeof Row<T>>

/** Props injected into a passed-in row button to make it the accessible trigger. */
type RowTriggerProps = {
  onClick?: (e: React.MouseEvent) => void
  'aria-expanded'?: boolean
  'aria-controls'?: string
}

export function Row<T>({
  item,
  index,
  selected = false,
  selectMode = false,
  onClick,
  children,
  select,
  button,
  toolbar,
  ...props
}: {
  item: T
  index: number
  selected?: boolean
  selectMode?: boolean
  onClick?: () => void
  children?: React.ReactNode
  select?: React.ReactNode
  button?: React.ReactNode
  toolbar?: React.ReactNode
} & ComponentProps<'div'>) {
  const [toolbarOpen, setToolbarOpen] = useState(false)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const toolbarId = useId()

  // Close toolbar when clicking outside
  useEffect(() => {
    if (!toolbarOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (rowRef.current && !rowRef.current.contains(event.target as Node)) {
        setToolbarOpen(false)
        setOverlayVisible(false)
      }
    }

    // Escape-to-close + focus move into the toolbar (a11y).
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setToolbarOpen(false)
        setOverlayVisible(false)
      }
    }

    setOverlayVisible(true)
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [toolbarOpen])

  // Move focus into the toolbar when it opens so keyboard users land there.
  useEffect(() => {
    if (toolbarOpen) toolbarRef.current?.focus()
  }, [toolbarOpen])

  const handleRowClick = () => {
    if (!toolbarOpen && onClick) {
      onClick()
    }
  }

  const handleToolbarClose = () => {
    setToolbarOpen(false)
    setOverlayVisible(false)
  }

  return (
    <>
      {overlayVisible && (
        <div
          className={mainListOverlay}
          onClick={handleToolbarClose}
          role="presentation"
        />
      )}
      <div
        ref={rowRef}
        className={mainListSlotClassNames.row()}
        data-selected={selected}
        data-select-mode={selectMode}
        data-toolbar-open={toolbarOpen}
        onClick={handleRowClick}
        {...props}
      >
        {select}
        {children ?? (
          <RowContent />
        )}
        <div className={mainListSlotClassNames.rowButton()}>
          {!toolbarOpen && button && (
            isValidElement(button)
              ? cloneElement(button as ReactElement<RowTriggerProps>, {
                  onClick: (e: React.MouseEvent) => {
                    e.stopPropagation()
                    setToolbarOpen(true)
                  },
                  'aria-expanded': false,
                  'aria-controls': toolbarId,
                })
              : button
          )}
          {toolbarOpen && toolbar && (
            <RowToolbar ref={toolbarRef} open={true} onClose={handleToolbarClose} id={toolbarId} tabIndex={-1}>
              {toolbar}
            </RowToolbar>
          )}
        </div>
      </div>
    </>
  )
}

Row.displayName = 'MainList.Row'

// Re-export sub-components
export { RowSelect } from './main-list-row-select'
export { RowButton } from './main-list-row-button'
export { RowToolbar } from './main-list-row-toolbar'
export { RowContent } from './main-list-row-content'