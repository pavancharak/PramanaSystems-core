import {
  evaluatePolicy,
} from "./evaluator";

/**
 * The result of a dry-run policy evaluation.
 *
 * DryRunResult is structurally distinct from ExecutionResult:
 * - governed is the literal false (ExecutionResult has literal true)
 * - No execution_id — no replay store interaction
 * - No runtime_hash — no runtime identity binding
 * - Not signed — produces no attestation
 * - No audit record — no side effects of any kind
 *
 * DryRunResult MUST NOT be accepted by any verification path that
 * expects an ExecutionResult. The TypeScript type system enforces
 * this at compile time via the governed literal type.
 *
 * Enforces: META-001, INV-072 (side-effect isolation for dry-run path).
 */
export interface DryRunResult {
  /** Policy identifier that was evaluated. */
  policy_id: string;

  /** Policy version that was evaluated. */
  policy_version: string;

  /** Schema version of this result format. */
  schema_version: string;

  /** The decision the policy would produce for these signals. */
  decision: string;

  /** Ordered list of rule identifiers that were evaluated. */
  rule_trace: string[];

  /**
   * Literal false. Always present.
   * Structurally distinguishes dry-run results from governed attestations.
   * A verifier MUST reject this as a governed ExecutionResult.
   */
  governed: false;

  /**
   * Literal true. Always present.
   * Explicit marker confirming this is a dry-run evaluation.
   */
  dry_run: true;

  /** ISO 8601 UTC timestamp of when the evaluation was performed. */
  evaluated_at: string;
}

/**
 * Evaluates a policy against signals without producing any side effects.
 *
 * Does NOT:
 * - Write to the replay store
 * - Write to the audit log
 * - Produce a cryptographic signature
 * - Issue or consume an ExecutionToken
 *
 * Does:
 * - Load and validate the policy
 * - Evaluate the rule tree against signals
 * - Return the decision and an empty rule trace
 *
 * Use this for: integration testing, pre-flight validation,
 * compliance preview, and the /evaluate API endpoint.
 *
 * @param policyId      - Policy identifier
 * @param policyVersion - Policy version directory (e.g. "v1")
 * @param signals       - Input signal map
 */
export function evaluateDryRun(
  policyId: string,
  policyVersion: string,
  signals: Record<string, unknown>
): DryRunResult {

  const decision =
    evaluatePolicy(
      policyId,
      policyVersion,
      signals
    );

  return {
    policy_id:
      policyId,

    policy_version:
      policyVersion,

    schema_version:
      "1.0.0",

    decision,

    rule_trace:
      [],

    governed:
      false,

    dry_run:
      true,

    evaluated_at:
      new Date()
        .toISOString(),
  };
}
