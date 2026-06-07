/**
 * Path that starts the OAuth flow as a full-page navigation (#264).
 *
 * The native app uses this instead of `next-auth/react`'s `signIn`, which
 * starts the flow with a background `fetch`. In the iOS WebView a cookie set on
 * a fetch response is not shared with the page navigation that follows, so the
 * PKCE / state check cookies were missing when the provider redirected back and
 * sign-in failed. Navigating to this route sets those cookies on a navigation
 * response, which the WebView keeps, while PKCE and state stay enabled.
 */
export function appSignInPath(providerId: string): string {
  return `/api/app-signin/${encodeURIComponent(providerId)}`;
}
