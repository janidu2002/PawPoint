import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

/**
 * Global error handling.
 *
 * Mounted last in server.ts. Express 5 forwards rejected promises from async
 * handlers here automatically, so controllers can `throw` freely.
 */

/** Anything reaching this point matched no route. */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Converts a thrown value into a JSON response.
 *
 * Deliberate error messages are sent through; anything unexpected is logged
 * server-side and reported as a generic 500 so internals never reach the client.
 */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  // Duplicate key: the unique index rejected a duplicate email.
  if (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: number }).code === 11000
  ) {
    res.status(409).json({
      success: false,
      message: "An account with that email already exists",
    });
    return;
  }

  // Bad ObjectId in a route param or query.
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ success: false, message: "Malformed identifier" });
    return;
  }

  // Malformed JSON body from express.json().
  if (
    err instanceof SyntaxError &&
    "status" in err &&
    (err as SyntaxError & { status?: number }).status === 400
  ) {
    res.status(400).json({ success: false, message: "Malformed JSON body" });
    return;
  }

  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(env.nodeEnv === "development" && err instanceof Error
      ? { detail: err.message }
      : {}),
  });
};
