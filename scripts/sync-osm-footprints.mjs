#!/usr/bin/env node
// Sync building footprints in public/data/buildings.json from OpenStreetMap.
//
// Usage:
//   node scripts/sync-osm-footprints.mjs --campus shah-alam            (dry run)
//   node scripts/sync-osm-footprints.mjs --campus shah-alam --write
//   node scripts/sync-osm-footprints.mjs --campus shah-alam --write --ollama
//
// Options:
//   --campus <id>        campus id from campuses.json (required)
//   --write              write changes back (default is dry run)
//   --max-distance <m>   keep footprint only if centroid is within this many
//                        metres of the building's coords (default 200)
//   --min-area <m2>      ignore OSM footprints smaller than this (default 40)
//   --simplify <m>       RDP simplification tolerance in metres (default 1.5)
//   --endpoint <url>     Overpass endpoint (default kumi.systems mirror)
//   --ollama             use Ollama to confirm ambiguous name matches
//   --ollama-model <m>   Ollama model (default from OLLAMA_MODEL or llama3.1)
//
// Requires OLLAMA_API_KEY for --ollama (or a self-hosted URL via OLLAMA_URL).

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const CAMPUSES = path.join(ROOT, "public", "data", "campuses.json");
const BUILDINGS = path.join(ROOT, "public", "data", "buildings.json");

const DEFAULT_ENDPOINT = "https://overpass.openstreetmap.fr/api/interpreter";

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  return next && !next.startsWith("--") ? next : true;
}

const opts = {
  campus: arg("campus"),
  write: Boolean(arg("write", false)),
  maxDistance: Number(arg("max-distance", 200)),
  minArea: Number(arg("min-area", 40)),
  simplify: Number(arg("simplify", 1.5)),
  minSim: Number(arg("min-sim", 0.5)),
  endpoint: arg("endpoint", DEFAULT_ENDPOINT),
  ollama: Boolean(arg("ollama", false)),
  ollamaModel: arg("ollama-model", process.env.OLLAMA_MODEL || "llama3.1"),
};

if (!opts.campus) {
  console.error("error: --campus <id> is required");
  process.exit(1);
}

const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;
const round6 = (n) => Math.round(n * 1e6) / 1e6;

function haversine(a, b) {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function makeProjection(centerLat, centerLng) {
  const mPerLat = 110540;
  const mPerLng = 111320 * Math.cos(rad(centerLat));
  return {
    to: ([lng, lat]) => [(lng - centerLng) * mPerLng, (lat - centerLat) * mPerLat],
    from: ([x, y]) => [x / mPerLng + centerLng, y / mPerLat + centerLat],
  };
}

function ringCentroid(ring, proj) {
  const pts = ring.map(proj.to);
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    const cross = x1 * y2 - x2 * y1;
    a += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  a *= 0.5;
  if (Math.abs(a) < 1e-9) {
    const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    return [mx, my];
  }
  return [cx / (6 * a), cy / (6 * a)];
}

function ringArea(ring, proj) {
  const pts = ring.map(proj.to);
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

function normalize(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(kolej|kediaman|fakulti|kompleks|bangunan|dewan|pusat|blok|block|uitm|the|of|and)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set(["faculty", "kompleks", "kolej", "kediaman", "bangunan", "dewan", "pusat"]);

function tokenSet(s) {
  return new Set(normalize(s).split(" ").filter((t) => t.length > 2 && !STOP.has(t)));
}

function nameSimilarity(a, b) {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (A.size === 0 || B.size === 0) return 0;
  let shared = 0;
  for (const t of A) if (B.has(t)) shared++;
  const dice = (2 * shared) / (A.size + B.size);
  const na = normalize(a);
  const nb = normalize(b);
  const substr = na && nb && (na.includes(nb) || nb.includes(na)) ? 0.85 : 0;
  return Math.max(dice, substr);
}

function perpendicular(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
  const cx = a[0] + t * dx;
  const cy = a[1] + t * dy;
  return Math.hypot(p[0] - cx, p[1] - cy);
}

function rdp(points, epsilon) {
  if (points.length < 3) return points;
  let maxD = 0;
  let idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicular(points[i], points[0], points[points.length - 1]);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD > epsilon) {
    const left = rdp(points.slice(0, idx + 1), epsilon);
    const right = rdp(points.slice(idx), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}

function simplifyRing(ring, proj, tolerance) {
  const open = ring.slice(0, -1);
  const projected = open.map(proj.to);
  const closed = [...projected, projected[0]];
  const simplified = rdp(closed, tolerance).slice(0, -1);
  return simplified.map(proj.from);
}

async function overpass(bbox, endpoint) {
  const [south, west, north, east] = bbox;
  const query = `[out:json][timeout:180];way["building"](${south},${west},${north},${east});out geom;`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "PetaUiTM/0.1 (footprint sync)",
    },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.elements ?? [];
}

function footprintFromWay(way, proj, minArea, tolerance) {
  if (!Array.isArray(way.geometry) || way.geometry.length < 4) return null;
  let ring = way.geometry.map((p) => [p.lon, p.lat]);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) ring = ring.slice(0, -1);
  if (ring.length < 3) return null;
  const area = ringArea(ring, proj);
  if (area < minArea) return null;
  const [cx, cy] = ringCentroid(ring, proj);
  const [lng, lat] = proj.from([cx, cy]);
  return {
    ring: simplifyRing(ring, proj, tolerance),
    area,
    centroid: [lat, lng],
    osmId: `way/${way.id}`,
    name: way.tags?.name ?? "",
  };
}

async function ollamaConfirm(building, candidate) {
  const key = process.env.OLLAMA_API_KEY;
  if (!key) return null;
  const url = process.env.OLLAMA_URL || "https://ollama.com/api/chat";
  const prompt =
    `Building name: ${building.name} (${building.shortName}). ` +
    `OpenStreetMap candidate: ${candidate.name || "(unnamed)"}. ` +
    `Is this the same building? Answer strictly yes or no.`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: opts.ollamaModel,
        messages: [
          { role: "system", content: "You match a building to an OSM footprint. Reply only yes or no." },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = (data.message?.content ?? data.response ?? "").trim().toLowerCase();
    return text.startsWith("y");
  } catch {
    return null;
  }
}

async function main() {
  const campuses = JSON.parse(fs.readFileSync(CAMPUSES, "utf-8"));
  const campus = campuses.find((c) => c.id === opts.campus);
  if (!campus) {
    console.error(`error: campus "${opts.campus}" not found`);
    process.exit(1);
  }

  const buildings = JSON.parse(fs.readFileSync(BUILDINGS, "utf-8"));
  const targets = buildings.filter((b) => b.campus === opts.campus);
  if (targets.length === 0) {
    console.error(`error: no buildings for campus "${opts.campus}"`);
    process.exit(1);
  }

  const proj = makeProjection(campus.center[1], campus.center[0]);

  const [[minLng, minLat], [maxLng, maxLat]] = campus.bounds;
  const bbox = [minLat, minLng, maxLat, maxLng];

  console.log(`Campus: ${campus.name} (${opts.campus})`);
  console.log(`Querying Overpass ${opts.endpoint} …`);
  const elements = await overpass(bbox, opts.endpoint);
  console.log(`OSM ways returned: ${elements.length}`);

  const footprints = elements
    .map((w) => footprintFromWay(w, proj, opts.minArea, opts.simplify))
    .filter(Boolean);

  console.log(`Usable footprints (>= ${opts.minArea} m²): ${footprints.length}\n`);

  let updated = 0;
  let skipped = 0;
  let reviewed = 0;
  const report = [];

  for (const b of targets) {
    // rank candidates by name similarity first, then distance
    const scored = footprints
      .map((fp) => ({
        fp,
        dist: haversine(b.coords, fp.centroid),
        sim: Math.max(nameSimilarity(b.name, fp.name), nameSimilarity(b.shortName, fp.name)),
      }))
      .sort((x, y) => y.sim - x.sim || x.dist - y.dist);

    const nearest = scored.reduce((m, s) => (s.dist < m.dist ? s : m), scored[0]);
    const named = scored.find((s) => s.sim >= opts.minSim && s.dist <= opts.maxDistance);

    let chosen = null;
    let reason = "";

    if (named && named.dist <= opts.maxDistance) {
      chosen = named.fp;
      reason = `name="${named.fp.name}" sim=${named.sim.toFixed(2)} d=${named.dist.toFixed(0)}m`;
    } else if (
      nearest &&
      nearest.dist <= 25 &&
      (nearest.fp.name === "" || nearest.sim >= 0.25)
    ) {
      chosen = nearest.fp;
      reason = `nearest d=${nearest.dist.toFixed(0)}m (weak/unnamed) OSM="${nearest.fp.name}"`;
    }

    if (!chosen) {
      skipped++;
      report.push(
        `SKIP   ${b.shortName.padEnd(12)} no confident match (nearest d=${nearest?.dist.toFixed(0)}m OSM="${nearest?.fp.name ?? ""}")`
      );
      continue;
    }

    // Name strongly disagrees and candidate is far → needs human review
    const sim = Math.max(nameSimilarity(b.name, chosen.name), nameSimilarity(b.shortName, chosen.name));
    const dist = haversine(b.coords, chosen.centroid);
    if (chosen.name && sim < opts.minSim && dist > 25) {
      let note = `OSM="${chosen.name}" sim=${sim.toFixed(2)} d=${dist.toFixed(0)}m`;
      if (opts.ollama) {
        const verdict = await ollamaConfirm(b, chosen);
        if (verdict === true) {
          note += " +ollama:yes";
          b.polygon = chosen.ring.map(([lng, lat]) => [round6(lng), round6(lat)]);
          b.coords = [round6(chosen.centroid[0]), round6(chosen.centroid[1])];
          b.osm = chosen.osmId;
          updated++;
          report.push(`OK*    ${b.shortName.padEnd(12)} ${note}`);
          continue;
        }
        note += verdict === false ? " +ollama:no" : " +ollama:unavailable";
      }
      reviewed++;
      report.push(`REVIEW ${b.shortName.padEnd(12)} ${note}`);
      continue;
    }

    b.polygon = chosen.ring.map(([lng, lat]) => [round6(lng), round6(lat)]);
    b.coords = [round6(chosen.centroid[0]), round6(chosen.centroid[1])];
    b.osm = chosen.osmId;
    updated++;
    report.push(
      `OK     ${b.shortName.padEnd(12)} ${reason} pts=${chosen.ring.length} area=${chosen.area.toFixed(0)}m²`
    );
  }

  console.log(report.join("\n"));
  console.log(`\nUpdated: ${updated}  Skipped: ${skipped}  Review: ${reviewed}  Total: ${targets.length}`);

  if (!opts.write) {
    console.log("\nDry run — no file written. Re-run with --write to apply.");
    return;
  }

  fs.writeFileSync(BUILDINGS, JSON.stringify(buildings, null, 2) + "\n", "utf-8");
  console.log(`\nWrote ${path.relative(ROOT, BUILDINGS)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
