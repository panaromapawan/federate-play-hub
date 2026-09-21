export async function up(pool) {
  console.log("  Running Phase 9: Governance & Document Repository...");

  const [cols] = await pool.query(`DESCRIBE rulebooks`);
  const colNames = cols.map((c) => c.Field);

  if (!colNames.includes("category")) {
    await pool.query(`ALTER TABLE rulebooks ADD COLUMN category ENUM('rulebook','circular','form','policy','result') NOT NULL DEFAULT 'circular'`);
    console.log("    + Added rulebooks.category");
  }
  if (!colNames.includes("effective_from")) {
    await pool.query(`ALTER TABLE rulebooks ADD COLUMN effective_from DATE NULL`);
    console.log("    + Added rulebooks.effective_from");
  }
  if (!colNames.includes("expires_on")) {
    await pool.query(`ALTER TABLE rulebooks ADD COLUMN expires_on DATE NULL`);
    console.log("    + Added rulebooks.expires_on");
  }
  if (!colNames.includes("download_count")) {
    await pool.query(`ALTER TABLE rulebooks ADD COLUMN download_count INT NOT NULL DEFAULT 0`);
    console.log("    + Added rulebooks.download_count");
  }
  if (!colNames.includes("description")) {
    await pool.query(`ALTER TABLE rulebooks ADD COLUMN description VARCHAR(500) NULL`);
    console.log("    + Added rulebooks.description");
  }

  // View for governance documents
  await pool.query(`
    CREATE OR REPLACE VIEW v_governance_documents AS
    SELECT 
      rb.id,
      rb.title,
      rb.category,
      rb.file_url,
      rb.version,
      rb.checksum_sha,
      rb.effective_from,
      rb.expires_on,
      rb.download_count,
      rb.description,
      rb.uploaded_at,
      u.name AS uploaded_by_name
    FROM rulebooks rb
    LEFT JOIN users u ON u.id = rb.uploaded_by;
  `);
}
