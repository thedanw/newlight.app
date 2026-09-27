/**
 * Email block registry — Studio SDK component definitions for the email editor.
 *
 * Built-in email components are provided automatically by Studio SDK when
 * project.type is 'email'. Modules and plugins can register additional
 * custom components via `registerEmailComponent`.
 */

export interface StudioComponentDefinition {
  type: string
  model?: Record<string, unknown>
  view?: Record<string, unknown>
  traits?: Record<string, unknown>
  [key: string]: unknown
}

const registeredComponents = new Map<string, StudioComponentDefinition>()

export function registerEmailComponent(component: StudioComponentDefinition): void {
  if (registeredComponents.has(component.type)) {
    throw new Error(`Email component type already registered: ${component.type}`)
  }
  registeredComponents.set(component.type, component)
}

export function getRegisteredComponents(): StudioComponentDefinition[] {
  return [...registeredComponents.values()]
}

export function getEmailComponent(type: string): StudioComponentDefinition | undefined {
  return registeredComponents.get(type)
}

export function clearRegisteredComponents(): void {
  registeredComponents.clear()
}

/**
 * Get Studio SDK component configuration object for use in EmailEditor options.
 * Built-in email components (text, image, button, columns, divider, spacer, html, mjml)
 * are automatically available when project.type is 'email'.
 * This function returns only custom registered components.
 */
export function getStudioComponents(): Record<string, StudioComponentDefinition> {
  const components: Record<string, StudioComponentDefinition> = {}
  for (const [type, component] of registeredComponents) {
    components[type] = component
  }
  return components
}
