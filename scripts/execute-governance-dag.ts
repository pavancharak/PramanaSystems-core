import fs from "fs";

import child_process from "child_process";

type Node = {
  node_id: string;

  operation: string;

  depends_on: string[];
};

const workflow =
  JSON.parse(
    fs.readFileSync(
      "workflows/release-governance-dag.json",
      "utf8"
    )
  );

const completed =
  new Set<string>();

const nodes: Node[] =
  workflow.nodes;

while (
  completed.size <
  nodes.length
) {
  let progress =
    false;

  for (
    const node
    of nodes
  ) {
    if (
      completed.has(
        node.node_id
      )
    ) {
      continue;
    }

    const ready =
      node.depends_on.every(
        (dependency) =>
          completed.has(
            dependency
          )
      );

    if (!ready) {
      continue;
    }

    console.log(
      `Executing ${node.node_id}`
    );

    child_process.execSync(
      `npm run ${node.operation}`,
      {
        stdio: "inherit",
      }
    );

    completed.add(
      node.node_id
    );

    progress =
      true;
  }

  if (!progress) {
    throw new Error(
      "Workflow deadlock detected"
    );
  }
}

console.log(
  "Governance DAG execution completed"
);


