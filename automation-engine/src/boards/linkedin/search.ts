import { browserPool } from '../../browser/browserPool.js';
import { loginLinkedIn } from './login.js';
import { parseLinkedInJobPage, LinkedInParsedJob } from './parser.js';
import { env } from '../../config/index.js';

export async function scrapeLinkedIn(
  query: string,
  location = 'Remote',
  limit = 5
): Promise<(LinkedInParsedJob & { url: string })[]> {
  if (!env.LINKEDIN_AUTOMATION_ENABLED) {
    console.warn('⚠️ [LinkedIn Search] LinkedIn search skipped since LINKEDIN_AUTOMATION_ENABLED=false.');
    return [];
  }

  console.log(`🔍 [LinkedIn Search] Starting job search for "${query}" in "${location}"...`);
  const context = await browserPool.newContext();
  const page = await context.newPage();
  const results: (LinkedInParsedJob & { url: string })[] = [];

  try {
    // 1. Authenticate session
    await loginLinkedIn(page);
    await browserPool.randomDelay(2000, 3000);

    // 2. Navigate to authenticated jobs search page
    const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
      query
    )}&location=${encodeURIComponent(location)}`;
    console.log(`🔍 [LinkedIn Search] Navigating search page: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'load' });
    await browserPool.randomDelay(2500, 4500);

    // Select container list items
    const jobListLocator = page.locator(
      '.scaffold-layout__list-item, .jobs-search-results__list-item, .job-card-container'
    );
    const totalFound = await jobListLocator.count();
    console.log(`📊 [LinkedIn Search] Found ${totalFound} listings in initial card viewport.`);

    const parseLimit = Math.min(totalFound, limit);
    for (let i = 0; i < parseLimit; i++) {
      try {
        const card = jobListLocator.nth(i);
        await card.scrollIntoViewIfNeeded().catch(() => {});
        await browserPool.randomDelay(800, 1500);

        // Find primary details URL link anchor
        const anchor = card.locator('a[href*="/jobs/view/"], .job-card-list__title').first();
        const relativeUrl = (await anchor.getAttribute('href').catch(() => '')) || '';
        if (!relativeUrl) continue;

        // Clean link parameters
        const cleanUrl = relativeUrl.split('?')[0];
        const absoluteUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://www.linkedin.com${cleanUrl}`;

        // Select and load right-hand description card
        await anchor.click();
        await browserPool.randomDelay(1800, 3200);

        const details = await parseLinkedInJobPage(page);
        results.push({
          ...details,
          url: absoluteUrl,
        });

        console.log(`✅ [LinkedIn Search] Parsed: "${details.title}" @ "${details.companyName}"`);
      } catch (cardError: any) {
        console.error(`⚠️ [LinkedIn Search] Skipping card index ${i} due to parsing error:`, cardError.message);
      }
    }
  } catch (searchError: any) {
    console.error('❌ [LinkedIn Search] Execution failed during search step:', searchError.message);
    throw searchError;
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }

  return results;
}

export default scrapeLinkedIn;
