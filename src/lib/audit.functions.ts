import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AuditEntry = {
  id: number;
  actor_id: number;
  actor_name: string;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: number;
  reason: string | null;
  before_state: any;
  after_state: any;
  prev_hash: string;
  current_hash: string;
  created_at: string;
};

export type AuditVerificationStatus = {
  status: "VERIFIED" | "TAMPERED";
  broken_id: number | null;
  checked_records: number;
  latest_hash: string | null;
  last_valid_hash?: string | null;
  message: string;
};

export const getAuditFeed = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        entityType: z.string().optional(),
        entityId: z.number().optional(),
        action: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
      .parse(input ?? {})
  )
  .handler(async ({ data }): Promise<AuditEntry[]> => {
    const { requireUser } = await import("./session.server");
    const { safeQuery } = await import("./db.server");
    await requireUser([1]); // Restricted to National Administration

    let sql = `SELECT id, actor_id, actor_name, actor_email, actor_role,
                      action, entity_type, entity_id, reason,
                      before_state, after_state, prev_hash, current_hash, created_at
                 FROM v_audit_feed WHERE 1=1`;
    const params: unknown[] = [];

    if (data.entityType) {
      sql += ` AND entity_type = ?`;
      params.push(data.entityType);
    }
    if (data.entityId) {
      sql += ` AND entity_id = ?`;
      params.push(data.entityId);
    }
    if (data.action) {
      sql += ` AND action = ?`;
      params.push(data.action);
    }

    sql += ` ORDER BY id DESC LIMIT ?`;
    params.push(data.limit);

    return safeQuery<AuditEntry>(sql, params);
  });

export const verifyAuditChain = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuditVerificationStatus> => {
    const { requireUser } = await import("./session.server");
    const { callProc } = await import("./db.server");
    await requireUser([1]); // National Administration only

    const rows = await callProc<AuditVerificationStatus>("sp_verify_audit_chain", []);
    return (
      rows[0] ?? {
        status: "VERIFIED",
        broken_id: null,
        checked_records: 0,
        latest_hash: null,
        message: "No audit records in chain",
      }
    );
  }
);
