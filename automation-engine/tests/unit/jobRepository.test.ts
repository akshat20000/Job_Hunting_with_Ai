import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobRepository } from '../../src/repositories/jobRepository.js';
import { prisma } from '../../src/config/index.js';

// Mock the Prisma DB client module to decouple tests from physical connections
vi.mock('../../src/config/index.js', () => {
  return {
    prisma: {
      job: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        findMany: vi.fn(),
      },
    },
    env: {
      DATABASE_URL: 'postgresql://mock:mock@localhost:5432/mock',
    },
  };
});

describe('JobRepository', () => {
  let repository: JobRepository;

  beforeEach(() => {
    repository = new JobRepository();
    vi.clearAllMocks();
  });

  it('should query job unique records including their parent companies', async () => {
    const fakeJob = { id: 'test-uuid-1', title: 'Rust Engineer', url: 'https://careers.company.io/1' };
    (prisma.job.findUnique as any).mockResolvedValue(fakeJob);

    const match = await repository.findById('test-uuid-1');
    expect(prisma.job.findUnique).toHaveBeenCalledWith({
      where: { id: 'test-uuid-1' },
      include: { company: true },
    });
    expect(match).toEqual(fakeJob);
  });

  it('should update status flags', async () => {
    (prisma.job.update as any).mockResolvedValue({ id: 'test-uuid-1', status: 'MATCHED' });

    const job = await repository.updateStatus('test-uuid-1', 'MATCHED');
    expect(prisma.job.update).toHaveBeenCalledWith({
      where: { id: 'test-uuid-1' },
      data: { status: 'MATCHED' },
    });
    expect(job.status).toBe('MATCHED');
  });
});
