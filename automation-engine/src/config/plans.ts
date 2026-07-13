// Plan limits — single source of truth for usage caps.
// FREE limit is hardcoded at 4 per spec.
// PREMIUM limit is configurable via PREMIUM_DAILY_LIMIT env var (defaults to 50).

export const PLAN_LIMITS = {
  FREE: {
    dailyApplications: 4,
  },
  PREMIUM: {
    dailyApplications: parseInt(process.env.PREMIUM_DAILY_LIMIT ?? '50', 10),
  },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;

export function isValidPlan(plan: string): plan is PlanName {
  return plan === 'FREE' || plan === 'PREMIUM';
}
