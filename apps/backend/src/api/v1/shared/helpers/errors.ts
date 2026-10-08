/**
 * Decide what an error may tell the client.
 *
 * Business-rule errors thrown by our services (plain `Error`s such as
 * "Invoice not found" or "Journal entry is not balanced") and validation /
 * auth errors are safe and useful to show. Anything else — database driver
 * errors, TypeErrors, ReferenceErrors — can leak internals (collection names,
 * query shapes, stack details), so the client gets a generic message and the
 * real error stays in the logs.
 */
const SAFE_ERROR_NAMES = new Set([
  "Error",
  "ValidationError", // mongoose schema validation
  "CastError", // malformed ids / values
  "AuthorizationError",
  "AuthenticationError",
]);

export const GENERIC_ERROR_MESSAGE = "Internal server error";

export function clientErrorMessage(
  error: unknown,
  fallback: string = GENERIC_ERROR_MESSAGE,
): string {
  if (!(error instanceof Error)) return fallback;

  // Duplicate key (unique index) errors from MongoDB.
  if ((error as { code?: number }).code === 11000) {
    return "A record with these details already exists.";
  }

  return SAFE_ERROR_NAMES.has(error.name) ? error.message : fallback;
}

/**
 * HTTP status for an error that reached the global handler without an
 * explicit `status`: business-rule and validation errors are the client's
 * (400, or 404 for "... not found"), duplicates are conflicts (409),
 * everything else is a server error.
 */
export function clientErrorStatus(error: unknown): number {
  const explicit =
    (error as { status?: number; statusCode?: number })?.status ??
    (error as { statusCode?: number })?.statusCode;
  if (typeof explicit === "number") return explicit;
  if ((error as { code?: number })?.code === 11000) return 409;
  if (error instanceof Error && SAFE_ERROR_NAMES.has(error.name)) {
    return /not found$/i.test(error.message) ? 404 : 400;
  }
  return 500;
}
