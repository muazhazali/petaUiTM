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

  // Close dropdown on outside click
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
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
          className="w-full h-11 pl-9 pr-9 rounded-xl text-sm font-medium bg-white border border-gray-200 shadow-sm placeholder:text-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:shadow-md transition-all duration-200"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up z-50"
          id={listboxId}
          role="listbox"
          aria-label="Search results"
        >
          <div className="max-h-72 overflow-y-auto scrollbar-hide divide-y divide-gray-100/60">
            {results.map((result, i) => (
              <button
                key={i}
                role="option"
                aria-selected="false"
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-indigo-50/70 active:bg-indigo-100/70 text-left transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(result);
                }}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  result.type === "building"
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-emerald-100 text-emerald-600"
                }`} aria-hidden="true">
                  {result.type === "building" ? (
                    <MapPin className="h-4 w-4" />
                  ) : (
                    <DoorOpen className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{result.displayName}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{result.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
