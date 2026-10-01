/**
 * The single error type thrown across the API.
 *
 * Carrying the HTTP status on the error lets the global error handler decide
 * what to send without a chain of `instanceof` checks or res.status calls
 * scattered through controllers.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  /** Field-level messages, keyed by field name. Sent back to the client. */
  readonly errors?: Record<string, string>;

  constructor(
    statusCode: number,
    message: string,
    errors?: Record<string, string>
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;

    // Required so `instanceof ApiError` survives the ES2022 class downlevel.
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, errors?: Record<string, string>): ApiError {
    return new ApiError(400, message, errors);
  }

  static notFound(message: string): ApiError {
    return new ApiError(404, message);
  }

  static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError(401, message);
  }

  /** Authenticated, but not permitted. Distinct from 401 so a client can tell
   *  "log in as someone else" apart from "you cannot do this". */
  static forbidden(message = "Forbidden"): ApiError {
    return new ApiError(403, message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }
}

export default ApiError;
