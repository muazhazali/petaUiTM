"use client";

import { useState, useEffect, useRef } from "react";
import Fuse from "fuse.js";
import { Building, Room } from "@/types";
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
  colorClass,
  bgClass,
  borderClass,
  buildings,
  onSelect,
  onClear,
}: {
  value: Building | null;
  placeholder: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
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

  // sync query with selected value
  useEffect(() => {
    if (value) setQuery("");
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

  // If a building is selected, show pill; otherwise show input
  if (value) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${bgClass} ${borderClass}`}>
        <span className={`flex-shrink-0 ${colorClass}`}>{icon}</span>
        <span className={`flex-1 text-sm font-medium truncate text-gray-900`}>{value.name}</span>
        <button
          onClick={onClear}
          className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full hover:bg-black/10 transition-colors"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed bg-gray-50 border-gray-200 focus-within:border-indigo-300 focus-within:bg-white transition-colors`}>
        <Search className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400 text-gray-900 min-w-0"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); }} className="flex-shrink-0">
            <X className="h-3 w-3 text-gray-400" aria-hidden="true" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-[60] overflow-hidden">
          <div className="max-h-48 overflow-y-auto divide-y divide-gray-100/60">
            {results.map((r, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-indigo-50 text-left transition-colors"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(r.building); }}
              >
                <MapPin className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{r.displayName}</p>
                  <p className="text-[10px] text-gray-400">{r.subtitle}</p>
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
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg w-full overflow-visible" role="region" aria-label="Directions panel">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
        <Navigation2 className="h-4 w-4 text-indigo-600 flex-shrink-0" aria-hidden="true" />
        <span className="text-sm font-bold text-gray-900 flex-1 tracking-tight">Directions</span>
        {bothSet && routeInfo && (
          <button
            onClick={handleShare}
            aria-label="Copy route link"
            title="Copy link to this route"
            className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-500"
          >
            {copied ? (
              <span className="text-[10px] font-semibold text-emerald-600">Copied!</span>
            ) : (
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        )}
        <button
          onClick={onClose}
          aria-label="Close directions"
          className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" aria-hidden="true" />
        </button>
      </div>

      {/* Waypoints */}
      <div className="flex items-stretch gap-0 px-3 pb-2">
        {/* Dot + line indicator */}
        <div className="flex flex-col items-center w-8 pt-3.5 pb-3.5 gap-0 flex-shrink-0" aria-hidden="true">
          <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-100 flex-shrink-0" />
          <div className="flex-1 w-0.5 bg-gradient-to-b from-emerald-300 to-red-300 my-1 min-h-[16px]" />
          <div className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-100 flex-shrink-0" />
        </div>

        {/* Input rows */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <WaypointInput
            value={from}
            placeholder="Choose start point…"
            icon={<MapPin className="h-3.5 w-3.5" />}
            colorClass="text-emerald-600"
            bgClass="bg-emerald-50"
            borderClass="border-emerald-200"
            buildings={buildings}
            onSelect={onSetFrom}
            onClear={onClearFrom}
          />
          <WaypointInput
            value={to}
            placeholder="Choose destination…"
            icon={<Flag className="h-3.5 w-3.5" />}
            colorClass="text-rose-600"
            bgClass="bg-rose-50"
            borderClass="border-rose-200"
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
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-indigo-50 hover:border-indigo-300 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ArrowUpDown className="h-4 w-4 text-gray-500" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Status / route summary */}
      <div className="px-4 pb-3 flex flex-col gap-2">
        {isLoading ? (
          <div className="flex items-center gap-2.5 py-2 px-3 rounded-xl bg-indigo-50 border border-indigo-100">
            <div className="flex gap-1" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-xs font-medium text-indigo-700" aria-live="polite">Finding best route…</span>
          </div>
        ) : bothSet && routeInfo ? (
          <>
            {/* Distance + time */}
            <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-xs font-semibold">{formatDuration(routeInfo.duration)}</span>
              </div>
              <div className="w-px h-3.5 bg-emerald-200" />
              <div className="flex items-center gap-1.5 text-emerald-700">
                <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-xs font-semibold">{formatDistance(routeInfo.distance)}</span>
              </div>
              <span className="text-xs text-emerald-600 ml-auto">Walking</span>
            </div>

            {/* Steps toggle */}
            {routeInfo.steps.length > 0 && (
              <button
                onClick={() => setStepsOpen((v) => !v)}
                className="flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors px-1"
              >
                <CornerDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                {stepsOpen ? "Hide" : "Show"} turn-by-turn directions
                {stepsOpen ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
              </button>
            )}

            {stepsOpen && (
              <ol className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                {routeInfo.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 py-1.5 px-2 rounded-lg even:bg-gray-50">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-gray-800">
                        {formatManeuver(step.maneuver)}
                        {step.name ? <span className="text-gray-500"> onto <span className="text-gray-700">{step.name}</span></span> : null}
                      </span>
                      <span className="block text-[10px] text-gray-400 mt-0.5">{formatDistance(step.distance)}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-400 py-1 px-1">
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
