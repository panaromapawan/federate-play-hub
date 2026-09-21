import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Download, FileText, Filter, ShieldCheck, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getGovernanceDocuments,
  incrementDocumentDownload,
  type GovernanceDocument,
} from "@/lib/governance.functions";

export function DocumentCenter() {
  const [category, setCategory] = useState<string>("all");

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["governance-documents", category],
    queryFn: () => getGovernanceDocuments({ data: { category: category === "all" ? undefined : category } }),
  });

  const downloadMutation = useMutation({
    mutationFn: (documentId: number) => incrementDocumentDownload({ data: { documentId } }),
  });

  const handleDownload = (doc: GovernanceDocument) => {
    downloadMutation.mutate(doc.id);
    window.open(doc.file_url, "_blank", "noopener,noreferrer");
  };

  const getCategoryBadge = (cat: GovernanceDocument["category"]) => {
    switch (cat) {
      case "rulebook":
        return <Badge className="bg-primary/20 text-primary uppercase text-[10px] font-mono">Rulebook</Badge>;
      case "circular":
        return <Badge variant="secondary" className="uppercase text-[10px] font-mono">Circular</Badge>;
      case "form":
        return <Badge variant="outline" className="uppercase text-[10px] font-mono">Form</Badge>;
      case "policy":
        return <Badge className="bg-amber-500/20 text-amber-600 uppercase text-[10px] font-mono">Policy</Badge>;
      case "result":
        return <Badge className="bg-emerald-500/20 text-emerald-600 uppercase text-[10px] font-mono">Result</Badge>;
      default:
        return <Badge variant="outline">{cat}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold tracking-tight text-foreground">
            Governance & Document Repository
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Official federation circulars, rulebooks, sanctioned tournament guidelines, and policy forms
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9 w-40 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="rulebook">Rulebooks</SelectItem>
              <SelectItem value="circular">Circulars</SelectItem>
              <SelectItem value="policy">Policies</SelectItem>
              <SelectItem value="form">Official Forms</SelectItem>
              <SelectItem value="result">Official Results</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse h-40 bg-card/60 border-border" />
          ))
        ) : documents.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-border py-12 text-center text-xs text-muted-foreground">
            No governance documents published in this category yet.
          </div>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} className="border-border bg-card flex flex-col justify-between hover:border-primary/40 transition-colors shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <FileText className="size-5" />
                  </div>
                  {getCategoryBadge(doc.category)}
                </div>
                <CardTitle className="font-serif text-base mt-2 line-clamp-2">
                  {doc.title}
                </CardTitle>
                {doc.description && (
                  <CardDescription className="text-xs line-clamp-2">
                    {doc.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-3">
                  <span>{doc.version ? `v${doc.version}` : "v1.0"}</span>
                  <span>{doc.download_count} downloads</span>
                </div>

                {doc.checksum_sha && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono truncate" title={`SHA-256: ${doc.checksum_sha}`}>
                    <ShieldCheck className="size-3 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">{doc.checksum_sha.slice(0, 16)}...</span>
                  </div>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs gap-1.5 font-semibold h-8"
                  onClick={() => handleDownload(doc)}
                >
                  <Download className="size-3.5" /> Download Document
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
