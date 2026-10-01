import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { User, type UserDocument } from "../models/User";
import { ApiError } from "../utils/ApiError";
import type {
  AuthResult,
  JwtPayload,
  LoginDto,
  RegisterDto,
  UserDto,
} from "../types/auth";

/** bcrypt cost factor. 12 is a sane balance for an auth route. */
const SALT_ROUNDS = 12;
const TOKEN_TTL = "7d";

/**
 * Hand-rolled validation.
 *
 * Kept dependency-free and colocated with the endpoint so the rules for a
 * given request are readable in one place.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const asString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

/**
 * Maps a user document to the client-facing shape.
 *
 * The only place a User is converted for output, so the password hash cannot
 * leak by accident - it is a separate, explicit step.
 */
const toUserDto = (user: UserDocument): UserDto => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  isAdmin: user.isAdmin,
  createdAt: user.createdAt.toISOString(),
});

const signToken = (user: UserDocument): string => {
  const payload: JwtPayload = { sub: user._id.toString(), email: user.email };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: TOKEN_TTL });
};

/**
 * POST /api/auth/register
 *
 * `isAdmin` is never read from the request body - registration always creates a
 * regular account, so a client cannot promote itself.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const name = asString(req.body?.name);
  const email = asString(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  const errors: Record<string, string> = {};

  if (name.length < 2) errors.name = "Name must be at least 2 characters";
  if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address";
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  if (Object.keys(errors).length > 0) {
    throw ApiError.badRequest("Validation failed", errors);
  }

  const existing = await User.exists({ email });
  if (existing) {
    throw ApiError.conflict("An account with that email already exists");
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({ name, email, password: hashed });

  const result: AuthResult = { token: signToken(user), user: toUserDto(user) };

  res.status(201).json({ success: true, message: "Account created", data: result });
};

/**
 * POST /api/auth/login
 *
 * The password field must be selected explicitly because the schema excludes
 * it by default. A wrong email and a wrong password both return 401 so the
 * response does not reveal which addresses are registered.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const email = asString(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  const errors: Record<string, string> = {};

  if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address";
  if (!password) errors.password = "Password is required";

  if (Object.keys(errors).length > 0) {
    throw ApiError.badRequest("Validation failed", errors);
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const matches = await bcrypt.compare(password, user.password);

  if (!matches) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const result: AuthResult = { token: signToken(user), user: toUserDto(user) };

  res.status(200).json({ success: true, message: "Logged in", data: result });
};

/**
 * GET /api/auth/me
 *
 * Re-reads the user from the database using the token's `sub` rather than
 * trusting the token body, so a deleted account cannot keep using its token.
 */
export const me = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as Request & { userId?: string }).userId;

  if (!userId) {
    throw ApiError.unauthorized();
  }

  const user = await User.findById(userId);

  if (!user) {
    throw ApiError.unauthorized("Account no longer exists");
  }

  res.status(200).json({ success: true, message: "Current user", data: toUserDto(user) });
};
