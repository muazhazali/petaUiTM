"use client";

import { POICategory } from "@/types";

const CATEGORIES: { id: POICategory; label: string; icon: string }[] = [
  { id: "food", label: "Food", icon: "🍽️" },
  { id: "mosque", label: "Prayer", icon: "🕌" },
  { id: "atm", label: "ATM", icon: "🏧" },
  { id: "parking", label: "Parking", icon: "🅿️" },
  { id: "bus", label: "Bus", icon: "🚌" },
  { id: "health", label: "Clinic", icon: "🏥" },
  { id: "library", label: "Library", icon: "📚" },
];

interface POIFilterProps {
  activeCategories: Set<POICategory>;
  onChange: (categories: Set<POICategory>) => void;
}

export default function POIFilter({ activeCategories, onChange }: POIFilterProps) {
  function toggle(cat: POICategory) {
    const next = new Set(activeCategories);
    if (next.has(cat)) {
      next.delete(cat);
    } else {
      next.add(cat);
    }
    onChange(next);
  }

  return (
    <div
      className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar"
      role="group"
      aria-label="Filter points of interest"
    >
      {CATEGORIES.map(({ id, label, icon }) => {
        const active = activeCategories.has(id);
        return (
          <button
            key={id}
            onClick={() => toggle(id)}
            aria-pressed={active}
            aria-label={`${active ? "Hide" : "Show"} ${label}`}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs font-medium flex-shrink-0 transition-all active:scale-95 ${
              active
                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
