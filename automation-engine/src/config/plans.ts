// Plan limits — single source of truth for usage caps.
//
// The unit of "usage" is a SEARCH, not an application: clicking "Start Job
// Search" consumes one token regardless of how many (if any) of the results
// get auto-applied to. Applying is unlimited/free — it's gated only by how
// many matching jobs a search actually turns up.
//
// FREE limit is hardcoded at 4 searches/day per spec.
// PREMIUM limits are configurable via env vars (defaults are placeholders —
// revisit premium tiering later).

export const PLAN_LIMITS = {
  FREE: {
    dailySearches: 4,
    // Search runs broadly under the hood per board, but only this many
    // results per board are persisted/shown per search — keeps the
    // dashboard from being flooded by one high-volume employer.
    maxResultsPerBoard: 15,
  },
  PREMIUM: {
    dailySearches: parseInt(process.env.PREMIUM_DAILY_SEARCHES ?? '50', 10),
    maxResultsPerBoard: parseInt(process.env.PREMIUM_MAX_RESULTS_PER_BOARD ?? '15', 10),
  },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;

export function isValidPlan(plan: string): plan is PlanName {
  return plan === 'FREE' || plan === 'PREMIUM';
}