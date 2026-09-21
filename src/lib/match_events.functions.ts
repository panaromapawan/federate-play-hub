import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type MatchEventRow = {
  id: number;
  match_id: number;
  team_id: number;
  team_name: string;
  player_id: number | null;
  player_name: string | null;
  event_type: "point" | "card_yellow" | "card_red" | "substitution" | "timeout" | "note";
  minute: number | null;
  value: number;
  note: string | null;
  created_at: string;
};

export const startMatch = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        matchId: z.number().int().positive(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { callProc } = await import("./db.server");
    const user = await requireUser([1, 4]);

    await callProc("sp_start_match", [user.id, data.matchId]);
    return { ok: true, message: "Match started successfully." };
  });

export const logMatchEvent = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        matchId: z.number().int().positive(),
        teamId: z.number().int().positive(),
        playerId: z.number().int().positive().nullable().optional(),
        eventType: z.enum(["point", "card_yellow", "card_red", "substitution", "timeout", "note"]),
        minute: z.number().int().min(0).max(180).optional(),
        value: z.number().int().default(1),
        note: z.string().max(255).optional(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { callProc } = await import("./db.server");
    const user = await requireUser([1, 4]);

    await callProc("sp_log_match_event", [
      user.id,
      data.matchId,
      data.teamId,
      data.playerId ?? null,
      data.eventType,
      data.minute ?? 0,
      data.value,
      data.note ?? null,
    ]);

    return { ok: true, message: "Event recorded." };
  });

export const getMatchEvents = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        matchId: z.number().int().positive(),
      })
      .parse(input)
  )
  .handler(async ({ data }): Promise<MatchEventRow[]> => {
    const { safeQuery } = await import("./db.server");

    return safeQuery<MatchEventRow>(
      `SELECT me.id, me.match_id, me.team_id, t.name AS team_name,
              me.player_id, p.name AS player_name,
              me.event_type, me.minute, me.value, me.note, me.created_at
         FROM match_events me
         JOIN teams t ON t.id = me.team_id
         LEFT JOIN players p ON p.id = me.player_id
        WHERE me.match_id = ?
        ORDER BY me.id ASC`,
      [data.matchId]
    );
  });
