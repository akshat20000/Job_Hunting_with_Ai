import { Page } from 'playwright';

export interface LinkedInParsedJob {
  title: string;
  description: string;
  companyName: string;
  companyWebsite?: string;
  location?: string;
  salary?: string;
}

export async function parseLinkedInJobPage(page: Page): Promise<LinkedInParsedJob> {
  // Wait for the description container to appear
  await page
    .waitForSelector('.jobs-description__content, #job-details, .jobs-box__html-content', {
      timeout: 10000,
    })
    .catch(() => {});

  // Scraping selectors
  const titleText =
    (await page
      .locator('h1, .jobs-unified-top-card__job-title, .job-details-jobs-unified-top-card__job-title')
      .first()
      .textContent()
      .catch(() => '')) || '';

  const companyText =
    (await page
      .locator(
        '.jobs-unified-top-card__company-name, .job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name a'
      )
      .first()
      .textContent()
      .catch(() => '')) || '';

  const descText =
    (await page
      .locator('.jobs-description__content, #job-details, .jobs-box__html-content')
      .first()
      .textContent()
      .catch(() => '')) || '';

  const locationText =
    (await page
      .locator('.jobs-unified-top-card__bullet, .job-details-jobs-unified-top-card__bullet')
      .first()
      .textContent()
      .catch(() => '')) || '';

  return {
    title: titleText.trim() || 'Unknown Title',
    description: descText.trim() || 'No Description Available',
    companyName: companyText.trim().replace(/\s+/g, ' ') || 'Unknown Company',
    location: locationText.trim() || undefined,
    companyWebsite: undefined,
    salary: undefined,
  };
}

export default parseLinkedInJobPage;
