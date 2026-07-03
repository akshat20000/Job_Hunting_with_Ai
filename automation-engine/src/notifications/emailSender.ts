import nodemailer from 'nodemailer';
import { emailConfig } from '../config/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to resolve the email templates dynamically in dev/compiled modes
const getTemplate = (filename: string): string => {
  const searchPaths = [
    path.join(__dirname, 'templates', filename),
    path.join(__dirname, '..', 'notifications', 'templates', filename),
    path.join(process.cwd(), 'src', 'notifications', 'templates', filename),
    path.join(process.cwd(), 'dist', 'notifications', 'templates', filename),
  ];
  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf8');
    }
  }
  throw new Error(`Email template ${filename} not found in search paths: ${searchPaths.join(', ')}`);
};

export interface EmailPayload {
  jobTitle: string;
  companyName: string;
  jobUrl: string;
  success: boolean;
  errorDetails?: string;
  screenshotPath?: string;
}

export class EmailSender {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    });
  }

  async sendNotification(payload: EmailPayload): Promise<void> {
    const { jobTitle, companyName, jobUrl, success, errorDetails, screenshotPath } = payload;

    const templateName = success ? 'applicationSubmitted.html' : 'applicationFailed.html';
    let html = getTemplate(templateName);

    // Replace template variables
    html = html
      .replace(/\{\{jobTitle\}\}/g, jobTitle)
      .replace(/\{\{companyName\}\}/g, companyName)
      .replace(/\{\{jobUrl\}\}/g, jobUrl)
      .replace(/\{\{appliedAt\}\}/g, new Date().toLocaleString())
      .replace(/\{\{errorDetails\}\}/g, errorDetails || 'No details provided');

    const subject = success
      ? `🚀 Application Submitted: ${jobTitle} at ${companyName}`
      : `⚠️ Application Failed: ${jobTitle} at ${companyName}`;

    const attachments = [];
    if (screenshotPath && fs.existsSync(screenshotPath)) {
      attachments.push({
        filename: 'submission_proof.png',
        path: screenshotPath,
      });
    }

    const mailOptions = {
      from: emailConfig.from,
      to: emailConfig.notifyTo,
      subject,
      html,
      attachments,
    };

    console.log(`✉️ [EmailSender] Dispatching subject "${subject}" to ${emailConfig.notifyTo}...`);
    await this.transporter.sendMail(mailOptions);
    console.log('✅ [EmailSender] Notification email dispatched successfully.');
  }
}

export const emailSender = new EmailSender();
export default emailSender;
