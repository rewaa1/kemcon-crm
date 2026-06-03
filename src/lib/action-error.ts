import { DomainError } from "@/domain/errors";

/**
 * Maps known Prisma error codes to a short, user-friendly message.
 * Full list: https://www.prisma.io/docs/orm/reference/error-reference
 */
function prismaCodeMessage(code: string): string | null {
  switch (code) {
    case "P2002":
      return "A record with these details already exists.";
    case "P2003":
      return "This action references a record that doesn't exist.";
    case "P2025":
      return "The record you're trying to change no longer exists.";
    case "P1001":
    case "P1002":
      return "Can't reach the database right now. Please try again in a moment.";
    default:
      return null;
  }
}

/**
 * Converts any thrown value into a safe, user-facing message.
 *
 * - DomainError messages are intentional and shown as-is.
 * - Prisma / infrastructure errors are logged in full server-side, but the
 *   user only sees a short, friendly message — never a raw query dump.
 *
 * @param error    the caught value
 * @param fallback message used for unexpected errors
 */
export function toUserMessage(error: unknown, fallback: string): string {
  // Domain errors are written for humans — safe to surface directly.
  if (error instanceof DomainError) {
    return error.message;
  }

  // Anything else is unexpected: log the real error for debugging.
  console.error("[action error]", error);

  // Prisma errors carry a `code`; map the common ones to friendly text.
  if (error && typeof error === "object" && "code" in error) {
    const mapped = prismaCodeMessage(String((error as { code: unknown }).code));
    if (mapped) return mapped;
  }

  // Prisma validation errors (e.g. unknown field, bad include) have this name.
  if (error && typeof error === "object" && "name" in error) {
    const name = String((error as { name: unknown }).name);
    if (name === "PrismaClientValidationError" || name === "PrismaClientKnownRequestError") {
      return fallback;
    }
  }

  return fallback;
}
