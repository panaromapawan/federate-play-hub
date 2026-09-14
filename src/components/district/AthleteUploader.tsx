import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Image as ImageIcon, CheckCircle2, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { registerAthleteFull } from "@/lib/federation.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SafeImage } from "@/components/common/SafeImage";
import { ImageUploader } from "@/components/common/ImageUploader";

export function AthleteUploader() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "M" as "M" | "F" | "O",
    sportId: 1, // 1: Sepak Takraw, 2: Aatya Paatya
    playingPosition: "Tekong (Server)",
    jerseyNumber: 7,
    heightCm: 180,
    weightKg: 72,
    bio: "",
    photoUrl: "/assets/defaults/fallback.svg",
  });

  const sepakTakrawPositions = [
    "Tekong (Server)",
    "Striker (Killer)",
    "Feeder (Setter)",
    "Reserve Specialist",
  ];

  const aatyaPaatyaPositions = [
    "Lonav Leader",
    "Sur-Pati Guard",
    "Pati Defender",
    "Chaser Specialist",
  ];

  const activePositions = form.sportId === 1 ? sepakTakrawPositions : aatyaPaatyaPositions;

  const registerMutation = useMutation({
    mutationFn: (data: typeof form) =>
      registerAthleteFull({
        data: {
          name: data.name,
          dob: data.dob,
          gender: data.gender,
          sportId: data.sportId,
          playingPosition: data.playingPosition,
          jerseyNumber: data.jerseyNumber ? Number(data.jerseyNumber) : null,
          heightCm: data.heightCm ? Number(data.heightCm) : null,
          weightKg: data.weightKg ? Number(data.weightKg) : null,
          bio: data.bio,
          photoUrl: data.photoUrl,
        },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(res.message);
        queryClient.invalidateQueries({ queryKey: ["players"] });
        // Reset form name and dob
        setForm((prev) => ({
          ...prev,
          name: "",
          dob: "",
          bio: "",
        }));
      } else {
        toast.error(res.message);
      }
    },
    onError: (err: any) => toast.error(err.message || "Registration failed"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.dob) {
      toast.error("Athlete Name and Date of Birth are mandatory.");
      return;
    }
    registerMutation.mutate(form);
  }

  return (
    <Card className="border-slate-800 bg-slate-900/80 shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
          <UserPlus className="size-4" /> District Athlete Intake & Photo Registry
        </div>
        <CardTitle className="text-xl font-black text-white">
          Register Verified District Athlete
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Upload certified player photograph, court role, physical metrics, and bio for State championship eligibility.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Form Fields (8 Cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">Athlete Full Name *</Label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Devendra Singh Rathore"
                    className="bg-slate-950 border-slate-800 text-xs text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">Date of Birth (YYYY-MM-DD) *</Label>
                  <Input
                    required
                    type="date"
                    value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">Gender</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(v: "M" | "F" | "O") => setForm({ ...form, gender: v })}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-xs text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
                      <SelectItem value="M">Male (M)</SelectItem>
                      <SelectItem value="F">Female (F)</SelectItem>
                      <SelectItem value="O">Other (O)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">Sport Discipline</Label>
                  <Select
                    value={String(form.sportId)}
                    onValueChange={(v) => {
                      const sportId = Number(v);
                      setForm({
                        ...form,
                        sportId,
                        playingPosition: sportId === 1 ? "Tekong (Server)" : "Lonav Leader",
                      });
                    }}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-xs text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
                      <SelectItem value="1">Sepak Takraw</SelectItem>
                      <SelectItem value="2">Aatya Paatya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">Court Position</Label>
                  <Select
                    value={form.playingPosition}
                    onValueChange={(v) => setForm({ ...form, playingPosition: v })}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-xs text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
                      {activePositions.map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">Jersey Number</Label>
                  <Input
                    type="number"
                    min="1"
                    max="99"
                    value={form.jerseyNumber}
                    onChange={(e) => setForm({ ...form, jerseyNumber: parseInt(e.target.value) || 0 })}
                    className="bg-slate-950 border-slate-800 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">Height (cm)</Label>
                  <Input
                    type="number"
                    min="120"
                    max="220"
                    value={form.heightCm}
                    onChange={(e) => setForm({ ...form, heightCm: parseInt(e.target.value) || 0 })}
                    className="bg-slate-950 border-slate-800 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">Weight (kg)</Label>
                  <Input
                    type="number"
                    min="35"
                    max="150"
                    value={form.weightKg}
                    onChange={(e) => setForm({ ...form, weightKg: parseInt(e.target.value) || 0 })}
                    className="bg-slate-950 border-slate-800 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <ImageUploader
                label="Athlete Photo (Upload File or URL)"
                value={form.photoUrl}
                onChange={(url) => setForm({ ...form, photoUrl: url })}
                presetCategory="player"
                helperText="Upload athlete photo directly from computer or paste direct link."
              />

              <div className="space-y-2">
                <Label className="text-xs text-slate-300">Scouting Notes & Tactical Bio</Label>
                <Textarea
                  rows={2}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="e.g. High-velocity horse-kick server trained under Jagdish Prajapat..."
                  className="bg-slate-950 border-slate-800 text-xs text-white"
                />
              </div>
            </div>

            {/* Right Column: Live Photo Preview & Badge (4 Cols) */}
            <div className="lg:col-span-4 flex flex-col items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Photo Live Preview</span>
                  <span className="font-mono text-emerald-400">RSTA VERIFIED</span>
                </div>

                <div className="h-56 w-full rounded-lg overflow-hidden border border-slate-800 relative group">
                  <SafeImage
                    src={form.photoUrl}
                    alt={form.name || "Preview"}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-950/90 backdrop-blur px-2.5 py-1.5 rounded border border-slate-800 text-[11px]">
                    <div className="font-bold text-white truncate">
                      {form.name || "Athlete Name"}
                    </div>
                    <div className="text-emerald-400 text-[10px] font-mono">
                      #{form.jerseyNumber || "—"} · {form.playingPosition}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-900/40 text-[11px] text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                  <span>INV-03 Unique District Roster Guard Active</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs gap-2"
              >
                <UserPlus className="size-3.5" /> Submit Verified Athlete
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
