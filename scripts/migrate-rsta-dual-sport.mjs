import { getPool } from "../src/lib/db.server.ts";

function cleanUrl(url) {
  if (!url) return url;
  const match = url.match(/https?:\/\/[^\s\)]+/);
  return match ? match[0] : url;
}

async function runMigration() {
  console.log("Starting RSTA Dual-Sport Database Migration & Seeding...");
  const pool = getPool();

  try {
    // Disable foreign key checks for clean re-seeding
    await pool.query("SET FOREIGN_KEY_CHECKS = 0");

    // 1. Extend Players table
    console.log("1. Extending players table with profile columns...");
    const [existingPlayerCols] = await pool.query("DESCRIBE players");
    const colNames = existingPlayerCols.map((c) => c.Field);

    const playerColsToAdd = [
      { name: "photo_url", def: "VARCHAR(1024) NULL DEFAULT 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=600&auto=format&fit=crop'" },
      { name: "aadhaar_hash", def: "CHAR(64) NULL" },
      { name: "playing_position", def: "VARCHAR(50) NULL" },
      { name: "jersey_number", def: "INT NULL" },
      { name: "height_cm", def: "INT NULL" },
      { name: "weight_kg", def: "INT NULL" },
      { name: "bio", def: "TEXT NULL" },
    ];

    for (const col of playerColsToAdd) {
      if (!colNames.includes(col.name)) {
        await pool.query(`ALTER TABLE players ADD COLUMN ${col.name} ${col.def}`);
        console.log(`  Added column players.${col.name}`);
      }
    }

    // 2. Create leadership_members table
    console.log("2. Creating leadership_members table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leadership_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        designation VARCHAR(150) NOT NULL,
        category ENUM('patron','executive','coaching','technical','selector') NOT NULL DEFAULT 'executive',
        photo_url VARCHAR(1024) NOT NULL,
        bio VARCHAR(500) NULL,
        display_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        updated_by INT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_lead_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB;
    `);

    // 3. Create site_settings table
    console.log("3. Creating site_settings table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT PRIMARY KEY DEFAULT 1,
        org_name VARCHAR(255) NOT NULL DEFAULT 'Rajasthan Sepak Takraw Association',
        org_short_name VARCHAR(50) NOT NULL DEFAULT 'RSTA',
        tagline VARCHAR(255) NOT NULL DEFAULT 'Apex State Governing Body for Sepak Takraw & Aatya Paatya in Rajasthan',
        hero_badge VARCHAR(150) NOT NULL DEFAULT 'Affiliated with Sepaktakraw Federation of India (STFI) & Rajasthan State Sports Council',
        hero_title VARCHAR(255) NOT NULL DEFAULT 'Rajasthan Sepak Takraw Association',
        hero_subtitle TEXT NOT NULL,
        hero_cta_primary_text VARCHAR(50) NOT NULL DEFAULT 'Official Federation Login',
        hero_cta_primary_url VARCHAR(100) NOT NULL DEFAULT '/auth',
        hero_bg_image VARCHAR(1024) NOT NULL DEFAULT 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1600&auto=format&fit=crop',
        featured_post_id INT NULL,
        updated_by INT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 4. Extend news_posts table
    console.log("4. Extending news_posts table...");
    const [existingNewsCols] = await pool.query("DESCRIBE news_posts");
    const newsColNames = existingNewsCols.map((c) => c.Field);

    const newsColsToAdd = [
      { name: "image_url", def: "VARCHAR(1024) NOT NULL DEFAULT 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=800&auto=format&fit=crop'" },
      { name: "category_tag", def: "VARCHAR(50) NOT NULL DEFAULT 'State Championship'" },
      { name: "read_time_min", def: "INT NOT NULL DEFAULT 3" },
      { name: "is_featured", def: "BOOLEAN NOT NULL DEFAULT FALSE" },
      { name: "author_name", def: "VARCHAR(100) NOT NULL DEFAULT 'RSTA Media Cell'" },
    ];

    for (const col of newsColsToAdd) {
      if (!newsColNames.includes(col.name)) {
        await pool.query(`ALTER TABLE news_posts ADD COLUMN ${col.name} ${col.def}`);
        console.log(`  Added column news_posts.${col.name}`);
      }
    }

    // 5. Seed Core Sports
    console.log("5. Seeding core sports (Sepak Takraw & Aatya Paatya)...");
    await pool.query("TRUNCATE TABLE sports");
    await pool.query(`
      INSERT INTO sports (id, name, scoring_type) VALUES
      (1, 'Sepak Takraw', 'point'),
      (2, 'Aatya Paatya', 'point')
    `);

    // 6. Seed Leadership Members
    console.log("6. Seeding leadership registry (Shri T. K. Singh, Jagdish Prajapat, etc.)...");
    await pool.query("TRUNCATE TABLE leadership_members");
    await pool.query(`
      INSERT INTO leadership_members (id, name, designation, category, photo_url, bio, display_order, is_active, updated_by) VALUES
      (1, 'Shri T. K. Singh', 'President, RSTA', 'executive', '/assets/leadership/tk-singh.webp', 'NIS-qualified expert and STFI National Committee Member driving Rajasthan state championship circuits and Asmita League development.', 1, TRUE, 1),
      (2, 'Jagdish Prajapat', 'Head Coach & Technical Director', 'coaching', '/assets/leadership/jagdish-prajapat.svg', 'Certified coach training national-tier Tekongs and Strikers in acrobatic roll-spikes, sunback kicks, and tactical court positioning.', 2, TRUE, 1),
      (3, 'Dr. Mahendra Sharma', 'Secretary General', 'executive', '/assets/leadership/mahendra-sharma.svg', 'Executive administrator coordinating inter-district tournaments and athlete welfare.', 3, TRUE, 1),
      (4, 'Col. B.S. Shekhawat', 'Chairman, Technical Board', 'technical', '/assets/leadership/bs-shekhawat.svg', 'Oversees referee certifications, ISTAF net height standards, and video adjudication.', 4, TRUE, 1)
    `);

    // 7. Seed Site Hero Settings
    console.log("7. Seeding site settings...");
    await pool.query(`
      INSERT INTO site_settings (id, org_name, org_short_name, tagline, hero_badge, hero_title, hero_subtitle, hero_bg_image, featured_post_id, updated_by)
      VALUES (
        1,
        'Rajasthan Sepak Takraw Association',
        'RSTA',
        'Apex State Governing Body for Sepak Takraw & Aatya Paatya in Rajasthan',
        'Affiliated with Sepaktakraw Federation of India (STFI) · Recognised by RSSC',
        'Rajasthan Sepak Takraw Association',
        'Presided over by Shri T. K. Singh (NIS). Administering high-flying acrobatic Sepak Takraw and indigenous Aatya Paatya championships across all 33 districts of Rajasthan.',
        '/assets/hero/stadium-court.svg',
        1,
        1
      ) ON DUPLICATE KEY UPDATE
        org_name=VALUES(org_name),
        hero_title=VALUES(hero_title),
        hero_subtitle=VALUES(hero_subtitle),
        hero_bg_image=VALUES(hero_bg_image);
    `);

    // 8. Seed Verified Players with Photos
    console.log("8. Seeding verified athletes with photos and physical attributes...");
    await pool.query("TRUNCATE TABLE team_players");
    await pool.query("TRUNCATE TABLE players");
    await pool.query(`
      INSERT INTO players (id, name, dob, gender, sport_id, district_id, status, photo_url, playing_position, jersey_number, height_cm, weight_kg, bio) VALUES
      (1, 'Devendra Singh Rathore', '2001-04-12', 'M', 1, 1, 'active', '/assets/players/devendra-rathore.svg', 'Tekong (Server)', 7, 182, 74, 'Right-footed high-velocity horse-kick server trained by Jagdish Prajapat.'),
      (2, 'Vikramaditya Shekhawat', '2002-08-19', 'M', 1, 1, 'active', '/assets/players/vikramaditya-shekhawat.svg', 'Striker (Killer)', 10, 178, 70, 'Specializes in aerial bicycle roll-spikes reaching heights above 2.4m.'),
      (3, 'Pratik Patel', '2001-11-03', 'M', 1, 3, 'active', '/assets/players/pratik-patel.svg', 'Feeder (Setter)', 5, 174, 68, 'Net setter directing deceptive ball feeds for perimeter attacks.'),
      (4, 'Harshvardhan Vaghela', '2002-02-14', 'M', 1, 3, 'active', '/assets/players/harshvardhan-vaghela.svg', 'Tekong (Server)', 9, 185, 76, 'Power server known for high-curve spinning serves.'),
      (7, 'Kuldeep Bishnoi', '2000-09-05', 'M', 2, 1, 'active', '/assets/players/kuldeep-bishnoi.svg', 'Lonav Leader', 1, 175, 69, 'Tactical leader in Aatya Paatya trench evasion.'),
      (8, 'Manish Choudhary', '2001-06-18', 'M', 2, 2, 'active', '/assets/players/manish-choudhary.svg', 'Sur-Pati Guard', 4, 180, 75, 'Central trench defender in regional Aatya Paatya tournaments.')
    `);

    // 9. Seed Teams & Rosters
    console.log("9. Seeding dual-sport teams and locking to FROZEN...");
    await pool.query("TRUNCATE TABLE teams");
    await pool.query(`
      INSERT INTO teams (id, name, level, sport_id, state_id, district_id, season, roster_status, created_by) VALUES
      (1, 'Rajasthan State Sepak Takraw Regu', 'state', 1, 1, NULL, '2025-26', 'draft', 2),
      (2, 'Gujarat State Sepak Takraw Regu', 'state', 1, 2, NULL, '2025-26', 'draft', 3),
      (4, 'Rajasthan Warriors Aatya Paatya', 'state', 2, 1, NULL, '2025-26', 'draft', 2),
      (5, 'Gujarat Titans Aatya Paatya', 'state', 2, 2, NULL, '2025-26', 'draft', 3)
    `);

    await pool.query(`
      INSERT INTO team_players (team_id, player_id, jersey_number, position) VALUES
      (1, 1, '7', 'Tekong'), (1, 2, '10', 'Striker'),
      (2, 3, '5', 'Feeder'), (2, 4, '9', 'Tekong'),
      (4, 7, '1', 'Lonav Leader'), (4, 8, '4', 'Sur-Pati Guard')
    `);

    await pool.query("UPDATE teams SET roster_status = 'submitted' WHERE id IN (1, 2, 4, 5)");
    await pool.query("UPDATE teams SET roster_status = 'approved' WHERE id IN (1, 2, 4, 5)");
    await pool.query("UPDATE teams SET roster_status = 'frozen' WHERE id IN (1, 2, 4, 5)");

    // 10. Tournaments, Matches, Results & Standings
    console.log("10. Seeding tournaments, matches, and dual-sport standings...");
    await pool.query("TRUNCATE TABLE standings");
    await pool.query("TRUNCATE TABLE match_result_revisions");
    await pool.query("TRUNCATE TABLE match_results");
    await pool.query("TRUNCATE TABLE match_official_assignments");
    await pool.query("TRUNCATE TABLE matches");
    await pool.query("TRUNCATE TABLE tournament_teams");
    await pool.query("TRUNCATE TABLE tournaments");

    await pool.query(`
      INSERT INTO tournaments (id, name, sport_id, level, state_id, district_id, format, season, status, created_by) VALUES
      (1, 'National Sepak Takraw Regu Championship 2026', 1, 'national', NULL, NULL, 'league', '2025-26', 'upcoming', 1),
      (2, 'All-India Aatya Paatya National Trophy 2026', 2, 'national', NULL, NULL, 'league', '2025-26', 'upcoming', 1)
    `);

    await pool.query(`
      INSERT INTO tournament_teams (tournament_id, team_id, group_name) VALUES
      (1, 1, 'Pool A'), (1, 2, 'Pool A'),
      (2, 4, 'Pool 1'), (2, 5, 'Pool 1')
    `);

    await pool.query("UPDATE tournaments SET status = 'ongoing' WHERE id = 1");

    await pool.query(`
      INSERT INTO matches (id, tournament_id, team1_id, team2_id, venue_id, match_date, match_time, stage, status) VALUES
      (1, 1, 1, 2, 1, '2026-09-14', '10:30:00', 'Group Match 1', 'scheduled'),
      (2, 2, 4, 5, 1, '2026-09-22', '16:00:00', 'Inaugural Pool Match', 'scheduled')
    `);

    await pool.query("UPDATE matches SET status = 'in_progress' WHERE id = 1");
    await pool.query("UPDATE matches SET status = 'completed' WHERE id = 1");

    await pool.query(`
      INSERT INTO match_official_assignments (match_id, official_id, role) VALUES
      (1, 6, 'main_scorer'), (2, 6, 'main_scorer')
    `);

    await pool.query(`
      INSERT INTO match_results (match_id, team1_score, team2_score, winner_team_id, man_of_match_player_id, recorded_by, certified_by, status)
      VALUES (1, 61, 56, 1, 2, 6, 1, 'certified')
    `);

    await pool.query("CALL sp_recalculate_standings(1)");
    await pool.query("CALL sp_recalculate_standings(2)");

    // 11. News Posts
    console.log("11. Seeding RSTA dispatches with authentic images...");
    await pool.query("TRUNCATE TABLE news_posts");
    await pool.query(`
      INSERT INTO news_posts (id, title, content, image_url, category_tag, read_time_min, is_featured, tournament_id, match_id, status, published_by, author_name) VALUES
      (1, 
       'Rajasthan Sepak Takraw Squad Clinches 3-Set Thriller at Sawai Mansingh Stadium', 
       'Under the tactical guidance of Head Coach Jagdish Prajapat and President Shri T. K. Singh, Rajasthan State Regu edged out defending champions Gujarat 2-1 (21-18, 19-21, 21-17). Vikramaditya Shekhawat executed 14 unreturnable bicycle spikes to seal the victory.', 
       '/assets/news/gold-medal.svg', 
       'State Championship', 
       4, 
       TRUE, 
       1, 
       1, 
       'published', 
       1, 
       'RSTA Press Cell'
      ),
      (2, 
       'Asmita League & Grassroots Coaching Clinics Launched by Shri T. K. Singh', 
       'RSTA President Shri T. K. Singh inaugurates comprehensive talent conditioning camps across Western Rajasthan. District coaches are undergoing ISTAF-certified coaching certifications under NIS guidelines.', 
       '/assets/news/aatya-paatya.svg', 
       'Talent Development', 
       3, 
       FALSE, 
       1, 
       NULL, 
       'published', 
       1, 
       'Technical Directorate'
      ),
      (3, 
       'Traditional Sport Sanctioning: Aatya Paatya National Trophy Circuit Expands', 
       'The ancient tactical tag game of Aatya Paatya receives official tournament sanctions across Rajasthan districts. Rajasthan Warriors confirm their final squad under newly surveyed trench layout standards.', 
       '/assets/news/istaf-referee.svg', 
       'Aatya Paatya Heritage', 
       5, 
       FALSE, 
       2, 
       NULL, 
       'published', 
       1, 
       'Traditional Sports Bureau'
      )
    `);

    // Re-enable foreign key checks
    await pool.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("RSTA DUAL-SPORT MIGRATION & SEEDING COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
