import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ActionResult = { ok: true; message: string } | { ok: false; code: string; message: string };

async function runAction(fn: () => Promise<void>, successMessage: string): Promise<ActionResult> {
  const { InvariantError } = await import("./db.server");
  try {
    await fn();
    return { ok: true, message: successMessage };
  } catch (error) {
    if (error instanceof InvariantError) {
      return { ok: false, code: error.code, message: error.message };
    }
    const message = (error as Error).message ?? "Unknown error";
    if (message === "UNAUTHENTICATED" || message === "NOT_APPROVED" || message === "FORBIDDEN") {
      return { ok: false, code: message, message: "You are not allowed to perform this action." };
    }
    console.error("[action]", error);
    return { ok: false, code: "ERR", message: "The operation could not be completed." };
  }
}

/* ----------------------------- public portal ----------------------------- */

export type SiteSettings = {
  id: number;
  org_name: string;
  org_short_name: string;
  tagline: string;
  hero_badge: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta_primary_text: string;
  hero_cta_primary_url: string;
  hero_bg_image: string;
  featured_post_id: number | null;
};

export type LeadershipMember = {
  id: number;
  name: string;
  designation: string;
  category: "patron" | "executive" | "coaching" | "technical" | "selector";
  photo_url: string;
  bio: string | null;
  display_order: number;
  is_active: boolean;
};

export type PublicPortal = {
  siteSettings: SiteSettings | null;
  leadershipMembers: LeadershipMember[];
  tournaments: Array<{ id: number; name: string; sport_id: number; level: string | null; status: string | null }>;
  standings: Array<{
    tournament_id: number;
    tournament_name: string | null;
    sport_id: number;
    team_name: string | null;
    played: number;
    won: number;
    lost: number;
    tied: number;
    points: number;
    score_difference: number;
  }>;
  fixtures: Array<{
    id: number;
    scheduled_at: string | null;
    venue: string | null;
    status: string | null;
    team1_name: string | null;
    team2_name: string | null;
    tournament_name: string | null;
    sport_id: number;
  }>;
  recaps: Array<{
    id: number;
    scheduled_at: string | null;
    team1_name: string | null;
    team2_name: string | null;
    team1_score: number | null;
    team2_score: number | null;
    venue: string | null;
    man_of_match: string | null;
    summary: string | null;
    sport_id: number;
  }>;
  notices: Array<{
    id: number;
    title: string | null;
    body: string | null;
    audience_level: string | null;
    target_level: string | null;
    published_at: string | null;
  }>;
  documents: Array<{
    id: number;
    title: string | null;
    file_url: string | null;
    category: string | null;
    version?: string | null;
    checksum_sha?: string | null;
  }>;
  news: Array<{
    id: number;
    title: string;
    content: string;
    image_url?: string | null;
    category_tag?: string | null;
    read_time_min?: number | null;
    is_featured?: boolean | null;
    author_name?: string | null;
    tournament_id: number | null;
    status: string;
    published_at: string | null;
  }>;
};

export const getPublicPortal = createServerFn({ method: "GET" }).handler(async (): Promise<PublicPortal> => {
  const { safeQuery } = await import("./db.server");
  const [siteSettingsRows, leadershipMembers, tournaments, standings, fixtures, recaps, notices, documents, news] = await Promise.all([
    safeQuery<SiteSettings>(`SELECT * FROM site_settings WHERE id = 1 LIMIT 1`),
    safeQuery<LeadershipMember>(`SELECT * FROM leadership_members WHERE is_active = 1 ORDER BY display_order ASC, id ASC`),
    safeQuery<PublicPortal["tournaments"][number]>(
      `SELECT id, name, sport_id, level, status FROM tournaments ORDER BY id DESC LIMIT 30`,
    ),
    safeQuery<PublicPortal["standings"][number]>(
      `SELECT s.tournament_id, t.name AS tournament_name, t.sport_id, tm.name AS team_name,
              s.played, s.won, s.lost, s.tied, s.points, s.score_difference
         FROM standings s
         LEFT JOIN tournaments t ON t.id = s.tournament_id
         LEFT JOIN teams tm ON tm.id = s.team_id
        ORDER BY s.tournament_id DESC, s.points DESC, s.score_difference DESC
        LIMIT 200`,
    ),
    safeQuery<PublicPortal["fixtures"][number]>(
      `SELECT m.id, CONCAT(m.match_date, ' ', COALESCE(m.match_time, '00:00:00')) AS scheduled_at,
              v.name AS venue, m.status,
              a.name AS team1_name, b.name AS team2_name, t.name AS tournament_name, t.sport_id
         FROM matches m
         LEFT JOIN teams a ON a.id = m.team1_id
         LEFT JOIN teams b ON b.id = m.team2_id
         LEFT JOIN tournaments t ON t.id = m.tournament_id
         LEFT JOIN venues v ON v.id = m.venue_id
        WHERE m.status IN ('scheduled','in_progress')
        ORDER BY m.match_date ASC LIMIT 25`,
    ),
    safeQuery<PublicPortal["recaps"][number]>(
      `SELECT m.id, CONCAT(m.match_date, ' ', COALESCE(m.match_time, '00:00:00')) AS scheduled_at,
              a.name AS team1_name, b.name AS team2_name,
              mr.team1_score, mr.team2_score,
              v.name AS venue,
              p.name AS man_of_match,
              t.sport_id,
              CONCAT('Winner: ', COALESCE(w.name, 'Tie'), IF(p.name IS NOT NULL, CONCAT(' | MOM: ', p.name), '')) AS summary
         FROM matches m
         JOIN match_results mr ON mr.match_id = m.id
         LEFT JOIN teams a ON a.id = m.team1_id
         LEFT JOIN teams b ON b.id = m.team2_id
         LEFT JOIN tournaments t ON t.id = m.tournament_id
         LEFT JOIN venues v ON v.id = m.venue_id
         LEFT JOIN teams w ON w.id = mr.winner_team_id
         LEFT JOIN players p ON p.id = mr.man_of_match_player_id
        WHERE m.status = 'completed' OR mr.status IN ('recorded','certified')
        ORDER BY m.match_date DESC LIMIT 15`,
    ),
    safeQuery<PublicPortal["notices"][number]>(
      `SELECT id, title, content AS body, target_level AS audience_level, target_level, issued_at AS published_at
         FROM notices
        ORDER BY issued_at DESC LIMIT 25`,
    ),
    safeQuery<PublicPortal["documents"][number]>(
      `SELECT id, title, file_url, 'rulebook' AS category, version, checksum_sha
         FROM rulebooks ORDER BY id DESC LIMIT 40`,
    ),
    safeQuery<PublicPortal["news"][number]>(
      `SELECT id, title, content, image_url, category_tag, read_time_min, is_featured, author_name, tournament_id, status, published_at
         FROM news_posts
        WHERE status = 'published'
        ORDER BY is_featured DESC, id DESC LIMIT 10`,
    ),
  ]);
  return {
    siteSettings: siteSettingsRows[0] ?? null,
    leadershipMembers,
    tournaments,
    standings,
    fixtures,
    recaps,
    notices,
    documents,
    news,
  };
});

/* --------------------------- admin: approvals ---------------------------- */

export type PendingUser = {
  id: number;
  full_name: string | null;
  email: string;
  role_id: number;
  status: string;
  state_name: string | null;
  district_name: string | null;
  created_at: string | null;
};

export const getApprovalQueue = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUser } = await import("./session.server");
  const { safeQuery } = await import("./db.server");
  const user = await requireUser([1, 2]);

  const scope =
    user.role_id === 1
      ? { clause: "u.role_id = 2", params: [] as unknown[] }
      : { clause: "u.role_id = 3 AND u.state_id = ?", params: [user.state_id] };

  return safeQuery<PendingUser>(
    `SELECT u.id, u.name AS full_name, u.email, u.role_id, u.status, s.name AS state_name,
            d.name AS district_name, u.created_at
       FROM users u
       LEFT JOIN states s ON s.id = u.state_id
       LEFT JOIN districts d ON d.id = u.district_id
      WHERE ${scope.clause}
      ORDER BY FIELD(u.status,'pending','approved','suspended'), u.id DESC
      LIMIT 200`,
    scope.params,
  );
});

export const approveUser = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        targetUserId: z.number().int().positive(),
        newStatus: z.enum(["approved", "rejected", "suspended", "pending"]),
        reason: z.string().min(3).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { callProc } = await import("./db.server");
    return runAction(async () => {
      const actor = await requireUser([1, 2]);
      await callProc("sp_approve_user", [actor.id, data.targetUserId, data.newStatus, data.reason]);
    }, `Membership status set to ${data.newStatus}.`);
  });

/* ----------------------------- teams / rosters --------------------------- */

export type TeamRow = {
  id: number;
  name: string;
  level: string | null;
  roster_status: string | null;
  state_name: string | null;
  district_name: string | null;
  player_count: number;
};

export const getTeams = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUser } = await import("./session.server");
  const { safeQuery } = await import("./db.server");
  const user = await requireUser([1, 2, 3]);

  const where =
    user.role_id === 1
      ? { clause: "1 = 1", params: [] as unknown[] }
      : user.role_id === 2
        ? { clause: "t.state_id = ?", params: [user.state_id] }
        : { clause: "t.district_id = ?", params: [user.district_id] };

  return safeQuery<TeamRow>(
    `SELECT t.id, t.name, t.level, t.roster_status, s.name AS state_name, d.name AS district_name,
            (SELECT COUNT(*) FROM team_players tp WHERE tp.team_id = t.id) AS player_count
       FROM teams t
       LEFT JOIN states s ON s.id = t.state_id
       LEFT JOIN districts d ON d.id = t.district_id
      WHERE ${where.clause}
      ORDER BY t.id DESC LIMIT 200`,
    where.params,
  );
});

export type RosterPlayer = { id: number; player_id: number; full_name: string | null; jersey_no: number | null };

export const getRoster = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ teamId: z.number().int().positive() }).parse(input))
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { safeQuery } = await import("./db.server");
    await requireUser([1, 2, 3]);

    const [roster, availablePlayers] = await Promise.all([
      safeQuery<RosterPlayer>(
        `SELECT tp.id, tp.player_id, p.name AS full_name, tp.jersey_number AS jersey_no
           FROM team_players tp LEFT JOIN players p ON p.id = tp.player_id
          WHERE tp.team_id = ? ORDER BY p.name`,
        [data.teamId],
      ),
      safeQuery<{ id: number; full_name: string | null }>(
        `SELECT p.id, p.name AS full_name FROM players p
          WHERE p.status = 'active'
            AND p.id NOT IN (SELECT player_id FROM team_players WHERE team_id = ?)
          ORDER BY p.name LIMIT 300`,
        [data.teamId],
      ),
    ]);
    return { roster, availablePlayers };
  });

export const addRosterPlayer = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        teamId: z.number().int().positive(),
        playerId: z.number().int().positive(),
        jerseyNo: z.number().int().min(0).max(999).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { query } = await import("./db.server");
    return runAction(async () => {
      await requireUser([1, 2, 3]);
      await query(`INSERT INTO team_players (team_id, player_id, jersey_number) VALUES (?, ?, ?)`, [
        data.teamId,
        data.playerId,
        data.jerseyNo ? String(data.jerseyNo) : null,
      ]);
    }, "Player added to the roster.");
  });

export const removeRosterPlayer = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ teamId: z.number().int().positive(), playerId: z.number().int().positive() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { query } = await import("./db.server");
    return runAction(async () => {
      await requireUser([1, 2, 3]);
      await query(`DELETE FROM team_players WHERE team_id = ? AND player_id = ?`, [
        data.teamId,
        data.playerId,
      ]);
    }, "Player removed from the roster.");
  });

export const transitionRoster = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        teamId: z.number().int().positive(),
        targetStatus: z.enum(["draft", "submitted", "approved", "frozen"]),
        reason: z.string().min(3).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { callProc } = await import("./db.server");
    return runAction(async () => {
      const actor = await requireUser([1, 2, 3]);
      await callProc("sp_transition_roster_status", [
        actor.id,
        data.teamId,
        data.targetStatus,
        data.reason,
      ]);
    }, `Roster moved to ${data.targetStatus}.`);
  });

/* -------------------------------- players -------------------------------- */

export type PlayerRecord = {
  id: number;
  full_name: string | null;
  dob: string | null;
  gender: string | null;
  status: string | null;
  district_name: string | null;
  photo_url?: string | null;
  playing_position?: string | null;
  jersey_number?: number | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  bio?: string | null;
  sport_id?: number | null;
  sport_name?: string | null;
};

export const getPlayers = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUser } = await import("./session.server");
  const { safeQuery } = await import("./db.server");
  const user = await requireUser([1, 2, 3]);
  const where =
    user.role_id === 1
      ? { clause: "1 = 1", params: [] as unknown[] }
      : user.role_id === 2
        ? { clause: "d.state_id = ?", params: [user.state_id] }
        : { clause: "p.district_id = ?", params: [user.district_id] };

  return safeQuery<PlayerRecord>(
    `SELECT p.id, p.name AS full_name, p.dob, p.gender, p.status, d.name AS district_name,
            p.photo_url, p.playing_position, p.jersey_number, p.height_cm, p.weight_kg, p.bio,
            p.sport_id, sp.name AS sport_name
       FROM players p
       LEFT JOIN districts d ON d.id = p.district_id
       LEFT JOIN sports sp ON sp.id = p.sport_id
      WHERE ${where.clause} ORDER BY p.id DESC LIMIT 300`,
    where.params,
  );
});

export const registerPlayer = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        fullName: z.string().min(2).max(120),
        dob: z.string().min(4).max(20),
        gender: z.enum(["male", "female", "other"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { query } = await import("./db.server");
    return runAction(async () => {
      const actor = await requireUser([3]);
      const genderCode = data.gender === "female" ? "F" : data.gender === "other" ? "O" : "M";
      await query(
        `INSERT INTO players (name, dob, gender, sport_id, district_id, status)
         VALUES (?, ?, ?, 1, ?, 'active')`,
        [data.fullName, data.dob, genderCode, actor.district_id],
      );
    }, "Player registered in the district directory.");
  });

export const registerAthleteFull = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        name: z.string().min(2).max(150),
        dob: z.string().min(4).max(20),
        gender: z.enum(["M", "F", "O"]),
        sportId: z.number().int().min(1).max(2),
        playingPosition: z.string().max(50).optional().nullable(),
        jerseyNumber: z.number().int().optional().nullable(),
        heightCm: z.number().int().optional().nullable(),
        weightKg: z.number().int().optional().nullable(),
        bio: z.string().max(5000).optional().nullable(),
        photoUrl: z.string().max(10_000_000).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { query, safeQuery } = await import("./db.server");
    return runAction(async () => {
      const actor = await requireUser([3]);
      // Duplicate prevention in the same district
      const duplicates = await safeQuery(
        `SELECT id FROM players WHERE district_id = ? AND LOWER(name) = ? AND dob = ? LIMIT 1`,
        [actor.district_id, data.name.trim().toLowerCase(), data.dob],
      );
      if (duplicates.length > 0) {
        throw new Error("An athlete with the exact same name and date of birth is already registered in your district.");
      }

      const photo = data.photoUrl?.trim() || "/assets/defaults/fallback.svg";

      await query(
        `INSERT INTO players (name, dob, gender, sport_id, district_id, status, photo_url, playing_position, jersey_number, height_cm, weight_kg, bio)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)`,
        [
          data.name.trim(),
          data.dob,
          data.gender,
          data.sportId,
          actor.district_id,
          photo,
          data.playingPosition?.trim() || null,
          data.jerseyNumber || null,
          data.heightCm || null,
          data.weightKg || null,
          data.bio?.trim() || null,
        ],
      );
    }, "Athlete registered successfully with verified profile.");
  });

/* ------------------------------ tournaments ------------------------------ */

export const getTournaments = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUser } = await import("./session.server");
  const { safeQuery } = await import("./db.server");
  await requireUser([1, 2, 3, 4]);
  return safeQuery<{
    id: number;
    name: string;
    level: string | null;
    status: string | null;
    start_date: string | null;
  }>(`SELECT id, name, level, status, season AS start_date FROM tournaments ORDER BY id DESC LIMIT 100`);
});

export const registerTournamentTeam = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        tournamentId: z.number().int().positive(),
        teamId: z.number().int().positive(),
        groupName: z.string().min(1).max(50),
        reason: z.string().min(3).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { callProc } = await import("./db.server");
    return runAction(async () => {
      const actor = await requireUser([1, 2]);
      await callProc("sp_register_tournament_team", [
        actor.id,
        data.tournamentId,
        data.teamId,
        data.groupName,
        data.reason,
      ]);
    }, "Team entry registered for the tournament.");
  });

export const getStandings = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ tournamentId: z.number().int().positive() }).parse(input))
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { safeQuery } = await import("./db.server");
    await requireUser([1, 2, 3, 4]);
    return safeQuery<{
      team_name: string | null;
      played: number;
      won: number;
      lost: number;
      tied: number;
      points: number;
      score_difference: number;
    }>(
      `SELECT tm.name AS team_name, s.played, s.won, s.lost, s.tied, s.points, s.score_difference
         FROM standings s LEFT JOIN teams tm ON tm.id = s.team_id
        WHERE s.tournament_id = ?
        ORDER BY s.points DESC, s.score_difference DESC`,
      [data.tournamentId],
    );
  });

export const recalculateStandings = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ tournamentId: z.number().int().positive() }).parse(input))
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { callProc } = await import("./db.server");
    return runAction(async () => {
      await requireUser([1, 2]);
      await callProc("sp_recalculate_standings", [data.tournamentId]);
    }, "Standings recalculated.");
  });

/* --------------------------------- matches ------------------------------- */

export type MatchRow = {
  id: number;
  tournament_name: string | null;
  scheduled_at: string | null;
  venue: string | null;
  status: string | null;
  team1_id: number;
  team2_id: number;
  team1_name: string | null;
  team2_name: string | null;
  team1_score: number | null;
  team2_score: number | null;
  summary: string | null;
};

const MATCH_SELECT = `SELECT m.id, t.name AS tournament_name,
        CONCAT(m.match_date, ' ', COALESCE(m.match_time, '00:00:00')) AS scheduled_at,
        v.name AS venue, m.status,
        m.team1_id, m.team2_id, a.name AS team1_name, b.name AS team2_name,
        mr.team1_score, mr.team2_score,
        CONCAT('Winner: ', COALESCE(w.name, 'Tie'), IF(p.name IS NOT NULL, CONCAT(' | MOM: ', p.name), '')) AS summary
   FROM matches m
   LEFT JOIN tournaments t ON t.id = m.tournament_id
   LEFT JOIN teams a ON a.id = m.team1_id
   LEFT JOIN teams b ON b.id = m.team2_id
   LEFT JOIN venues v ON v.id = m.venue_id
   LEFT JOIN match_results mr ON mr.match_id = m.id
   LEFT JOIN teams w ON w.id = mr.winner_team_id
   LEFT JOIN players p ON p.id = mr.man_of_match_player_id`;

/** Matches visible to the signed-in user; officials see only assigned fixtures. */
export const getMatches = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUser } = await import("./session.server");
  const { safeQuery } = await import("./db.server");
  const user = await requireUser([1, 2, 3, 4]);

  if (user.role_id === 4) {
    return safeQuery<MatchRow>(
      `${MATCH_SELECT}
        JOIN match_official_assignments moa ON moa.match_id = m.id
       WHERE moa.official_id = ?
       ORDER BY m.match_date ASC LIMIT 100`,
      [user.id],
    );
  }
  if (user.role_id === 2) {
    return safeQuery<MatchRow>(
      `${MATCH_SELECT} WHERE a.state_id = ? OR b.state_id = ?
       ORDER BY m.match_date DESC LIMIT 150`,
      [user.state_id, user.state_id],
    );
  }
  return safeQuery<MatchRow>(`${MATCH_SELECT} ORDER BY m.match_date DESC LIMIT 150`);
});

/** Players eligible to be Man of the Match: on-roster, active, for either side. */
export const getMatchSquads = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ matchId: z.number().int().positive() }).parse(input))
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { safeQuery } = await import("./db.server");
    await requireUser([1, 2, 3, 4]);
    return safeQuery<{ id: number; full_name: string | null; team_name: string | null }>(
      `SELECT p.id, p.name AS full_name, tm.name AS team_name
         FROM matches m
         JOIN team_players tp ON tp.team_id IN (m.team1_id, m.team2_id)
         JOIN players p ON p.id = tp.player_id AND p.status = 'active'
         LEFT JOIN teams tm ON tm.id = tp.team_id
        WHERE m.id = ?
        ORDER BY tm.name, p.name`,
      [data.matchId],
    );
  });

export const recordMatchResult = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        matchId: z.number().int().positive(),
        team1Score: z.number().int().min(0).max(999),
        team2Score: z.number().int().min(0).max(999),
        manOfMatchPlayerId: z.number().int().positive().nullable(),
        summary: z.string().min(3).max(2000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { callProc } = await import("./db.server");
    return runAction(async () => {
      const actor = await requireUser([4]);
      await callProc("sp_record_match_result", [
        actor.id,
        data.matchId,
        data.team1Score,
        data.team2Score,
        data.manOfMatchPlayerId,
        data.summary,
      ]);
    }, "Match result recorded and locked for certification.");
  });

export const certifyMatchResult = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ matchId: z.number().int().positive(), reason: z.string().min(3).max(500) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { callProc } = await import("./db.server");
    return runAction(async () => {
      const actor = await requireUser([1, 2]);
      await callProc("sp_certify_match_result", [actor.id, data.matchId, data.reason]);
    }, "Result certified.");
  });

export const correctCertifiedResult = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        matchId: z.number().int().positive(),
        team1Score: z.number().int().min(0).max(999),
        team2Score: z.number().int().min(0).max(999),
        reason: z.string().min(3).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { callProc } = await import("./db.server");
    return runAction(async () => {
      const actor = await requireUser([1]);
      await callProc("sp_correct_certified_result", [
        actor.id,
        data.matchId,
        data.team1Score,
        data.team2Score,
        data.reason,
      ]);
    }, "Certified score corrected.");
  });

/* ------------------------------- governance ------------------------------ */

export const getGovernance = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUser } = await import("./session.server");
  const { safeQuery } = await import("./db.server");
  await requireUser([1, 2, 3, 4]);
  const [notices, documents] = await Promise.all([
    safeQuery<{
      id: number;
      title: string | null;
      body: string | null;
      audience_level: string | null;
      published_at: string | null;
    }>(`SELECT id, title, content AS body, target_level AS audience_level, issued_at AS published_at FROM notices ORDER BY issued_at DESC LIMIT 50`),
    safeQuery<{ id: number; title: string | null; file_url: string | null; category: string | null }>(
      `SELECT id, title, file_url, 'rulebook' AS category, version, checksum_sha FROM rulebooks ORDER BY id DESC LIMIT 60`,
    ),
  ]);
  return { notices, documents };
});

/* --------------------------- headless CMS & settings --------------------- */

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async (): Promise<SiteSettings | null> => {
  const { safeQuery } = await import("./db.server");
  const rows = await safeQuery<SiteSettings>(`SELECT * FROM site_settings WHERE id = 1 LIMIT 1`);
  return rows[0] ?? null;
});

export const updateSiteSettings = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        orgName: z.string().min(2).max(255),
        orgShortName: z.string().max(50),
        tagline: z.string().max(255),
        heroBadge: z.string().max(150),
        heroTitle: z.string().min(2).max(255),
        heroSubtitle: z.string(),
        heroBgImage: z.string().min(1).max(10_000_000),
        heroCtaPrimaryText: z.string().max(50),
        heroCtaPrimaryUrl: z.string().max(100),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { query } = await import("./db.server");
    return runAction(async () => {
      const actor = await requireUser([1, 2]);
      await query(
        `UPDATE site_settings
            SET org_name = ?, org_short_name = ?, tagline = ?, hero_badge = ?,
                hero_title = ?, hero_subtitle = ?, hero_bg_image = ?,
                hero_cta_primary_text = ?, hero_cta_primary_url = ?, updated_by = ?
          WHERE id = 1`,
        [
          data.orgName,
          data.orgShortName,
          data.tagline,
          data.heroBadge,
          data.heroTitle,
          data.heroSubtitle,
          data.heroBgImage,
          data.heroCtaPrimaryText,
          data.heroCtaPrimaryUrl,
          actor.id,
        ],
      );
    }, "Federation site settings updated successfully.");
  });

export const getLeadershipMembers = createServerFn({ method: "GET" }).handler(async (): Promise<LeadershipMember[]> => {
  const { safeQuery } = await import("./db.server");
  return safeQuery<LeadershipMember>(
    `SELECT * FROM leadership_members ORDER BY display_order ASC, id ASC`,
  );
});

export const saveLeadershipMember = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        id: z.number().int().optional().nullable(),
        name: z.string().min(2).max(150),
        designation: z.string().min(2).max(150),
        category: z.enum(["patron", "executive", "coaching", "technical", "selector"]),
        photoUrl: z.string().min(1).max(10_000_000),
        bio: z.string().max(5000).optional().nullable(),
        displayOrder: z.number().int().default(0),
        isActive: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { query } = await import("./db.server");
    return runAction(async () => {
      const actor = await requireUser([1, 2]);
      if (data.id) {
        await query(
          `UPDATE leadership_members
              SET name = ?, designation = ?, category = ?, photo_url = ?, bio = ?,
                  display_order = ?, is_active = ?, updated_by = ?
            WHERE id = ?`,
          [
            data.name,
            data.designation,
            data.category,
            data.photoUrl,
            data.bio ?? null,
            data.displayOrder,
            data.isActive ? 1 : 0,
            actor.id,
            data.id,
          ],
        );
      } else {
        await query(
          `INSERT INTO leadership_members
           (name, designation, category, photo_url, bio, display_order, is_active, updated_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data.name,
            data.designation,
            data.category,
            data.photoUrl,
            data.bio ?? null,
            data.displayOrder,
            data.isActive ? 1 : 0,
            actor.id,
          ],
        );
      }
    }, "Leadership registry entry saved successfully.");
  });

export const deleteLeadershipMember = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.number().int().positive() }).parse(input))
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { query } = await import("./db.server");
    return runAction(async () => {
      await requireUser([1, 2]);
      await query(`DELETE FROM leadership_members WHERE id = ?`, [data.id]);
    }, "Leadership member removed from council.");
  });
