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

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (fuseRef.current) {
      setResults(fuseRef.current.search(query).slice(0, 8).map((r) => r.item));
    }
  }, [query]);

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
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search buildings or rooms..."
          className="w-full h-10 pl-9 pr-9 rounded-xl text-sm glass shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:shadow-md transition-all duration-200"
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
        <div className="absolute top-full mt-2 w-full glass rounded-xl shadow-xl overflow-hidden animate-fade-in-up z-50">
          <div className="max-h-80 overflow-y-auto scrollbar-hide">
            {results.map((result, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50/60 active:bg-indigo-100/60 text-left transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(result);
                }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  result.type === "building"
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-emerald-100 text-emerald-600"
                }`}>
                  {result.type === "building" ? (
                    <MapPin className="h-4 w-4" />
                  ) : (
                    <DoorOpen className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{result.displayName}</p>
                  <p className="text-xs text-gray-400 truncate">{result.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
