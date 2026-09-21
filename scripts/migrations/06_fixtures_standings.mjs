export async function up(pool) {
  console.log("  Running Phase 7: Fixtures, Scheduling & Standings Automation...");

  // 1. Alter tournaments table
  const [tournCols] = await pool.query(`DESCRIBE tournaments`);
  const tournColNames = tournCols.map((c) => c.Field);

  if (!tournColNames.includes("registration_opens_at")) {
    await pool.query(`ALTER TABLE tournaments ADD COLUMN registration_opens_at DATETIME NULL`);
    console.log("    + Added tournaments.registration_opens_at");
  }
  if (!tournColNames.includes("registration_closes_at")) {
    await pool.query(`ALTER TABLE tournaments ADD COLUMN registration_closes_at DATETIME NULL`);
    console.log("    + Added tournaments.registration_closes_at");
  }

  // 2. Create tournament_groups table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tournament_groups (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tournament_id INT NOT NULL,
      name VARCHAR(40) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_group (tournament_id, name)
    ) ENGINE=InnoDB;
  `);

  // 3. Update sp_certify_match_result to automatically call sp_recalculate_standings
  await pool.query(`DROP PROCEDURE IF EXISTS sp_certify_match_result`);
  await pool.query(`
    CREATE PROCEDURE sp_certify_match_result(
      IN p_actor_id INT,
      IN p_match_id INT,
      IN p_reason VARCHAR(255)
    )
    proc_cert: BEGIN
      DECLARE v_actor_role VARCHAR(50);
      DECLARE v_actor_state INT;
      DECLARE v_tourn_id INT;
      DECLARE v_tourn_level VARCHAR(20);
      DECLARE v_tourn_state INT;
      DECLARE v_recorder INT;
      DECLARE v_status VARCHAR(20);

      SELECT r.name, u.state_id INTO v_actor_role, v_actor_state
        FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = p_actor_id AND u.status = 'approved';

      SELECT mr.recorded_by, mr.status, t.id, t.level, t.state_id
        INTO v_recorder, v_status, v_tourn_id, v_tourn_level, v_tourn_state
        FROM match_results mr
        JOIN matches m ON m.id = mr.match_id
        JOIN tournaments t ON t.id = m.tournament_id
       WHERE mr.match_id = p_match_id;

      IF v_status <> 'recorded' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-09: Only RECORDED results can be certified.';
      END IF;

      IF p_actor_id = v_recorder THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-09: Separation of duties violation: Scorer cannot certify own match result.';
      END IF;

      IF v_actor_role = 'state_admin' THEN
        IF v_tourn_level <> 'state' OR v_tourn_state <> v_actor_state THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-02: State Admin can only certify results for tournaments within their own state.';
        END IF;
      ELSEIF v_actor_role <> 'national_admin' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-02: Insufficient role authority to certify results.';
      END IF;

      UPDATE match_results SET status = 'certified', certified_by = p_actor_id, certified_at = NOW() WHERE match_id = p_match_id;

      CALL sp_internal_write_audit(
        p_actor_id, 'MATCH_RESULT_CERTIFIED', 'MATCH_RESULT', p_match_id,
        JSON_OBJECT('status', 'recorded'), JSON_OBJECT('status', 'certified'), p_reason
      );

      -- Auto-recalculate standings upon certification
      CALL sp_recalculate_standings(v_tourn_id);
    END proc_cert
  `);

  // 4. sp_generate_fixtures
  await pool.query(`DROP PROCEDURE IF EXISTS sp_generate_fixtures`);
  await pool.query(`
    CREATE PROCEDURE sp_generate_fixtures(
      IN p_actor_id INT,
      IN p_tournament_id INT,
      IN p_group_name VARCHAR(40)
    )
    proc_fixtures: BEGIN
      DECLARE v_actor_role VARCHAR(50);
      DECLARE v_actor_state INT;
      DECLARE v_tourn_level VARCHAR(20);
      DECLARE v_tourn_state INT;
      DECLARE v_existing_count INT;
      DECLARE v_team_count INT;

      SELECT r.name, u.state_id INTO v_actor_role, v_actor_state
        FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = p_actor_id AND u.status = 'approved';

      SELECT level, state_id INTO v_tourn_level, v_tourn_state
        FROM tournaments WHERE id = p_tournament_id;

      IF v_actor_role = 'state_admin' THEN
        IF v_tourn_level <> 'state' OR v_tourn_state <> v_actor_state THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-02: State Admin out of jurisdiction.';
        END IF;
      ELSEIF v_actor_role <> 'national_admin' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-02: Insufficient privileges to generate fixtures.';
      END IF;

      SELECT COUNT(*) INTO v_existing_count
        FROM matches
       WHERE tournament_id = p_tournament_id
         AND (p_group_name IS NULL OR stage = p_group_name);

      IF v_existing_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-06: Fixtures already exist for this tournament stage.';
      END IF;

      -- Generate round-robin pairing between tournament registered teams
      INSERT INTO matches (tournament_id, team1_id, team2_id, match_date, stage, status)
      SELECT 
        p_tournament_id,
        tt1.team_id,
        tt2.team_id,
        DATE_ADD(CURDATE(), INTERVAL 7 DAY),
        IFNULL(p_group_name, 'Group Stage'),
        'scheduled'
      FROM tournament_teams tt1
      JOIN tournament_teams tt2 
        ON tt1.tournament_id = tt2.tournament_id 
       AND tt1.team_id < tt2.team_id
      WHERE tt1.tournament_id = p_tournament_id
        AND (p_group_name IS NULL OR tt1.group_name = p_group_name)
        AND (p_group_name IS NULL OR tt2.group_name = p_group_name);

      CALL sp_internal_write_audit(
        p_actor_id, 'FIXTURES_GENERATED', 'TOURNAMENT', p_tournament_id,
        NULL, JSON_OBJECT('stage', IFNULL(p_group_name, 'Group Stage')), 'Automated round-robin pairing'
      );
    END proc_fixtures
  `);
}
