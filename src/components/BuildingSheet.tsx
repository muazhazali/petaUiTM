"use client";

import { Building, Room } from "@/types";
import { Clock, Layers, Building2, FlaskConical, Users, X, Navigation, MapPin, Map } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import FloorPlanViewer from "@/components/FloorPlanViewer";
import { cn } from "@/lib/utils";

export type SheetSnap = "peek" | "half" | "tall";

interface BuildingSheetProps {
  building: Building | null;
  onClose: () => void;
  onSetFrom?: (building: Building) => void;
  onSetTo?: (building: Building) => void;
  /** When set (deep-linked from room search), open the floor-plan tab on this floor. */
  focusFloor?: number | null;
  /** SVG element id of the room to highlight on open. */
  focusRoomId?: string | null;
  /** Snap state of the mobile bottom sheet (ignored on desktop). */
  snap?: SheetSnap;
  onSnapChange?: (snap: SheetSnap) => void;
}

const typeConfig: Record<string, { bg: string; text: string; dot: string }> = {
  lecture_hall: { bg: "bg-[#EEF1F9]", text: "text-[#374C9E]", dot: "bg-[#5A6BB5]" },
  lab: { bg: "bg-[#EEE6F6]", text: "text-[#703394]", dot: "bg-[#9A63BD]" },
  office: { bg: "bg-[#FDF4DC]", text: "text-[#8A6D0B]", dot: "bg-[#F5BF32]" },
  default: { bg: "bg-[#EEF1F9]", text: "text-[#4C5370]", dot: "bg-[#8A96CB]" },
};

type Tab = "info" | "floorplan";

const GREEN = "#17245B";
const PEEK_PX = 160;
const SNAP_ORDER: SheetSnap[] = ["peek", "half", "tall"];
const snapClass: Record<SheetSnap, string> = {
  peek: "h-[160px]",
  half: "h-[45dvh]",
  tall: "h-[92dvh]",
};

function snapHeightPx(snap: SheetSnap): number {
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  if (snap === "peek") return PEEK_PX;
  if (snap === "half") return Math.round(vh * 0.45);
  return Math.round(vh * 0.92);
}

export default function BuildingSheet({
  building,
  onClose,
  onSetFrom,
  onSetTo,
  focusFloor,
  focusRoomId,
  snap = "half",
  onSnapChange,
}: BuildingSheetProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const sheetRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<{ startY: number; startH: number; lastY: number; lastT: number; vy: number; h: number } | null>(null);

  // Track the lg breakpoint after mount so the SSR markup stays stable.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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
        setSelectedFloor(focusFloor ?? 1);
        setActiveTab(focusRoomId || focusFloor ? "floorplan" : "info");
        setSelectedRoomId(focusRoomId ?? null);
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
  }, [building, focusFloor, focusRoomId]);

  // Esc closes the non-modal detail panel.
  useEffect(() => {
    if (!building) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [building, onClose]);

  // Drag the mobile bottom sheet between snap points.
  const startDrag = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (isDesktop) return;
      const target = e.target as HTMLElement;
      if (!target.closest("[data-sheet-drag]")) return;
      if (target.closest("button, a, input")) return;
      const rect = sheetRef.current?.getBoundingClientRect();
      if (!rect) return;
      const d = {
        startY: e.clientY,
        startH: rect.height,
        lastY: e.clientY,
        lastT: performance.now(),
        vy: 0,
        h: rect.height,
      };
      dragRef.current = d;
      setDragging(true);
      setDragHeight(rect.height);

      const move = (ev: PointerEvent) => {
        if (dragRef.current !== d) return;
        const now = performance.now();
        const dt = Math.max(now - d.lastT, 1);
        d.vy = (ev.clientY - d.lastY) / dt; // positive = dragging down (collapsing)
        d.lastY = ev.clientY;
        d.lastT = now;
        const maxH = Math.round(window.innerHeight * 0.95);
        const next = Math.min(Math.max(d.startH - (ev.clientY - d.startY), 88), maxH);
        d.h = next;
        setDragHeight(next);
      };
      const end = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", end);
        window.removeEventListener("pointercancel", end);
        const h = d.h;
        const vy = d.vy;
        let idx = 0;
        let best = Infinity;
        SNAP_ORDER.forEach((s, i) => {
          const dist = Math.abs(snapHeightPx(s) - h);
          if (dist < best) {
            best = dist;
            idx = i;
          }
        });
        if (vy < -0.5) idx = Math.min(idx + 1, SNAP_ORDER.length - 1);
        else if (vy > 0.5) idx = Math.max(idx - 1, 0);
        dragRef.current = null;
        setDragging(false);
        setDragHeight(null);
        onSnapChange?.(SNAP_ORDER[idx]);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", end);
      window.addEventListener("pointercancel", end);
    },
    [isDesktop, onSnapChange]
  );

  // Tap the handle to cycle the sheet open/closed on mobile.
  const handleTap = useCallback(() => {
    if (isDesktop) return;
    onSnapChange?.(snap === "peek" ? "half" : "peek");
  }, [isDesktop, onSnapChange, snap]);

  const floorRooms = rooms.filter((r) => r.floor === selectedFloor);
  const floors = Array.from({ length: building?.floors ?? 0 }, (_, i) => i + 1);
  const compact = !isDesktop && snap === "peek";

  if (!building) return null;

  return (
    <aside
      ref={sheetRef}
      role="dialog"
      aria-modal="false"
      aria-label={building.name}
      onPointerDown={startDrag}
      className={cn(
        "z-[1100] flex flex-col overflow-hidden bg-[#F5F7FC]",
        // Mobile: bottom sheet over the map.
        "fixed inset-x-0 bottom-0 rounded-t-3xl border-t border-[#DBE0F1] shadow-[0_-8px_30px_rgba(23,36,91,0.15)]",
        // Desktop: docked panel on the right of the map (no dim/blur, map stays live).
        "lg:absolute lg:inset-y-0 lg:right-0 lg:left-auto lg:bottom-auto lg:h-full lg:w-[400px] lg:min-w-[400px] lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-[-8px_0_24px_rgba(23,36,91,0.10)]",
        !dragging && snapClass[snap],
        dragging ? "transition-none" : "transition-[height] duration-300 ease-out lg:transition-none"
      )}
      style={!isDesktop && dragHeight != null ? { height: dragHeight } : undefined}
    >
      <div className="flex flex-col h-full min-h-0">
        {/* Drag handle - mobile only */}
        <div
          data-sheet-drag
          onClick={handleTap}
          className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none lg:hidden"
        >
          <div className="w-10 h-1 rounded-full bg-[#DBE0F1]" />
        </div>

        {/* Header */}
        <header
          data-sheet-drag
          className="px-5 pt-3 pb-4 lg:pt-5 border-b border-[#DBE0F1] touch-none"
        >
          <div className="flex items-start gap-3.5">
            {/* Building icon with initials */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ background: "#17245B" }}
            >
              <Building2 className="h-5 w-5 text-[#F5BF32]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-left text-base font-semibold leading-tight text-[#17245B]">
                {building.name}
              </h2>
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
        </header>

        {/* Direction buttons */}
        {(onSetFrom || onSetTo) && (
          <div data-sheet-drag className="flex gap-2.5 px-4 py-3 border-b border-[#DBE0F1] bg-white/60 touch-none">
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
        {!compact && (
          <div data-sheet-drag className="flex gap-0 px-4 pt-3 pb-0 border-b border-[#DBE0F1] bg-white/60 touch-none">
            {(["info", "floorplan"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === "floorplan" && !isDesktop) onSnapChange?.("tall");
                }}
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
        )}

        {/* Tab content */}
        {!compact && (activeTab === "info" ? (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-5 py-4 safe-bottom">
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
                    {floorRooms.length === 0 ? (
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
                              if (!isDesktop) onSnapChange?.("tall");
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
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-5 py-3 safe-bottom gap-3">
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
        ))}
      </div>
    </aside>
  );
}
