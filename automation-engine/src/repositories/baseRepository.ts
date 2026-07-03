import { prisma } from '../config/index.js';

export abstract class BaseRepository {
  protected prisma = prisma;
}
