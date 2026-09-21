import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PlayerRow = {
  id: number;
  name: string;
  dob: string | null;
  gender: string;
  sport_id: number;
  sport_name: string | null;
  district_id: number;
  district_name: string | null;
  state_id: number;
  state_name: string | null;
  status: string;
  playing_position: string | null;
  jersey_number: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  photo_url: string | null;
  created_at: string;
};

export type TeamListRow = {
  id: number;
  name: string;
  level: string;
  sport_id: number;
  sport_name: string | null;
  state_id: number | null;
  state_name: string | null;
  district_id: number | null;
  district_name: string | null;
  season: string;
  roster_status: string;
  created_at: string;
  player_count: number;
};

export type MatchListRow = {
  id: number;
  tournament_id: number;
  tournament_name: string;
  team1_id: number;
  team1_name: string;
  team2_id: number;
  team2_name: string;
  venue_id: number | null;
  venue_name: string | null;
  match_date: string;
  match_time: string | null;
  stage: string | null;
  status: string;
  team1_score: number | null;
  team2_score: number | null;
  winner_team_id: number | null;
  man_of_match_player_id: number | null;
  man_of_match_name: string | null;
  result_status: string | null;
  certified_by: number | null;
  certified_at: string | null;
};

export type PaginatedResult<T> = {
  rows: T[];
  total: number;
  limit: number;
  offset: number;
};

export const listPlayers = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        search: z.string().optional(),
        stateId: z.number().optional(),
        districtId: z.number().optional(),
        status: z.string().optional(),
        limit: z.number().min(1).max(100).default(25),
        offset: z.number().min(0).default(0),
      })
      .parse(input ?? {})
  )
  .handler(async ({ data }): Promise<PaginatedResult<PlayerRow>> => {
    const { requireUser } = await import("./session.server");
    const { callProcMulti } = await import("./db.server");
    const user = await requireUser([1, 2, 3, 4]);

    const [rows, countRows] = await callProcMulti<PlayerRow, { total_count: number }>(
      "sp_list_players",
      [
        user.id,
        data.search ?? null,
        data.stateId ?? null,
        data.districtId ?? null,
        data.status ?? null,
        data.limit,
        data.offset,
      ]
    );

    const total = Number(countRows[0]?.total_count ?? 0);
    return {
      rows: rows ?? [],
      total,
      limit: data.limit,
      offset: data.offset,
    };
  });

export const listTeams = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        search: z.string().optional(),
        level: z.string().optional(),
        rosterStatus: z.string().optional(),
        limit: z.number().min(1).max(100).default(25),
        offset: z.number().min(0).default(0),
      })
      .parse(input ?? {})
  )
  .handler(async ({ data }): Promise<PaginatedResult<TeamListRow>> => {
    const { requireUser } = await import("./session.server");
    const { callProcMulti } = await import("./db.server");
    const user = await requireUser([1, 2, 3, 4]);

    const [rows, countRows] = await callProcMulti<TeamListRow, { total_count: number }>(
      "sp_list_teams",
      [
        user.id,
        data.search ?? null,
        data.level ?? null,
        data.rosterStatus ?? null,
        data.limit,
        data.offset,
      ]
    );

    const total = Number(countRows[0]?.total_count ?? 0);
    return {
      rows: rows ?? [],
      total,
      limit: data.limit,
      offset: data.offset,
    };
  });

export const listMatches = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        tournamentId: z.number().optional(),
        status: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        limit: z.number().min(1).max(100).default(25),
        offset: z.number().min(0).default(0),
      })
      .parse(input ?? {})
  )
  .handler(async ({ data }): Promise<PaginatedResult<MatchListRow>> => {
    const { requireUser } = await import("./session.server");
    const { callProcMulti } = await import("./db.server");
    const user = await requireUser([1, 2, 3, 4]);

    const [rows, countRows] = await callProcMulti<MatchListRow, { total_count: number }>(
      "sp_list_matches",
      [
        user.id,
        data.tournamentId ?? null,
        data.status ?? null,
        data.from ?? null,
        data.to ?? null,
        data.limit,
        data.offset,
      ]
    );

    const total = Number(countRows[0]?.total_count ?? 0);
    return {
      rows: rows ?? [],
      total,
      limit: data.limit,
      offset: data.offset,
    };
  });
