import {
  Utensils,
  MoonStar,
  Banknote,
  CircleParking,
  Bus,
  HeartPulse,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import type { POICategory } from "@/types";

export interface POIMeta {
  id: POICategory;
  label: string;
  color: string;
  Icon: LucideIcon;
  /** Inner SVG markup (24x24 viewBox, stroked) for Leaflet divIcon markers. */
  markup: string;
}

export const POI_META: POIMeta[] = [
  {
    id: "food",
    label: "Food",
    color: "#F5BF32",
    Icon: Utensils,
    markup:
      '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  },
  {
    id: "mosque",
    label: "Prayer",
    color: "#5B267B",
    Icon: MoonStar,
    markup:
      '<path d="M18 5h4"/><path d="M20 3v4"/><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>',
  },
  {
    id: "atm",
    label: "ATM",
    color: "#17245B",
    Icon: Banknote,
    markup:
      '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  },
  {
    id: "parking",
    label: "Parking",
    color: "#8547A9",
    Icon: CircleParking,
    markup:
      '<circle cx="12" cy="12" r="10"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
  },
  {
    id: "bus",
    label: "Bus",
    color: "#C79A14",
    Icon: Bus,
    markup:
      '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>',
  },
  {
    id: "health",
    label: "Clinic",
    color: "#B03A2B",
    Icon: HeartPulse,
    markup:
      '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/><path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
  },
  {
    id: "library",
    label: "Library",
    color: "#374C9E",
    Icon: BookOpen,
    markup:
      '<path d="M12 5v16"/><path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"/>',
  },
];

export const POI_BY_ID: Record<POICategory, POIMeta> = POI_META.reduce(
  (acc, meta) => {
    acc[meta.id] = meta;
    return acc;
  },
  {} as Record<POICategory, POIMeta>
);

export const POI_COLORS: Record<POICategory, string> = POI_META.reduce(
  (acc, meta) => {
    acc[meta.id] = meta.color;
    return acc;
  },
  {} as Record<POICategory, string>
);

/** Build the inner SVG markup for a category marker (24x24 viewBox). */
export function poiIconMarkup(category: POICategory, size = 18): string {
  const meta = POI_BY_ID[category];
  const inner = meta?.markup ?? "";
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}
