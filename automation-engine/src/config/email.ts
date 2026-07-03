import { env } from './env.js';

export const emailConfig = {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  from: env.SMTP_USER,
  notifyTo: env.NOTIFY_TO_EMAIL,
};

export default emailConfig;
