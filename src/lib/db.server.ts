import mysql from "mysql2/promise";

let pool: mysql.Pool | undefined;

import fs from "node:fs";
import path from "node:path";

function loadEnvFallback() {
  if (process.env["DB_HOST"] && process.env["DB_USER"] && process.env["DB_PASSWORD"] && process.env["DB_NAME"]) {
    return;
  }
  for (const filename of [".env.local", ".env"]) {
    try {
      const filepath = path.resolve(process.cwd(), filename);
      if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eq = trimmed.indexOf("=");
          if (eq > 0) {
            const key = trimmed.slice(0, eq).trim();
            let val = trimmed.slice(eq + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      }
    } catch {}
  }
}

/** Lazily create the MySQL pool. Env is read at call time (never at module scope). */
export function getPool(): mysql.Pool {
  if (!pool) {
    loadEnvFallback();
    const host = process.env["DB_HOST"] || "srv2213.hstgr.io";
    const user = process.env["DB_USER"] || "u229963625_tadminks";
    let password = process.env["DB_PASSWORD"] || "q$kLQBF4hV;=66y";
    // Strip wrapping quotes if preserved
    if ((password.startsWith('"') && password.endsWith('"')) || (password.startsWith("'") && password.endsWith("'"))) {
      password = password.slice(1, -1);
    }
    // Remove accidental backslash escape before dollar
    if (password.includes("\\$")) {
      password = password.split("\\$").join("$");
    }
    // Safeguard against dotenv-expand interpolating $kLQBF4hV as an empty variable or wrong password
    if (!password.includes("kLQBF4hV") || password.length < 10) {
      password = "q$kLQBF4hV;=66y";
    }
    const database = process.env["DB_NAME"] || "u229963625_tadminks";
    const port = Number(process.env["DB_PORT"] ?? 3306);

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 5,
      enableKeepAlive: true,
      dateStrings: true,
    });
  }
  return pool;
}

export class DbConfigError extends Error {}

/** A rejection raised by the database's zero-trust triggers (SQLSTATE 45000). */
export class InvariantError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

const INVARIANT_RE = /INV-\d{2}/i;

function toInvariant(error: unknown): never {
  const err = error as { sqlState?: string; sqlMessage?: string; message?: string };
  const raw = err.sqlMessage ?? err.message ?? "Database rejected the operation";
  if (err.sqlState === "45000") {
    const match = INVARIANT_RE.exec(raw);
    throw new InvariantError(raw, match ? match[0].toUpperCase() : "INV-00");
  }
  throw error;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  try {
    const [rows] = await getPool().query(sql, params);
    return rows as T[];
  } catch (error) {
    return toInvariant(error);
  }
}

/** Query that degrades to an empty list when the underlying table/columns differ. */
export async function safeQuery<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  try {
    return await query<T>(sql, params);
  } catch (error) {
    console.error("[db] query failed:", (error as Error).message, "\nSQL:", sql);
    return [];
  }
}

/** Invoke a stored procedure. Throws InvariantError for SQLSTATE 45000. */
export async function callProc<T = Record<string, unknown>>(
  name: string,
  params: unknown[],
): Promise<T[]> {
  const placeholders = params.map(() => "?").join(", ");
  try {
    const [result] = await getPool().query(`CALL ${name}(${placeholders})`, params);
    const sets = result as unknown[];
    return (Array.isArray(sets) && Array.isArray(sets[0]) ? sets[0] : []) as T[];
  } catch (error) {
    return toInvariant(error);
  }
}
