export type AccountTileState = 'login' | 'account'

/** Account nav-tile state: signed in → account tile, signed out → log-in tile. */
export function getAccountTileState(user: { id: string } | null | undefined): AccountTileState {
  return user ? 'account' : 'login'
}