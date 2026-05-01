const aiSignals = {
  symptomSeverity: "HIGH",
  chestPain: true,
  breathingDifficulty: true,
  ageRisk: true
};

console.log("AI SIGNALS:");
console.log(aiSignals);

function deterministicGovernanceDecision(signals) {
  if (
    signals.chestPain &&
    signals.breathingDifficulty
  ) {
    return {
      decision: "ESCALATE_IMMEDIATELY",
      reason: "HIGH_RISK_TRIAGE"
    };
  }

  return {
    decision: "STANDARD_REVIEW",
    reason: "NORMAL_PATH"
  };
}

const decision =
  deterministicGovernanceDecision(aiSignals);

console.log("");
console.log("DETERMINISTIC GOVERNANCE DECISION:");
console.log(decision);
