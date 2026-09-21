export async function up(pool) {
  console.log("  Running Phase 5: Roster Workflow Hardening...");

  // 1. Alter teams table
  const [teamCols] = await pool.query(`DESCRIBE teams`);
  const teamColNames = teamCols.map((c) => c.Field);

  if (!teamColNames.includes("roster_min_players")) {
    await pool.query(`ALTER TABLE teams ADD COLUMN roster_min_players TINYINT NOT NULL DEFAULT 12`);
    console.log("    + Added teams.roster_min_players");
  }
  if (!teamColNames.includes("roster_max_players")) {
    await pool.query(`ALTER TABLE teams ADD COLUMN roster_max_players TINYINT NOT NULL DEFAULT 20`);
    console.log("    + Added teams.roster_max_players");
  }
  if (!teamColNames.includes("roster_submitted_at")) {
    await pool.query(`ALTER TABLE teams ADD COLUMN roster_submitted_at DATETIME NULL`);
    console.log("    + Added teams.roster_submitted_at");
  }
  if (!teamColNames.includes("roster_locked_by")) {
    await pool.query(`ALTER TABLE teams ADD COLUMN roster_locked_by INT NULL`);
    console.log("    + Added teams.roster_locked_by");
  }

  // 2. Alter team_players table
  const [tpCols] = await pool.query(`DESCRIBE team_players`);
  const tpColNames = tpCols.map((c) => c.Field);

  if (!tpColNames.includes("squad_role")) {
    await pool.query(`ALTER TABLE team_players ADD COLUMN squad_role ENUM('player','captain','vice_captain','staff') NOT NULL DEFAULT 'player'`);
    console.log("    + Added team_players.squad_role");
  }

  // Ensure unique index on team_players(team_id, jersey_number)
  const [existingUq] = await pool.query(
    `SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team_players' AND INDEX_NAME = 'uq_team_jersey' LIMIT 1`
  );
  if (existingUq.length === 0) {
    try {
      await pool.query(`ALTER TABLE team_players ADD UNIQUE KEY uq_team_jersey (team_id, jersey_number)`);
      console.log("    + Added unique key uq_team_jersey on team_players(team_id, jersey_number)");
    } catch (err) {
      console.warn("    ! Could not add uq_team_jersey (may have existing duplicates in test data):", err.message);
    }
  }

  // 3. Update sp_transition_roster_status with squad validations
  await pool.query(`DROP PROCEDURE IF EXISTS sp_transition_roster_status`);
  await pool.query(`
    CREATE PROCEDURE sp_transition_roster_status(
      IN p_actor_id INT,
      IN p_team_id INT,
      IN p_target_status VARCHAR(20),
      IN p_reason VARCHAR(255)
    )
    proc_roster: BEGIN
      DECLARE v_actor_role VARCHAR(50);
      DECLARE v_actor_state INT;
      DECLARE v_actor_dist INT;
      DECLARE v_team_level VARCHAR(20);
      DECLARE v_team_state INT;
      DECLARE v_team_dist INT;
      DECLARE v_cur_status VARCHAR(20);
      DECLARE v_min_players INT;
      DECLARE v_max_players INT;
      DECLARE v_player_count INT;
      DECLARE v_captain_count INT;
      DECLARE v_dup_jerseys INT;
      DECLARE v_before JSON;

      SELECT r.name, u.state_id, u.district_id INTO v_actor_role, v_actor_state, v_actor_dist
        FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = p_actor_id AND u.status = 'approved';

      IF v_actor_role IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-02: Actor is unapproved or invalid.';
      END IF;

      SELECT level, state_id, district_id, roster_status, roster_min_players, roster_max_players,
             JSON_OBJECT('team_id', id, 'roster_status', roster_status)
        INTO v_team_level, v_team_state, v_team_dist, v_cur_status, v_min_players, v_max_players, v_before
        FROM teams WHERE id = p_team_id FOR UPDATE;

      IF v_actor_role = 'district_admin' THEN
        IF v_team_level <> 'district' OR v_team_dist <> v_actor_dist THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-02: District Admin out of jurisdiction.';
        END IF;
        IF p_target_status NOT IN ('draft', 'submitted') THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-02: District Admin can only submit or draft rosters.';
        END IF;
      ELSEIF v_actor_role = 'state_admin' THEN
        IF v_team_level = 'district' THEN
          IF v_team_state <> v_actor_state THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-02: State Admin cannot manage district teams outside their state.';
          END IF;
          IF p_target_status NOT IN ('approved', 'frozen', 'draft') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-02: State Admin may only approve, freeze, or return district rosters.';
          END IF;
        ELSEIF v_team_level = 'state' THEN
          IF v_team_state <> v_actor_state THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-02: State Admin cannot manage state teams outside their state.';
          END IF;
          IF p_target_status NOT IN ('draft', 'submitted') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-02: State Admin can only submit their own state team rosters.';
          END IF;
        ELSE
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-02: State Admin cannot manage national teams.';
        END IF;
      ELSEIF v_actor_role <> 'national_admin' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-02: Insufficient privileges for roster lifecycle operations.';
      END IF;

      IF v_cur_status = 'frozen' AND v_actor_role <> 'national_admin' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-04: Only National Administration may perform an emergency unfreeze.';
      END IF;

      -- Validation for transition to 'submitted'
      IF p_target_status = 'submitted' THEN
        SELECT COUNT(*) INTO v_player_count FROM team_players WHERE team_id = p_team_id;
        IF v_player_count < IFNULL(v_min_players, 12) THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-04: Roster must have at least 12 registered players before submission.';
        END IF;
        IF v_player_count > IFNULL(v_max_players, 20) THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-04: Roster cannot exceed the 20 registered players maximum.';
        END IF;

        -- Check captain
        SELECT COUNT(*) INTO v_captain_count FROM team_players WHERE team_id = p_team_id AND squad_role = 'captain';
        IF v_captain_count <> 1 THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-04: Roster must designate exactly one team captain before submission.';
        END IF;

        -- Check duplicate jerseys
        SELECT COUNT(*) INTO v_dup_jerseys FROM (
          SELECT jersey_number FROM team_players 
          WHERE team_id = p_team_id AND jersey_number IS NOT NULL AND TRIM(jersey_number) <> ''
          GROUP BY jersey_number HAVING COUNT(*) > 1
        ) dups;
        IF v_dup_jerseys > 0 THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-03: Duplicate jersey numbers detected on roster.';
        END IF;

        UPDATE teams SET roster_status = 'submitted', roster_submitted_at = NOW() WHERE id = p_team_id;
      ELSEIF p_target_status = 'frozen' THEN
        UPDATE teams SET roster_status = 'frozen', roster_locked_by = p_actor_id WHERE id = p_team_id;
      ELSEIF p_target_status = 'draft' AND v_cur_status = 'frozen' THEN
        -- Emergency unfreeze
        UPDATE teams SET roster_status = 'draft', roster_locked_by = NULL WHERE id = p_team_id;
      ELSE
        UPDATE teams SET roster_status = p_target_status WHERE id = p_team_id;
      END IF;

      CALL sp_internal_write_audit(
        p_actor_id, 'ROSTER_LIFECYCLE_TRANSITION', 'TEAM', p_team_id,
        v_before, JSON_OBJECT('team_id', p_team_id, 'roster_status', p_target_status), p_reason
      );
    END proc_roster
  `);
}
