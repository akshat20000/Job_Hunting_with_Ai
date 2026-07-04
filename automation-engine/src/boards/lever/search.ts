import { LeverParsedJob } from './parser.js';
import { LEVER_COMPANY_WATCHLIST } from '../../config/companyWatchlist.js';

interface LeverApiJob {
  id: string;
  text: string;
  hostedUrl: string;
  categories?: { location?: string; team?: string; commitment?: string };
  descriptionPlain?: string;
  lists?: { text: string; content: string }[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Polls Lever's public job-postings API directly for each company in the
 * watchlist, instead of scraping a search engine. No browser, no bot
 * detection risk — this is a plain, unauthenticated JSON endpoint meant to
 * be queried programmatically.
 */
export async function scrapeLever(
  query: string,
  limit = 5
): Promise<(LeverParsedJob & { url: string })[]> {
  console.log(
    `🔍 [Lever Search] Polling ${LEVER_COMPANY_WATCHLIST.length} company board(s) directly for: "${query}"`
  );

  const results: (LeverParsedJob & { url: string })[] = [];
  const queryLower = query.toLowerCase();

  for (const company of LEVER_COMPANY_WATCHLIST) {
    if (results.length >= limit) break;
    try {
      const apiUrl = `https://api.lever.co/v0/postings/${company}?mode=json`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.warn(`⚠️ [Lever Search] Company "${company}" returned HTTP ${response.status}, skipping.`);
        continue;
      }

      const jobs = (await response.json()) as LeverApiJob[];
      const matches = jobs.filter((job) => job.text.toLowerCase().includes(queryLower));

      console.log(
        `📊 [Lever Search] "${company}": ${jobs.length} total job(s), ${matches.length} matching "${query}".`
      );

      const companyDisplayName = company.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      for (const job of matches) {
        if (results.length >= limit) break;
        const listText = (job.lists || [])
          .map((l) => `${l.text}\n${stripHtml(l.content || '')}`)
          .join('\n\n');
        const fullDescription = [job.descriptionPlain, listText].filter(Boolean).join('\n\n');

        results.push({
          title: job.text.trim(),
          description: fullDescription || 'No Description Available',
          companyName: companyDisplayName,
          location: job.categories?.location,
          companyWebsite: undefined,
          salary: undefined,
          url: job.hostedUrl,
        });
      }
    } catch (err: any) {
      console.error(`❌ [Lever Search] Failed to poll company "${company}":`, err.message);
    }
  }

  console.log(`✅ [Lever Search] Collected ${results.length} matching job(s) across all watched companies.`);
  return results;
}

export default scrapeLever;