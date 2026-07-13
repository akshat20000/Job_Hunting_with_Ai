import { BaseRepository } from './baseRepository.js';

export class UserRepository extends BaseRepository {
  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: {
    email: string;
    name?: string;
    passwordHash: string;
    plan?: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        plan: data.plan ?? 'FREE',
      },
    });
  }

  async updatePlan(id: string, plan: string) {
    return this.prisma.user.update({ where: { id }, data: { plan } });
  }
}
