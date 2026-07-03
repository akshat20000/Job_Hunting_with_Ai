import { browserPool } from '../../browser/browserPool.js';
import { loginLinkedIn } from './login.js';
import { env } from '../../config/index.js';
import fs from 'fs';
import path from 'path';

export async function applyLinkedIn(
  url: string,
  resumePath: string,
  coverLetterPath?: string,
  screenshotPath?: string
): Promise<void> {
  if (!env.LINKEDIN_AUTOMATION_ENABLED) {
    throw new Error('LinkedIn application skipped since LINKEDIN_AUTOMATION_ENABLED=false.');
  }

  console.log(`🚀 [LinkedIn Apply] Beginning Easy Apply workflow for URL: ${url}`);
  const context = await browserPool.newContext();
  const page = await context.newPage();

  try {
    // 1. Session Login
    await loginLinkedIn(page);
    await browserPool.randomDelay(2000, 3000);

    // 2. Load Listing
    await page.goto(url, { waitUntil: 'load' });
    await browserPool.randomDelay(3000, 5000);

    // 3. Detect Apply State
    const applyButton = page.locator('button.jobs-apply-button').first();
    const count = await applyButton.count();

    if (count === 0) {
      const alreadyApplied =
        (await page.locator('.artdeco-inline-feedback--success, .jobs-s-apply--applied').count()) > 0;
      if (alreadyApplied) {
        console.log('⏭️ [LinkedIn Apply] Already applied to this listing. Skipping.');
        return;
      }
      throw new Error('Listing is not open for "Easy Apply" or has expired.');
    }

    // Click "Easy Apply" to open modal
    await applyButton.click();
    await browserPool.randomDelay(2000, 3500);

    // 4. Modal Loop Stepper
    let currentStep = 0;
    const maxSafetySteps = 10;
    let submitted = false;

    while (currentStep < maxSafetySteps) {
      currentStep++;
      console.log(`➡️ [LinkedIn Apply] Stepping through application modal (Step ${currentStep})...`);

      // File upload handling
      const uploadInputs = page.locator('input[type="file"]');
      const inputCount = await uploadInputs.count();

      if (inputCount > 0) {
        const inputId = (await uploadInputs.first().getAttribute('id').catch(() => '')) || '';
        
        if (inputId.toLowerCase().includes('resume') || inputCount === 1) {
          console.log(`📂 [LinkedIn Apply] Uploading tailored resume: ${resumePath}`);
          await uploadInputs.first().setInputFiles(resumePath);
          await browserPool.randomDelay(2000, 3000);
        } else if (coverLetterPath && (inputId.toLowerCase().includes('cover') || inputId.toLowerCase().includes('letter'))) {
          console.log(`📂 [LinkedIn Apply] Uploading tailored cover letter: ${coverLetterPath}`);
          await uploadInputs.first().setInputFiles(coverLetterPath);
          await browserPool.randomDelay(2000, 3000);
        }
      }

      // Step selectors
      const nextButton = page.locator('button:has-text("Next"), button[aria-label*="Next step"]').first();
      const reviewButton = page.locator('button:has-text("Review"), button[aria-label*="Review application"]').first();
      const submitButton = page.locator('button:has-text("Submit application"), button[aria-label*="Submit application"]').first();

      if ((await submitButton.count()) > 0 && (await submitButton.isVisible())) {
        console.log('💾 [LinkedIn Apply] Submitting application...');
        await submitButton.click();
        await browserPool.randomDelay(4000, 6000);
        submitted = true;
        break;
      }

      if ((await reviewButton.count()) > 0 && (await reviewButton.isVisible())) {
        console.log('💾 [LinkedIn Apply] Reviewing application form...');
        await reviewButton.click();
        await browserPool.randomDelay(1500, 2500);
        continue;
      }

      if ((await nextButton.count()) > 0 && (await nextButton.isVisible())) {
        console.log('💾 [LinkedIn Apply] Advancing to next step...');
        await nextButton.click();
        await browserPool.randomDelay(1500, 2500);
        continue;
      }

      // Blocked by validation or custom question
      throw new Error(
        'LinkedIn Apply blocked: Form validation error or custom screening questions are required.'
      );
    }

    if (!submitted) {
      throw new Error('LinkedIn Easy Apply session terminated without submission.');
    }

    // 5. Capture Proof Screenshot
    if (screenshotPath) {
      console.log(`📸 [LinkedIn Apply] Capturing proof screenshot: ${screenshotPath}`);
      fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }
  } catch (applyError: any) {
    console.error('❌ [LinkedIn Apply] Application submission failed:', applyError.message);
    throw applyError;
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
}

export default applyLinkedIn;
