import { z } from 'zod'

/**
 * Plugin Manifest Schema — WordPress-style plugin manifest
 * Validated at load time by PluginLoader
 */

// Permission types that plugins can declare
export const PluginPermissionSchema = z.enum([
  'people.read', 'people.write',
  'households.read', 'households.write',
  'journey_tracks.read', 'journey_tracks.write',
  'tags.read', 'tags.write',
  'forms.read', 'forms.write',
  'platform_settings.read', 'platform_settings.write',
  'elvanto_settings.read', 'elvanto_settings.write',
  'elvanto_sync_config.read', 'elvanto_sync_config.write',
  'elvanto_sync_history.read',
  'elvanto_sync_dead_letter.read', 'elvanto_sync_dead_letter.write',
])

export type PluginPermission = z.infer<typeof PluginPermissionSchema>

// Settings section that a plugin can register
export const PluginSettingsSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  order: z.number().optional(),
})

export type PluginSettingsSection = z.infer<typeof PluginSettingsSectionSchema>

// Settings page that a plugin can register within a section
export const PluginSettingsPageSchema = z.object({
  sectionId: z.string(),
  id: z.string(),
  title: z.string(),
  component: z.string(), // Component name (lazy-loaded)
  order: z.number().optional(),
})

export type PluginSettingsPage = z.infer<typeof PluginSettingsPageSchema>

// Dashboard widget a plugin can register
export const PluginDashboardWidgetSchema = z.object({
  id: z.string(),
  title: z.string(),
  component: z.string(), // Component name (lazy-loaded)
  size: z.enum(['small', 'medium', 'large']).optional(),
})

export type PluginDashboardWidget = z.infer<typeof PluginDashboardWidgetSchema>

// Navigation item a plugin can register
export const PluginNavItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  route: z.string(),
  icon: z.string().optional(),
  order: z.number().optional(),
})

export type PluginNavItem = z.infer<typeof PluginNavItemSchema>

// Hooks that a plugin can implement
export const PluginHooksSchema = z.object({
  settingsSections: z.string().optional(), // Function name to call
  settingsPages: z.string().optional(),
  dashboardWidgets: z.string().optional(),
  navItems: z.string().optional(),
  settingsLinks: z.string().optional(), // Function name to call
})

export type PluginHooks = z.infer<typeof PluginHooksSchema>

// Full plugin manifest
export const PluginManifestSchema = z.object({
  name: z.string().min(1), // kebab-case, unique
  displayName: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/), // semver
  description: z.string(),
  author: z.string(),
  entryPoint: z.string(), // Relative to plugin folder (e.g., "index.js")
  settings: z.object({
    sections: z.array(PluginSettingsSectionSchema).optional(),
    pages: z.array(PluginSettingsPageSchema).optional(),
  }).optional(),
  dashboardWidgets: z.array(PluginDashboardWidgetSchema).optional(),
  navItems: z.array(PluginNavItemSchema).optional(),
  hooks: PluginHooksSchema.optional(),
  permissions: z.array(PluginPermissionSchema),
})

export type PluginManifest = z.infer<typeof PluginManifestSchema>

// Validation function
export function validatePluginManifest(data: unknown): { success: true; data: PluginManifest } | { success: false; error: z.ZodError } {
  const result = PluginManifestSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

// Type guards
export function isPluginManifest(obj: unknown): obj is PluginManifest {
  return PluginManifestSchema.safeParse(obj).success
}