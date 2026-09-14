import mysql from "mysql2/promise";

let pool: mysql.Pool | undefined;

/** Lazily create the MySQL pool. Env is read at call time (never at module scope). */
export function getPool(): mysql.Pool {
  if (!pool) {
    const host = process.env["DB_HOST"];
    const user = process.env["DB_USER"];
    const password = process.env["DB_PASSWORD"];
    const database = process.env["DB_NAME"];
    if (!host || !user || !password || !database) {
      throw new DbConfigError(
        "Database connection is not configured (DB_HOST / DB_USER / DB_PASSWORD / DB_NAME).",
      );
    }
    pool = mysql.createPool({
      host,
      port: Number(process.env["DB_PORT"] ?? 3306),
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
