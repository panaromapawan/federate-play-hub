export async function up(pool) {
  console.log("  Creating Enterprise DataTable Procedures (sp_list_players, sp_list_teams, sp_list_matches)...");

  // =========================================================================
  // 1. sp_list_players
  // =========================================================================
  await pool.query(`DROP PROCEDURE IF EXISTS sp_list_players`);
  await pool.query(`
    CREATE PROCEDURE sp_list_players(
      IN p_actor_id INT,
      IN p_search VARCHAR(100),
      IN p_state_id INT,
      IN p_district_id INT,
      IN p_status VARCHAR(20),
      IN p_limit INT,
      IN p_offset INT
    )
    proc_players: BEGIN
      DECLARE v_role_id INT;
      DECLARE v_state_id INT;
      DECLARE v_dist_id INT;
      DECLARE v_limit INT DEFAULT 25;
      DECLARE v_offset INT DEFAULT 0;
      DECLARE v_search VARCHAR(110);

      SELECT role_id, state_id, district_id INTO v_role_id, v_state_id, v_dist_id
        FROM users WHERE id = p_actor_id;

      IF p_limit IS NOT NULL AND p_limit > 0 THEN
        SET v_limit = LEAST(p_limit, 100);
      END IF;
      IF p_offset IS NOT NULL AND p_offset >= 0 THEN
        SET v_offset = p_offset;
      END IF;

      IF p_search IS NOT NULL AND TRIM(p_search) <> '' THEN
        SET v_search = CONCAT('%', TRIM(p_search), '%');
      ELSE
        SET v_search = NULL;
      END IF;

      -- Result Set 1: Paginated Rows
      SELECT 
        p.id,
        p.name,
        p.dob,
        p.gender,
        p.sport_id,
        sp.name AS sport_name,
        p.district_id,
        d.name AS district_name,
        d.state_id,
        s.name AS state_name,
        p.status,
        p.playing_position,
        p.jersey_number,
        p.height_cm,
        p.weight_kg,
        p.photo_url,
        p.created_at
      FROM players p
      LEFT JOIN sports sp ON sp.id = p.sport_id
      LEFT JOIN districts d ON d.id = p.district_id
      LEFT JOIN states s ON s.id = d.state_id
      WHERE (v_role_id = 1 
             OR (v_role_id = 2 AND d.state_id = v_state_id)
             OR (v_role_id = 3 AND p.district_id = v_dist_id)
             OR v_role_id = 4)
        AND (v_search IS NULL OR p.name LIKE v_search OR p.playing_position LIKE v_search)
        AND (p_state_id IS NULL OR d.state_id = p_state_id)
        AND (p_district_id IS NULL OR p.district_id = p_district_id)
        AND (p_status IS NULL OR TRIM(p_status) = '' OR p.status = p_status)
      ORDER BY p.id DESC
      LIMIT v_limit OFFSET v_offset;

      -- Result Set 2: Total Count
      SELECT COUNT(*) AS total_count
      FROM players p
      LEFT JOIN districts d ON d.id = p.district_id
      WHERE (v_role_id = 1 
             OR (v_role_id = 2 AND d.state_id = v_state_id)
             OR (v_role_id = 3 AND p.district_id = v_dist_id)
             OR v_role_id = 4)
        AND (v_search IS NULL OR p.name LIKE v_search OR p.playing_position LIKE v_search)
        AND (p_state_id IS NULL OR d.state_id = p_state_id)
        AND (p_district_id IS NULL OR p.district_id = p_district_id)
        AND (p_status IS NULL OR TRIM(p_status) = '' OR p.status = p_status);
    END proc_players
  `);

  // =========================================================================
  // 2. sp_list_teams
  // =========================================================================
  await pool.query(`DROP PROCEDURE IF EXISTS sp_list_teams`);
  await pool.query(`
    CREATE PROCEDURE sp_list_teams(
      IN p_actor_id INT,
      IN p_search VARCHAR(100),
      IN p_level VARCHAR(20),
      IN p_roster_status VARCHAR(20),
      IN p_limit INT,
      IN p_offset INT
    )
    proc_teams: BEGIN
      DECLARE v_role_id INT;
      DECLARE v_state_id INT;
      DECLARE v_dist_id INT;
      DECLARE v_limit INT DEFAULT 25;
      DECLARE v_offset INT DEFAULT 0;
      DECLARE v_search VARCHAR(110);

      SELECT role_id, state_id, district_id INTO v_role_id, v_state_id, v_dist_id
        FROM users WHERE id = p_actor_id;

      IF p_limit IS NOT NULL AND p_limit > 0 THEN
        SET v_limit = LEAST(p_limit, 100);
      END IF;
      IF p_offset IS NOT NULL AND p_offset >= 0 THEN
        SET v_offset = p_offset;
      END IF;

      IF p_search IS NOT NULL AND TRIM(p_search) <> '' THEN
        SET v_search = CONCAT('%', TRIM(p_search), '%');
      ELSE
        SET v_search = NULL;
      END IF;

      -- Result Set 1: Paginated Rows
      SELECT 
        t.id,
        t.name,
        t.level,
        t.sport_id,
        sp.name AS sport_name,
        t.state_id,
        s.name AS state_name,
        t.district_id,
        d.name AS district_name,
        t.season,
        t.roster_status,
        t.created_at,
        COUNT(tp.id) AS player_count
      FROM teams t
      LEFT JOIN sports sp ON sp.id = t.sport_id
      LEFT JOIN states s ON s.id = t.state_id
      LEFT JOIN districts d ON d.id = t.district_id
      LEFT JOIN team_players tp ON tp.team_id = t.id
      WHERE (v_role_id = 1 
             OR (v_role_id = 2 AND t.state_id = v_state_id)
             OR (v_role_id = 3 AND t.district_id = v_dist_id)
             OR v_role_id = 4)
        AND (v_search IS NULL OR t.name LIKE v_search)
        AND (p_level IS NULL OR TRIM(p_level) = '' OR t.level = p_level)
        AND (p_roster_status IS NULL OR TRIM(p_roster_status) = '' OR t.roster_status = p_roster_status)
      GROUP BY t.id, t.name, t.level, t.sport_id, sp.name, t.state_id, s.name, t.district_id, d.name, t.season, t.roster_status, t.created_at
      ORDER BY t.id DESC
      LIMIT v_limit OFFSET v_offset;

      -- Result Set 2: Total Count
      SELECT COUNT(*) AS total_count
      FROM teams t
      WHERE (v_role_id = 1 
             OR (v_role_id = 2 AND t.state_id = v_state_id)
             OR (v_role_id = 3 AND t.district_id = v_dist_id)
             OR v_role_id = 4)
        AND (v_search IS NULL OR t.name LIKE v_search)
        AND (p_level IS NULL OR TRIM(p_level) = '' OR t.level = p_level)
        AND (p_roster_status IS NULL OR TRIM(p_roster_status) = '' OR t.roster_status = p_roster_status);
    END proc_teams
  `);

  // =========================================================================
  // 3. sp_list_matches
  // =========================================================================
  await pool.query(`DROP PROCEDURE IF EXISTS sp_list_matches`);
  await pool.query(`
    CREATE PROCEDURE sp_list_matches(
      IN p_actor_id INT,
      IN p_tournament_id INT,
      IN p_status VARCHAR(20),
      IN p_from DATE,
      IN p_to DATE,
      IN p_limit INT,
      IN p_offset INT
    )
    proc_matches: BEGIN
      DECLARE v_role_id INT;
      DECLARE v_state_id INT;
      DECLARE v_dist_id INT;
      DECLARE v_limit INT DEFAULT 25;
      DECLARE v_offset INT DEFAULT 0;

      SELECT role_id, state_id, district_id INTO v_role_id, v_state_id, v_dist_id
        FROM users WHERE id = p_actor_id;

      IF p_limit IS NOT NULL AND p_limit > 0 THEN
        SET v_limit = LEAST(p_limit, 100);
      END IF;
      IF p_offset IS NOT NULL AND p_offset >= 0 THEN
        SET v_offset = p_offset;
      END IF;

      -- Result Set 1: Paginated Rows
      SELECT 
        m.id,
        m.tournament_id,
        tr.name AS tournament_name,
        m.team1_id,
        t1.name AS team1_name,
        m.team2_id,
        t2.name AS team2_name,
        m.venue_id,
        v.name AS venue_name,
        m.match_date,
        m.match_time,
        m.stage,
        m.status,
        mr.team1_score,
        mr.team2_score,
        mr.winner_team_id,
        mr.man_of_match_player_id,
        p_mom.name AS man_of_match_name,
        mr.status AS result_status,
        mr.certified_by,
        mr.certified_at
      FROM matches m
      JOIN tournaments tr ON tr.id = m.tournament_id
      JOIN teams t1 ON t1.id = m.team1_id
      JOIN teams t2 ON t2.id = m.team2_id
      LEFT JOIN venues v ON v.id = m.venue_id
      LEFT JOIN match_results mr ON mr.match_id = m.id
      LEFT JOIN players p_mom ON p_mom.id = mr.man_of_match_player_id
      WHERE (v_role_id = 1
             OR (v_role_id = 2 AND tr.state_id = v_state_id)
             OR (v_role_id = 3 AND (t1.district_id = v_dist_id OR t2.district_id = v_dist_id))
             OR (v_role_id = 4 AND m.id IN (SELECT match_id FROM match_official_assignments WHERE official_id = p_actor_id)))
        AND (p_tournament_id IS NULL OR m.tournament_id = p_tournament_id)
        AND (p_status IS NULL OR TRIM(p_status) = '' OR m.status = p_status)
        AND (p_from IS NULL OR m.match_date >= p_from)
        AND (p_to IS NULL OR m.match_date <= p_to)
      ORDER BY m.match_date DESC, m.id DESC
      LIMIT v_limit OFFSET v_offset;

      -- Result Set 2: Total Count
      SELECT COUNT(*) AS total_count
      FROM matches m
      JOIN tournaments tr ON tr.id = m.tournament_id
      JOIN teams t1 ON t1.id = m.team1_id
      JOIN teams t2 ON t2.id = m.team2_id
      WHERE (v_role_id = 1
             OR (v_role_id = 2 AND tr.state_id = v_state_id)
             OR (v_role_id = 3 AND (t1.district_id = v_dist_id OR t2.district_id = v_dist_id))
             OR (v_role_id = 4 AND m.id IN (SELECT match_id FROM match_official_assignments WHERE official_id = p_actor_id)))
        AND (p_tournament_id IS NULL OR m.tournament_id = p_tournament_id)
        AND (p_status IS NULL OR TRIM(p_status) = '' OR m.status = p_status)
        AND (p_from IS NULL OR m.match_date >= p_from)
        AND (p_to IS NULL OR m.match_date <= p_to);
    END proc_matches
  `);
}
