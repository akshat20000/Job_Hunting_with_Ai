"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnection = void 0;
var index_js_1 = require("../config/index.js");
var ioredis_1 = require("ioredis");
exports.redisConnection = new ioredis_1.Redis(index_js_1.env.REDIS_URL, {
    maxRetriesPerRequest: null,
});
exports.default = exports.redisConnection;
