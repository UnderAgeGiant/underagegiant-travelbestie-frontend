/** isLoggedIn() flips true together with the server user (AuthService.setTokens), so a stale
 *  localStorage user without `username` can never trigger this before the refresh lands. */
export const shouldShowProfileIntro = (loggedIn: boolean, username: string | null | undefined): boolean =>
  loggedIn && !username;
