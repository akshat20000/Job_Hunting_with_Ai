"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playwrightConfig = void 0;
var env_js_1 = require("./env.js");
exports.playwrightConfig = {
    headless: env_js_1.env.PLAYWRIGHT_HEADLESS,
    linkedinAutomationEnabled: env_js_1.env.LINKEDIN_AUTOMATION_ENABLED,
    defaultTimeout: 30000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    actionDelayMin: 1000,
    actionDelayMax: 3000,
};
exports.default = exports.playwrightConfig;
