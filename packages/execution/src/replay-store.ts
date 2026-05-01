const executedTokens =
  new Set<string>();

export function hasExecuted(
  tokenHash: string
): boolean {
  return executedTokens.has(
    tokenHash
  );
}

export function markExecuted(
  tokenHash: string
): void {
  executedTokens.add(
    tokenHash
  );
}



