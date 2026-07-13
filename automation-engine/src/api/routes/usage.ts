import { Router } from 'express';
import { requireUserId, AuthenticatedRequest } from '../middleware/auth.js';
import { UsageLimiter } from '../../domain/UsageLimiter.js';
import { Request, Response } from 'express';

const router = Router();
const usageLimiter = new UsageLimiter();

/**
 * GET /api/me/usage
 * Returns the current user's daily application usage stats.
 */
router.get('/', requireUserId, async (req: Request, res: Response) => {
  const { userId, userPlan } = req as AuthenticatedRequest;
  try {
    const usage = await usageLimiter.getUsage(userId, userPlan);
    res.json({
      used: usage.used,
      limit: usage.limit,
      plan: usage.plan,
      resetsAt: usage.resetsAt.toISOString(),
      remaining: Math.max(0, usage.limit - usage.used),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
