'use client'
import { createContext, useContext, useState, type ReactNode } from 'react'

export type SettingsActions = {
  cancel: () => void
  apply: () => Promise<void>
  isSaving: boolean
}

interface SettingsActionsContextValue {
  actions: SettingsActions | null
  setActions: (actions: SettingsActions | null) => void
}

const SettingsActionsContext = createContext<SettingsActionsContextValue | null>(null)

export function SettingsActionsProvider({ children, initialActions = null }: { children: ReactNode; initialActions?: SettingsActions | null }) {
  const [actions, setActions] = useState<SettingsActions | null>(initialActions)
  return (
    <SettingsActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </SettingsActionsContext.Provider>
  )
}

export function useSettingsActions(): SettingsActionsContextValue {
  const context = useContext(SettingsActionsContext)
  if (!context) {
    return { actions: null, setActions: () => {} }
  }
  return context
}
