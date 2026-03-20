"use client";

import { Building } from "@/types";
import { ArrowLeftRight, Navigation, X } from "lucide-react";

interface NavigationPanelProps {
  from: Building | null;
  to: Building | null;
  isLoading: boolean;
  onSwap: () => void;
  onClearFrom: () => void;
  onClearTo: () => void;
  onClose: () => void;
}

export default function NavigationPanel({
  from,
  to,
  isLoading,
  onSwap,
  onClearFrom,
  onClearTo,
  onClose,
}: NavigationPanelProps) {
  return (
    <div className="glass rounded-2xl p-3 shadow-lg w-full">
      <div className="flex items-center gap-2 mb-2">
        <Navigation className="h-4 w-4 text-indigo-600 flex-shrink-0" />
        <span className="text-sm font-semibold text-gray-800 flex-1">Directions</span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          title="Close directions"
        >
          <X className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </div>

      <div className="flex items-stretch gap-2">
        {/* Waypoint labels */}
        <div className="flex flex-col items-center gap-0.5 py-1">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
          <div className="flex-1 w-px bg-gray-200 my-0.5" />
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
        </div>

        {/* Input rows */}
        <div className="flex-1 flex flex-col gap-1.5">
          {/* From */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-xs text-gray-500 flex-shrink-0 w-6">From</span>
            <span className={`flex-1 text-xs font-medium truncate ${from ? "text-gray-800" : "text-gray-400"}`}>
              {from ? from.name : "Select on map or search"}
            </span>
            {from && (
              <button onClick={onClearFrom} className="flex-shrink-0">
                <X className="h-3 w-3 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* To */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-xs text-gray-500 flex-shrink-0 w-6">To</span>
            <span className={`flex-1 text-xs font-medium truncate ${to ? "text-gray-800" : "text-gray-400"}`}>
              {to ? to.name : "Select on map or search"}
            </span>
            {to && (
              <button onClick={onClearTo} className="flex-shrink-0">
                <X className="h-3 w-3 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Swap button */}
        <div className="flex flex-col items-center justify-center">
          <button
            onClick={onSwap}
            disabled={!from && !to}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
            title="Swap"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 mt-2 px-1">
          <div className="h-1 flex-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full animate-pulse w-1/2" />
          </div>
          <span className="text-xs text-gray-400">Finding route…</span>
        </div>
      )}

      {!from && !to && (
        <p className="text-xs text-gray-400 mt-2 px-1">
          Tap a building and choose &quot;Set as start&quot; or &quot;Set as destination&quot;.
        </p>
      )}
    </div>
  );
}
