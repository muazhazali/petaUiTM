"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Room } from "@/types";
import { X, ZoomIn, ZoomOut, RotateCcw, Users, Tag } from "lucide-react";

interface FloorPlanViewerProps {
  buildingId: string;
  floor: number;
  rooms: Room[];
  /** Called when the user taps a room in the SVG */
  onRoomSelect?: (room: Room | null) => void;
  selectedRoomId?: string | null;
}

interface Transform {
  scale: number;
  x: number;
  y: number;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const SCALE_STEP = 0.35;

export default function FloorPlanViewer({
  buildingId,
  floor,
  rooms,
  onRoomSelect,
  selectedRoomId,
}: FloorPlanViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Build a map from svgElementId → Room for O(1) lookup
  const roomBySvgId = useRef<Map<string, Room>>(new Map());
  useEffect(() => {
    roomBySvgId.current = new Map(rooms.map((r) => [r.svgElementId, r]));
  }, [rooms]);

  // Load SVG source
  useEffect(() => {
    const url = `/floorplans/${buildingId}-L${floor}.svg`;
    // Reset state asynchronously to avoid cascading renders
    Promise.resolve().then(() => {
      setLoading(true);
      setError(false);
      setSvgContent(null);
      setTransform({ scale: 1, x: 0, y: 0 });
      setSelectedRoom(null);
    });
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.text();
      })
      .then((text) => {
        setSvgContent(text);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [buildingId, floor]);

  // Highlight the selected room in the SVG DOM
  useEffect(() => {
    if (!svgContainerRef.current) return;
    // Remove all previous selections
    svgContainerRef.current
      .querySelectorAll(".selected")
      .forEach((el) => el.classList.remove("selected"));

    const targetId = selectedRoomId ?? selectedRoom?.svgElementId;
    if (targetId) {
      const el = svgContainerRef.current.querySelector(`#${CSS.escape(targetId)}`);
      if (el) el.classList.add("selected");
    }
  }, [svgContent, selectedRoom, selectedRoomId]);

  // Attach click listeners after SVG content is injected
  const handleSvgClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as Element;
      // Walk up to find a clickable room element (has an id registered in rooms)
      let el: Element | null = target;
      while (el && el !== svgContainerRef.current) {
        if (el.id && roomBySvgId.current.has(el.id)) {
          const room = roomBySvgId.current.get(el.id)!;
          setSelectedRoom(room);
          onRoomSelect?.(room);
          return;
        }
        el = el.parentElement;
      }
      // Click on empty area — deselect
      setSelectedRoom(null);
      onRoomSelect?.(null);
    },
    [onRoomSelect]
  );

  useEffect(() => {
    const container = svgContainerRef.current;
    if (!container || !svgContent) return;
    container.addEventListener("click", handleSvgClick);
    return () => container.removeEventListener("click", handleSvgClick);
  }, [svgContent, handleSvgClick]);

  // Pan with pointer drag
  const dragStart = useRef<{ px: number; py: number; tx: number; ty: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragStart.current = {
      px: e.clientX,
      py: e.clientY,
      tx: transform.x,
      ty: transform.y,
    };
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.px;
    const dy = e.clientY - dragStart.current.py;
    setTransform((t) => ({ ...t, x: dragStart.current!.tx + dx, y: dragStart.current!.ty + dy }));
  };

  const onPointerUp = () => {
    dragStart.current = null;
    setIsDragging(false);
  };

  // Pinch/wheel zoom
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
    setTransform((t) => ({
      ...t,
      scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale + delta)),
    }));
  };

  const zoomIn = () =>
    setTransform((t) => ({ ...t, scale: Math.min(MAX_SCALE, t.scale + SCALE_STEP) }));
  const zoomOut = () =>
    setTransform((t) => ({ ...t, scale: Math.max(MIN_SCALE, t.scale - SCALE_STEP) }));
  const resetView = () => setTransform({ scale: 1, x: 0, y: 0 });

  const dismissRoom = () => {
    setSelectedRoom(null);
    onRoomSelect?.(null);
  };

  return (
    <div className="relative flex flex-col w-full h-full min-h-[220px]">
      {/* SVG viewport */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        style={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none" }}
        aria-label={`Floor plan level ${floor}`}
        role="img"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-[#5B267B] border-t-transparent animate-spin" />
              <p className="text-xs text-gray-400">Loading floor plan…</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <p className="text-sm font-medium text-gray-500">No floor plan available</p>
              <p className="text-xs text-gray-400 mt-1">Level {floor} plan coming soon</p>
            </div>
          </div>
        )}

        {svgContent && (
          <div
            ref={svgContainerRef}
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.15s ease",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}

        {/* Zoom controls */}
        {!error && !loading && (
          <div className="absolute bottom-2 right-2 flex flex-col gap-1 z-10">
            <button
              onClick={zoomIn}
              aria-label="Zoom in"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
            >
              <ZoomIn className="h-3.5 w-3.5 text-gray-600" />
            </button>
            <button
              onClick={zoomOut}
              aria-label="Zoom out"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
            >
              <ZoomOut className="h-3.5 w-3.5 text-gray-600" />
            </button>
            <button
              onClick={resetView}
              aria-label="Reset view"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
            >
              <RotateCcw className="h-3 w-3 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Room info tooltip */}
      {selectedRoom && (
        <div
          className="mt-2 flex items-start gap-2.5 p-3 rounded-xl bg-[#EEE6F6] border border-[#C4A9DD] animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#3F1860] truncate">{selectedRoom.name}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-[#5B267B]">
                <Tag className="h-3 w-3" aria-hidden="true" />
                <span className="capitalize">{selectedRoom.type.replace("_", " ")}</span>
              </span>
              <span className="flex items-center gap-1 text-xs text-[#5B267B]">
                <Users className="h-3 w-3" aria-hidden="true" />
                {selectedRoom.capacity}
              </span>
            </div>
          </div>
          <button
            onClick={dismissRoom}
            aria-label="Dismiss room info"
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[#DCCBEB] active:bg-[#C4A9DD] transition-colors flex-shrink-0"
          >
            <X className="h-3.5 w-3.5 text-[#5B267B]" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
