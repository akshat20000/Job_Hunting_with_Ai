import { BaseRepository } from './baseRepository.js';
import { Application, Job } from '@prisma/client';

export type ApplicationWithJob = Application & { job: Job & { company: { name: string } } };

export class ApplicationRepository extends BaseRepository {
  async findById(id: string): Promise<ApplicationWithJob | null> {
    return this.prisma.application.findUnique({
      where: { id },
      include: { job: { include: { company: true } } },
    });
  }

  async findByUserAndJobId(userId: string, jobId: string): Promise<ApplicationWithJob | null> {
    return this.prisma.application.findUnique({
      where: { userId_jobId: { userId, jobId } },
      include: { job: { include: { company: true } } },
    });
  }

  /**
   * @deprecated Use findByUserAndJobId instead. Retained for backward compatibility
   * in workers that haven't been threaded with userId yet.
   */
  async findByJobId(jobId: string): Promise<ApplicationWithJob | null> {
    return this.prisma.application.findFirst({
      where: { jobId },
      include: { job: { include: { company: true } } },
    });
  }

  async findByUserId(userId: string): Promise<ApplicationWithJob[]> {
    return this.prisma.application.findMany({
      where: { userId },
      include: { job: { include: { company: true } } },
      orderBy: [{ job: { score: 'desc' } }, { createdAt: 'desc' }],
    });
  }

  async upsert(
    userId: string,
    jobId: string,
    data: {
      status?: string;
      appliedAt?: Date | null;
      resumePath?: string | null;
      coverLetterPath?: string | null;
      screenshotPath?: string | null;
      errorDetails?: string | null;
    }
  ): Promise<Application> {
    return this.prisma.application.upsert({
      where: { userId_jobId: { userId, jobId } },
      update: {
        status: data.status,
        appliedAt: data.appliedAt,
        resumePath: data.resumePath,
        coverLetterPath: data.coverLetterPath,
        screenshotPath: data.screenshotPath,
        errorDetails: data.errorDetails,
      },
      create: {
        userId,
        jobId,
        status: data.status || 'FOUND',
        appliedAt: data.appliedAt,
        resumePath: data.resumePath,
        coverLetterPath: data.coverLetterPath,
        screenshotPath: data.screenshotPath,
        errorDetails: data.errorDetails,
      },
    });
  }

  async updateStatus(
    userId: string,
    jobId: string,
    status: string,
    extra: Partial<Omit<Application, 'id' | 'userId' | 'jobId' | 'createdAt' | 'updatedAt'>> = {}
  ): Promise<Application> {
    return this.prisma.application.update({
      where: { userId_jobId: { userId, jobId } },
      data: { status, ...extra },
    });
  }

  async updateArtifacts(
    userId: string,
    jobId: string,
    resumePath: string,
    coverLetterPath: string
  ): Promise<Application> {
    return this.prisma.application.update({
      where: { userId_jobId: { userId, jobId } },
      data: { resumePath, coverLetterPath },
    });
  }

  async markApplied(userId: string, jobId: string, screenshotPath: string): Promise<Application> {
    return this.prisma.application.update({
      where: { userId_jobId: { userId, jobId } },
      data: {
        status: 'APPLIED',
        appliedAt: new Date(),
        screenshotPath,
      },
    });
  }

  async markFailed(userId: string, jobId: string, errorDetails: string): Promise<Application> {
    return this.prisma.application.update({
      where: { userId_jobId: { userId, jobId } },
      data: { status: 'FAILED', errorDetails },
    });
  }

  /**
   * Delete all of this user's tracked applications. Called when a new
   * search starts, so the dashboard reflects only the latest search's
   * results instead of accumulating across runs. This only removes this
   * user's Application (join) rows — the underlying Job/Company records
   * are global/shared and are left untouched.
   */
  async deleteAllForUser(userId: string): Promise<number> {
    const result = await this.prisma.application.deleteMany({ where: { userId } });
    return result.count;
  }

  /**
   * Count how many applications this user has submitted today.
   * NOTE: no longer used to enforce the daily quota (that's now
   * search-based — see UsageLimiter/SearchRunRepository). Kept for
   * dashboards/analytics that want a raw "applies today" figure.
   */
  async countTodayApplications(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return this.prisma.application.count({
      where: {
        userId,
        status: { in: ['APPLYING', 'APPLIED'] },
        createdAt: { gte: startOfDay },
      },
    });
  }
}