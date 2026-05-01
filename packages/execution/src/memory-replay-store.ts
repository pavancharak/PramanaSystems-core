import type {
  ReplayStore,
} from "./replay-store-interface";

export class MemoryReplayStore
  implements ReplayStore {
  private readonly store =
    new Set<string>();

  hasExecuted(
    executionId: string
  ): boolean {
    return this.store.has(
      executionId
    );
  }

  markExecuted(
    executionId: string
  ): void {
    this.store.add(
      executionId
    );
  }
}



