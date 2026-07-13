import { PLAN_LIMITS, PlanName, isValidPlan } from '../config/plans.js';
import { ApplicationRepository } from '../repositories/applicationRepository.js';

export class DailyLimitExceededError extends Error {
  readonly plan: PlanName;
  readonly used: number;
  readonly limit: number;

  constructor(plan: PlanName, used: number) {
    const limit = PLAN_LIMITS[plan].dailyApplications;
    super(
      `Daily application limit reached for ${plan} plan: ${used}/${limit} used today. ` +
        `Upgrade to PREMIUM for a higher limit.`
    );
    this.name = 'DailyLimitExceededError';
    this.plan = plan;
    this.used = used;
    this.limit = limit;
  }
}

export class UsageLimiter {
  private appRepo = new ApplicationRepository();

  /**
   * Check whether the user has remaining capacity under their plan.
   * Throws DailyLimitExceededError if the cap has been reached.
   *
   * Call this before enqueuing any application to the apply worker.
   */
  async check(userId: string, planRaw: string): Promise<void> {
    const plan: PlanName = isValidPlan(planRaw) ? planRaw : 'FREE';
    const limit = PLAN_LIMITS[plan].dailyApplications;
    const used = await this.appRepo.countTodayApplications(userId);

    if (used >= limit) {
      throw new DailyLimitExceededError(plan, used);
    }
  }

  /**
   * Return the current usage stats for a user without enforcing the limit.
   */
  async getUsage(
    userId: string,
    planRaw: string
  ): Promise<{ used: number; limit: number; plan: PlanName; resetsAt: Date }> {
    const plan: PlanName = isValidPlan(planRaw) ? planRaw : 'FREE';
    const limit = PLAN_LIMITS[plan].dailyApplications;
    const used = await this.appRepo.countTodayApplications(userId);

    const resetsAt = new Date();
    resetsAt.setDate(resetsAt.getDate() + 1);
    resetsAt.setHours(0, 0, 0, 0);

    return { used, limit, plan, resetsAt };
  }
}
