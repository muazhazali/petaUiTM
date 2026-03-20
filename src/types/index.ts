export interface Campus {
  id: string;
  name: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  bounds: [[number, number], [number, number]];
}

export interface Building {
  id: string;
  campus: string;
  name: string;
  shortName: string;
  coords: [number, number]; // [lat, lng]
  polygon: [number, number][]; // array of [lng, lat]
  floors: number;
  facilities: string[];
  hours: string;
  description?: string;
}

export interface Room {
  id: string;
  name: string;
  floor: number;
  type: string;
  capacity: number;
  svgElementId: string;
}

export type POICategory = "food" | "mosque" | "atm" | "parking" | "bus" | "health" | "library";

export interface POI {
  id: string;
  campus: string;
  name: string;
  category: POICategory;
  coords: [number, number]; // [lat, lng]
  description?: string;
}

export interface SearchResult {
  type: 'building' | 'room';
  item: Building | Room;
  buildingId?: string;
}
