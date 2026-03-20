"use client";

import { Building } from "@/types";
import { ArrowUpDown, Navigation2, X, MapPin, Flag } from "lucide-react";

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
  const bothSet = from && to;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg w-full overflow-hidden" role="region" aria-label="Directions panel">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
        <Navigation2 className="h-4 w-4 text-indigo-600 flex-shrink-0" aria-hidden="true" />
        <span className="text-sm font-bold text-gray-900 flex-1 tracking-tight">Directions</span>
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
          {/* From */}
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${
            from ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200 border-dashed"
          }`}>
            <MapPin className={`h-3.5 w-3.5 flex-shrink-0 ${from ? "text-emerald-600" : "text-gray-400"}`} aria-hidden="true" />
            <span className={`flex-1 text-sm font-medium truncate ${from ? "text-gray-900" : "text-gray-400"}`}>
              {from ? from.name : "Choose start point"}
            </span>
            {from && (
              <button
                onClick={onClearFrom}
                aria-label={`Clear start point: ${from.name}`}
                className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full hover:bg-emerald-200 active:bg-emerald-300 transition-colors"
              >
                <X className="h-3 w-3 text-emerald-700" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* To */}
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${
            to ? "bg-rose-50 border-rose-200" : "bg-gray-50 border-gray-200 border-dashed"
          }`}>
            <Flag className={`h-3.5 w-3.5 flex-shrink-0 ${to ? "text-rose-600" : "text-gray-400"}`} aria-hidden="true" />
            <span className={`flex-1 text-sm font-medium truncate ${to ? "text-gray-900" : "text-gray-400"}`}>
              {to ? to.name : "Choose destination"}
            </span>
            {to && (
              <button
                onClick={onClearTo}
                aria-label={`Clear destination: ${to.name}`}
                className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full hover:bg-rose-200 active:bg-rose-300 transition-colors"
              >
                <X className="h-3 w-3 text-rose-700" aria-hidden="true" />
              </button>
            )}
          </div>
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

      {/* Status bar */}
      <div className="px-4 pb-3">
        {isLoading ? (
          <div className="flex items-center gap-2.5 py-2 px-3 rounded-xl bg-indigo-50 border border-indigo-100">
            <div className="flex gap-1" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-xs font-medium text-indigo-700" aria-live="polite">Finding best route…</span>
          </div>
        ) : bothSet ? (
          <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" aria-hidden="true" />
            <span className="text-xs font-medium text-emerald-700">Route ready — follow the line on the map</span>
          </div>
        ) : (
          <p className="text-xs text-gray-400 py-1 px-1">
            {!from
              ? "Tap a building on the map, then choose \u201cSet as start\u201d."
              : "Now tap another building and choose \u201cSet as destination\u201d."}
          </p>
        )}
      </div>
    </div>
  );
}
