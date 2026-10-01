/**
 * Environment configuration.
 *
 * Read once at startup and validated immediately, so a missing or unsafe value
 * stops the process with a clear message instead of failing later at an
 * arbitrary request.
 */

import dotenv from "dotenv";

// Loaded here rather than in server.ts: module imports are evaluated before the
// importing module's body runs, so validating process.env any earlier would see
// an empty environment.
dotenv.config();

const requireString = (name: string, value: string | undefined): string => {
  if (!value || !value.trim()) {
    throw new Error(`${name} is not defined in .env`);
  }
  return value.trim();
};

/**
 * Signing keys must have enough entropy to resist brute force. 32 characters
 * is the practical floor for an HS256 secret, so we refuse anything shorter
 * rather than shipping a weak default.
 */
const MIN_SECRET_LENGTH = 32;

const jwtSecret = requireString("JWT_SECRET", process.env.JWT_SECRET);

if (jwtSecret.length < MIN_SECRET_LENGTH) {
  throw new Error(
    `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters (got ${jwtSecret.length}). ` +
      `Generate one with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
  );
}

/**
 * Email that is granted admin rights at registration.
 *
 * Development convenience only: whoever can register this address becomes an
 * admin, so a deployed environment would need a real invite or approval flow.
 * Left unset, nobody is an admin and every account is a regular user.
 */
const optionalEmail = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim().toLowerCase();
  return trimmed || undefined;
};

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: requireString("MONGO_URI", process.env.MONGO_URI),
  jwtSecret,
  /** Optional comma-separated DNS resolvers; see config/db.ts. */
  dnsServers: process.env.DNS_SERVERS,
  /** Only ever "development" here; there is no deployed environment yet. */
  nodeEnv: process.env.NODE_ENV ?? "development",
  /** Optional. See the note above before using this outside development. */
  adminEmail: optionalEmail(process.env.ADMIN_EMAIL),
} as const;
