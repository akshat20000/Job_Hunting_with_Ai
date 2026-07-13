/**
 * Authentication middleware for the automation-engine API.
 *
 * Strategy (Phase 1): The Next.js frontend calls these routes from the server side
 * (route handlers / server components), passing the authenticated user's ID in the
 * X-User-Id header. This header is trusted because both services run on the same
 * Docker network and the header is never forwarded from the client.
 *
 * NOTE: A shared JWT secret or mTLS is the Phase 2 hardening path.
 */

import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../../repositories/userRepository.js';

const userRepo = new UserRepository();

export interface AuthenticatedRequest extends Request {
  userId: string;
  userPlan: string;
}

export async function requireUserId(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.headers['x-user-id'] as string | undefined;

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    res.status(401).json({ error: 'Unauthorized: X-User-Id header is required.' });
    return;
  }

  // Verify the user actually exists in the database
  const user = await userRepo.findById(userId);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized: user not found.' });
    return;
  }

  (req as AuthenticatedRequest).userId = user.id;
  (req as AuthenticatedRequest).userPlan = user.plan;
  next();
}
