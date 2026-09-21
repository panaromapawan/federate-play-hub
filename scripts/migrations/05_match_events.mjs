export async function up(pool) {
  console.log("  Running Phase 6: Match Events and Live Scoring...");

  // 1. Create match_events table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS match_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      match_id INT NOT NULL,
      team_id INT NOT NULL,
      player_id INT NULL,
      event_type ENUM('point','card_yellow','card_red','substitution','timeout','note') NOT NULL,
      minute SMALLINT NULL,
      value SMALLINT NOT NULL DEFAULT 1,
      note VARCHAR(255) NULL,
      created_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_me_match (match_id, created_at),
      INDEX idx_me_team (team_id),
      INDEX idx_me_player (player_id)
    ) ENGINE=InnoDB;
  `);

  // 2. Alter matches table if needed
  const [matchCols] = await pool.query(`DESCRIBE matches`);
  const matchColNames = matchCols.map((c) => c.Field);

  if (!matchColNames.includes("started_at")) {
    await pool.query(`ALTER TABLE matches ADD COLUMN started_at DATETIME NULL`);
    console.log("    + Added matches.started_at");
  }
  if (!matchColNames.includes("venue_text")) {
    await pool.query(`ALTER TABLE matches ADD COLUMN venue_text VARCHAR(160) NULL`);
    console.log("    + Added matches.venue_text");
  }
  if (!matchColNames.includes("live_note")) {
    await pool.query(`ALTER TABLE matches ADD COLUMN live_note VARCHAR(255) NULL`);
    console.log("    + Added matches.live_note");
  }

  // 3. sp_start_match
  await pool.query(`DROP PROCEDURE IF EXISTS sp_start_match`);
  await pool.query(`
    CREATE PROCEDURE sp_start_match(
      IN p_actor_id INT,
      IN p_match_id INT
    )
    proc_start: BEGIN
      DECLARE v_actor_role VARCHAR(50);
      DECLARE v_assigned INT;
      DECLARE v_cur_status VARCHAR(20);

      SELECT r.name INTO v_actor_role
        FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = p_actor_id AND u.status = 'approved';

      IF v_actor_role IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-02: Actor is unapproved or invalid.';
      END IF;

      IF v_actor_role = 'match_official' THEN
        SELECT COUNT(*) INTO v_assigned FROM match_official_assignments
         WHERE match_id = p_match_id AND official_id = p_actor_id;
        IF v_assigned = 0 THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-07: Official is not assigned to this match fixture.';
        END IF;
      ELSEIF v_actor_role <> 'national_admin' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-02: Insufficient role privilege to start match.';
      END IF;

      SELECT status INTO v_cur_status FROM matches WHERE id = p_match_id FOR UPDATE;

      IF v_cur_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-07: Match not found.';
      END IF;
      IF v_cur_status <> 'scheduled' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-07: Only scheduled matches can be started.';
      END IF;

      UPDATE matches SET status = 'in_progress', started_at = NOW() WHERE id = p_match_id;

      CALL sp_internal_write_audit(
        p_actor_id, 'MATCH_STARTED', 'MATCH', p_match_id,
        JSON_OBJECT('status', 'scheduled'), JSON_OBJECT('status', 'in_progress'), 'Match started on field'
      );
    END proc_start
  `);

  // 4. sp_log_match_event
  await pool.query(`DROP PROCEDURE IF EXISTS sp_log_match_event`);
  await pool.query(`
    CREATE PROCEDURE sp_log_match_event(
      IN p_actor_id INT,
      IN p_match_id INT,
      IN p_team_id INT,
      IN p_player_id INT,
      IN p_event_type VARCHAR(30),
      IN p_minute SMALLINT,
      IN p_value SMALLINT,
      IN p_note VARCHAR(255)
    )
    proc_event: BEGIN
      DECLARE v_actor_role VARCHAR(50);
      DECLARE v_assigned INT;
      DECLARE v_cur_status VARCHAR(20);
      DECLARE v_t1 INT;
      DECLARE v_t2 INT;
      DECLARE v_on_roster INT;

      SELECT r.name INTO v_actor_role
        FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = p_actor_id AND u.status = 'approved';

      IF v_actor_role = 'match_official' THEN
        SELECT COUNT(*) INTO v_assigned FROM match_official_assignments
         WHERE match_id = p_match_id AND official_id = p_actor_id;
        IF v_assigned = 0 THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-07: Official is not assigned to this match.';
        END IF;
      ELSEIF v_actor_role <> 'national_admin' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-02: Insufficient authority to log live match events.';
      END IF;

      SELECT status, team1_id, team2_id INTO v_cur_status, v_t1, v_t2
        FROM matches WHERE id = p_match_id;

      IF v_cur_status <> 'in_progress' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-07: Events can only be logged for in-progress matches.';
      END IF;

      IF p_team_id <> v_t1 AND p_team_id <> v_t2 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-07: Team does not belong to this match fixture.';
      END IF;

      IF p_player_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_on_roster FROM team_players
         WHERE team_id = p_team_id AND player_id = p_player_id;
        IF v_on_roster = 0 THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-04: Player is not in the active squad roster for this team.';
        END IF;
      END IF;

      INSERT INTO match_events (
        match_id, team_id, player_id, event_type, minute, value, note, created_by
      ) VALUES (
        p_match_id, p_team_id, p_player_id, p_event_type, p_minute, IFNULL(p_value, 1), p_note, p_actor_id
      );
    END proc_event
  `);

  // 5. Update sp_record_match_result to validate event scores and MOM roster membership
  await pool.query(`DROP PROCEDURE IF EXISTS sp_record_match_result`);
  await pool.query(`
    CREATE PROCEDURE sp_record_match_result(
      IN p_actor_id INT,
      IN p_match_id INT,
      IN p_team1_score INT,
      IN p_team2_score INT,
      IN p_man_of_match_player_id INT,
      IN p_summary TEXT
    )
    proc_result: BEGIN
      DECLARE v_actor_role VARCHAR(50);
      DECLARE v_tourn_id INT;
      DECLARE v_t1 INT;
      DECLARE v_t2 INT;
      DECLARE v_winner INT;
      DECLARE v_assigned INT;
      DECLARE v_event_t1_pts INT;
      DECLARE v_event_t2_pts INT;
      DECLARE v_mom_valid INT;

      SELECT r.name INTO v_actor_role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = p_actor_id AND u.status = 'approved';

      IF v_actor_role IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-02: Actor is invalid or unapproved.';
      END IF;

      IF v_actor_role = 'match_official' THEN
        SELECT COUNT(*) INTO v_assigned FROM match_official_assignments WHERE match_id = p_match_id AND official_id = p_actor_id;
        IF v_assigned = 0 THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-08: Official is not assigned to this fixture.';
        END IF;
      ELSEIF v_actor_role <> 'national_admin' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-08: Insufficient authority to record scorelines.';
      END IF;

      SELECT tournament_id, team1_id, team2_id INTO v_tourn_id, v_t1, v_t2 FROM matches WHERE id = p_match_id;

      IF v_t1 IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-07: Target match fixture not found.';
      END IF;

      -- Validate MOM roster membership if selected
      IF p_man_of_match_player_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_mom_valid FROM team_players
         WHERE (team_id = v_t1 OR team_id = v_t2) AND player_id = p_man_of_match_player_id;
        IF v_mom_valid = 0 THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-08: Man of the Match must be an accredited player on one of the participating team rosters.';
        END IF;
      END IF;

      -- Cross-check logged point events if events were recorded
      SELECT IFNULL(SUM(CASE WHEN team_id = v_t1 THEN value ELSE 0 END), 0),
             IFNULL(SUM(CASE WHEN team_id = v_t2 THEN value ELSE 0 END), 0)
        INTO v_event_t1_pts, v_event_t2_pts
        FROM match_events
       WHERE match_id = p_match_id AND event_type = 'point';

      IF (v_event_t1_pts > 0 OR v_event_t2_pts > 0) THEN
        IF (v_event_t1_pts <> p_team1_score OR v_event_t2_pts <> p_team2_score) THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-08: Submitted scoreline does not tally with logged match point events.';
        END IF;
      END IF;

      IF p_team1_score > p_team2_score THEN
        SET v_winner = v_t1;
      ELSEIF p_team2_score > p_team1_score THEN
        SET v_winner = v_t2;
      ELSE
        SET v_winner = NULL;
      END IF;

      UPDATE matches SET status = 'completed' WHERE id = p_match_id;

      INSERT INTO match_results (
        match_id, team1_score, team2_score, winner_team_id, man_of_match_player_id, recorded_by, status
      ) VALUES (
        p_match_id, p_team1_score, p_team2_score, v_winner, p_man_of_match_player_id, p_actor_id, 'recorded'
      ) ON DUPLICATE KEY UPDATE
        team1_score = p_team1_score, team2_score = p_team2_score, winner_team_id = v_winner,
        man_of_match_player_id = p_man_of_match_player_id, recorded_by = p_actor_id, status = 'recorded';

      CALL sp_internal_write_audit(
        p_actor_id, 'MATCH_SCORE_RECORDED', 'MATCH_RESULT', p_match_id,
        NULL, JSON_OBJECT('t1_score', p_team1_score, 't2_score', p_team2_score, 'winner', v_winner), p_summary
      );

      CALL sp_recalculate_standings(v_tourn_id);
    END proc_result
  `);
}
