import { GreenhouseParsedJob } from './parser.js';
import { GREENHOUSE_COMPANY_WATCHLIST } from '../../config/companyWatchlist.js';

interface GreenhouseApiJob {
  id: number;
  title: string;
  absolute_url: string;
  location?: { name: string };
  content?: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Polls Greenhouse's public job-board API directly for each company in the
 * watchlist, instead of scraping a search engine. No browser, no bot
 * detection risk — this is a plain, unauthenticated JSON endpoint meant to
 * be queried programmatically.
 */
export async function scrapeGreenhouse(
  query: string,
  limit = 5
): Promise<(GreenhouseParsedJob & { url: string })[]> {
  console.log(
    `🔍 [Greenhouse Search] Polling ${GREENHOUSE_COMPANY_WATCHLIST.length} company board(s) directly for: "${query}"`
  );

  const results: (GreenhouseParsedJob & { url: string })[] = [];
  const queryLower = query.toLowerCase();

  for (const boardToken of GREENHOUSE_COMPANY_WATCHLIST) {
    if (results.length >= limit) break;
    try {
      const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.warn(`⚠️ [Greenhouse Search] Board "${boardToken}" returned HTTP ${response.status}, skipping.`);
        continue;
      }

      const data = (await response.json()) as { jobs: GreenhouseApiJob[] };
      const jobs = data.jobs || [];
      const matches = jobs.filter((job) => job.title.toLowerCase().includes(queryLower));

      console.log(
        `📊 [Greenhouse Search] "${boardToken}": ${jobs.length} total job(s), ${matches.length} matching "${query}".`
      );

      const companyDisplayName = boardToken.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      for (const job of matches) {
        if (results.length >= limit) break;
        results.push({
          title: job.title.trim(),
          description: stripHtml(job.content || '') || 'No Description Available',
          companyName: companyDisplayName,
          location: job.location?.name,
          companyWebsite: undefined,
          salary: undefined,
          url: job.absolute_url,
        });
      }
    } catch (err: any) {
      console.error(`❌ [Greenhouse Search] Failed to poll board "${boardToken}":`, err.message);
    }
  }

  console.log(`✅ [Greenhouse Search] Collected ${results.length} matching job(s) across all watched boards.`);
  return results;
}

export default scrapeGreenhouse;