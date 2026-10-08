/**
 * Escape a user-supplied string so it can be embedded in a RegExp / $regex
 * as a literal. Prevents regex injection and catastrophic-backtracking
 * (ReDoS) patterns from search inputs. Input is also capped in length.
 */
export const escapeRegex = (value: string, maxLength = 100): string =>
  String(value ?? "")
    .slice(0, maxLength)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
