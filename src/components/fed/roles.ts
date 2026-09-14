export const ROLE_LABELS: Record<number, string> = {
  1: "National Admin",
  2: "State Admin",
  3: "District Admin",
  4: "Match Official",
};

export const INVARIANT_HINTS: Record<string, string> = {
  "INV-01": "Geography Integrity — District strictly bound to parent State.",
  "INV-02": "Scoped RBAC — Action strictly scoped to your administrative jurisdiction.",
  "INV-03": "Roster Immutability — Squad is frozen; player additions, removals, and attribute mutations are locked.",
  "INV-04": "Roster Lifecycle — Invalid status transition. Only National Admins can perform emergency unfreeze.",
  "INV-05": "Player Pathways — Grassroots district must match State territory or active exception required.",
  "INV-06": "Tournament Compatibility — Only teams with frozen rosters and matching level/sport can register.",
  "INV-07": "Match Progression — Match status must progress scheduled -> in_progress -> completed.",
  "INV-08": "Match Result Integrity — Main scorer assignment required, winner derived from scores, and MOM must belong to participating squads.",
  "INV-09": "Certification Separation — Scorer cannot certify own match. Certified results are immutable (use score correction).",
  "INV-10": "Audit Chain Integrity — Tamper-evident hash-chain invariant violation.",
};

export function describeFailure(code: string, message: string): string {
  const hint = INVARIANT_HINTS[code];
  if (hint) {
    // If message contains the code or specific info from trigger, show both cleanly
    return `${code}: ${message && !message.includes(code) ? message : hint}`;
  }
  return message || "Database rejected the operation.";
}

