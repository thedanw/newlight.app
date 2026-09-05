import { registerSettingsSection } from '@/core/settings/lib/schema'
import ExampleSettingsPage from './settings/ExampleSettingsPage'

/**
 * Example module settings registration. Imported from `routes.tsx` so it runs
 * at module load; the section deep-links at `/settings/example`.
 */
registerSettingsSection({
  id: 'example',
  title: 'Example Settings',
  description: 'Example module settings.',
  component: ExampleSettingsPage,
  order: 30,
})
