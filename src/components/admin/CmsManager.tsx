import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Image as ImageIcon,
  Save,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  UserCheck,
  Shield,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

import {
  getSiteSettings,
  updateSiteSettings,
  getLeadershipMembers,
  saveLeadershipMember,
  deleteLeadershipMember,
  type SiteSettings,
  type LeadershipMember,
} from "@/lib/federation.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SafeImage } from "@/components/common/SafeImage";
import { ImageUploader } from "@/components/common/ImageUploader";

export function CmsManager() {
  const queryClient = useQueryClient();

  // 1. Site Settings Query
  const { data: settings, isLoading: settingsLoading } = useQuery<SiteSettings | null>({
    queryKey: ["siteSettings"],
    queryFn: () => getSiteSettings(),
  });

  // 2. Leadership Members Query
  const { data: leadership = [], isLoading: leadershipLoading } = useQuery<LeadershipMember[]>({
    queryKey: ["leadershipMembers"],
    queryFn: () => getLeadershipMembers(),
  });

  // Site Settings Form State
  const [formSettings, setFormSettings] = useState({
    orgName: "",
    orgShortName: "",
    tagline: "",
    heroBadge: "",
    heroTitle: "",
    heroSubtitle: "",
    heroBgImage: "",
    heroCtaPrimaryText: "Official Federation Login",
    heroCtaPrimaryUrl: "/auth",
  });

  useEffect(() => {
    if (settings) {
      setFormSettings({
        orgName: settings.org_name || "Rajasthan Sepak Takraw Association",
        orgShortName: settings.org_short_name || "RSTA",
        tagline: settings.tagline || "",
        heroBadge: settings.hero_badge || "",
        heroTitle: settings.hero_title || "",
        heroSubtitle: settings.hero_subtitle || "",
        heroBgImage: settings.hero_bg_image || "",
        heroCtaPrimaryText: settings.hero_cta_primary_text || "Official Federation Login",
        heroCtaPrimaryUrl: settings.hero_cta_primary_url || "/auth",
      });
    }
  }, [settings]);

  // Settings Mutation
  const saveSettingsMutation = useMutation({
    mutationFn: (data: typeof formSettings) => updateSiteSettings({ data }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(res.message);
        queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
        queryClient.invalidateQueries({ queryKey: ["publicPortal"] });
      } else {
        toast.error(res.message);
      }
    },
    onError: (err: any) => toast.error(err.message || "Failed to update settings"),
  });

  // Leadership Modal State
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<{
    id?: number;
    name: string;
    designation: string;
    category: "patron" | "executive" | "coaching" | "technical" | "selector";
    photoUrl: string;
    bio: string;
    displayOrder: number;
  }>({
    name: "",
    designation: "",
    category: "executive",
    photoUrl: "",
    bio: "",
    displayOrder: 0,
  });

  // Leadership Mutations
  const saveLeadMutation = useMutation({
    mutationFn: (data: typeof currentLead) => saveLeadershipMember({ data }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(res.message);
        queryClient.invalidateQueries({ queryKey: ["leadershipMembers"] });
        queryClient.invalidateQueries({ queryKey: ["publicPortal"] });
        setLeadModalOpen(false);
      } else {
        toast.error(res.message);
      }
    },
    onError: (err: any) => {
      console.error("Failed to save leadership profile:", err);
      toast.error(err.message || "Failed to save leadership profile");
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: (id: number) => deleteLeadershipMember({ data: { id } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(res.message);
        queryClient.invalidateQueries({ queryKey: ["leadershipMembers"] });
        queryClient.invalidateQueries({ queryKey: ["publicPortal"] });
      } else {
        toast.error(res.message);
      }
    },
    onError: (err: any) => {
      console.error("Failed to delete leadership member:", err);
      toast.error(err.message || "Failed to delete leadership member");
    },
  });

  return (
    <div className="space-y-10">
      {/* 1. HERO & BRANDING SECTION */}
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Building2 className="size-5 text-emerald-400" />
            Federation Branding & Hero Stage Content
          </CardTitle>
          <CardDescription>
            Configure public portal hero banner, slogans, accreditation badges, and background imagery in real time.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Organization Name</Label>
              <Input
                value={formSettings.orgName}
                onChange={(e) => setFormSettings({ ...formSettings, orgName: e.target.value })}
                placeholder="Rajasthan Sepak Takraw Association"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Acronym / Short Code</Label>
              <Input
                value={formSettings.orgShortName}
                onChange={(e) => setFormSettings({ ...formSettings, orgShortName: e.target.value })}
                placeholder="RSTA"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Statutory Tagline</Label>
            <Input
              value={formSettings.tagline}
              onChange={(e) => setFormSettings({ ...formSettings, tagline: e.target.value })}
              placeholder="Apex State Governing Body for Sepak Takraw & Aatya Paatya in Rajasthan"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Hero Badge Text</Label>
              <Input
                value={formSettings.heroBadge}
                onChange={(e) => setFormSettings({ ...formSettings, heroBadge: e.target.value })}
                placeholder="Affiliated with Sepaktakraw Federation of India (STFI) & RSSC"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Hero Main Title</Label>
              <Input
                value={formSettings.heroTitle}
                onChange={(e) => setFormSettings({ ...formSettings, heroTitle: e.target.value })}
                placeholder="Rajasthan Sepak Takraw Association"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Hero Subtitle / Description</Label>
            <Textarea
              rows={3}
              value={formSettings.heroSubtitle}
              onChange={(e) => setFormSettings({ ...formSettings, heroSubtitle: e.target.value })}
              placeholder="Presided over by Shri T. K. Singh (NIS)..."
            />
          </div>

          <ImageUploader
            label="Hero Stadium Background Photo / Graphic"
            value={formSettings.heroBgImage}
            onChange={(url) => setFormSettings({ ...formSettings, heroBgImage: url })}
            presetCategory="hero"
            helperText="Upload a high-resolution stadium graphic from your computer, choose an official preset, or paste a link."
          />

          <Button
            onClick={() => saveSettingsMutation.mutate(formSettings)}
            disabled={saveSettingsMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold gap-2 text-xs"
          >
            <Save className="size-4" /> Save Federation Settings
          </Button>
        </CardContent>
      </Card>

      {/* 2. LEADERSHIP COUNCIL MANAGEMENT */}
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <UserCheck className="size-5 text-amber-400" />
              Leadership & Executive Council Registry
            </CardTitle>
            <CardDescription>
              Manage verified profiles for President (Shri T. K. Singh), Head Coach (Jagdish Prajapat), Secretary General, and Technical Board.
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setCurrentLead({
                name: "",
                designation: "",
                category: "executive",
                photoUrl: "",
                bio: "",
                displayOrder: leadership.length + 1,
              });
              setLeadModalOpen(true);
            }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5"
          >
            <Plus className="size-3.5" /> Add Leadership Member
          </Button>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {leadership.map((member) => (
              <div
                key={member.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between group hover:border-emerald-600/50 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="h-44 rounded-lg overflow-hidden border border-slate-800">
                    <SafeImage
                      src={member.photo_url}
                      alt={member.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-white">{member.name}</h4>
                      <Badge className="text-[9px] uppercase font-mono bg-slate-900 text-amber-300">
                        {member.category}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-emerald-400">{member.designation}</p>
                    {member.bio && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {member.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">Order: #{member.display_order}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-7 p-0 text-slate-400 hover:text-white"
                      onClick={() => {
                        setCurrentLead({
                          id: member.id,
                          name: member.name,
                          designation: member.designation,
                          category: member.category,
                          photoUrl: member.photo_url,
                          bio: member.bio || "",
                          displayOrder: member.display_order,
                        });
                        setLeadModalOpen(true);
                      }}
                    >
                      <Edit2 className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-7 p-0 text-slate-400 hover:text-rose-400"
                      onClick={() => {
                        if (confirm(`Remove ${member.name} from leadership registry?`)) {
                          deleteLeadMutation.mutate(member.id);
                        }
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leadership Edit / Create Dialog */}
      <Dialog open={leadModalOpen} onOpenChange={setLeadModalOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentLead.id ? "Edit Leadership Profile" : "Add Leadership Profile"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Full Name</Label>
              <Input
                value={currentLead.name}
                onChange={(e) => setCurrentLead({ ...currentLead, name: e.target.value })}
                placeholder="e.g. Shri T. K. Singh"
                className="bg-slate-900 border-slate-800 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Official Designation</Label>
              <Input
                value={currentLead.designation}
                onChange={(e) => setCurrentLead({ ...currentLead, designation: e.target.value })}
                placeholder="President, RSTA"
                className="bg-slate-900 border-slate-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Category</Label>
                <Select
                  value={currentLead.category}
                  onValueChange={(v: any) => setCurrentLead({ ...currentLead, category: v })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-800 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
                    <SelectItem value="executive">Executive Board</SelectItem>
                    <SelectItem value="coaching">Head Coaching</SelectItem>
                    <SelectItem value="technical">Technical Board</SelectItem>
                    <SelectItem value="selector">Chief Selector</SelectItem>
                    <SelectItem value="patron">Patron-in-Chief</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Display Order</Label>
                <Input
                  type="number"
                  value={currentLead.displayOrder}
                  onChange={(e) => setCurrentLead({ ...currentLead, displayOrder: parseInt(e.target.value) || 0 })}
                  className="bg-slate-900 border-slate-800 text-xs"
                />
              </div>
            </div>

            <ImageUploader
              label="Portrait Photo (Upload File / Google Drive / URL)"
              value={currentLead.photoUrl}
              onChange={(url) => setCurrentLead({ ...currentLead, photoUrl: url })}
              presetCategory="leadership"
              helperText="Upload an image directly from your PC (JPG, PNG, WEBP) or paste any image/Google Drive link."
            />

            <div className="space-y-2">
              <Label className="text-xs">Executive Biography / Portfolio</Label>
              <Textarea
                rows={3}
                value={currentLead.bio}
                onChange={(e) => setCurrentLead({ ...currentLead, bio: e.target.value })}
                placeholder="NIS-qualified expert and STFI National Committee Member..."
                className="bg-slate-900 border-slate-800 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setLeadModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold"
              disabled={saveLeadMutation.isPending || !currentLead.name || !currentLead.photoUrl}
              onClick={() => saveLeadMutation.mutate(currentLead)}
            >
              {saveLeadMutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
