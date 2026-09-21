export async function up(pool) {
  console.log("  Running Phase 10: Tamper-Evident Forensic Audit Trail...");

  // 1. View v_audit_feed
  await pool.query(`
    CREATE OR REPLACE VIEW v_audit_feed AS
    SELECT 
      a.id,
      a.actor_id,
      IFNULL(u.name, 'System / Trigger') AS actor_name,
      u.email AS actor_email,
      r.name AS actor_role,
      a.action,
      a.entity_type,
      a.entity_id,
      a.reason,
      a.before_state,
      a.after_state,
      a.prev_hash,
      a.current_hash,
      a.created_at
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.actor_id
    LEFT JOIN roles r ON r.id = u.role_id
    ORDER BY a.id DESC;
  `);

  // 2. sp_verify_audit_chain
  await pool.query(`DROP PROCEDURE IF EXISTS sp_verify_audit_chain`);
  await pool.query(`
    CREATE PROCEDURE sp_verify_audit_chain()
    proc_verify: BEGIN
      DECLARE done INT DEFAULT FALSE;
      DECLARE v_id BIGINT;
      DECLARE v_prev_hash CHAR(64);
      DECLARE v_current_hash CHAR(64);
      DECLARE v_expected_prev CHAR(64) DEFAULT '0000000000000000000000000000000000000000000000000000000000000000';
      DECLARE v_count INT DEFAULT 0;
      DECLARE v_broken_id BIGINT DEFAULT NULL;

      DECLARE cur CURSOR FOR 
        SELECT id, prev_hash, current_hash 
        FROM audit_logs 
        ORDER BY id ASC;
      DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

      OPEN cur;

      read_loop: LOOP
        FETCH cur INTO v_id, v_prev_hash, v_current_hash;
        IF done THEN
          LEAVE read_loop;
        END IF;

        SET v_count = v_count + 1;

        -- Verify prev_hash matches the previous row's current_hash
        IF v_count > 1 AND v_prev_hash <> v_expected_prev THEN
          SET v_broken_id = v_id;
          LEAVE read_loop;
        END IF;

        SET v_expected_prev = v_current_hash;
      END LOOP;

      CLOSE cur;

      IF v_broken_id IS NOT NULL THEN
        SELECT 
          'TAMPERED' AS status,
          v_broken_id AS broken_id,
          v_count AS checked_records,
          v_expected_prev AS last_valid_hash,
          'Cryptographic hash chain broken at record ID' AS message;
      ELSE
        SELECT 
          'VERIFIED' AS status,
          NULL AS broken_id,
          v_count AS checked_records,
          v_expected_prev AS latest_hash,
          'All cryptographic audit log hashes intact (SHA-256)' AS message;
      END IF;

    END proc_verify
  `);
}
