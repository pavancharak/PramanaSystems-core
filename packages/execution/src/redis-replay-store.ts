import {
  createClient,
  type RedisClientType,
} from "redis";

import type {
  AsyncReplayStore,
} from "./async-replay-store-interface";

export class RedisReplayStore
  implements AsyncReplayStore {
  private readonly client:
    RedisClientType;

  constructor(
    redisUrl =
      "redis://localhost:6379"
  ) {
    this.client =
      createClient({
        url: redisUrl,
      });

    this.client.connect();
  }

  async hasExecuted(
    executionId: string
  ): Promise<boolean> {
    const result =
      await this.client.get(
        executionId
      );

    return result === "1";
  }

  async markExecuted(
    executionId: string
  ): Promise<void> {
    await this.client.set(
      executionId,
      "1"
    );
  }
}



