import { browserPool } from '../../browser/browserPool.js';
import fs from 'fs';
import path from 'path';

export async function applyLever(
  url: string,
  resumePath: string,
  coverLetterPath?: string,
  screenshotPath?: string
): Promise<void> {
  console.log(`🚀 [Lever Apply] Beginning application process for: ${url}`);
  const context = await browserPool.newContext();
  const page = await context.newPage();

  try {
    // Append /apply path extension to go straight to form page
    let applyUrl = url.trim();
    if (!applyUrl.endsWith('/apply')) {
      applyUrl = applyUrl.replace(/\/$/, '') + '/apply';
    }

    console.log(`🚀 [Lever Apply] Loading URL: ${applyUrl}`);
    await page.goto(applyUrl, { waitUntil: 'load' });
    await browserPool.randomDelay(2000, 3500);

    const fullName = `${process.env.CANDIDATE_FIRST_NAME || 'John'} ${process.env.CANDIDATE_LAST_NAME || 'Doe'}`;
    const email = process.env.CANDIDATE_EMAIL || process.env.NOTIFY_TO_EMAIL || 'candidate@example.com';
    const phone = process.env.CANDIDATE_PHONE || '+1-555-0199';

    // Fill contact details
    await page.fill('input[name="name"]', fullName).catch(() => {});
    await page.fill('input[name="email"]', email).catch(() => {});
    await page.fill('input[name="phone"]', phone).catch(() => {});
    await browserPool.randomDelay(1000, 2000);

    // Locate and upload resume file input
    const fileInput = page.locator('input[type="file"]#resume-upload-input, input[type="file"][name*="resume"]').first();
    if ((await fileInput.count()) > 0) {
      console.log(`📂 [Lever Apply] Uploading resume document: ${resumePath}`);
      await fileInput.setInputFiles(resumePath);
      await browserPool.randomDelay(2000, 3000);
    }

    // Locate submit button
    const submitBtn = page.locator('button[type="submit"], #btn-submit, button:has-text("Submit Application")').first();
    if ((await submitBtn.count()) === 0) {
      throw new Error('Lever Submit button locator was not found.');
    }

    console.log('💾 [Lever Apply] Clicking submit button...');
    await submitBtn.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await browserPool.randomDelay(4000, 6000);

    // Save proof screenshot
    if (screenshotPath) {
      console.log(`📸 [Lever Apply] Saving submission screenshot: ${screenshotPath}`);
      fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }
  } catch (applyError: any) {
    console.error('❌ [Lever Apply] Application submission failed:', applyError.message);
    throw applyError;
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
}

export default applyLever;
