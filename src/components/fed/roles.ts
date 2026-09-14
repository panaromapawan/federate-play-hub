export const ROLE_LABELS: Record<number, string> = {
  1: "National Admin",
  2: "State Admin",
  3: "District Admin",
  4: "Match Official",
};

export const INVARIANT_HINTS: Record<string, string> = {
  "INV-01": "Scope violation — this record sits outside your jurisdiction.",
  "INV-02": "Roster lifecycle violation — the requested transition is not allowed.",
  "INV-03": "Frozen roster — the squad is locked and cannot be edited.",
  "INV-04": "Separation of duties — the same officer cannot record and certify.",
  "INV-05": "Player eligibility failed for this squad.",
  "INV-06": "Registration window closed or duplicate entry detected.",
  "INV-08": "Result already certified — use the correction workflow.",
  "INV-09": "Approval chain broken — the actor is not authorised.",
};

export function describeFailure(code: string, message: string): string {
  const hint = INVARIANT_HINTS[code];
  return hint ? `${code}: ${hint}` : message;
}
