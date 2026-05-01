import fs from "fs";

import child_process from "child_process";

const workflow =
  JSON.parse(
    fs.readFileSync(
      "workflows/release-governance.json",
      "utf8"
    )
  );

for (
  const step
  of workflow.steps
) {
  console.log(
    `Executing ${step.step_id}`
  );

  child_process.execSync(
    `npm run ${step.operation}`,
    {
      stdio: "inherit",
    }
  );
}

console.log(
  "Governance workflow execution completed"
);


