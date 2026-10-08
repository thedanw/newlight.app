/** Auto-generate a slug from a human-readable label (e.g. "Not Started" → "not-started"). */
export function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
