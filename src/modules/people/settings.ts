import { registerSettingsPage } from '@/core/settings/settings-schema'
import PeopleSettingsPage from './settings/PeopleSettingsPage'

/**
 * People module settings registration — demo of the core #41
 * `settings-schema` extension point. Imported from `routes.tsx` so it runs
 * at module load; the page deep-links at `/settings/church-info/people`.
 */
registerSettingsPage({
  sectionId: 'church-info',
  id: 'people',
  title: 'People Settings',
  component: PeopleSettingsPage,
  order: 0,
})