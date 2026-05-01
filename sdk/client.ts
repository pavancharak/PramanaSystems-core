export interface PramanaSystemsClientConfig {
  baseUrl: string;

  apiKey: string;
}

export class PramanaSystemsClient {
  constructor(
    private config:
      PramanaSystemsClientConfig
  ) {}

  private async request(
    path: string,
    method: string,
    body?: unknown
  ): Promise<unknown> {

    const response =
      await fetch(
        `${this.config.baseUrl}${path}`,
        {
          method,

          headers: {
            "Content-Type":
              "application/json",

            "x-api-key":
              this.config.apiKey,
          },

          body:
            body
              ? JSON.stringify(
                  body
                )
              : undefined,
        }
      );

    if (!response.ok) {
      throw new Error(
        `Request failed: ${response.status}`
      );
    }

    return response.json();
  }

  async health():
    Promise<unknown> {

    return this.request(
      "/health",
      "GET"
    );
  }

  async manifest():
    Promise<unknown> {

    return this.request(
      "/runtime/manifest",
      "GET"
    );
  }

  async capabilities():
    Promise<unknown> {

    return this.request(
      "/runtime/capabilities",
      "GET"
    );
  }

  async evaluate(
    payload: {
      policy_id: string;

      policy_version: string;

      signals: Record<
        string,
        unknown
      >;
    }
  ): Promise<unknown> {

    return this.request(
      "/evaluate",
      "POST",
      payload
    );
  }

  async simulate(
    payload: {
      policy_id: string;

      policy_version: string;

      signals: Record<
        string,
        unknown
      >;
    }
  ): Promise<unknown> {

    return this.request(
      "/simulate",
      "POST",
      payload
    );
  }

  async execute(
    payload: {
      token: unknown;

      signature: string;
    }
  ): Promise<unknown> {

    return this.request(
      "/execute",
      "POST",
      payload
    );
  }

  async verify(
    payload: {
      result: unknown;

      signature: string;
    }
  ): Promise<unknown> {

    return this.request(
      "/verify",
      "POST",
      payload
    );
  }
}



