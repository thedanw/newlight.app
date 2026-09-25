import { registerSettingsSection } from './lib/schema'
import ChurchGeneralPage from './pages/ChurchGeneralPage'
import ChurchAppearancePage from './pages/ChurchAppearancePage'
import IntegrationsPage from './pages/IntegrationsPage'
import EmailSettingsPage from '@/core/email/settings/EmailSettingsPage'
import { Church, Palette, Mail, Blocks } from 'lucide-react'

/**
 * Core settings section registrations. Imported from `routes.tsx` so it runs
 * at module load; sections deep-link at `/settings/<sectionId>`.
 *
 * Module-owned sections (people, example, …) pass their own manifest icon
 * at registration time (see `src/modules/<id>/settings.ts`), so the
 * dashboard can render every card with the owning module's icon without
 * core importing module manifests. Core sections declare
 * `group: 'general'` so the dashboard lists them under General Settings;
 * module sections default to the Modules group.
 */
// The former single "Church Information" section was split (decision #13):
// `general` holds the church identity fields, `appearance` holds the app
// name, logo, and theme knobs. Both share `useAppSettingsForm`
// (lib/app-settings.ts) over the single upserted `app-settings` payload.
registerSettingsSection({
  id: 'general',
  title: 'General',
  description: 'Church name, email, website, and address.',
  component: ChurchGeneralPage,
  icon: Church,
  order: 0,
  group: 'general',
})

registerSettingsSection({
  id: 'appearance',
  title: 'Appearance',
  description: 'App name, logo, colors, sidebar, and typography.',
  component: ChurchAppearancePage,
  icon: Palette,
  order: 1,
  group: 'general',
})

registerSettingsSection({
  id: 'email',
  title: 'Email',
  description: 'Configure email transport (SMTP/Resend), default sender, and template branding.',
  component: EmailSettingsPage,
  icon: Mail,
  order: 10,
  group: 'general',
})

registerSettingsSection({
  id: 'integrations',
  title: 'Integrations',
  description: 'Third-party integrations and external service connections.',
  component: IntegrationsPage,
  icon: Blocks,
  order: 100,
  group: 'general',
})
