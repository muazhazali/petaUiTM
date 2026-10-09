"use client";

import { Building, Room } from "@/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  lecture_hall: { bg: "bg-[#EEF1F9]", text: "text-[#374C9E]", dot: "bg-[#5A6BB5]" },
  lab: { bg: "bg-[#EEE6F6]", text: "text-[#703394]", dot: "bg-[#9A63BD]" },
  office: { bg: "bg-[#FDF4DC]", text: "text-[#8A6D0B]", dot: "bg-[#F5BF32]" },
  default: { bg: "bg-[#EEF1F9]", text: "text-[#4C5370]", dot: "bg-[#8A96CB]" },
};

type Tab = "info" | "floorplan";

const GREEN = "#17245B";

export default function BuildingSheet({ building, onClose, onSetFrom, onSetTo }: BuildingSheetProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    if (!building) {
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
        className="sm:!inset-y-0 sm:!right-0 sm:!left-auto sm:!bottom-auto sm:!w-[400px] sm:!max-w-[400px] sm:!h-full sm:!border-l sm:!border-t-0 sm:!rounded-none max-h-[85dvh] sm:max-h-full rounded-t-3xl overflow-hidden p-0 border-0"
        style={{ background: "#F5F7FC" }}
      >
        {building && (
          <div className="flex flex-col h-full">
            {/* Drag handle - mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-[#DBE0F1]" />
            </div>

            {/* Header */}
            <SheetHeader className="px-5 pt-3 pb-4 sm:pt-5 border-b border-[#DBE0F1]">
              <div className="flex items-start gap-3.5">
                {/* Building icon with initials */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ background: "#17245B" }}
                >
                  <Building2 className="h-5 w-5 text-[#F5BF32]" />
                </div>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-left text-base font-semibold leading-tight text-[#17245B]">
                    {building.name}
                  </SheetTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                      style={{ background: "rgba(91,38,123,0.08)", color: "#5B267B" }}
                    >
                      {building.shortName}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close building details"
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#EEF1F9] active:bg-[#DBE0F1] transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4 text-[#6B7399]" aria-hidden="true" />
                </button>
              </div>
            </SheetHeader>

            {/* Direction buttons */}
            {(onSetFrom || onSetTo) && (
              <div className="flex gap-2.5 px-4 py-3 border-b border-[#DBE0F1] bg-white/60">
                {onSetFrom && (
                  <button
                    onClick={() => { onSetFrom(building); }}
                    aria-label={`Set ${building.name} as start point`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                    style={{
                      background: "#F5BF32",
                      color: "#17245B",
                    }}
                  >
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    Start here
                  </button>
                )}
                {onSetTo && (
                  <button
                    onClick={() => { onSetTo(building); }}
                    aria-label={`Set ${building.name} as destination`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                    style={{
                      background: "#5B267B",
                      color: "white",
                    }}
                  >
                    <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                    Go here
                  </button>
                )}
              </div>
            )}

            {/* Tab bar */}
            <div className="flex gap-0 px-4 pt-3 pb-0 border-b border-[#DBE0F1] bg-white/60">
              {(["info", "floorplan"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-all duration-150 capitalize`}
                  style={
                    activeTab === tab
                      ? { borderColor: "#F5BF32", color: "#17245B" }
                      : { borderColor: "transparent", color: "#6B7399" }
                  }
                  aria-selected={activeTab === tab}
                  role="tab"
                >
                  {tab === "info" ? <Building2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Map className="h-3.5 w-3.5" aria-hidden="true" />}
                  {tab === "info" ? "Info" : "Floor Plan"}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "info" ? (
              <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 safe-bottom">
                {building.description && (
                  <p className="text-sm text-[#4C5370] leading-relaxed mb-5 font-light">{building.description}</p>
                )}

                {/* Info cards */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#DBE0F1]">
                    <Clock className="h-4 w-4 flex-shrink-0" style={{ color: "#5B267B" }} />
                    <span className="text-xs font-medium text-[#17245B] truncate">{building.hours}</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#DBE0F1]">
                    <Layers className="h-4 w-4 flex-shrink-0" style={{ color: "#5B267B" }} />
                    <span className="text-xs font-medium text-[#17245B]">{building.floors} floors</span>
                  </div>
                </div>

                {/* Facilities */}
                {building.facilities?.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8A96CB] mb-2.5">Facilities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {building.facilities.map((f) => (
                        <span
                          key={f}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium capitalize"
                          style={{ background: "rgba(91,38,123,0.08)", color: "#5B267B" }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {rooms.length > 0 && (
                  <>
                    <div className="border-t border-[#DBE0F1] mb-5" />

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FlaskConical className="h-3.5 w-3.5" style={{ color: "#5B267B" }} />
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8A96CB]">Rooms</p>
                      </div>

                      {/* Floor tabs */}
                      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide pb-1">
                        {floors.map((f) => (
                          <button
                            key={f}
                            onClick={() => setSelectedFloor(f)}
                            className="px-3 py-1.5 text-xs rounded-lg font-semibold transition-all duration-200 flex-shrink-0"
                            style={
                              selectedFloor === f
                                ? { background: GREEN, color: "white", boxShadow: "0 2px 6px rgba(23,36,91,0.3)" }
                                : { background: "#EEF1F9", color: "#4C5370" }
                            }
                          >
                            L{f}
                          </button>
                        ))}
                      </div>

                      {/* Room cards */}
                      <div className="space-y-1.5">
                        {                          floorRooms.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-xs text-[#8A96CB]">No room data for this floor.</p>
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
                                className={`w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-[#DBE0F1] hover:border-[#8A96CB] active:bg-[#F5F7FC] text-left transition-colors`}
                                aria-label={`View ${room.name} on floor plan`}
                              >
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-[#17245B] truncate">{room.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[11px] font-medium capitalize ${cfg.text}`}>
                                      {room.type.replace("_", " ")}
                                    </span>
                                    <span className="text-[#DBE0F1]">·</span>
                                    <span className="text-[11px] text-[#6B7399] flex items-center gap-0.5">
                                      <Users className="h-3 w-3" />
                                      {room.capacity}
                                    </span>
                                  </div>
                                </div>
                                <Map className="h-3.5 w-3.5 text-[#DBE0F1] flex-shrink-0" aria-hidden="true" />
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
                      className="px-3 py-1.5 text-xs rounded-lg font-semibold transition-all duration-200 flex-shrink-0"
                      style={
                        selectedFloor === f
                          ? { background: GREEN, color: "white", boxShadow: "0 2px 6px rgba(23,36,91,0.3)" }
                          : { background: "#EEF1F9", color: "#4C5370" }
                      }
                    >
                      L{f}
                    </button>
                  ))}
                </div>

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
