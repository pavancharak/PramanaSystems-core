export interface AsyncReplayStore {
  hasExecuted(
    executionId: string
  ): Promise<boolean>;

  markExecuted(
    executionId: string
  ): Promise<void>;
}




