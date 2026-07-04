import { chromium, Browser, BrowserContext } from 'playwright';
import { playwrightConfig } from '../config/index.js';

export class BrowserPool {
  private browser: Browser | null =  null;

  async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: playwrightConfig.headless,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-dev-shm-usage',
        ],
      });
    }
    return this.browser;
  }

  async newContext(options = {}): Promise<BrowserContext> {
    const browser = await this.getBrowser();
    return browser.newContext({
      userAgent: playwrightConfig.userAgent,
      viewport: playwrightConfig.viewport,
      ...options,
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Generates a random delay between actions to humanize interaction behavior.
   */
  async randomDelay(min = playwrightConfig.actionDelayMin, max = playwrightConfig.actionDelayMax): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

export const browserPool = new BrowserPool();
export default browserPool;
