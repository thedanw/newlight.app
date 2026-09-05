export type SettingsActions = {
  cancel: () => void
  apply: () => Promise<void>
  isSaving: boolean
}
