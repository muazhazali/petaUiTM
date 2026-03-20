import { notFound } from "next/navigation";
import CampusMap from "./CampusMap";
import { Campus, Building } from "@/types";
import fs from "fs";
import path from "path";

async function getData() {
  const campusesPath = path.join(process.cwd(), "public", "data", "campuses.json");
  const buildingsPath = path.join(process.cwd(), "public", "data", "buildings.json");

  const campuses: Campus[] = JSON.parse(fs.readFileSync(campusesPath, "utf-8"));
  const buildings: Building[] = JSON.parse(fs.readFileSync(buildingsPath, "utf-8"));
  return { campuses, buildings };
}

export default async function CampusPage({
  params,
}: {
  params: Promise<{ campus: string }>;
}) {
  const { campus: campusId } = await params;
  const { campuses, buildings } = await getData();
  const campus = campuses.find((c) => c.id === campusId);
  if (!campus) notFound();

  const campusBuildings = buildings.filter((b) => b.campus === campusId);

  return <CampusMap campus={campus} buildings={campusBuildings} />;
}

export async function generateStaticParams() {
  const campusesPath = path.join(process.cwd(), "public", "data", "campuses.json");
  const campuses: Campus[] = JSON.parse(fs.readFileSync(campusesPath, "utf-8"));
  return campuses.map((c) => ({ campus: c.id }));
}
