import { registerSettingsSection } from './lib/schema'
import ChurchInformationPage from './pages/ChurchInformationPage'
import IntegrationsPage from './pages/IntegrationsPage'

/**
 * Core settings section registrations. Imported from `routes.tsx` so it runs
 * at module load; sections deep-link at `/settings/<sectionId>`.
 */
registerSettingsSection({
  id: 'church-info',
  title: 'Church Information',
  description: 'Church name, app name, contact details, and brand/theme settings.',
  component: ChurchInformationPage,
  order: 0,
})

registerSettingsSection({
  id: 'integrations',
  title: 'Integrations',
  description: 'Third-party integrations and external service connections.',
  component: IntegrationsPage,
  order: 100,
})
