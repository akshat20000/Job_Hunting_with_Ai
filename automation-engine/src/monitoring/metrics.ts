import promClient from 'prom-client';

// Collect default server process metrics
promClient.collectDefaultMetrics();

export const jobsScrapedCounter = new promClient.Counter({
  name: 'job_applications_scraped_total',
  help: 'Total number of jobs scraped from target boards',
  labelNames: ['board'],
});

export const jobsMatchedCounter = new promClient.Counter({
  name: 'job_applications_matched_total',
  help: 'Total number of jobs evaluated as high match fit by LLM',
});

export const jobsSubmittedCounter = new promClient.Counter({
  name: 'job_applications_submitted_total',
  help: 'Total number of job applications submitted successfully',
  labelNames: ['board'],
});

export const jobsFailedCounter = new promClient.Counter({
  name: 'job_applications_failed_total',
  help: 'Total number of job application failures',
  labelNames: ['board', 'reason'],
});

export const register = promClient.register;
