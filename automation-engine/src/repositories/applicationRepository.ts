import { BaseRepository } from './baseRepository.js';
import { Application, Job } from '@prisma/client';

export type ApplicationWithJob = Application & { job: Job };

export class ApplicationRepository extends BaseRepository {
  async findById(id: string): Promise<ApplicationWithJob | null> {
    return this.prisma.application.findUnique({
      where: { id },
      include: { job: true },
    });
  }

  async findByJobId(jobId: string): Promise<ApplicationWithJob | null> {
    return this.prisma.application.findUnique({
      where: { jobId },
      include: { job: true },
    });
  }

  async upsert(
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
      where: { jobId },
      update: {
        status: data.status,
        appliedAt: data.appliedAt,
        resumePath: data.resumePath,
        coverLetterPath: data.coverLetterPath,
        screenshotPath: data.screenshotPath,
        errorDetails: data.errorDetails,
      },
      create: {
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
    jobId: string,
    status: string,
    extra: Partial<Omit<Application, 'id' | 'jobId' | 'createdAt' | 'updatedAt'>> = {}
  ): Promise<Application> {
    return this.prisma.application.update({
      where: { jobId },
      data: {
        status,
        ...extra,
      },
    });
  }

  async updateArtifacts(jobId: string, resumePath: string, coverLetterPath: string): Promise<Application> {
    return this.prisma.application.update({
      where: { jobId },
      data: {
        resumePath,
        coverLetterPath,
      },
    });
  }

  async markApplied(jobId: string, screenshotPath: string): Promise<Application> {
    return this.prisma.application.update({
      where: { jobId },
      data: {
        status: 'SUBMITTED',
        appliedAt: new Date(),
        screenshotPath,
      },
    });
  }

  async markFailed(jobId: string, errorDetails: string): Promise<Application> {
    return this.prisma.application.update({
      where: { jobId },
      data: {
        status: 'FAILED',
        errorDetails,
      },
    });
  }
}
