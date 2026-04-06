export const COLD_MAIL_CONTEXT_KEY = 'cold_mail_context';

export interface ColdMailContext {
  company_name?: string;
  job_role?: string;
  recipient_email?: string;
  source?: string;
  created_at: string;
}

export function getColdMailContext(): ColdMailContext | null {
  try {
    const raw = window.localStorage.getItem(COLD_MAIL_CONTEXT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ColdMailContext;
  } catch {
    return null;
  }
}

export function setColdMailContext(context: Omit<ColdMailContext, 'created_at'>): void {
  const payload: ColdMailContext = {
    ...context,
    created_at: new Date().toISOString(),
  };

  window.localStorage.setItem(COLD_MAIL_CONTEXT_KEY, JSON.stringify(payload));
}

export function clearColdMailContext(): void {
  window.localStorage.removeItem(COLD_MAIL_CONTEXT_KEY);
}
