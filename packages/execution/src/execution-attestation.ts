import type {
  ExecutionResult,
} from "./execution-result";

export interface ExecutionAttestation {
  result: ExecutionResult;

  signature: string;
}




