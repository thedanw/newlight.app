import { registerSettingsSection } from '@/core/settings/lib/schema'
import ExampleSettingsPage from './settings/ExampleSettingsPage'
import { Manifest } from './manifest'

/**
 * Developers module settings registration. Imported from `routes.tsx` so it runs
 * at module load; the section deep-links at `/settings/developers`.
 */
registerSettingsSection({
  id: Manifest.id,
  title: `${Manifest.name} Settings`,
  description: `${Manifest.name} module settings.`,
  component: ExampleSettingsPage,
  icon: Manifest.icon,
  order: Manifest.number * 10,
  group: 'modules',
})