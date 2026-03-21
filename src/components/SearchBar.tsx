"use client";

import { useState, useEffect, useRef } from "react";
import Fuse from "fuse.js";
import { Building, Room } from "@/types";
import { Search, X, MapPin, DoorOpen } from "lucide-react";

interface SearchBarProps {
  buildings: Building[];
  onSelectBuilding: (building: Building) => void;
}

interface FuseResult {
  type: "building" | "room";
  building: Building;
  room?: Room;
  displayName: string;
  subtitle: string;
}

export default function SearchBar({ buildings, onSelectBuilding }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FuseResult[]>([]);
  const [open, setOpen] = useState(false);
  const listboxId = "search-listbox";
  const fuseRef = useRef<Fuse<FuseResult> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const items: FuseResult[] = buildings.map((b) => ({
      type: "building",
      building: b,
      displayName: b.name,
      subtitle: b.shortName,
    }));

    Promise.all(
      buildings.map((b) =>
        fetch(`/data/rooms/${b.id}.json`)
          .then((r) => (r.ok ? r.json() : []))
          .then((rooms: Room[]) =>
            rooms.map((room) => ({
              type: "room" as const,
              building: b,
              room,
              displayName: room.name,
              subtitle: `${b.shortName} · Floor ${room.floor}`,
            }))
          )
          .catch(() => [] as FuseResult[])
      )
    ).then((roomResults) => {
      const flat = [...items, ...roomResults.flat()];
      fuseRef.current = new Fuse(flat, {
        keys: ["displayName", "subtitle", "building.name", "building.shortName"],
        threshold: 0.4,
      });
    });
  }, [buildings]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setOpen(true);
    if (!value.trim() || !fuseRef.current) {
      setResults([]);
    } else {
      setResults(fuseRef.current.search(value).slice(0, 8).map((r) => r.item));
    }
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (result: FuseResult) => {
    onSelectBuilding(result.building);
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
          style={{ color: "oklch(0.52 0.06 155)" }}
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search buildings or rooms…"
          aria-label="Search buildings or rooms"
          aria-autocomplete="list"
          aria-expanded={open && results.length > 0}
          aria-controls={listboxId}
          role="combobox"
          className="w-full h-11 pl-10 pr-10 rounded-xl text-sm font-medium placeholder:text-stone-400 text-stone-900 focus:outline-none transition-all duration-200"
          style={{
            background: "rgba(255,255,255,0.96)",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 2px 12px rgba(13,43,26,0.08), 0 1px 3px rgba(0,0,0,0.05)",
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.boxShadow = "0 0 0 2px oklch(0.32 0.09 155 / 0.25), 0 2px 12px rgba(13,43,26,0.08)";
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.boxShadow = "0 2px 12px rgba(13,43,26,0.08), 0 1px 3px rgba(0,0,0,0.05)";
          }}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3 w-3 text-stone-500" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute top-full mt-2 w-full rounded-2xl overflow-hidden animate-fade-in-up z-50"
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          style={{
            background: "rgba(255,255,255,0.97)",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 16px 48px rgba(13,43,26,0.14), 0 4px 12px rgba(0,0,0,0.07)",
          }}
        >
          <div className="max-h-72 overflow-y-auto scrollbar-hide">
            {results.map((result, i) => (
              <button
                key={i}
                role="option"
                aria-selected="false"
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50/80 active:bg-stone-100/80 border-b border-stone-50 last:border-0"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(result);
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={
                    result.type === "building"
                      ? { background: "oklch(0.32 0.09 155 / 0.1)", color: "oklch(0.32 0.09 155)" }
                      : { background: "oklch(0.62 0.15 155 / 0.1)", color: "oklch(0.45 0.12 155)" }
                  }
                  aria-hidden="true"
                >
                  {result.type === "building" ? (
                    <MapPin className="h-3.5 w-3.5" />
                  ) : (
                    <DoorOpen className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-stone-800 truncate">{result.displayName}</p>
                  <p className="text-xs text-stone-400 truncate mt-0.5">{result.subtitle}</p>
                </div>
                <span className="text-[10px] font-medium text-stone-300 flex-shrink-0">
                  {result.type === "building" ? "Building" : "Room"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
