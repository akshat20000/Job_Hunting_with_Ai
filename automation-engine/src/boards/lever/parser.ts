import { Page } from 'playwright';

export interface LeverParsedJob {
  title: string;
  description: string;
  companyName: string;
  companyWebsite?: string;
  location?: string;
  salary?: string;
}

export async function parseLeverJobPage(page: Page): Promise<LeverParsedJob> {
  await page
    .waitForSelector('.posting-headline h2, .posting-header h2, .section-wrapper', {
      timeout: 10000,
    })
    .catch(() => {});

  const titleText =
    (await page.locator('.posting-headline h2, .posting-header h2').first().textContent().catch(() => '')) || '';

  // Extract text from all posting sections
  const sectionLocator = page.locator('.section-wrapper, .posting-description, .posting-section');
  const count = await sectionLocator.count();
  let descText = '';
  for (let i = 0; i < count; i++) {
    const text = await sectionLocator.nth(i).textContent().catch(() => '');
    if (text) {
      descText += text.trim() + '\n\n';
    }
  }

  const locationText =
    (await page.locator('.posting-categories .location, .location').first().textContent().catch(() => '')) || '';

  // Extract company name slug from URL path (e.g. jobs.lever.co/{company}/{id})
  const url = page.url();
  let companySlug = '';
  const urlParts = url.split('/');
  if (urlParts.length > 3) {
    companySlug = urlParts[3];
  }

  const finalCompanyName = companySlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: titleText.trim() || 'Unknown Title',
    description: descText.trim() || 'No Description Available',
    companyName: finalCompanyName || 'Unknown Company',
    location: locationText.trim() || undefined,
    companyWebsite: undefined,
    salary: undefined,
  };
}

export default parseLeverJobPage;
