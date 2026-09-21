export async function up(pool) {
  console.log("  Creating / Updating KPI Views...");

  // 1. v_kpi_users
  await pool.query(`
    CREATE OR REPLACE VIEW v_kpi_users AS
    SELECT 
      u.role_id,
      r.name AS role_name,
      u.state_id,
      s.name AS state_name,
      u.district_id,
      d.name AS district_name,
      u.status,
      COUNT(u.id) AS count
    FROM users u
    JOIN roles r ON r.id = u.role_id
    LEFT JOIN states s ON s.id = u.state_id
    LEFT JOIN districts d ON d.id = u.district_id
    GROUP BY u.role_id, r.name, u.state_id, s.name, u.district_id, d.name, u.status
  `);

  // 2. v_kpi_teams
  await pool.query(`
    CREATE OR REPLACE VIEW v_kpi_teams AS
    SELECT
      t.level,
      t.state_id,
      s.name AS state_name,
      t.district_id,
      d.name AS district_name,
      t.roster_status,
      t.season,
      COUNT(DISTINCT t.id) AS team_count,
      COUNT(tp.id) AS total_players
    FROM teams t
    LEFT JOIN states s ON s.id = t.state_id
    LEFT JOIN districts d ON d.id = t.district_id
    LEFT JOIN team_players tp ON tp.team_id = t.id
    GROUP BY t.level, t.state_id, s.name, t.district_id, d.name, t.roster_status, t.season
  `);

  // 3. v_kpi_matches
  await pool.query(`
    CREATE OR REPLACE VIEW v_kpi_matches AS
    SELECT
      m.tournament_id,
      tr.name AS tournament_name,
      tr.level AS tournament_level,
      tr.state_id,
      tr.district_id,
      m.status AS match_status,
      mr.status AS result_status,
      COUNT(m.id) AS match_count
    FROM matches m
    JOIN tournaments tr ON tr.id = m.tournament_id
    LEFT JOIN match_results mr ON mr.match_id = m.id
    GROUP BY m.tournament_id, tr.name, tr.level, tr.state_id, tr.district_id, m.status, mr.status
  `);

  console.log("  Ensuring performance indexes...");

  async function ensureIndex(table, indexName, columns) {
    const [existing] = await pool.query(
      `SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
      [table, indexName]
    );
    if (existing.length === 0) {
      try {
        await pool.query(`CREATE INDEX ${indexName} ON ${table} (${columns})`);
        console.log(`    + Created index ${indexName} on ${table}(${columns})`);
      } catch (err) {
        console.warn(`    ! Could not create index ${indexName} on ${table}: ${err.message}`);
      }
    } else {
      console.log(`    = Index ${indexName} already exists on ${table}`);
    }
  }

  await ensureIndex('users', 'idx_users_status_role', 'status, role_id');
  await ensureIndex('teams', 'idx_teams_roster_status', 'roster_status, state_id, district_id');
  await ensureIndex('matches', 'idx_matches_status_date', 'status, match_date');
  await ensureIndex('match_results', 'idx_mr_status_cert', 'status, certified_by');
  await ensureIndex('match_official_assignments', 'idx_moa_match_off', 'match_id, official_id');
  await ensureIndex('team_players', 'idx_tp_team_player', 'team_id, player_id');
  await ensureIndex('players', 'idx_players_name', 'name(60)');
  await ensureIndex('teams', 'idx_teams_name', 'name(60)');
}
