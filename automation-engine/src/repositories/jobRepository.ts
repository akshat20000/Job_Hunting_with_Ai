import { BaseRepository } from './baseRepository.js';
import { Job, Company } from '@prisma/client';

export type JobWithCompany = Job & { company: Company };

export class JobRepository extends BaseRepository {
  async findById(id: string): Promise<JobWithCompany | null> {
    return this.prisma.job.findUnique({
      where: { id },
      include: { company: true },
    });
  }

  async findByUrl(url: string): Promise<JobWithCompany | null> {
    return this.prisma.job.findUnique({
      where: { url },
      include: { company: true },
    });
  }

  async create(data: {
    title: string;
    description: string;
    url: string;
    location?: string;
    salary?: string;
    companyId: string;
    status?: string;
  }): Promise<Job> {
    return this.prisma.job.create({
      data: {
        title: data.title,
        description: data.description,
        url: data.url,
        location: data.location,
        salary: data.salary,
        status: data.status || 'FOUND',
        companyId: data.companyId,
      },
    });
  }

  async updateStatus(id: string, status: string): Promise<Job> {
    return this.prisma.job.update({
      where: { id },
      data: { status },
    });
  }

  async updateScore(id: string, score: number, fitExplanation?: string): Promise<Job> {
    return this.prisma.job.update({
      where: { id },
      data: {
        score,
        fitExplanation,
      },
    });
  }

  async upsert(
    url: string,
    data: {
      title: string;
      description: string;
      location?: string;
      salary?: string;
      companyId: string;
      status?: string;
    }
  ): Promise<Job> {
    return this.prisma.job.upsert({
      where: { url },
      update: {
        title: data.title,
        description: data.description,
        location: data.location,
        salary: data.salary,
        status: data.status,
      },
      create: {
        url,
        title: data.title,
        description: data.description,
        location: data.location,
        salary: data.salary,
        status: data.status || 'FOUND',
        companyId: data.companyId,
      },
    });
  }

  async findByStatus(status: string): Promise<JobWithCompany[]> {
    return this.prisma.job.findMany({
      where: { status },
      include: { company: true },
    });
  }
}
