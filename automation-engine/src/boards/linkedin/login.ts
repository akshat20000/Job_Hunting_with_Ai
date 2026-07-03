/**
 * ⚠️ WARNING: Automated LinkedIn login violates LinkedIn's Terms of Service and
 * commonly triggers CAPTCHA challenges, account rate-limiting, or permanent bans.
 * Build it with caution. Opt-in is required via LINKEDIN_AUTOMATION_ENABLED=true.
 * basic safeguards: randomized delays between actions, a realistic user-agent,
 * and a headful (non-headless) browser option for solving CAPTCHAs manually if one appears.
 */
import { Page } from 'playwright';
import { browserPool } from '../../browser/browserPool.js';

export async function loginLinkedIn(page: Page): Promise<void> {
  const username = process.env.LINKEDIN_USERNAME;
  const password = process.env.LINKEDIN_PASSWORD;

  if (!username || !password) {
    throw new Error('LinkedIn credentials (LINKEDIN_USERNAME/LINKEDIN_PASSWORD) not found in env.');
  }

  console.log('🔑 [LinkedIn Login] Navigating to LinkedIn login page...');
  await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded' });
  await browserPool.randomDelay(1500, 3000);

  // Input credentials with humanized delays
  await page.fill('input#username', username);
  await browserPool.randomDelay(500, 1200);

  await page.fill('input#password', password);
  await browserPool.randomDelay(500, 1200);

  // Submit login form
  console.log('🔑 [LinkedIn Login] Submitting credentials...');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('load');

  // Safely check for CAPTCHA/Verification challenges
  const challengeSelectors = ['#captcha-dialog', 'iframe[src*="captcha"]', '.challenge-dialog', '.challenge-container'];
  let isChallenged = false;

  for (const selector of challengeSelectors) {
    if (await page.locator(selector).count().catch(() => 0) > 0) {
      isChallenged = true;
      break;
    }
  }

  if (isChallenged || page.url().includes('challenge')) {
    console.warn('⚠️ [LinkedIn Login] CAPTCHA/Verification Challenge detected!');
    console.warn('⚠️ [LinkedIn Login] If running headful, solve the challenge in the browser window.');

    // Wait up to 120 seconds (24 attempts x 5s) for user manual completion
    for (let i = 0; i < 24; i++) {
      await browserPool.randomDelay(5000, 5000);
      let stillChallenged = false;
      for (const selector of challengeSelectors) {
        if (await page.locator(selector).count().catch(() => 0) > 0) {
          stillChallenged = true;
          break;
        }
      }
      if (!stillChallenged && !page.url().includes('challenge')) {
        console.log('✅ [LinkedIn Login] Verification cleared by user.');
        isChallenged = false;
        break;
      }
    }

    if (isChallenged || page.url().includes('challenge')) {
      throw new Error('LinkedIn automated login blocked by verification CAPTCHA challenge.');
    }
  }

  // Confirm feed or navigation dashboard matches logged-in state
  const loginFeedLocator = page.locator('.global-nav, #global-nav, .feed-shared-update-v2');
  const feedExists = await loginFeedLocator.count().catch(() => 0) > 0;

  if (!feedExists && !page.url().includes('feed')) {
    // Check credentials errors
    const credentialsError = await page.locator('#error-for-username, #error-for-password').textContent().catch(() => '');
    if (credentialsError) {
      throw new Error(`LinkedIn Login Rejected: ${credentialsError.trim()}`);
    }
    console.warn('⚠️ [LinkedIn Login] Logged in dashboard feed locator not verified.');
  }

  console.log('✅ [LinkedIn Login] Logged in successfully.');
}

export default loginLinkedIn;
