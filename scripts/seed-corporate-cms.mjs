import { getPool } from "../src/lib/db.server.ts";

async function runSeed() {
  console.log("Connecting to database pool...");
  const pool = getPool();

  try {
    // 1. Populate Notices
    console.log("1. Seeding circulars into notices...");
    await pool.query(`
      INSERT INTO notices (id, title, content, target_level, issued_by) VALUES
      (1, 'Mandatory Medical Clearance & Doping Declaration for 2026 Nationals', 'All affiliated state federations and district associations must submit verified player fitness certificates and dope-free declarations prior to final squad freeze.', 'national', 1),
      (2, 'Official Schedule & Mat Verification Protocol: Sawai Mansingh Stadium', 'The technical committee has approved Mats 1 & 2 for the National Kabaddi Championship opening clashes. Teams must report 90 minutes prior to scheduled whistle.', 'public', 1),
      (3, 'Rajasthan State Association: Junior Trial Dates Announced', 'Open district-to-state selection trials for U-21 talent identification will commence on October 5th at Jodhpur Sports Complex.', 'state', 2),
      (4, 'Accreditation Guidelines for Certified Match Officials & Video Referees', 'Mandatory refresher clinic for Grade-A scorers and technical officials on September 28th covering real-time audit event triggers.', 'public', 1)
      ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), target_level=VALUES(target_level)
    `);

    // 2. Populate Rulebooks
    console.log("2. Seeding technical rulebooks into rulebooks...");
    await pool.query(`
      INSERT INTO rulebooks (id, sport_id, title, file_url, version, checksum_sha, uploaded_by) VALUES
      (1, 1, 'National Pro Kabaddi Official Technical Rulebook & Scoring Code 2026', 'https://example.com/rules/kabaddi-2026-v2.pdf', 'v2.4', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 1),
      (2, 2, 'All-India Kho-Kho Federation Field Directives & Match Regulation', 'https://example.com/rules/khokho-code.pdf', 'v1.8', 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0', 1),
      (3, 1, 'Disciplinary Code, Anti-Poaching Regulations & Player Transfer Guidelines', 'https://example.com/rules/disciplinary-code-2026.pdf', 'v3.1', 'fa7289c09b2e18d6314f81029c7861542f1a56e87901cb3d4e5f6a7b8c9d0e1f', 1)
      ON DUPLICATE KEY UPDATE title=VALUES(title), version=VALUES(version), file_url=VALUES(file_url), checksum_sha=VALUES(checksum_sha)
    `);

    // 3. Populate Live Dispatches
    console.log("3. Seeding live dispatches into news_posts...");
    await pool.query(`
      INSERT INTO news_posts (id, title, content, tournament_id, match_id, status, published_by) VALUES
      (1, 'Rajasthan Edges Gujarat in Gripping Opening Clash of National Kabaddi Championship', 'In an electrifying opener at Sawai Mansingh Indoor Stadium, Rajasthan State Kabaddi secured a thrilling 34-28 victory against Gujarat. Arjun Raider led the offensive raid points tally, clinching the Man of the Match honor.', 1, 1, 'published', 1),
      (2, 'Grassroots Pathway Initiative: Zero-Trust Player Integrity Framework Deployed', 'The National Federation has officially launched its decentralized Zero-Trust registry to eliminate duplicate tier participation and age fraud across state championships.', 1, NULL, 'published', 1),
      (3, 'National Selection Trials: Roster Freeze Deadlines Imposed Across 28 States', 'Technical directors confirm that rosters for the upcoming season must reach APPROVED status by the end of the month before transition into immutable FROZEN state.', 1, NULL, 'published', 1)
      ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), status=VALUES(status)
    `);

    // 4. Update match and insert certified match result
    console.log("4. Updating match 1 to completed...");
    await pool.query(`UPDATE matches SET status = 'completed' WHERE id = 1`);

    console.log("5. Updating certified match results via Zero-Trust procedure sp_correct_certified_result...");
    try {
      await pool.query(`CALL sp_correct_certified_result(1, 1, 34, 28, 'Official opening clash verified 34-28 scoreline')`);
    } catch (err) {
      console.log("Note on sp_correct_certified_result:", err.message);
    }

    console.log("6. Recalculating standings via stored procedure...");
    await pool.query(`CALL sp_recalculate_standings(1)`);

    console.log("7. Verifying standings...");
    const [standings] = await pool.query(`
      SELECT s.tournament_id, t.name as tournament_name, tm.name as team_name, s.played, s.won, s.lost, s.tied, s.points, s.score_difference
      FROM standings s
      JOIN tournaments t ON t.id = s.tournament_id
      JOIN teams tm ON tm.id = s.team_id
      WHERE s.tournament_id = 1
      ORDER BY s.points DESC, s.score_difference DESC
    `);
    console.log("Updated standings:", standings);

    console.log("ALL SEED OPERATIONS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("Error running seed script:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeed();
