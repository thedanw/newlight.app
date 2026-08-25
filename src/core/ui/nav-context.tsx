'use client'
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface NavContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const NavContext = createContext<NavContextValue | null>(null)

export function NavProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  return (
    <NavContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </NavContext.Provider>
  )
}

export function useNavContext(): NavContextValue {
  const context = useContext(NavContext)
  if (!context) {
    throw new Error('useNavContext must be used within a NavProvider')
  }
  return context
}