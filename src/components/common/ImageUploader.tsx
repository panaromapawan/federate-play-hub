import React, { useState, useRef } from "react";
import { Upload, Link as LinkIcon, Check, X, Image as ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/common/SafeImage";

interface ImageUploaderProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  presetCategory?: "leadership" | "hero" | "news" | "player";
  helperText?: string;
}

// Convert Google Drive share links to direct renderable image URLs
export function convertGoogleDriveUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();

  // drive.google.com/file/d/{id}/...
  const matchFile = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile && matchFile[1]) {
    return `https://lh3.googleusercontent.com/d/${matchFile[1]}`;
  }

  // drive.google.com/open?id={id} or uc?id={id}
  const matchId = trimmed.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) {
    return `https://lh3.googleusercontent.com/d/${matchId[1]}`;
  }

  return trimmed;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label = "Upload or Select Photo",
  value,
  onChange,
  presetCategory,
  helperText,
}) => {
  const [activeTab, setActiveTab] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState(value || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Quick preset catalog
  const presets: Record<string, Array<{ name: string; url: string }>> = {
    leadership: [
      { name: "Shri T. K. Singh (Official)", url: "/assets/leadership/tk-singh.webp" },
      { name: "Jagdish Prajapat", url: "/assets/leadership/jagdish-prajapat.jpg" },
      { name: "Dr. Mahendra Sharma", url: "/assets/leadership/mahendra-sharma.jpg" },
      { name: "Col. B.S. Shekhawat", url: "/assets/leadership/bs-shekhawat.jpg" },
    ],
    hero: [
      { name: "SMS Stadium Arena", url: "/assets/hero/stadium-arena.jpg" },
      { name: "Official Fallback", url: "/assets/defaults/fallback.svg" },
    ],
    news: [
      { name: "National Gold Medal", url: "/assets/news/gold-medal.jpg" },
      { name: "Aatya Paatya Circuit", url: "/assets/news/aatya-paatya.jpg" },
      { name: "ISTAF Certification", url: "/assets/news/istaf-referee.jpg" },
    ],
    player: [
      { name: "Tekong Server", url: "/assets/players/devendra-rathore.svg" },
      { name: "Striker Killer", url: "/assets/players/vikramaditya-shekhawat.svg" },
      { name: "Feeder Setter", url: "/assets/players/pratik-patel.svg" },
      { name: "Aatya Paatya Leader", url: "/assets/players/kuldeep-bishnoi.svg" },
    ],
  };

  // Convert File to optimized Canvas Data URL
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WEBP, SVG).");
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        setIsProcessing(false);
        return;
      }

      // If SVG or small image under 300KB, use directly
      if (file.type.includes("svg") || file.size < 300 * 1024) {
        onChange(result);
        setUrlInput(result);
        setIsProcessing(false);
        return;
      }

      // Resize and compress large images via canvas
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/webp", 0.85);
          onChange(compressed);
          setUrlInput(compressed);
        } else {
          onChange(result);
          setUrlInput(result);
        }
        setIsProcessing(false);
      };

      img.onerror = () => {
        onChange(result);
        setUrlInput(result);
        setIsProcessing(false);
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleUrlSubmit = () => {
    const converted = convertGoogleDriveUrl(urlInput);
    onChange(converted);
  };

  const getSourceBadge = () => {
    if (!value) return null;
    if (value.startsWith("data:")) return <Badge className="bg-emerald-600 text-slate-950 font-bold text-[10px]">Local Upload</Badge>;
    if (value.includes("googleusercontent.com")) return <Badge className="bg-blue-600 text-white font-bold text-[10px]">Google Drive Direct</Badge>;
    if (value.startsWith("/assets/")) return <Badge className="bg-amber-600 text-slate-950 font-bold text-[10px]">RSTA Verified Asset</Badge>;
    return <Badge className="bg-purple-600 text-white font-bold text-[10px]">External URL</Badge>;
  };

  return (
    <div className="space-y-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">{label}</label>
        {getSourceBadge()}
      </div>

      {/* Mode Switcher */}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={activeTab === "file" ? "default" : "outline"}
          onClick={() => setActiveTab("file")}
          className={`text-xs gap-1.5 h-8 font-semibold ${
            activeTab === "file" ? "bg-emerald-600 text-slate-950 hover:bg-emerald-500 font-bold" : "border-slate-700 text-slate-300"
          }`}
        >
          <Upload className="size-3.5" /> Upload File from PC
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === "url" ? "default" : "outline"}
          onClick={() => setActiveTab("url")}
          className={`text-xs gap-1.5 h-8 font-semibold ${
            activeTab === "url" ? "bg-emerald-600 text-slate-950 hover:bg-emerald-500 font-bold" : "border-slate-700 text-slate-300"
          }`}
        >
          <LinkIcon className="size-3.5" /> Direct URL / Google Drive
        </Button>
      </div>

      {/* Tab 1: File Upload */}
      {activeTab === "file" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? "border-emerald-500 bg-emerald-950/30 scale-[1.01]"
              : "border-slate-700/80 bg-slate-950/60 hover:border-emerald-500/60 hover:bg-slate-900"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center gap-2">
            <div className="size-10 rounded-full bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shadow-sm">
              <Upload className="size-5 animate-pulse" />
            </div>
            <p className="text-xs font-bold text-slate-200">
              {isProcessing ? "Processing & Optimizing Image..." : "Click or Drag & Drop photo here"}
            </p>
            <p className="text-[10px] text-slate-400">
              Supports WEBP, JPG, PNG, SVG • Auto-compressed for instantaneous 0ms loading
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: URL Input with Google Drive converter */}
      {activeTab === "url" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                const converted = convertGoogleDriveUrl(e.target.value);
                onChange(converted);
              }}
              placeholder="Paste image link or Google Drive share link..."
              className="bg-slate-950 border-slate-700 text-xs text-white"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleUrlSubmit}
              className="bg-emerald-600 text-slate-950 hover:bg-emerald-500 font-bold text-xs shrink-0"
            >
              Apply
            </Button>
          </div>
          <p className="text-[10px] text-slate-400">
            Paste direct links or Google Drive links (e.g. <code>drive.google.com/file/d/...</code>) — automatically transformed to live image streams.
          </p>
        </div>
      )}

      {/* Quick Presets if category provided */}
      {presetCategory && presets[presetCategory] && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Sparkles className="size-3 text-amber-400" /> One-Click Official Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presets[presetCategory].map((p) => (
              <Button
                key={p.url}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange(p.url);
                  setUrlInput(p.url);
                }}
                className={`text-[10px] h-6 px-2 border-slate-800 hover:border-emerald-600 hover:text-emerald-300 ${
                  value === p.url ? "border-emerald-500 bg-emerald-950 text-emerald-300 font-bold" : "text-slate-400"
                }`}
              >
                {p.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Live Preview Panel */}
      {value && (
        <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
          <div className="size-16 rounded-lg overflow-hidden border-2 border-emerald-500/40 bg-slate-950 relative shadow-md shrink-0">
            <SafeImage src={value} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">Active Preview</p>
            <p className="text-[10px] text-slate-400 font-mono truncate">{value.substring(0, 50)}...</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange("");
              setUrlInput("");
            }}
            className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 h-7 px-2"
          >
            <X className="size-3.5 mr-1" /> Clear
          </Button>
        </div>
      )}

      {helperText && <p className="text-[10px] text-slate-400 italic">{helperText}</p>}
    </div>
  );
};

export default ImageUploader;
