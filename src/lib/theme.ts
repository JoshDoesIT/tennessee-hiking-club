/**
 * Whether the dark theme should be applied, given the persisted preference.
 *
 * The site defaults to light: dark is opt-in only (an explicit stored "dark"),
 * never inferred from the OS `prefers-color-scheme`. The before-paint script in
 * the root layout serialises this function so the no-flash check and this tested
 * contract can never drift apart.
 */
export function shouldUseDarkTheme(stored: string | null): boolean {
  return stored === "dark";
}
