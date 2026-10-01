import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import type { JwtPayload } from "../types/auth";

/** The verified user id, attached to the request by requireAuth. */
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

/**
 * Requires a valid `Authorization: Bearer <token>` header.
 *
 * On success the decoded `sub` becomes `req.userId`; controllers never trust
 * an id taken from the request body or query string.
 */
export const requireAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    next(ApiError.unauthorized("Missing bearer token"));
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  if (!token) {
    next(ApiError.unauthorized("Missing bearer token"));
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;

    if (!payload.sub) {
      next(ApiError.unauthorized("Invalid token"));
      return;
    }

    req.userId = payload.sub;
    next();
  } catch {
    // Covers both a malformed signature and an expired token; the client only
    // needs to know the token is no longer usable.
    next(ApiError.unauthorized("Invalid or expired token"));
  }
};

export default requireAuth;
