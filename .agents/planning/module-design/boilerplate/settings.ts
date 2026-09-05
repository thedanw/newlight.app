import { registerSettingsSection } from '@/core/settings/settings-schema'
import <Module>SettingsPage from './settings/<Module>SettingsPage'

/**
 * <Module> module settings registration. Imported from `routes.tsx` so it runs
 * at module load; the section deep-links at `/settings/<moduleId>`.
 */
registerSettingsSection({
  id: '<moduleId>',
  title: '<Module> Settings',
  description: '<Module> module settings.',
  component: <Module>SettingsPage,
  order: 20,
})
