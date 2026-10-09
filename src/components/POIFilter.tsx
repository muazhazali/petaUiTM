"use client";

import { POICategory } from "@/types";
import { POI_META } from "@/lib/poi";

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
      {POI_META.map(({ id, label, Icon }) => {
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
                  }
                : {
                    background: "rgba(255,255,255,0.92)",
                    border: "1px solid rgba(23,36,91,0.1)",
                    color: "#4C5370",
                    boxShadow: "0 1px 4px rgba(23,36,91,0.06)",
                  }
            }
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
