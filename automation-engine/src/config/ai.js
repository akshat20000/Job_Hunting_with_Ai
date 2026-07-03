"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiConfig = void 0;
var env_js_1 = require("./env.js");
exports.aiConfig = {
    brainEngineUrl: env_js_1.env.BRAIN_ENGINE_URL,
    groqApiKey: env_js_1.env.GROQ_API_KEY,
};
exports.default = exports.aiConfig;
