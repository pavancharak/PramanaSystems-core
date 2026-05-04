/**
 * Immutable record of a completed governance decision.
 *
 * The governed field is the literal type true — not boolean, not false,
 * always true. It is always present and always in signature scope.
 * This structurally distinguishes governed attestations from dry-run
 * results at both the TypeScript type level and at runtime.
 *
 * A verifier MUST reject any ExecutionResult where governed is absent
 * or not strictly equal to true.
 *
 * Enforces: META-001, INV-008, INV-014.
 */
export interface ExecutionResult {
  /** Unique execution identifier matching the consumed ExecutionToken. */
  execution_id: string;

  /** Policy identifier that was executed. */
  policy_id: string;

  /** Policy version string. */
  policy_version: string;

  /** Schema version of this result format. Currently "1.0.0". */
  schema_version: string;

  /** Runtime version that produced this result. Currently "1.0.0". */
  runtime_version: string;

  /** SHA-256 hash of the runtime manifest definition. */
  runtime_hash: string;

  /** The governance decision that was executed. */
  decision: string;

  /** SHA-256 hex digest of the input signals payload. */
  signals_hash: string;

  /** ISO 8601 UTC timestamp of when the decision was executed. */
  executed_at: string;

  /**
   * Literal true. Always present. Always in signature scope.
   * Structurally distinguishes governed attestations from dry-run results.
   * Enforces: META-001, INV-008, INV-014.
   */
  governed: true;
}

// Compile-time assertion: ExecutionResult.governed must always be the
// literal type true — never boolean, never false, never missing.
// If this line produces a TypeScript error, the type contract is broken.
type _AssertGoverned = ExecutionResult["governed"] extends true ? true : never;
const _check: _AssertGoverned = true;
void _check;
