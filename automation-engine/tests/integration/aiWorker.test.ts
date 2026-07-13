import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIWorker } from '../../src/workers/aiWorker.js';
import { brainEngineClient } from '../../src/clients/brainEngineClient.js';
import { tailorQueue } from '../../src/queue/jobQueues.js';

// Mock dependencies to avoid side effects during test suites
vi.mock('../../src/repositories/jobRepository.js', () => {
  return {
    JobRepository: vi.fn().mockImplementation(() => ({
      findById: vi.fn().mockResolvedValue({
        id: 'job-uuid-123',
        title: 'Backend Dev',
        description: 'Node, TS, Postgres',
        status: 'FOUND',
      }),
      updateScore: vi.fn().mockResolvedValue({}),
      updateStatus: vi.fn().mockResolvedValue({}),
    })),
  };
});

vi.mock('../../src/repositories/applicationRepository.js', () => {
  return {
    ApplicationRepository: vi.fn().mockImplementation(() => ({
      updateStatus: vi.fn().mockResolvedValue({}),
      markFailed: vi.fn().mockResolvedValue({}),
    })),
  };
});

vi.mock('../../src/repositories/resumeRepository.js', () => {
  return {
    ResumeRepository: vi.fn().mockImplementation(() => ({
      findActiveByUser: vi.fn().mockResolvedValue({
        id: 'resume-1',
        parsedText: 'Candidate: Senior engineer with Python expertise.',
        content: 'Candidate: Senior engineer with Python expertise.',
        isActive: true,
      }),
    })),
  };
});

vi.mock('../../src/clients/brainEngineClient.js', () => {
  return {
    brainEngineClient: {
      evaluateFit: vi.fn(),
    },
  };
});

vi.mock('../../src/queue/jobQueues.js', () => {
  return {
    tailorQueue: {
      add: vi.fn(),
    },
    notificationQueue: {
      add: vi.fn(),
    },
  };
});

vi.mock('../../src/queue/connection.js', () => {
  return {
    redisConnection: {},
  };
});

describe('AIWorker Integration', () => {
  let worker: AIWorker;

  beforeEach(() => {
    vi.clearAllMocks();
    worker = new AIWorker();
  });

  it('should process job details, update fit score, and transition to MATCHED state when score >= 70', async () => {
    const bullJob = {
      id: 'bull-job-1',
      // Now includes userId in the job data
      data: { jobId: 'job-uuid-123', userId: 'user-uuid-1' },
    } as any;

    // Simulate high score match
    (brainEngineClient.evaluateFit as any).mockResolvedValue({
      score: 92.5,
      explanation: 'Candidate lists Node.js and TypeScript extensively.',
      key_matches: ['Node', 'TS'],
      missing_keywords: [],
    });

    // Execute internal worker logic directly
    await worker['processJob'](bullJob);

    expect(worker['jobRepo'].findById).toHaveBeenCalledWith('job-uuid-123');
    // Now expects resume_content to be passed (from the mocked active resume)
    expect(brainEngineClient.evaluateFit).toHaveBeenCalledWith({
      job_title: 'Backend Dev',
      job_description: 'Node, TS, Postgres',
      resume_content: 'Candidate: Senior engineer with Python expertise.',
    });
    expect(worker['jobRepo'].updateScore).toHaveBeenCalledWith(
      'job-uuid-123',
      92.5,
      'Candidate lists Node.js and TypeScript extensively.'
    );
    expect(worker['jobRepo'].updateStatus).toHaveBeenCalledWith('job-uuid-123', 'MATCHED');
    // updateStatus now takes (userId, jobId, status)
    expect(worker['applicationRepo'].updateStatus).toHaveBeenCalledWith(
      'user-uuid-1',
      'job-uuid-123',
      'MATCHED'
    );
    expect(tailorQueue.add).toHaveBeenCalled();
  });
});
