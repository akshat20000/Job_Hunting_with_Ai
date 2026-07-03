import { BaseRepository } from './baseRepository.js';
import { Company } from '@prisma/client';

export class CompanyRepository extends BaseRepository {
  async findById(id: string): Promise<Company | null> {
    return this.prisma.company.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Company | null> {
    return this.prisma.company.findUnique({
      where: { name },
    });
  }

  async create(data: { name: string; website?: string }): Promise<Company> {
    return this.prisma.company.create({
      data,
    });
  }

  async upsert(name: string, website?: string): Promise<Company> {
    return this.prisma.company.upsert({
      where: { name },
      update: website ? { website } : {},
      create: { name, website },
    });
  }
}
