import type { LucideIcon } from 'lucide-react'

/**
 * Sidebar Module Registry
 *
 * Modules self-register at load time (import side-effect in routes.tsx).
 * This keeps core sidebar.tsx decoupled from module internals.
 * Single source of truth for module metadata is the module's Manifest.
 */
export interface SidebarModuleEntry {
  /** Stable module ID (matches Manifest.id) */
  id: string
  /** Display label (matches Manifest.name) */
  label: string
  /** Lucide icon component (matches Manifest.icon) */
  icon: LucideIcon
  /** Display order — lower sorts first (matches Manifest.number) */
  order?: number
  /** Optional visibility condition — if false, module hidden from sidebar */
  condition?: () => boolean
}

const modules: SidebarModuleEntry[] = []

/**
 * Register a module for sidebar display.
 * Called by module's routes.tsx at import time.
 * Idempotent: re-registration replaces existing entry (handles Vite HMR).
 */
export function registerSidebarModule(entry: SidebarModuleEntry): void {
  const existing = modules.findIndex((m) => m.id === entry.id)
  if (existing >= 0) {
    modules[existing] = entry
  } else {
    modules.push(entry)
  }
  // Sort by order (ascending) so module number drives sidebar position
  modules.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

/**
 * Get all registered modules for sidebar rendering.
 * Returns read-only array to prevent external mutation.
 */
export function getSidebarModules(): ReadonlyArray<SidebarModuleEntry> {
  return modules
}

/**
 * Clear all registered modules (for testing only).
 */
export function clearSidebarModules(): void {
  modules.length = 0
}