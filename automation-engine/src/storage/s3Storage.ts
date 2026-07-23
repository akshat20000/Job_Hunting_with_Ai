import fs from 'fs';
import path from 'path';
import { env } from '../config/index.js';

export class LocalStorage {
  private baseDir: string;

  constructor() {
    this.baseDir = env.STORAGE_DIR;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Emulates file upload by copying a file into the local storage folder.
   */
  async uploadFile(sourcePath: string, destKey: string): Promise<string> {
    const destinationPath = path.join(this.baseDir, destKey);
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(sourcePath, destinationPath);
    console.log(`💾 [LocalStorage] Copied file from ${sourcePath} -> ${destinationPath}`);
    return destinationPath;
  }

  /**
   * Emulates file download by reading a local file.
   */
  async downloadFile(destKey: string): Promise<Buffer> {
    const sourcePath = path.join(this.baseDir, destKey);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`[LocalStorage] File not found in local storage bucket: ${sourcePath}`);
    }
    return fs.readFileSync(sourcePath);
  }

  /**
   * Emulates file deletion by removing a local file.
   */
  async deleteFile(destKey: string): Promise<void> {
    const sourcePath = path.join(this.baseDir, destKey);
    if (fs.existsSync(sourcePath)) {
      fs.unlinkSync(sourcePath);
      console.log(`💾 [LocalStorage] Deleted file: ${sourcePath}`);
    }
  }
}

export const s3Storage = new LocalStorage();
export default s3Storage;
