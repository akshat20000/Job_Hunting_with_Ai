import { BaseRepository } from './baseRepository.js';

export class SearchRunRepository extends BaseRepository {
  /**
   * Record a search run. Called once a search is validated and about to be
   * enqueued — this is the moment the user's daily quota is consumed,
   * independent of how the search or any downstream applies turn out.
   */
  async record(userId: string, boards: string[], titles: string[]) {
    return this.prisma.searchRun.create({
      data: { userId, boards, titles },
    });
  }

  /**
   * Count how many searches this user has started today (since local
   * midnight). Used by UsageLimiter to enforce and display the daily cap.
   */
  async countToday(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return this.prisma.searchRun.count({
      where: { userId, createdAt: { gte: startOfDay } },
    });
  }
}