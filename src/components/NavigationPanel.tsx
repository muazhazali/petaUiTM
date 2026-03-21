"use client";

import { useState, useEffect, useRef } from "react";
import Fuse from "fuse.js";
import { Building } from "@/types";
import { RouteInfo } from "@/app/[campus]/CampusMap";
import { ArrowUpDown, Navigation2, X, MapPin, Flag, Clock, Ruler, Share2, ChevronDown, ChevronUp, CornerDownRight, Search } from "lucide-react";

interface NavigationPanelProps {
  buildings: Building[];
  from: Building | null;
  to: Building | null;
  isLoading: boolean;
  routeInfo: RouteInfo | null;
  onSwap: () => void;
  onSetFrom: (b: Building) => void;
  onSetTo: (b: Building) => void;
  onClearFrom: () => void;
  onClearTo: () => void;
  onClose: () => void;
}

interface FuseResult {
  building: Building;
  displayName: string;
  subtitle: string;
}

const GREEN = "oklch(0.32 0.09 155)";

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

function formatManeuver(type: string): string {
  const map: Record<string, string> = {
    "turn": "Turn",
    "depart": "Start",
    "arrive": "Arrive",
    "merge": "Merge",
    "on ramp": "Take ramp",
    "off ramp": "Exit ramp",
    "fork": "Keep",
    "end of road": "Turn at end",
    "continue": "Continue",
    "roundabout": "Enter roundabout",
    "rotary": "Enter rotary",
    "roundabout turn": "Turn in roundabout",
    "notification": "Note",
    "new name": "Continue",
  };
  return map[type] ?? "Continue";
}

function WaypointInput({
  value,
  placeholder,
  icon,
  accentColor,
  accentBg,
  buildings,
  onSelect,
  onClear,
}: {
  value: Building | null;
  placeholder: string;
  icon: React.ReactNode;
  accentColor: string;
  accentBg: string;
  buildings: Building[];
  onSelect: (b: Building) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<FuseResult[]>([]);
  const fuseRef = useRef<Fuse<FuseResult> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const items: FuseResult[] = buildings.map((b) => ({
      building: b,
      displayName: b.name,
      subtitle: b.shortName,
    }));
    fuseRef.current = new Fuse(items, {
      keys: ["displayName", "subtitle"],
      threshold: 0.4,
    });
  }, [buildings]);

  // Reset query when external value is set (deferred to avoid sync state call)
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      if (value) {
        setTimeout(() => setQuery(""), 0);
      }
    }
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleChange(v: string) {
    setQuery(v);
    setOpen(true);
    if (!v.trim() || !fuseRef.current) {
      setResults([]);
    } else {
      setResults(fuseRef.current.search(v).slice(0, 6).map((r) => r.item));
    }
  }

  function handleSelect(b: Building) {
    onSelect(b);
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.blur();
  }

  if (value) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
        style={{ background: accentBg, borderColor: `${accentColor} / 0.2` }}
      >
        <span className="flex-shrink-0" style={{ color: accentColor }}>{icon}</span>
        <span className="flex-1 text-sm font-medium truncate text-stone-900">{value.name}</span>
        <button
          onClick={onClear}
          className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Clear"
        >
          <X className="h-3 w-3 text-stone-500" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-stone-200 bg-stone-50 focus-within:border-stone-300 focus-within:bg-white transition-colors">
        <Search className="h-3.5 w-3.5 flex-shrink-0 text-stone-300" aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-stone-400 text-stone-900 min-w-0"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); }} className="flex-shrink-0" aria-label="Clear">
            <X className="h-3 w-3 text-stone-400" aria-hidden="true" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute top-full mt-1.5 left-0 right-0 rounded-xl overflow-hidden z-[60]"
          style={{
            background: "rgba(255,255,255,0.97)",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 12px 32px rgba(13,43,26,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div className="max-h-48 overflow-y-auto divide-y divide-stone-50">
            {results.map((r, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-stone-50/80"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(r.building); }}
              >
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color: GREEN }} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-900 truncate">{r.displayName}</p>
                  <p className="text-[10px] text-stone-400">{r.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NavigationPanel({
  buildings,
  from,
  to,
  isLoading,
  routeInfo,
  onSwap,
  onSetFrom,
  onSetTo,
  onClearFrom,
  onClearTo,
  onClose,
}: NavigationPanelProps) {
  const bothSet = from && to;
  const [stepsOpen, setStepsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="w-full rounded-2xl overflow-visible"
      role="region"
      aria-label="Directions panel"
      style={{
        background: "rgba(255,255,255,0.97)",
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 4px 24px rgba(13,43,26,0.1), 0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2.5 border-b border-stone-100">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: GREEN }}
        >
          <Navigation2 className="h-3.5 w-3.5 text-white" aria-hidden="true" />
        </div>
        <span className="text-sm font-semibold text-stone-900 flex-1 tracking-tight">Directions</span>
        {bothSet && routeInfo && (
          <button
            onClick={handleShare}
            aria-label="Copy route link"
            title="Copy link to this route"
            className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-stone-100 active:bg-stone-200 transition-colors"
          >
            {copied ? (
              <span className="text-[10px] font-semibold" style={{ color: GREEN }}>Copied!</span>
            ) : (
              <Share2 className="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />
            )}
          </button>
        )}
        <button
          onClick={onClose}
          aria-label="Close directions"
          className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-stone-100 active:bg-stone-200 transition-colors"
        >
          <X className="h-4 w-4 text-stone-400" aria-hidden="true" />
        </button>
      </div>

      {/* Waypoints */}
      <div className="flex items-stretch gap-0 px-3 py-2.5">
        {/* Dot + line indicator */}
        <div className="flex flex-col items-center w-8 pt-3.5 pb-3.5 gap-0 flex-shrink-0" aria-hidden="true">
          <div className="w-2.5 h-2.5 rounded-full ring-2 ring-emerald-100 flex-shrink-0 bg-emerald-400" />
          <div className="flex-1 w-px my-1 min-h-[16px]" style={{ background: "linear-gradient(to bottom, #34d399, #f87171)" }} />
          <div className="w-2.5 h-2.5 rounded-full ring-2 ring-red-100 flex-shrink-0 bg-red-400" />
        </div>

        {/* Input rows */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <WaypointInput
            value={from}
            placeholder="Choose start point…"
            icon={<MapPin className="h-3.5 w-3.5" />}
            accentColor="#059669"
            accentBg="rgba(209,250,229,0.5)"
            buildings={buildings}
            onSelect={onSetFrom}
            onClear={onClearFrom}
          />
          <WaypointInput
            value={to}
            placeholder="Choose destination…"
            icon={<Flag className="h-3.5 w-3.5" />}
            accentColor="#dc2626"
            accentBg="rgba(254,226,226,0.5)"
            buildings={buildings}
            onSelect={onSetTo}
            onClear={onClearTo}
          />
        </div>

        {/* Swap button */}
        <div className="flex flex-col items-center justify-center w-9 gap-0 flex-shrink-0">
          <button
            onClick={onSwap}
            disabled={!from && !to}
            aria-label="Swap start and destination"
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-stone-200 shadow-sm hover:border-stone-300 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Status / route summary */}
      <div className="px-4 pb-3 flex flex-col gap-2">
        {isLoading ? (
          <div
            className="flex items-center gap-2.5 py-2 px-3 rounded-xl"
            style={{ background: "oklch(0.32 0.09 155 / 0.06)", border: "1px solid oklch(0.32 0.09 155 / 0.12)" }}
          >
            <div className="flex gap-1" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0ms]" style={{ background: GREEN }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:150ms]" style={{ background: GREEN }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:300ms]" style={{ background: GREEN }} />
            </div>
            <span className="text-xs font-medium" style={{ color: GREEN }} aria-live="polite">Finding best route…</span>
          </div>
        ) : bothSet && routeInfo ? (
          <>
            {/* Distance + time */}
            <div
              className="flex items-center gap-3 py-2 px-3 rounded-xl"
              style={{
                background: "oklch(0.32 0.09 155 / 0.06)",
                border: "1px solid oklch(0.32 0.09 155 / 0.1)",
              }}
            >
              <div className="flex items-center gap-1.5" style={{ color: GREEN }}>
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-xs font-semibold">{formatDuration(routeInfo.duration)}</span>
              </div>
              <div className="w-px h-3.5 bg-stone-200" />
              <div className="flex items-center gap-1.5" style={{ color: GREEN }}>
                <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-xs font-semibold">{formatDistance(routeInfo.distance)}</span>
              </div>
              <span className="text-xs text-stone-400 ml-auto">Walking</span>
            </div>

            {/* Steps toggle */}
            {routeInfo.steps.length > 0 && (
              <button
                onClick={() => setStepsOpen((v) => !v)}
                className="flex items-center gap-2 text-xs font-medium transition-colors px-1"
                style={{ color: GREEN }}
              >
                <CornerDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                {stepsOpen ? "Hide" : "Show"} turn-by-turn
                {stepsOpen ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
              </button>
            )}

            {stepsOpen && (
              <ol className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1 scrollbar-hide">
                {routeInfo.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 py-1.5 px-2 rounded-lg even:bg-stone-50">
                    <span
                      className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 text-white"
                      style={{ background: GREEN }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-stone-800">
                        {formatManeuver(step.maneuver)}
                        {step.name ? <span className="text-stone-500"> onto <span className="text-stone-700">{step.name}</span></span> : null}
                      </span>
                      <span className="block text-[10px] text-stone-400 mt-0.5">{formatDistance(step.distance)}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </>
        ) : (
          <p className="text-xs text-stone-400 py-1 px-1">
            {!from
              ? "Search for a start point above."
              : !to
              ? "Now search for your destination."
              : "Calculating route…"}
          </p>
        )}
      </div>
    </div>
  );
}
