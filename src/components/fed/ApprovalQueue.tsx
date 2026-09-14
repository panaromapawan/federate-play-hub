import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { approveUser, getApprovalQueue, type PendingUser } from "@/lib/federation.functions";
import { ROLE_LABELS } from "./roles";
import { useProcedure } from "./useAction";

type Decision = "approved" | "rejected" | "suspended";

export function ApprovalQueue({ heading }: { heading: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["approval-queue"],
    queryFn: () => getApprovalQueue(),
  });
  const [target, setTarget] = useState<PendingUser | null>(null);
  const [decision, setDecision] = useState<Decision>("approved");
  const [reason, setReason] = useState("");

  const mutation = useProcedure(approveUser, ["approval-queue"]);

  function open(user: PendingUser, next: Decision) {
    setTarget(user);
    setDecision(next);
    setReason("");
  }

  async function submit() {
    if (!target) return;
    const result = await mutation.mutateAsync({
      data: { targetUserId: target.id, newStatus: decision, reason: reason.trim() },
    } as never);
    if (result.ok) setTarget(null);
  }

  return (
    <section className="panel p-5">
      <h2 className="text-base font-bold">{heading}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Every decision is written through <code>sp_approve_user</code> with a mandatory reason.
      </p>

      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Jurisdiction</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Loading membership requests…
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No membership requests in your scope.
                </TableCell>
              </TableRow>
            ) : (
              data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <span className="font-medium">{user.full_name ?? "—"}</span>
                    <span className="block text-xs text-muted-foreground">{user.email}</span>
                  </TableCell>
                  <TableCell>{ROLE_LABELS[user.role_id] ?? user.role_id}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {[user.state_name, user.district_name].filter(Boolean).join(" / ") || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.status === "approved"
                          ? "default"
                          : user.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button size="sm" onClick={() => open(user, "approved")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => open(user, "rejected")}>
                      Reject
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => open(user, "suspended")}>
                      Suspend
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={target !== null} onOpenChange={(next) => !next && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{decision} membership</DialogTitle>
            <DialogDescription>
              {target?.full_name ?? target?.email} — a written reason is recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="approval-reason">Reason</Label>
            <Textarea
              id="approval-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Documents verified against state affiliation records."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button disabled={reason.trim().length < 3 || mutation.isPending} onClick={submit}>
              Confirm {decision}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
