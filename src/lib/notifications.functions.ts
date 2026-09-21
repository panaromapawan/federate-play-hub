import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type NotificationRow = {
  id: number;
  user_id: number;
  title: string;
  body: string | null;
  link: string | null;
  kind: "approval" | "roster" | "match" | "certification" | "system";
  read_at: string | null;
  created_at: string;
};

export const getNotifications = createServerFn({ method: "GET" }).handler(
  async (): Promise<NotificationRow[]> => {
    const { requireUser } = await import("./session.server");
    const { safeQuery } = await import("./db.server");
    const user = await requireUser();

    return safeQuery<NotificationRow>(
      `SELECT id, user_id, title, body, link, kind, read_at, created_at
         FROM notifications
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 30`,
      [user.id]
    );
  }
);

export const markNotificationRead = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        notifId: z.number().int().positive().nullable().optional(),
      })
      .parse(input ?? {})
  )
  .handler(async ({ data }) => {
    const { requireUser } = await import("./session.server");
    const { callProc } = await import("./db.server");
    const user = await requireUser();

    await callProc("sp_mark_notification_read", [user.id, data.notifId ?? null]);
    return { ok: true };
  });
