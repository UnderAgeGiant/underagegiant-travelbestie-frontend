/** isLoggedIn() flips true together with the server user (AuthService.setTokens), so a stale
 *  localStorage user without `username` can never trigger this before the refresh lands. */
export const shouldShowProfileIntro = (loggedIn: boolean, username: string | null | undefined, firstPlanAvailable = false): boolean =>
  loggedIn && !username && !firstPlanAvailable; // F79: the tour waits until the free first plan is used
