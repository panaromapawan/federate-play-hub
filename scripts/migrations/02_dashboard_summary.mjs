export async function up(pool) {
  console.log("  Creating sp_dashboard_summary procedure...");

  await pool.query(`DROP PROCEDURE IF EXISTS sp_dashboard_summary`);

  await pool.query(`
    CREATE PROCEDURE sp_dashboard_summary(IN p_actor_id INT)
    proc_summary: BEGIN
      DECLARE v_role_id INT;
      DECLARE v_role_name VARCHAR(50);
      DECLARE v_state_id INT;
      DECLARE v_dist_id INT;
      DECLARE v_status VARCHAR(20);

      SELECT u.role_id, r.name, u.state_id, u.district_id, u.status
        INTO v_role_id, v_role_name, v_state_id, v_dist_id, v_status
        FROM users u
        JOIN roles r ON r.id = u.role_id
       WHERE u.id = p_actor_id;

      IF v_status <> 'approved' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INV-02: Actor account is not approved.';
      END IF;

      -- =========================================================================
      -- RESULT SET 1: COUNTERS (Aggregates based on jurisdiction)
      -- =========================================================================
      IF v_role_id = 1 THEN
        -- National Admin
        SELECT
          (SELECT COUNT(*) FROM users WHERE status = 'pending') AS pending_users,
          (SELECT COUNT(*) FROM teams) AS teams_total,
          (SELECT COUNT(*) FROM teams WHERE roster_status = 'frozen') AS rosters_frozen,
          (SELECT COUNT(*) FROM teams WHERE roster_status IN ('submitted', 'approved')) AS rosters_awaiting_action,
          (SELECT COUNT(*) FROM matches WHERE status = 'scheduled') AS matches_upcoming,
          (SELECT COUNT(*) FROM matches m JOIN match_results mr ON mr.match_id = m.id WHERE mr.status = 'recorded') AS matches_awaiting_certification;

      ELSEIF v_role_id = 2 THEN
        -- State Admin
        SELECT
          (SELECT COUNT(*) FROM users WHERE status = 'pending' AND state_id = v_state_id AND role_id = 3) AS pending_users,
          (SELECT COUNT(*) FROM teams WHERE state_id = v_state_id) AS teams_total,
          (SELECT COUNT(*) FROM teams WHERE state_id = v_state_id AND roster_status = 'frozen') AS rosters_frozen,
          (SELECT COUNT(*) FROM teams WHERE state_id = v_state_id AND roster_status = 'submitted') AS rosters_awaiting_action,
          (SELECT COUNT(*) FROM matches m JOIN tournaments t ON t.id = m.tournament_id WHERE t.state_id = v_state_id AND m.status = 'scheduled') AS matches_upcoming,
          (SELECT COUNT(*) FROM matches m JOIN tournaments t ON t.id = m.tournament_id JOIN match_results mr ON mr.match_id = m.id WHERE t.state_id = v_state_id AND mr.status = 'recorded') AS matches_awaiting_certification;

      ELSEIF v_role_id = 3 THEN
        -- District Admin
        SELECT
          0 AS pending_users,
          (SELECT COUNT(*) FROM teams WHERE district_id = v_dist_id) AS teams_total,
          (SELECT COUNT(*) FROM teams WHERE district_id = v_dist_id AND roster_status = 'frozen') AS rosters_frozen,
          (SELECT COUNT(*) FROM teams WHERE district_id = v_dist_id AND roster_status = 'draft') AS rosters_awaiting_action,
          (SELECT COUNT(*) FROM matches m JOIN teams t ON (t.id = m.team1_id OR t.id = m.team2_id) WHERE t.district_id = v_dist_id AND m.status = 'scheduled') AS matches_upcoming,
          (SELECT COUNT(*) FROM matches m JOIN teams t ON (t.id = m.team1_id OR t.id = m.team2_id) JOIN match_results mr ON mr.match_id = m.id WHERE t.district_id = v_dist_id AND mr.status = 'recorded') AS matches_awaiting_certification;

      ELSE
        -- Match Official (Role 4)
        SELECT
          0 AS pending_users,
          (SELECT COUNT(DISTINCT m.team1_id) + COUNT(DISTINCT m.team2_id) FROM match_official_assignments moa JOIN matches m ON m.id = moa.match_id WHERE moa.official_id = p_actor_id) AS teams_total,
          0 AS rosters_frozen,
          (SELECT COUNT(*) FROM match_official_assignments moa JOIN matches m ON m.id = moa.match_id WHERE moa.official_id = p_actor_id AND m.status IN ('scheduled', 'in_progress')) AS rosters_awaiting_action,
          (SELECT COUNT(*) FROM match_official_assignments moa JOIN matches m ON m.id = moa.match_id WHERE moa.official_id = p_actor_id AND m.status = 'scheduled') AS matches_upcoming,
          (SELECT COUNT(*) FROM match_official_assignments moa JOIN matches m ON m.id = moa.match_id JOIN match_results mr ON mr.match_id = m.id WHERE moa.official_id = p_actor_id AND mr.status = 'recorded') AS matches_awaiting_certification;
      END IF;

      -- =========================================================================
      -- RESULT SET 2: WORK QUEUE / NEEDS ATTENTION ITEMS
      -- =========================================================================
      IF v_role_id = 1 THEN
        -- National Admin Queue
        (
          SELECT 
            'user_approval' AS type,
            u.id AS entity_id,
            CONCAT('Pending Registration: ', u.name, ' (', r.name, IFNULL(CONCAT(' - ', d.name), IFNULL(CONCAT(' - ', s.name), '')), ')') AS label,
            DATEDIFF(NOW(), u.created_at) AS age_days,
            CASE WHEN DATEDIFF(NOW(), u.created_at) >= 7 THEN 'destructive' WHEN DATEDIFF(NOW(), u.created_at) >= 3 THEN 'warning' ELSE 'default' END AS severity,
            u.status AS status,
            '/admin/national' AS action_url,
            u.created_at AS sort_date
          FROM users u
          JOIN roles r ON r.id = u.role_id
          LEFT JOIN states s ON s.id = u.state_id
          LEFT JOIN districts d ON d.id = u.district_id
          WHERE u.status = 'pending'
        )
        UNION ALL
        (
          SELECT
            'roster_approval' AS type,
            t.id AS entity_id,
            CONCAT('Roster ', UPPER(t.roster_status), ': ', t.name, ' (', t.level, ')') AS label,
            DATEDIFF(NOW(), t.created_at) AS age_days,
            CASE WHEN DATEDIFF(NOW(), t.created_at) >= 5 THEN 'warning' ELSE 'default' END AS severity,
            t.roster_status AS status,
            '/admin/national' AS action_url,
            t.created_at AS sort_date
          FROM teams t
          WHERE t.roster_status IN ('submitted', 'approved')
        )
        UNION ALL
        (
          SELECT
            'match_certification' AS type,
            m.id AS entity_id,
            CONCAT('Match #', m.id, ' Awaiting Certification: ', t1.name, ' vs ', t2.name) AS label,
            DATEDIFF(NOW(), m.match_date) AS age_days,
            CASE WHEN DATEDIFF(NOW(), m.match_date) >= 3 THEN 'destructive' ELSE 'warning' END AS severity,
            mr.status AS status,
            '/admin/national' AS action_url,
            m.created_at AS sort_date
          FROM matches m
          JOIN match_results mr ON mr.match_id = m.id AND mr.status = 'recorded'
          JOIN teams t1 ON t1.id = m.team1_id
          JOIN teams t2 ON t2.id = m.team2_id
        )
        ORDER BY 
          CASE severity WHEN 'destructive' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
          age_days DESC
        LIMIT 20;

      ELSEIF v_role_id = 2 THEN
        -- State Admin Queue
        (
          SELECT 
            'user_approval' AS type,
            u.id AS entity_id,
            CONCAT('District Admin Registration: ', u.name, IFNULL(CONCAT(' (', d.name, ')'), '')) AS label,
            DATEDIFF(NOW(), u.created_at) AS age_days,
            CASE WHEN DATEDIFF(NOW(), u.created_at) >= 7 THEN 'destructive' WHEN DATEDIFF(NOW(), u.created_at) >= 3 THEN 'warning' ELSE 'default' END AS severity,
            u.status AS status,
            '/admin/state' AS action_url,
            u.created_at AS sort_date
          FROM users u
          LEFT JOIN districts d ON d.id = u.district_id
          WHERE u.status = 'pending' AND u.state_id = v_state_id AND u.role_id = 3
        )
        UNION ALL
        (
          SELECT
            'roster_approval' AS type,
            t.id AS entity_id,
            CONCAT('District Roster Submitted: ', t.name) AS label,
            DATEDIFF(NOW(), t.created_at) AS age_days,
            CASE WHEN DATEDIFF(NOW(), t.created_at) >= 4 THEN 'warning' ELSE 'default' END AS severity,
            t.roster_status AS status,
            '/admin/state' AS action_url,
            t.created_at AS sort_date
          FROM teams t
          WHERE t.state_id = v_state_id AND t.roster_status = 'submitted'
        )
        UNION ALL
        (
          SELECT
            'match_certification' AS type,
            m.id AS entity_id,
            CONCAT('State Match #', m.id, ' Awaiting Certification: ', t1.name, ' vs ', t2.name) AS label,
            DATEDIFF(NOW(), m.match_date) AS age_days,
            CASE WHEN DATEDIFF(NOW(), m.match_date) >= 3 THEN 'destructive' ELSE 'warning' END AS severity,
            mr.status AS status,
            '/admin/state' AS action_url,
            m.created_at AS sort_date
          FROM matches m
          JOIN tournaments tr ON tr.id = m.tournament_id AND tr.state_id = v_state_id
          JOIN match_results mr ON mr.match_id = m.id AND mr.status = 'recorded'
          JOIN teams t1 ON t1.id = m.team1_id
          JOIN teams t2 ON t2.id = m.team2_id
        )
        ORDER BY 
          CASE severity WHEN 'destructive' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
          age_days DESC
        LIMIT 20;

      ELSEIF v_role_id = 3 THEN
        -- District Admin Queue
        (
          SELECT
            'roster_action' AS type,
            t.id AS entity_id,
            CONCAT('Draft Roster Ready to Submit: ', t.name) AS label,
            DATEDIFF(NOW(), t.created_at) AS age_days,
            CASE WHEN DATEDIFF(NOW(), t.created_at) >= 7 THEN 'warning' ELSE 'default' END AS severity,
            t.roster_status AS status,
            '/admin/district' AS action_url,
            t.created_at AS sort_date
          FROM teams t
          WHERE t.district_id = v_dist_id AND t.roster_status = 'draft'
        )
        ORDER BY age_days DESC
        LIMIT 20;

      ELSE
        -- Match Official Queue
        (
          SELECT
            'match_scoring' AS type,
            m.id AS entity_id,
            CONCAT('Assigned Fixture: ', t1.name, ' vs ', t2.name, ' (', m.match_date, ')') AS label,
            DATEDIFF(NOW(), m.match_date) AS age_days,
            CASE WHEN m.match_date < CURDATE() THEN 'destructive' WHEN m.match_date = CURDATE() THEN 'warning' ELSE 'default' END AS severity,
            m.status AS status,
            '/official/console' AS action_url,
            m.created_at AS sort_date
          FROM match_official_assignments moa
          JOIN matches m ON m.id = moa.match_id
          JOIN teams t1 ON t1.id = m.team1_id
          JOIN teams t2 ON t2.id = m.team2_id
          WHERE moa.official_id = p_actor_id AND m.status IN ('scheduled', 'in_progress')
        )
        ORDER BY age_days DESC
        LIMIT 20;
      END IF;

      -- =========================================================================
      -- RESULT SET 3: RECENT AUDIT ACTIVITY (Last 20 scoped events)
      -- =========================================================================
      SELECT 
        a.id,
        a.actor_id,
        IFNULL(u.name, 'System') AS actor_name,
        a.action,
        a.entity_type,
        a.entity_id,
        a.reason,
        a.created_at
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.actor_id
      ORDER BY a.id DESC
      LIMIT 20;

    END proc_summary
  `);
}
