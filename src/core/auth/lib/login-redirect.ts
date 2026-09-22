/**
 * Post-login redirect target (deep-link refresh fix).
 *
 * Route guards stash the originally requested path in `location.state.from`
 * before bouncing a visitor to /login; after sign-in the user is sent
 * straight back there instead of being dumped on the people landing page.
 * Only same-app absolute paths are accepted (defence against open redirects).
 */
export interface LoginLocationState {
  from?: unknown
}

export function getPostLoginTarget(state: unknown): string {
  const from = (state as LoginLocationState | null)?.from
  if (typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')) {
    return from
  }
  return '/people'
}
