import { registerSettingsSection } from '@/core/settings/lib/schema'
import PeopleSettingsPage from './settings/PeopleSettingsPage'
import { peopleManifest } from './manifest'

/**
 * People module settings registration — demo of the core #41
 * `settings-schema` extension point. Imported from `routes.tsx` so it runs
 * at module load; the section deep-links at `/settings/people`.
 */
registerSettingsSection({
  id: 'people',
  title: 'People Settings',
  description: 'People module settings.',
  component: PeopleSettingsPage,
  icon: peopleManifest.icon,
  order: 10,
})