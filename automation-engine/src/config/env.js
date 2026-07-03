"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
var dotenv_1 = require("dotenv");
var zod_1 = require("zod");
var path_1 = require("path");
var fs_1 = require("fs");
// Resolve environment variables by searching both local and parent directories
var envPaths = [
    path_1.default.resolve(process.cwd(), '.env'),
    path_1.default.resolve(process.cwd(), '../.env'),
];
for (var _i = 0, envPaths_1 = envPaths; _i < envPaths_1.length; _i++) {
    var envPath = envPaths_1[_i];
    if (fs_1.default.existsSync(envPath)) {
        dotenv_1.default.config({ path: envPath });
        break;
    }
}
var envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(3000),
    DATABASE_URL: zod_1.z.string().url(),
    REDIS_URL: zod_1.z.string().url().default('redis://localhost:6379'),
    BRAIN_ENGINE_URL: zod_1.z.string().url().default('http://localhost:8000'),
    GROQ_API_KEY: zod_1.z.string().min(1),
    SMTP_HOST: zod_1.z.string().min(1),
    SMTP_PORT: zod_1.z.coerce.number().default(587),
    SMTP_USER: zod_1.z.string().min(1),
    SMTP_PASS: zod_1.z.string().min(1),
    NOTIFY_TO_EMAIL: zod_1.z.string().email(),
    LINKEDIN_AUTOMATION_ENABLED: zod_1.z
        .string()
        .transform(function (val) { return val.toLowerCase() === 'true'; })
        .or(zod_1.z.boolean())
        .default(false),
    PLAYWRIGHT_HEADLESS: zod_1.z
        .string()
        .transform(function (val) { return val.toLowerCase() === 'true'; })
        .or(zod_1.z.boolean())
        .default(true),
    STORAGE_DIR: zod_1.z.string().default(path_1.default.join(process.cwd(), 'storage')),
});
var parseEnv = function () {
    var parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        console.error('❌ Invalid environment variables:', parsed.error.format());
        throw new Error('Invalid environment variables');
    }
    return parsed.data;
};
exports.env = parseEnv();
