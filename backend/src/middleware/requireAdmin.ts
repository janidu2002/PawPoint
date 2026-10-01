import type { NextFunction, Response } from "express";

import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import type { AuthenticatedRequest } from "./requireAuth";

/**
 * Requires the authenticated user to be an admin.
 *
 * Must run after `requireAuth`, which is what sets `req.userId`.
 *
 * The role is re-read from the database on every request rather than trusted
 * from the JWT: a token is valid for 7 days, so a role baked into it would keep
 * granting admin long after the account was demoted.
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.userId) {
    throw ApiError.unauthorized();
  }

  const user = await User.findById(req.userId).select("isAdmin");

  // The same message whether the account is missing or merely not an admin, so
  // the endpoint does not confirm which user ids exist.
  if (!user?.isAdmin) {
    throw ApiError.forbidden("Admin access required");
  }

  next();
};

export default requireAdmin;
