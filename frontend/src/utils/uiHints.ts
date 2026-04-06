export const UI_HINT_KEYS = {
  JOB_SCRAPER_PROFILE_AUTOFILL_DISMISSED: 'job-scraper.profile-hint-dismissed',
} as const;

export const UI_HINT_DISMISS_KEYS = Object.values(UI_HINT_KEYS);

export function isUiHintDismissed(key: string): boolean {
  return localStorage.getItem(key) === 'true';
}

export function dismissUiHint(key: string): void {
  localStorage.setItem(key, 'true');
}

export function resetUiHints(): void {
  UI_HINT_DISMISS_KEYS.forEach((key) => localStorage.removeItem(key));
}
