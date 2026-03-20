"use client";

import { Building, Room } from "@/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Layers, Building2, FlaskConical, Users, X, Navigation, MapPin, Map } from "lucide-react";
import { useEffect, useState } from "react";
import FloorPlanViewer from "@/components/FloorPlanViewer";

interface BuildingSheetProps {
  building: Building | null;
  onClose: () => void;
  onSetFrom?: (building: Building) => void;
  onSetTo?: (building: Building) => void;
}

const typeConfig: Record<string, { bg: string; text: string; dot: string }> = {
  lecture_hall: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  lab: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  office: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  default: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400" },
};

type Tab = "info" | "floorplan";

export default function BuildingSheet({ building, onClose, onSetFrom, onSetTo }: BuildingSheetProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    if (!building) {
      // Reset all derived state when building is deselected
      Promise.resolve().then(() => {
        if (!controller.signal.aborted) {
          setRooms([]);
          setSelectedFloor(1);
          setActiveTab("info");
          setSelectedRoomId(null);
        }
      });
      return () => controller.abort();
    }

    // Reset navigation state for the new building immediately via microtask
    Promise.resolve().then(() => {
      if (!controller.signal.aborted) {
        setSelectedFloor(1);
        setActiveTab("info");
        setSelectedRoomId(null);
      }
    });

    fetch(`/data/rooms/${building.id}.json`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Room[]) => {
        if (!controller.signal.aborted) setRooms(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setRooms([]);
      });

    return () => controller.abort();
  }, [building]);

  const floorRooms = rooms.filter((r) => r.floor === selectedFloor);
  const floors = Array.from({ length: building?.floors ?? 0 }, (_, i) => i + 1);

  return (
    <Sheet open={!!building} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="sm:!inset-y-0 sm:!right-0 sm:!left-auto sm:!bottom-auto sm:!w-[420px] sm:!max-w-[420px] sm:!h-full sm:!border-l sm:!border-t-0 sm:!rounded-none max-h-[85dvh] sm:max-h-full rounded-t-2xl overflow-hidden p-0"
      >
        {building && (
          <div className="flex flex-col h-full">
            {/* Drag handle - mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <SheetHeader className="px-5 pt-3 pb-4 sm:pt-5 border-b border-gray-100">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-500/20">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-left text-lg font-semibold leading-tight truncate">
                    {building.name}
                  </SheetTitle>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="secondary" className="text-xs font-medium">
                      {building.shortName}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close building details"
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4 text-gray-500" aria-hidden="true" />
                </button>
              </div>
            </SheetHeader>

            {/* Direction buttons */}
            {(onSetFrom || onSetTo) && (
              <div className="flex gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
                {onSetFrom && (
                  <button
                    onClick={() => { onSetFrom(building); }}
                    aria-label={`Set ${building.name} as start point`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 active:scale-95 active:bg-emerald-700 shadow-sm shadow-emerald-500/20 transition-all"
                  >
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    Start here
                  </button>
                )}
                {onSetTo && (
                  <button
                    onClick={() => { onSetTo(building); }}
                    aria-label={`Set ${building.name} as destination`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-95 active:bg-indigo-800 shadow-sm shadow-indigo-500/20 transition-all"
                  >
                    <Navigation className="h-4 w-4" aria-hidden="true" />
                    Go here
                  </button>
                )}
              </div>
            )}

            {/* Tab bar */}
            <div className="flex gap-1 px-5 pt-3 pb-0 border-b border-gray-100">
              <button
                onClick={() => setActiveTab("info")}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all duration-150 ${
                  activeTab === "info"
                    ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
                aria-selected={activeTab === "info"}
                role="tab"
              >
                <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                Info
              </button>
              <button
                onClick={() => setActiveTab("floorplan")}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all duration-150 ${
                  activeTab === "floorplan"
                    ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
                aria-selected={activeTab === "floorplan"}
                role="tab"
              >
                <Map className="h-3.5 w-3.5" aria-hidden="true" />
                Floor Plan
              </button>
            </div>

            {/* Tab content */}
            {activeTab === "info" ? (
              <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 safe-bottom">
                {building.description && (
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{building.description}</p>
                )}

                {/* Info cards row */}
                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50">
                    <Clock className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-700 truncate">{building.hours}</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50">
                    <Layers className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-700">{building.floors} floors</span>
                  </div>
                </div>

                {/* Facilities */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Facilities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {building.facilities.map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-xs font-medium text-indigo-700 capitalize"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {rooms.length > 0 && (
                  <>
                    <Separator className="mb-5" />

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FlaskConical className="h-4 w-4 text-indigo-500" />
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Rooms</p>
                      </div>

                      {/* Floor tabs - horizontal scroll on mobile */}
                      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide pb-1">
                        {floors.map((f) => (
                          <button
                            key={f}
                            onClick={() => setSelectedFloor(f)}
                            className={`px-3.5 py-1.5 text-xs rounded-lg font-semibold transition-all duration-200 flex-shrink-0 ${
                              selectedFloor === f
                                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-200"
                            }`}
                          >
                            L{f}
                          </button>
                        ))}
                      </div>

                      {/* Room cards */}
                      <div className="space-y-2">
                        {floorRooms.length === 0 ? (
                          <div className="text-center py-6">
                            <p className="text-xs text-gray-400">No room data for this floor.</p>
                          </div>
                        ) : (
                          floorRooms.map((room) => {
                            const cfg = typeConfig[room.type] ?? typeConfig.default;
                            return (
                              <button
                                key={room.id}
                                onClick={() => {
                                  setSelectedRoomId(room.svgElementId);
                                  setActiveTab("floorplan");
                                  setSelectedFloor(room.floor);
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100/80 active:bg-gray-200/80 text-left transition-colors"
                                aria-label={`View ${room.name} on floor plan`}
                              >
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">{room.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-xs font-medium capitalize ${cfg.text}`}>
                                      {room.type.replace("_", " ")}
                                    </span>
                                    <span className="text-gray-300">·</span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {room.capacity}
                                    </span>
                                  </div>
                                </div>
                                <Map className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" aria-hidden="true" />
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Floor Plan tab */
              <div className="flex flex-col flex-1 overflow-hidden px-5 py-3 safe-bottom gap-3">
                {/* Floor selector */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
                  {floors.map((f) => (
                    <button
                      key={f}
                      onClick={() => { setSelectedFloor(f); setSelectedRoomId(null); }}
                      className={`px-3.5 py-1.5 text-xs rounded-lg font-semibold transition-all duration-200 flex-shrink-0 ${
                        selectedFloor === f
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-200"
                      }`}
                    >
                      L{f}
                    </button>
                  ))}
                </div>

                {/* Floor plan viewer fills remaining space */}
                <div className="flex-1 min-h-0">
                  <FloorPlanViewer
                    buildingId={building.id}
                    floor={selectedFloor}
                    rooms={rooms.filter((r) => r.floor === selectedFloor)}
                    selectedRoomId={selectedRoomId}
                    onRoomSelect={(room) => setSelectedRoomId(room?.svgElementId ?? null)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
