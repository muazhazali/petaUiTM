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

const GREEN = "#17245B";

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
      className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide"
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
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all active:scale-95"
            style={
              active
                ? {
                    background: GREEN,
                    color: "white",
                    border: `1px solid ${GREEN}`,
                    boxShadow: "0 2px 8px rgba(91,38,123,0.25)",
                  }
                : {
                    background: "rgba(255,255,255,0.92)",
                    border: "1px solid rgba(23,36,91,0.1)",
                    color: "#4C5370",
                    boxShadow: "0 1px 4px rgba(23,36,91,0.06)",
                  }
            }
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
