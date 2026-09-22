import { registerSettingsSection } from './lib/schema'
import ChurchInformationPage from './pages/ChurchInformationPage'
import IntegrationsPage from './pages/IntegrationsPage'
import EmailSettingsPage from '@/core/email/settings/EmailSettingsPage'
import { Church, Mail, Blocks } from 'lucide-react'

/**
 * Core settings section registrations. Imported from `routes.tsx` so it runs
 * at module load; sections deep-link at `/settings/<sectionId>`.
 *
 * Module-owned sections (people, example, …) pass their own manifest icon
 * at registration time (see `src/modules/<id>/settings.ts`), so the
 * dashboard can render every card with the owning module's icon without
 * core importing module manifests.
 */
registerSettingsSection({
  id: 'church-info',
  title: 'Church Information',
  description: 'Church name, app name, contact details, and brand/theme settings.',
  component: ChurchInformationPage,
  icon: Church,
  order: 0,
})

registerSettingsSection({
  id: 'email',
  title: 'Email',
  description: 'Configure email transport (SMTP/Resend), default sender, and template branding.',
  component: EmailSettingsPage,
  icon: Mail,
  order: 10,
})

registerSettingsSection({
  id: 'integrations',
  title: 'Integrations',
  description: 'Third-party integrations and external service connections.',
  component: IntegrationsPage,
  icon: Blocks,
  order: 100,
})
