"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailConfig = void 0;
var env_js_1 = require("./env.js");
exports.emailConfig = {
    host: env_js_1.env.SMTP_HOST,
    port: env_js_1.env.SMTP_PORT,
    secure: env_js_1.env.SMTP_PORT === 465,
    auth: {
        user: env_js_1.env.SMTP_USER,
        pass: env_js_1.env.SMTP_PASS,
    },
    from: env_js_1.env.SMTP_USER,
    notifyTo: env_js_1.env.NOTIFY_TO_EMAIL,
};
exports.default = exports.emailConfig;
