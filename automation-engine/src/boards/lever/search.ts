import { browserPool } from '../../browser/browserPool.js';
import { parseLeverJobPage, LeverParsedJob } from './parser.js';

export async function scrapeLever(
  query: string,
  limit = 5
): Promise<(LeverParsedJob & { url: string })[]> {
  console.log(`🔍 [Lever Search] Starting DuckDuckGo search query for Lever board matching: "${query}"`);
  
  const context = await browserPool.newContext();
  const page = await context.newPage();
  const results: (LeverParsedJob & { url: string })[] = [];

  try {
    const queryStr = `site:jobs.lever.co ${query}`;
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(queryStr)}`;
    await page.goto(searchUrl, { waitUntil: 'load' });
    await browserPool.randomDelay(2000, 3500);

    const anchorElements = page.locator('a.result__url');
    const count = await anchorElements.count();
    console.log(`📊 [Lever Search] Found ${count} raw results on DuckDuckGo.`);

    const targetUrls: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = (await anchorElements.nth(i).getAttribute('href').catch(() => '')) || '';
      
      const urlParts = href.split('/');
      if (href.includes('jobs.lever.co') && urlParts.length >= 5) {
        const cleaned = href.split('?')[0];
        if (!targetUrls.includes(cleaned)) {
          targetUrls.push(cleaned);
        }
      }
    }

    console.log(`📊 [Lever Search] Extracted ${targetUrls.length} unique Lever job URL nodes.`);

    const parseLimit = Math.min(targetUrls.length, limit);
    for (let i = 0; i < parseLimit; i++) {
      const url = targetUrls[i];
      try {
        console.log(`🔍 [Lever Search] Fetching job card ${i + 1}/${parseLimit}: ${url}`);
        await page.goto(url, { waitUntil: 'load' });
        await browserPool.randomDelay(1500, 2500);

        const details = await parseLeverJobPage(page);
        results.push({
          ...details,
          url,
        });
      } catch (parseError: any) {
        console.error(`⚠️ [Lever Search] Error details on link: ${url}`, parseError.message);
      }
    }
  } catch (searchError: any) {
    console.error('❌ [Lever Search] Search execution crashed:', searchError.message);
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }

  return results;
}

export default scrapeLever;
