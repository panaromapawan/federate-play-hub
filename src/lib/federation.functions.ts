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

export type PublicPortal = {
  tournaments: Array<{ id: number; name: string; level: string | null; status: string | null }>;
  standings: Array<{
    tournament_id: number;
    tournament_name: string | null;
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
  }>;
  recaps: Array<{
    id: number;
    scheduled_at: string | null;
    team1_name: string | null;
    team2_name: string | null;
    team1_score: number | null;
    team2_score: number | null;
    summary: string | null;
  }>;
  notices: Array<{
    id: number;
    title: string | null;
    body: string | null;
    audience_level: string | null;
    published_at: string | null;
  }>;
  documents: Array<{ id: number; title: string | null; file_url: string | null; category: string | null }>;
};

export const getPublicPortal = createServerFn({ method: "GET" }).handler(async (): Promise<PublicPortal> => {
  const { safeQuery } = await import("./db.server");
  const [tournaments, standings, fixtures, recaps, notices, documents] = await Promise.all([
    safeQuery<PublicPortal["tournaments"][number]>(
      `SELECT id, name, level, status FROM tournaments ORDER BY id DESC LIMIT 30`,
    ),
    safeQuery<PublicPortal["standings"][number]>(
      `SELECT s.tournament_id, t.name AS tournament_name, tm.name AS team_name,
              s.played, s.won, s.lost, s.tied, s.points, s.score_difference
         FROM standings s
         LEFT JOIN tournaments t ON t.id = s.tournament_id
         LEFT JOIN teams tm ON tm.id = s.team_id
        ORDER BY s.tournament_id DESC, s.points DESC, s.score_difference DESC
        LIMIT 200`,
    ),
    safeQuery<PublicPortal["fixtures"][number]>(
      `SELECT m.id, m.scheduled_at, m.venue, m.status,
              a.name AS team1_name, b.name AS team2_name, t.name AS tournament_name
         FROM matches m
         LEFT JOIN teams a ON a.id = m.team1_id
         LEFT JOIN teams b ON b.id = m.team2_id
         LEFT JOIN tournaments t ON t.id = m.tournament_id
        WHERE m.status IN ('scheduled','pending','live')
        ORDER BY m.scheduled_at ASC LIMIT 25`,
    ),
    safeQuery<PublicPortal["recaps"][number]>(
      `SELECT m.id, m.scheduled_at, a.name AS team1_name, b.name AS team2_name,
              m.team1_score, m.team2_score, m.summary
         FROM matches m
         LEFT JOIN teams a ON a.id = m.team1_id
         LEFT JOIN teams b ON b.id = m.team2_id
        WHERE m.status IN ('completed','certified','corrected')
        ORDER BY m.scheduled_at DESC LIMIT 15`,
    ),
    safeQuery<PublicPortal["notices"][number]>(
      `SELECT id, title, body, audience_level, published_at FROM notices
        ORDER BY published_at DESC LIMIT 25`,
    ),
    safeQuery<PublicPortal["documents"][number]>(
      `SELECT id, title, file_url, category FROM documents ORDER BY id DESC LIMIT 40`,
    ),
  ]);
  return { tournaments, standings, fixtures, recaps, notices, documents };
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
    `SELECT u.id, u.full_name, u.email, u.role_id, u.status, s.name AS state_name,
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
        `SELECT tp.id, tp.player_id, p.full_name, tp.jersey_no
           FROM team_players tp LEFT JOIN players p ON p.id = tp.player_id
          WHERE tp.team_id = ? ORDER BY p.full_name`,
        [data.teamId],
      ),
      safeQuery<{ id: number; full_name: string | null }>(
        `SELECT p.id, p.full_name FROM players p
          WHERE p.status = 'active'
            AND p.id NOT IN (SELECT player_id FROM team_players WHERE team_id = ?)
          ORDER BY p.full_name LIMIT 300`,
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
      await query(`INSERT INTO team_players (team_id, player_id, jersey_no) VALUES (?, ?, ?)`, [
        data.teamId,
        data.playerId,
        data.jerseyNo,
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

export const getPlayers = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUser } = await import("./session.server");
  const { safeQuery } = await import("./db.server");
  const user = await requireUser([1, 2, 3]);
  const where =
    user.role_id === 1
      ? { clause: "1 = 1", params: [] as unknown[] }
      : user.role_id === 2
        ? { clause: "p.state_id = ?", params: [user.state_id] }
        : { clause: "p.district_id = ?", params: [user.district_id] };

  return safeQuery<{
    id: number;
    full_name: string | null;
    dob: string | null;
    gender: string | null;
    status: string | null;
    district_name: string | null;
  }>(
    `SELECT p.id, p.full_name, p.dob, p.gender, p.status, d.name AS district_name
       FROM players p LEFT JOIN districts d ON d.id = p.district_id
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
      await query(
        `INSERT INTO players (full_name, dob, gender, state_id, district_id, status)
         VALUES (?, ?, ?, ?, ?, 'active')`,
        [data.fullName, data.dob, data.gender, actor.state_id, actor.district_id],
      );
    }, "Player registered in the district directory.");
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
  }>(`SELECT id, name, level, status, start_date FROM tournaments ORDER BY id DESC LIMIT 100`);
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

const MATCH_SELECT = `SELECT m.id, t.name AS tournament_name, m.scheduled_at, m.venue, m.status,
        m.team1_id, m.team2_id, a.name AS team1_name, b.name AS team2_name,
        m.team1_score, m.team2_score, m.summary
   FROM matches m
   LEFT JOIN tournaments t ON t.id = m.tournament_id
   LEFT JOIN teams a ON a.id = m.team1_id
   LEFT JOIN teams b ON b.id = m.team2_id`;

/** Matches visible to the signed-in user; officials see only assigned fixtures. */
export const getMatches = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUser } = await import("./session.server");
  const { safeQuery } = await import("./db.server");
  const user = await requireUser([1, 2, 3, 4]);

  if (user.role_id === 4) {
    return safeQuery<MatchRow>(
      `${MATCH_SELECT}
        JOIN match_official_assignments moa ON moa.match_id = m.id
       WHERE moa.official_user_id = ?
       ORDER BY m.scheduled_at ASC LIMIT 100`,
      [user.id],
    );
  }
  if (user.role_id === 2) {
    return safeQuery<MatchRow>(
      `${MATCH_SELECT} WHERE a.state_id = ? OR b.state_id = ?
       ORDER BY m.scheduled_at DESC LIMIT 150`,
      [user.state_id, user.state_id],
    );
  }
  return safeQuery<MatchRow>(`${MATCH_SELECT} ORDER BY m.scheduled_at DESC LIMIT 150`);
});

/** Players eligible to be Man of the Match: on-roster, active, for either side. */
export const getMatchSquads = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ matchId: z.number().int().positive() }).parse(input))
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { safeQuery } = await import("./db.server");
    await requireUser([1, 2, 3, 4]);
    return safeQuery<{ id: number; full_name: string | null; team_name: string | null }>(
      `SELECT p.id, p.full_name, tm.name AS team_name
         FROM matches m
         JOIN team_players tp ON tp.team_id IN (m.team1_id, m.team2_id)
         JOIN players p ON p.id = tp.player_id AND p.status = 'active'
         LEFT JOIN teams tm ON tm.id = tp.team_id
        WHERE m.id = ?
        ORDER BY tm.name, p.full_name`,
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
    }>(`SELECT id, title, body, audience_level, published_at FROM notices ORDER BY published_at DESC LIMIT 50`),
    safeQuery<{ id: number; title: string | null; file_url: string | null; category: string | null }>(
      `SELECT id, title, file_url, category FROM documents ORDER BY id DESC LIMIT 60`,
    ),
  ]);
  return { notices, documents };
});
