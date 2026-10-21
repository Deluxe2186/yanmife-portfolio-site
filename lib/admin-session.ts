/**
 * Settings for how long an admin sign-in lasts.
 *
 * To change them, set these in your .env file (and in Vercel):
 *   NEXT_PUBLIC_ADMIN_IDLE_MINUTES  minutes of no activity before sign-out (default 15)
 *   NEXT_PUBLIC_ADMIN_MAX_HOURS     longest a sign-in can last, active or not (default 8)
 */
const read = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const IDLE_LIMIT_MS = read(process.env.NEXT_PUBLIC_ADMIN_IDLE_MINUTES, 15) * 60_000;
export const MAX_SESSION_MS = read(process.env.NEXT_PUBLIC_ADMIN_MAX_HOURS, 8) * 3_600_000;
/** How long before the idle sign-out the warning appears. */
export const WARNING_MS = Math.min(60_000, IDLE_LIMIT_MS / 3);

export const SIGNOUT_REASON_KEY = 'portfolio-admin-signout-reason';
export type SignOutReason = 'idle' | 'expired';

export function describeMinutes(ms: number): string {
  const minutes = ms / 60_000;
  if (minutes >= 60 && Number.isInteger(minutes / 60)) {
    const hours = minutes / 60;
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  const rounded = Math.max(1, Math.round(minutes));
  return `${rounded} minute${rounded === 1 ? '' : 's'}`;
}
