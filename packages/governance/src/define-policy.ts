import type {
  PolicyDefinition,
  PolicyRule,
} from "./types";

export function definePolicy(config: {
  id: string;
  version: string;
  rules: PolicyRule[];
}): PolicyDefinition {

  return {
    id: config.id,

    version: config.version,

    rules: config.rules,
  };
}
