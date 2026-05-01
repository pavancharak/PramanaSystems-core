export interface ExecutionToken {
  execution_id: string;

  policy_id: string;

  policy_version: string;

  bundle_hash: string;

  decision_type: string;

  signals_hash: string;

  issued_at: string;

  expires_at: string;
}



