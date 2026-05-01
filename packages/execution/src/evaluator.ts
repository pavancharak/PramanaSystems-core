import fs from "fs";

import path from "path";

interface BaseCondition {
  signal?: string;

  equals?: unknown;

  greater_than?: number;

  less_than?: number;
}

interface AllCondition {
  all: Rule[];
}

interface AnyCondition {
  any: Rule[];
}

type Rule =
  | BaseCondition
  | AllCondition
  | AnyCondition;

interface SignalDefinition {
  type:
    | "boolean"
    | "number"
    | "string";

  required: boolean;
}

interface PolicyDocument {
  schema_version: string;

  signals: Record<
    string,
    SignalDefinition
  >;

  decision: string;

  rules: Rule;
}

function evaluateRule(
  rule: Rule,
  signals: Record<
    string,
    unknown
  >
): boolean {
  if ("all" in rule) {
    return rule.all.every(
      (child) =>
        evaluateRule(
          child,
          signals
        )
    );
  }

  if ("any" in rule) {
    return rule.any.some(
      (child) =>
        evaluateRule(
          child,
          signals
        )
    );
  }

  if (!rule.signal) {
    return false;
  }

  const actual =
    signals[
      rule.signal
    ];

  if (
    rule.equals !==
    undefined
  ) {
    return (
      actual ===
      rule.equals
    );
  }

  if (
    rule.greater_than !==
    undefined
  ) {
    return (
      typeof actual ===
        "number" &&
      actual >
        rule.greater_than
    );
  }

  if (
    rule.less_than !==
    undefined
  ) {
    return (
      typeof actual ===
        "number" &&
      actual <
        rule.less_than
    );
  }

  return false;
}

function validateSchemaVersion(
  policy: PolicyDocument
): void {
  const supported =
    [
      "1.0.0",
    ];

  if (
    !supported.includes(
      policy.schema_version
    )
  ) {
    throw new Error(
      `Unsupported schema version: ${policy.schema_version}`
    );
  }
}

function validateSignals(
  policy: PolicyDocument,
  signals: Record<
    string,
    unknown
  >
): void {
  for (
    const [
      signalName,
      definition,
    ] of Object.entries(
      policy.signals
    )
  ) {
    const value =
      signals[
        signalName
      ];

    if (
      definition.required &&
      value === undefined
    ) {
      throw new Error(
        `Missing required signal: ${signalName}`
      );
    }

    if (
      value !== undefined
    ) {
      const actualType =
        typeof value;

      if (
        actualType !==
        definition.type
      ) {
        throw new Error(
          `Invalid signal type for ${signalName}`
        );
      }
    }
  }
}

export function evaluatePolicy(
  policyId: string,
  policyVersion: string,
  signals: Record<
    string,
    unknown
  >
): string {
  const policyPath =
    path.join(
      "./policies",
      policyId,
      policyVersion,
      "policy.json"
    );

  const raw =
    fs.readFileSync(
      policyPath,
      "utf8"
    );

  const policy =
    JSON.parse(
      raw
    ) as PolicyDocument;

  validateSchemaVersion(
    policy
  );

  validateSignals(
    policy,
    signals
  );

  const passed =
    evaluateRule(
      policy.rules,
      signals
    );

  if (!passed) {
    return "deny";
  }

  return policy.decision;
}




