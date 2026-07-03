import { browserPool } from '../../browser/browserPool.js';
import fs from 'fs';
import path from 'path';

export async function applyGreenhouse(
  url: string,
  resumePath: string,
  coverLetterPath?: string,
  screenshotPath?: string
): Promise<void> {
  console.log(`🚀 [Greenhouse Apply] Opening application form: ${url}`);
  const context = await browserPool.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'load' });
    await browserPool.randomDelay(2000, 3500);

    // Candidate details with environment overrides
    const firstName = process.env.CANDIDATE_FIRST_NAME || 'John';
    const lastName = process.env.CANDIDATE_LAST_NAME || 'Doe';
    const email = process.env.CANDIDATE_EMAIL || process.env.NOTIFY_TO_EMAIL || 'candidate@example.com';
    const phone = process.env.CANDIDATE_PHONE || '+1-555-0199';

    // Fill contact details
    await page.fill('input#first_name', firstName).catch(() => {});
    await page.fill('input#last_name', lastName).catch(() => {});
    await page.fill('input#email', email).catch(() => {});
    await page.fill('input#phone', phone).catch(() => {});
    await browserPool.randomDelay(1000, 2000);

    // Locate and upload resume file input
    const resumeInput = page
      .locator('input[type="file"][id*="resume"], input[type="file"][name*="resume"], input#resume')
      .first();
    if ((await resumeInput.count()) > 0) {
      console.log(`📂 [Greenhouse Apply] Uploading resume document: ${resumePath}`);
      await resumeInput.setInputFiles(resumePath);
      await browserPool.randomDelay(2000, 3000);
    }

    // Upload cover letter if requested
    if (coverLetterPath) {
      const coverInput = page
        .locator('input[type="file"][id*="cover"], input[type="file"][name*="cover"], input#cover_letter')
        .first();
      if ((await coverInput.count()) > 0) {
        console.log(`📂 [Greenhouse Apply] Uploading cover letter document: ${coverLetterPath}`);
        await coverInput.setInputFiles(coverLetterPath);
        await browserPool.randomDelay(2000, 3000);
      }
    }

    // Find submit button container
    const submitBtn = page
      .locator('#submit_app, button#submit_app, button:has-text("Submit Application")')
      .first();

    if ((await submitBtn.count()) === 0) {
      throw new Error('Greenhouse Submit button locator was not found.');
    }

    console.log('💾 [Greenhouse Apply] Clicking submit button...');
    await submitBtn.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await browserPool.randomDelay(4000, 6000);

    // Save submission screenshot
    if (screenshotPath) {
      console.log(`📸 [Greenhouse Apply] Saving submission screenshot: ${screenshotPath}`);
      fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }
  } catch (applyError: any) {
    console.error('❌ [Greenhouse Apply] Form submission failed:', applyError.message);
    throw applyError;
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
}

export default applyGreenhouse;
