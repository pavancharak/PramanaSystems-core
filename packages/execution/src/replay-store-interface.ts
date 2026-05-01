export interface ReplayStore {
  hasExecuted(
    executionId: string
  ): boolean;

  markExecuted(
    executionId: string
  ): void;
}




