import { browserPool } from '../../browser/browserPool.js';
import { parseGreenhouseJobPage, GreenhouseParsedJob } from './parser.js';

export async function scrapeGreenhouse(
  query: string,
  limit = 5
): Promise<(GreenhouseParsedJob & { url: string })[]> {
  console.log(`🔍 [Greenhouse Search] Starting DuckDuckGo search query for Greenhouse board matching: "${query}"`);
  
  const context = await browserPool.newContext();
  const page = await context.newPage();
  const results: (GreenhouseParsedJob & { url: string })[] = [];

  try {
    // Perform HTML-only DuckDuckGo search to avoid captcha/JS challenges
    const queryStr = `site:boards.greenhouse.io ${query}`;
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(queryStr)}`;
    await page.goto(searchUrl, { waitUntil: 'load' });
    await browserPool.randomDelay(2000, 3500);

    const anchorElements = page.locator('a.result__url');
    const count = await anchorElements.count();
    console.log(`📊 [Greenhouse Search] Found ${count} raw results on index page.`);

    const targetUrls: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = (await anchorElements.nth(i).getAttribute('href').catch(() => '')) || '';
      
      // Filter link format to ensure it points to a specific job details page
      if (href.includes('boards.greenhouse.io') && href.includes('/jobs/')) {
        const cleaned = href.split('?')[0];
        if (!targetUrls.includes(cleaned)) {
          targetUrls.push(cleaned);
        }
      }
    }

    console.log(`📊 [Greenhouse Search] Extracted ${targetUrls.length} unique job URL nodes.`);

    const parseLimit = Math.min(targetUrls.length, limit);
    for (let i = 0; i < parseLimit; i++) {
      const url = targetUrls[i];
      try {
        console.log(`🔍 [Greenhouse Search] Fetching job card ${i + 1}/${parseLimit}: ${url}`);
        await page.goto(url, { waitUntil: 'load' });
        await browserPool.randomDelay(1500, 2500);

        const details = await parseGreenhouseJobPage(page);
        results.push({
          ...details,
          url,
        });
      } catch (parseError: any) {
        console.error(`⚠️ [Greenhouse Search] Error details on link: ${url}`, parseError.message);
      }
    }
  } catch (searchError: any) {
    console.error('❌ [Greenhouse Search] Search execution crashed:', searchError.message);
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }

  return results;
}

export default scrapeGreenhouse;
