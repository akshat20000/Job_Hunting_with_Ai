import { Page } from 'playwright';

export interface GreenhouseParsedJob {
  title: string;
  description: string;
  companyName: string;
  companyWebsite?: string;
  location?: string;
  salary?: string;
}

export async function parseGreenhouseJobPage(page: Page): Promise<GreenhouseParsedJob> {
  await page
    .waitForSelector('h1.app-title, #content, div#main', {
      timeout: 10000,
    })
    .catch(() => {});

  const titleText = (await page.locator('h1.app-title').first().textContent().catch(() => '')) || '';
  const descText = (await page.locator('#content, #main').first().textContent().catch(() => '')) || '';
  const locationText = (await page.locator('.location').first().textContent().catch(() => '')) || '';

  // Extract company name slug from URL (e.g. boards.greenhouse.io/{company}/jobs/{id})
  const url = page.url();
  let companySlug = '';
  const urlParts = url.split('/');
  if (urlParts.length > 3) {
    companySlug = urlParts[3];
  }

  let finalCompanyName = companySlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  if (!finalCompanyName) {
    finalCompanyName =
      (await page.locator('.company-name').first().textContent().catch(() => '')) || 'Unknown Company';
  }

  return {
    title: titleText.trim() || 'Unknown Title',
    description: descText.trim() || 'No Description Available',
    companyName: finalCompanyName.trim(),
    location: locationText.trim() || undefined,
    companyWebsite: undefined,
    salary: undefined,
  };
}

export default parseGreenhouseJobPage;
