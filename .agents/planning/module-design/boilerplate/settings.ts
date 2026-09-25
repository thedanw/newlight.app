import { registerSettingsSection } from '@/core/settings/lib/schema'
import SettingsPage from './settings/SettingsPage'
import { Manifest } from './manifest'

/**
 * Module settings registration. Imported from `routes.tsx` so it runs
 * at module load; the section deep-links at `/settings/<moduleId>`.
 */
registerSettingsSection({
  id: Manifest.id,
  title: `${Manifest.name} Settings`,
  description: `${Manifest.name} module settings.`,
  component: SettingsPage,
  icon: Manifest.icon,
  order: Manifest.number * 10,
  group: 'modules',
})