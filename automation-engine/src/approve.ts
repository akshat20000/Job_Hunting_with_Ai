import { prisma } from './config/index.js';
import { applyQueue } from './queue/jobQueues.js';
import { redisConnection } from './queue/connection.js';

/**
 * Manual review gate.
 *
 * With AUTO_APPLY_ENABLED=false (the default), tailored applications stop at
 * the READY state instead of being submitted automatically. Run this script
 * to see what's waiting, read the generated resume/cover letter paths, and
 * decide which ones actually get submitted.
 *
 *   npm run approve              -> lists all READY jobs
 *   npm run approve <jobId>      -> approves one job and enqueues it to Apply
 *   npm run approve --all        -> approves everything currently READY
 */

async function listReady() {
  const jobs = await prisma.job.findMany({
    where: { status: 'READY' },
    include: { company: true, applications: true },
    orderBy: { score: 'desc' },
  });

  if (jobs.length === 0) {
    console.log('✅ Nothing waiting for approval right now.');
    return [];
  }

  console.log(`\n📋 ${jobs.length} job(s) READY and awaiting approval:\n`);
  for (const job of jobs) {
    const app = job.applications[0];
    console.log(`ID: ${job.id}`);
    console.log(`  ${job.title} @ ${job.company.name}  (score: ${job.score ?? 'n/a'})`);
    console.log(`  ${job.url}`);
    if (app?.resumePath) console.log(`  Resume:       ${app.resumePath}`);
    if (app?.coverLetterPath) console.log(`  Cover Letter: ${app.coverLetterPath}`);
    console.log('');
  }
  return jobs;
}

async function approve(jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    console.error(`❌ No job found with ID ${jobId}`);
    return;
  }
  if (job.status !== 'READY') {
    console.error(`❌ Job ${jobId} is in status "${job.status}", not READY. Skipping.`);
    return;
  }
  await applyQueue.add(`apply-submission-${jobId}`, { jobId });
  console.log(`🚀 Approved and enqueued job ${jobId} (${job.title}) to the Apply queue.`);
}

async function main() {
  const args = process.argv.slice(2);
  const ready = await listReady();

  if (args.length === 0) {
    console.log('Run "npm run approve <jobId>" to approve a specific job, or "npm run approve -- --all" to approve everything above.');
    return;
  }

  if (args.includes('--all')) {
    for (const job of ready) {
      await approve(job.id);
    }
    return;
  }

  for (const jobId of args) {
    await approve(jobId);
  }
}

main()
  .catch((err) => {
    console.error('💥 Approval script failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await redisConnection.quit();
    await applyQueue.close();
  });
