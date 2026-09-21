import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type GovernanceDocument = {
  id: number;
  title: string;
  category: "rulebook" | "circular" | "form" | "policy" | "result";
  file_url: string;
  version: string | null;
  checksum_sha: string | null;
  effective_from: string | null;
  expires_on: string | null;
  download_count: number;
  description: string | null;
  uploaded_at: string;
  uploaded_by_name: string | null;
};

export const getGovernanceDocuments = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        category: z.string().optional(),
      })
      .parse(input ?? {})
  )
  .handler(async ({ data }): Promise<GovernanceDocument[]> => {
    const { safeQuery } = await import("./db.server");
    let sql = `SELECT id, title, category, file_url, version, checksum_sha,
                      effective_from, expires_on, download_count, description,
                      uploaded_at, uploaded_by_name
                 FROM v_governance_documents WHERE 1=1`;
    const params: unknown[] = [];

    if (data.category && data.category !== "all") {
      sql += ` AND category = ?`;
      params.push(data.category);
    }

    sql += ` ORDER BY uploaded_at DESC`;
    return safeQuery<GovernanceDocument>(sql, params);
  });

export const incrementDocumentDownload = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        documentId: z.number().int().positive(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const { query } = await import("./db.server");
    await query(`UPDATE rulebooks SET download_count = download_count + 1 WHERE id = ?`, [data.documentId]);
    return { ok: true };
  });
