import { registerSettingsSection } from '@/core/settings/lib/schema'
import PeopleSettingsPage from './settings/PeopleSettingsPage'
import { Manifest } from './manifest'

/**
 * People module settings registration — demo of the core #41
 * `settings-schema` extension point. Imported from `routes.tsx` so it runs
 * at module load; the section deep-links at `/settings/people`.
 */
registerSettingsSection({
  id: Manifest.id,
  title: `${Manifest.name} Settings`,
  description: `${Manifest.name} module settings.`,
  component: PeopleSettingsPage,
  icon: Manifest.icon,
  order: Manifest.number * 10,
  group: 'modules',
})