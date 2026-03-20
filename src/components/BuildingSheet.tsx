"use client";

import { Building, Room } from "@/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Layers, Building2, FlaskConical } from "lucide-react";
import { useEffect, useState } from "react";

interface BuildingSheetProps {
  building: Building | null;
  onClose: () => void;
}

const typeColors: Record<string, string> = {
  lecture_hall: "bg-blue-100 text-blue-800",
  lab: "bg-green-100 text-green-800",
  office: "bg-purple-100 text-purple-800",
  default: "bg-gray-100 text-gray-800",
};

export default function BuildingSheet({ building, onClose }: BuildingSheetProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedFloor, setSelectedFloor] = useState(1);

  useEffect(() => {
    if (!building) {
      setRooms([]);
      return;
    }
    fetch(`/data/rooms/${building.id}.json`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setRooms)
      .catch(() => setRooms([]));
    setSelectedFloor(1);
  }, [building]);

  const floorRooms = rooms.filter((r) => r.floor === selectedFloor);
  const floors = Array.from({ length: building?.floors ?? 0 }, (_, i) => i + 1);

  return (
    <Sheet open={!!building} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {building && (
          <>
            <SheetHeader className="pb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <SheetTitle className="text-left text-lg leading-tight">{building.name}</SheetTitle>
                  <Badge variant="outline" className="mt-1">{building.shortName}</Badge>
                </div>
              </div>
            </SheetHeader>

            {building.description && (
              <p className="text-sm text-gray-600 mb-4">{building.description}</p>
            )}

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{building.hours}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Layers className="h-4 w-4 text-gray-400" />
                <span>{building.floors} floors</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Facilities</p>
              <div className="flex flex-wrap gap-2">
                {building.facilities.map((f) => (
                  <Badge key={f} variant="secondary" className="text-xs capitalize">{f}</Badge>
                ))}
              </div>
            </div>

            {rooms.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FlaskConical className="h-4 w-4 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rooms</p>
                  </div>

                  <div className="flex gap-1 mb-3 flex-wrap">
                    {floors.map((f) => (
                      <button
                        key={f}
                        onClick={() => setSelectedFloor(f)}
                        className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                          selectedFloor === f
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        L{f}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {floorRooms.length === 0 ? (
                      <p className="text-xs text-gray-400">No room data for this floor.</p>
                    ) : (
                      floorRooms.map((room) => (
                        <div key={room.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{room.name}</p>
                            <p className="text-xs text-gray-500 capitalize">
                              {room.type.replace("_", " ")} · Cap: {room.capacity}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              typeColors[room.type] ?? typeColors.default
                            }`}
                          >
                            {room.type.replace("_", " ")}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
