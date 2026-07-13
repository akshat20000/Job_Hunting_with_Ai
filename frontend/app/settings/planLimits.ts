// Client-side plan limit constants for the settings page.
// These must match automation-engine/src/config/plans.ts.
export const PLAN_LIMITS = {
  FREE: { dailyApplications: 4 },
  PREMIUM: { dailyApplications: 50 },
} as const;
