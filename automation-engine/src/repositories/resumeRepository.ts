import { BaseRepository } from './baseRepository.js';
import { Resume } from '@prisma/client';

export class ResumeRepository extends BaseRepository {
  async create(data: {
    userId: string;
    filePath: string;
    parsedText: string;
  }): Promise<Resume> {
    // Mark all previous resumes for this user as inactive
    await this.prisma.resume.updateMany({
      where: { userId: data.userId },
      data: { isActive: false },
    });

    return this.prisma.resume.create({
      data: {
        userId: data.userId,
        filePath: data.filePath,
        parsedText: data.parsedText,
        content: data.parsedText,
        isActive: true,
      },
    });
  }

  async findByUser(userId: string): Promise<Resume[]> {
    return this.prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveByUser(userId: string): Promise<Resume | null> {
    return this.prisma.resume.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Resume | null> {
    return this.prisma.resume.findUnique({ where: { id } });
  }
}
