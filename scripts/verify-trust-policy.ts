import fs from "fs";

const policy =
  JSON.parse(
    fs.readFileSync(
      "trust/trust-governance-policy.json",
      "utf8"
    )
  );

const releaseApproval =
  JSON.parse(
    fs.readFileSync(
      "trust/release-approval.json",
      "utf8"
    )
  );

const authorities =
  JSON.parse(
    fs.readFileSync(
      "trust/governance-authorities.json",
      "utf8"
    )
  );

const operation =
  policy.operations
    .release_approval;

const approvedRoles =
  new Set<string>();

for (
  const approver
  of releaseApproval.approved_by
) {
  const authority =
    authorities.authorities.find(
      (
        entry: any
      ) =>
        entry.authority_id ===
        approver.authority_id
    );

  if (authority) {
    approvedRoles.add(
      authority.role
    );
  }
}

for (
  const requiredRole
  of operation.required_roles
) {
  if (
    !approvedRoles.has(
      requiredRole
    )
  ) {
    throw new Error(
      `Missing required role: ${requiredRole}`
    );
  }
}

if (
  releaseApproval.approved_by
    .length <
  operation.required_quorum
) {
  throw new Error(
    "Approval quorum not satisfied"
  );
}

console.log(
  "Trust governance policy verification passed"
);


