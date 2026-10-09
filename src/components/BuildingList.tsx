"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Fuse from "fuse.js";
import { Building, POI, POICategory } from "@/types";
import POIFilter from "@/components/POIFilter";
import { Search, Clock, Layers, Navigation } from "lucide-react";

interface BuildingListProps {
  buildings: Building[];
  selectedBuilding: Building | null;
  onSelectBuilding: (b: Building) => void;
  navMode: boolean;
  fromBuilding: Building | null;
  toBuilding: Building | null;
  onSetFrom: (b: Building) => void;
  onSetTo: (b: Building) => void;
  pois: POI[];
  activeCategories: Set<POICategory>;
  onCategoriesChange: (cats: Set<POICategory>) => void;
}

// Collect unique facilities across all buildings for filter chips
function getUniqueFacilities(buildings: Building[]): string[] {
  const set = new Set<string>();
  buildings.forEach((b) => b.facilities.forEach((f) => set.add(f)));
  return Array.from(set).sort();
}

const GREEN = "oklch(0.32 0.09 155)";

export default function BuildingList({
  buildings,
  selectedBuilding,
  onSelectBuilding,
  navMode,
  fromBuilding,
  toBuilding,
  onSetFrom,
  onSetTo,
  activeCategories,
  onCategoriesChange,
}: BuildingListProps) {
  const [query, setQuery] = useState("");
  const [activeFacility, setActiveFacility] = useState<string | null>(null);
  const selectedCardRef = useRef<HTMLDivElement | null>(null);

  const fuse = useMemo(
    () =>
      new Fuse(buildings, {
        keys: ["name", "shortName", "description", "facilities"],
        threshold: 0.35,
      }),
    [buildings]
  );

  const uniqueFacilities = useMemo(() => getUniqueFacilities(buildings), [buildings]);

  const filteredBuildings = useMemo(() => {
    let list = buildings;
    if (query.trim()) {
      list = fuse.search(query.trim()).map((r) => r.item);
    }
    if (activeFacility) {
      list = list.filter((b) => b.facilities.includes(activeFacility));
    }
    return list;
  }, [buildings, query, activeFacility, fuse]);

  // Scroll selected card into view when selection changes externally
  useEffect(() => {
    if (selectedBuilding && selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedBuilding]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search + filters */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-stone-100 space-y-2.5">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search buildings…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-stone-100 rounded-xl border border-transparent focus:border-stone-300 focus:bg-white focus:outline-none transition-colors placeholder:text-stone-400"
          />
        </div>

        {/* Facility filter chips */}
        {uniqueFacilities.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide" role="group" aria-label="Filter by facility">
            <button
              onClick={() => setActiveFacility(null)}
              className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all active:scale-95"
              style={
                activeFacility === null
                  ? { background: GREEN, color: "white", border: `1px solid ${GREEN}` }
                  : { background: "rgba(0,0,0,0.05)", border: "1px solid transparent", color: "#57534e" }
              }
            >
              All
            </button>
            {uniqueFacilities.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFacility(activeFacility === f ? null : f)}
                aria-pressed={activeFacility === f}
                className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all active:scale-95 capitalize"
                style={
                  activeFacility === f
                    ? { background: GREEN, color: "white", border: `1px solid ${GREEN}` }
                    : { background: "rgba(0,0,0,0.05)", border: "1px solid transparent", color: "#57534e" }
                }
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {/* POI filter */}
        <POIFilter activeCategories={activeCategories} onChange={onCategoriesChange} />
      </div>

      {/* Building count */}
      <div className="flex-shrink-0 px-4 py-2 text-xs text-stone-400 font-medium border-b border-stone-50">
        {filteredBuildings.length} building{filteredBuildings.length !== 1 ? "s" : ""}
        {query && ` matching "${query}"`}
      </div>

      {/* Scrollable building list */}
      <div className="flex-1 overflow-y-auto">
        {filteredBuildings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-stone-400 gap-2">
            <Search className="h-8 w-8 opacity-30" />
            <p className="text-sm font-medium">No buildings found</p>
            <button
              onClick={() => { setQuery(""); setActiveFacility(null); }}
              className="text-xs underline underline-offset-2 mt-1"
              style={{ color: GREEN }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {filteredBuildings.map((b) => {
              const isSelected = selectedBuilding?.id === b.id;
              const isFrom = fromBuilding?.id === b.id;
              const isTo = toBuilding?.id === b.id;

              return (
                <div
                  key={b.id}
                  ref={isSelected ? selectedCardRef : null}
                  role="button"
                  tabIndex={0}
                  onClick={() => !navMode && onSelectBuilding(b)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!navMode) onSelectBuilding(b); } }}
                  className="px-4 py-3.5 cursor-pointer transition-colors hover:bg-stone-50 focus:outline-none focus-visible:bg-stone-50"
                  style={
                    isSelected
                      ? { borderLeft: `3px solid ${GREEN}`, background: "oklch(0.97 0.01 155)" }
                      : { borderLeft: "3px solid transparent" }
                  }
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Building icon */}
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: isSelected ? GREEN : "oklch(0.45 0.09 155)" }}
                      >
                        {b.shortName.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-800 truncate leading-tight">{b.name}</p>
                        <p className="text-xs text-stone-400 truncate">{b.shortName}</p>
                      </div>
                    </div>
                    {/* Nav mode badges */}
                    {isFrom && (
                      <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">FROM</span>
                    )}
                    {isTo && (
                      <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">TO</span>
                    )}
                  </div>

                  {/* Description */}
                  {b.description && (
                    <p className="text-xs text-stone-500 line-clamp-2 mb-2 leading-relaxed">{b.description}</p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mb-2">
                    {b.hours && (
                      <span className="flex items-center gap-1 text-xs text-stone-400">
                        <Clock className="h-3 w-3" />
                        {b.hours}
                      </span>
                    )}
                    {b.floors && (
                      <span className="flex items-center gap-1 text-xs text-stone-400">
                        <Layers className="h-3 w-3" />
                        {b.floors} floor{b.floors !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Facility tags */}
                  {b.facilities.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-2">
                      {b.facilities.slice(0, 3).map((f) => (
                        <span
                          key={f}
                          className="text-[10px] px-1.5 py-0.5 rounded-md font-medium capitalize"
                          style={{ background: "rgba(0,0,0,0.05)", color: "#57534e" }}
                        >
                          {f}
                        </span>
                      ))}
                      {b.facilities.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium text-stone-400">
                          +{b.facilities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Nav mode buttons */}
                  {navMode && (
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSetFrom(b); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 border"
                        style={
                          isFrom
                            ? { background: "#d1fae5", borderColor: "#6ee7b7", color: "#065f46" }
                            : { background: "white", borderColor: "#e7e5e4", color: "#57534e" }
                        }
                      >
                        <Navigation className="h-3 w-3" />
                        From here
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onSetTo(b); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 border"
                        style={
                          isTo
                            ? { background: "#ffe4e6", borderColor: "#fda4af", color: "#9f1239" }
                            : { background: "white", borderColor: "#e7e5e4", color: "#57534e" }
                        }
                      >
                        <Navigation className="h-3 w-3 rotate-180" />
                        Go here
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
