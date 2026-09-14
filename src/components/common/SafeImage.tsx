import React, { useState, useEffect, useRef } from "react";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  wrapperClassName?: string;
  timeoutMs?: number;
}

export function sanitizeImageUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  // Strip Markdown link format [url](url) if present
  if (trimmed.startsWith("[") && trimmed.includes("](")) {
    const parts = trimmed.split("](");
    if (parts[1]) {
      return parts[1].replace(/\)$/, "").trim();
    }
  }
  const match = trimmed.match(/(https?:\/\/[^\s\)]+|\/assets\/[^\s\)]+)/);
  return match ? match[0] : trimmed;
}

const DEFAULT_FALLBACK = "/assets/defaults/fallback.svg";

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = "RSTA Media Asset",
  className = "",
  wrapperClassName = "",
  fallbackSrc = DEFAULT_FALLBACK,
  timeoutMs = 2500, // 2.5s maximum before falling back to local asset
  ...props
}) => {
  const initialClean = sanitizeImageUrl(src);
  const isLocal = initialClean.startsWith("/") || initialClean.startsWith("data:");

  const [hasError, setHasError] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(!isLocal && Boolean(initialClean));
  const [currentSrc, setCurrentSrc] = useState<string>(initialClean || fallbackSrc);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with src prop changes
  useEffect(() => {
    const clean = sanitizeImageUrl(src);
    if (!clean) {
      setCurrentSrc(fallbackSrc);
      setIsLoading(false);
      return;
    }

    const localAsset = clean.startsWith("/") || clean.startsWith("data:");
    setCurrentSrc(clean);
    setHasError(false);
    setFallbackFailed(false);
    setIsLoading(!localAsset);

    // If it's a remote URL, attach a timeout guard to prevent infinite hanging
    if (clean.startsWith("http://") || clean.startsWith("https://")) {
      timeoutRef.current = setTimeout(() => {
        // Switch to fast fallback if remote is stalling
        setCurrentSrc(fallbackSrc);
        setIsLoading(false);
      }, timeoutMs);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [src, fallbackSrc, timeoutMs]);

  const handleLoad = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsLoading(false);
  };

  const handleError = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!hasError && currentSrc !== fallbackSrc) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
      setIsLoading(false);
    } else {
      setFallbackFailed(true);
      setIsLoading(false);
    }
  };

  // If both primary and fallback failed, render dignified native placeholder (never broken browser image icon)
  if (fallbackFailed) {
    const initials = (alt || "RSTA")
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .join("")
      .substring(0, 3)
      .toUpperCase();

    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-4 text-center select-none ${
          wrapperClassName || ""
        }`}
      >
        <div className="size-14 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-2 shadow-inner">
          <span className="text-base font-black tracking-wider text-amber-400 font-mono">{initials}</span>
        </div>
        <span className="text-xs font-bold text-white tracking-wide truncate max-w-[90%]">{alt}</span>
        <span className="text-[9px] text-emerald-400 font-mono mt-0.5 tracking-wider uppercase">
          RSTA Verified Official
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-900 ${wrapperClassName || ""}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-800/60 animate-pulse flex items-center justify-center z-10">
          <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Loading Media...
          </span>
        </div>
      )}
      <img
        src={currentSrc || fallbackSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        } ${className}`}
        {...props}
      />
    </div>
  );
};

export default SafeImage;
