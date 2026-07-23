import { PLAN_LIMITS, PlanName, isValidPlan } from '../config/plans.js';
import { SearchRunRepository } from '../repositories/searchRunRepository.js';

export class DailyLimitExceededError extends Error {
  readonly plan: PlanName;
  readonly used: number;
  readonly limit: number;

  constructor(plan: PlanName, used: number) {
    const limit = PLAN_LIMITS[plan].dailySearches;
    super(
      `Daily search limit reached for ${plan} plan: ${used}/${limit} used today. ` +
        `Upgrade to PREMIUM for a higher limit.`
    );
    this.name = 'DailyLimitExceededError';
    this.plan = plan;
    this.used = used;
    this.limit = limit;
  }
}

export class UsageLimiter {
  private searchRunRepo = new SearchRunRepository();

  /**
   * Check whether the user has remaining search capacity under their plan.
   * Throws DailyLimitExceededError if the cap has been reached.
   *
   * Call this before enqueuing any search — applying to matched jobs does
   * NOT consume quota, only starting a search does.
   */
  async check(userId: string, planRaw: string): Promise<void> {
    const plan: PlanName = isValidPlan(planRaw) ? planRaw : 'FREE';
    const limit = PLAN_LIMITS[plan].dailySearches;
    const used = await this.searchRunRepo.countToday(userId);

    if (used >= limit) {
      throw new DailyLimitExceededError(plan, used);
    }
  }

  /**
   * Record that a search was started, consuming one quota token for today.
   * Call this only after all validation has passed and the search is
   * definitely being enqueued.
   */
  async record(userId: string, boards: string[], titles: string[]): Promise<void> {
    await this.searchRunRepo.record(userId, boards, titles);
  }

  /**
   * Return the current usage stats for a user without enforcing the limit.
   */
  async getUsage(
    userId: string,
    planRaw: string
  ): Promise<{ used: number; limit: number; plan: PlanName; resetsAt: Date }> {
    const plan: PlanName = isValidPlan(planRaw) ? planRaw : 'FREE';
    const limit = PLAN_LIMITS[plan].dailySearches;
    const used = await this.searchRunRepo.countToday(userId);

    const resetsAt = new Date();
    resetsAt.setDate(resetsAt.getDate() + 1);
    resetsAt.setHours(0, 0, 0, 0);

    return { used, limit, plan, resetsAt };
  }
}