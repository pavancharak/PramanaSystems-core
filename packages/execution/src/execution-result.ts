export interface ExecutionResult {
  execution_id: string;

  policy_id: string;

  policy_version: string;

  schema_version: string;

  runtime_version: string;

  runtime_hash: string;

  decision: string;

  signals_hash: string;

  executed_at: string;
}




