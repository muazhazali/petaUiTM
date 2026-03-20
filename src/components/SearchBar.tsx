"use client";

import { useState, useEffect, useRef } from "react";
import Fuse from "fuse.js";
import { Building, Room } from "@/types";
import { Search, X, MapPin, DoorOpen } from "lucide-react";
import { Input } from "@/components/ui/input";

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

  const handleSelect = (result: FuseResult) => {
    onSelectBuilding(result.building);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search buildings or rooms..."
          className="pl-9 pr-9 bg-white shadow-sm"
        />
        {query && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden">
          {results.map((result, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(result);
              }}
            >
              {result.type === "building" ? (
                <MapPin className="h-4 w-4 text-indigo-500 flex-shrink-0" />
              ) : (
                <DoorOpen className="h-4 w-4 text-green-500 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-800">{result.displayName}</p>
                <p className="text-xs text-gray-500">{result.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
