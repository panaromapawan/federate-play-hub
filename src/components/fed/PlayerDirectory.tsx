import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPlayers, registerPlayer } from "@/lib/federation.functions";
import { useProcedure } from "./useAction";

export function PlayerDirectory({ canRegister }: { canRegister: boolean }) {
  const { data = [], isLoading } = useQuery({ queryKey: ["players"], queryFn: () => getPlayers() });
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const mutation = useProcedure(registerPlayer, ["players"]);

  async function submit() {
    const result = await mutation.mutateAsync({ data: { fullName, dob, gender } } as never);
    if (result.ok) {
      setFullName("");
      setDob("");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="panel p-5">
        <h2 className="text-base font-bold">Player directory</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Grassroots athletes registered inside your jurisdiction.
        </p>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Date of birth</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Loading players…
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No players registered yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{player.full_name ?? "—"}</TableCell>
                    <TableCell>{player.dob ?? "—"}</TableCell>
                    <TableCell className="capitalize">{player.gender ?? "—"}</TableCell>
                    <TableCell>{player.district_name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={player.status === "active" ? "default" : "secondary"}>
                        {player.status ?? "unknown"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {canRegister ? (
        <section className="panel h-fit p-5">
          <h2 className="text-base font-bold">Register a player</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="player-name">Full name</Label>
              <Input
                id="player-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Anita Sharma"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="player-dob">Date of birth</Label>
              <Input
                id="player-dob"
                type="date"
                value={dob}
                onChange={(event) => setDob(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="player-gender">Gender</Label>
              <Select value={gender} onValueChange={(value) => setGender(value as typeof gender)}>
                <SelectTrigger id="player-gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={fullName.trim().length < 2 || dob.length < 4 || mutation.isPending}
              onClick={submit}
            >
              Add to directory
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
