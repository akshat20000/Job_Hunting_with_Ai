import { env } from './env.js';

export const playwrightConfig = {
  headless: env.PLAYWRIGHT_HEADLESS,
  linkedinAutomationEnabled: env.LINKEDIN_AUTOMATION_ENABLED,
  defaultTimeout: 30000,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  viewport: { width: 1280, height: 800 },
  actionDelayMin: 1000,
  actionDelayMax: 3000,
};

export default playwrightConfig;
