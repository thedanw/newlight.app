'use client'
import { type ComponentProps, useState, useRef, useEffect } from 'react'
import { mainListSlotClassNames, mainListOverlay } from './main-list-context'
import { RowToolbar } from './main-list-row-toolbar'
import { RowContent } from './main-list-row-content'
import { RowSelect } from './main-list-row-select'

export type RowProps<T> = ComponentProps<typeof Row<T>>

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

  // Close toolbar when clicking outside
  useEffect(() => {
    if (!toolbarOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (rowRef.current && !rowRef.current.contains(event.target as Node)) {
        setToolbarOpen(false)
        setOverlayVisible(false)
      }
    }

    setOverlayVisible(true)
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [toolbarOpen])

  const handleRowClick = () => {
    if (!toolbarOpen && onClick) {
      onClick()
    }
  }

  const handleManageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setToolbarOpen(true)
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
          aria-hidden="true"
        />
      )}
      <div
        ref={rowRef}
        className={mainListSlotClassNames.row()}
        data-selected={selected}
        onClick={handleRowClick}
        {...props}
      >
        {select}
        {children ?? (
          <RowContent />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2', paddingRight: '4' }}>
          {!toolbarOpen && button && (
            <div onClick={handleManageClick}>
              {button}
            </div>
          )}
          {toolbarOpen && toolbar && (
            <RowToolbar open={true} onClose={handleToolbarClose}>
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