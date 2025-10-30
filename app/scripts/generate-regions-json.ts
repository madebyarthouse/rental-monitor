import fs from "fs";
import path from "path";
import { regionBase } from "./data/region-base";

type RegionBaseEntry = {
  id: string;
  name: string;
  slug: string;
  type: "country" | "state" | "district" | "city";
  parent_id: string | null;
  bounds: string | null;
  center_lat: number;
  center_lng: number;
  geojson: string | null;
  population: number | null;
  postal_codes: string | null;
};

type Position = [number, number]; // [lng, lat]
type LinearRing = Position[];
type Polygon = LinearRing[];
type MultiPolygon = Polygon[];

type Geometry =
  | { type: "MultiPolygon"; coordinates: MultiPolygon }
  | { type: "Polygon"; coordinates: Polygon };

type GeoFeature = {
  type: "Feature";
  properties: { name?: string; iso?: string };
  geometry: Geometry;
};

type FeatureCollection = {
  type: "FeatureCollection";
  features: GeoFeature[];
};

function looseNormalize(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = raw.toLowerCase();
  s = s.replace(/st\.?\s+/g, "sankt ");
  s = s
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .replace(/ae/g, "a")
    .replace(/oe/g, "o")
    .replace(/ue/g, "u");
  s = s.replace(/\(.*?\)/g, "");
  s = s.replace(/[^a-z0-9]/g, "");
  return s;
}

function extractIsoFromRegionBase(entry: RegionBaseEntry): string | null {
  if (!entry.geojson) return null;
  try {
    const parsed = JSON.parse(entry.geojson) as {
      properties?: { iso?: string | number };
    };
    const iso = parsed?.properties?.iso;
    return iso == null ? null : String(iso);
  } catch {
    return null;
  }
}

function getAllPositions(geometry: Geometry): Position[] {
  if (geometry.type === "Polygon") {
    const coords: Position[] = [];
    for (const ring of geometry.coordinates) {
      for (const p of ring) coords.push(p);
    }
    return coords;
  }
  const coords: Position[] = [];
  for (const poly of geometry.coordinates) {
    for (const ring of poly) {
      for (const p of ring) coords.push(p);
    }
  }
  return coords;
}

function computeBounds(geometry: Geometry): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  const pts = getAllPositions(geometry);
  let north = -Infinity;
  let south = Infinity;
  let east = -Infinity;
  let west = Infinity;
  for (const [lng, lat] of pts) {
    if (lat > north) north = lat;
    if (lat < south) south = lat;
    if (lng > east) east = lng;
    if (lng < west) west = lng;
  }
  return { north, south, east, west };
}

function computeCenter(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}): { lat: number; lng: number } {
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2,
  };
}

function readFeatureCollection(absPath: string): FeatureCollection {
  const raw = fs.readFileSync(absPath, "utf-8");
  const parsed = JSON.parse(raw) as FeatureCollection;
  return parsed;
}

function main(): void {
  const projectRoot = process.cwd();
  const statesPath = path.join(
    projectRoot,
    "app",
    "scripts",
    "data",
    "geojson",
    "laender_999_geo.json"
  );
  const districtsPath = path.join(
    projectRoot,
    "app",
    "scripts",
    "data",
    "geojson",
    "bezirke_999_geo.json"
  );

  const statesFc = readFeatureCollection(statesPath);
  const districtsFc = readFeatureCollection(districtsPath);

  const stateIsoToRb = new Map<string, RegionBaseEntry>();
  const stateNameKeyToRb = new Map<string, RegionBaseEntry>();
  const districtIsoToRb = new Map<string, RegionBaseEntry>();
  const districtNameKeyToRb = new Map<string, RegionBaseEntry>();

  for (const rb of regionBase as RegionBaseEntry[]) {
    if (rb.type === "state") {
      const iso = extractIsoFromRegionBase(rb);
      if (iso) stateIsoToRb.set(iso, rb);
      const k1 = looseNormalize(rb.name);
      const k2 = looseNormalize(rb.slug);
      if (k1) stateNameKeyToRb.set(k1, rb);
      if (k2) stateNameKeyToRb.set(k2, rb);
    } else if (rb.type === "district") {
      const iso = extractIsoFromRegionBase(rb);
      if (iso) districtIsoToRb.set(iso, rb);
      const k1 = looseNormalize(rb.name);
      const k2 = looseNormalize(rb.slug);
      if (k1) districtNameKeyToRb.set(k1, rb);
      if (k2) districtNameKeyToRb.set(k2, rb);
    }
  }

  const result: RegionBaseEntry[] = [];
  const unmatchedStates: string[] = [];
  const unmatchedDistricts: string[] = [];

  // Manually include specific unmatched districts (excluding Wien(Stadt))
  const manualDistrictIsoWhitelist = new Set<string>([
    "209", // Wolfsberg
    "611", // Leoben
    "306", // Baden
    "802", // Bregenz
    "803", // Dornbirn
    "804", // Feldkirch
  ]);

  // Manually include Austria root country entry first
  const countryRoot: RegionBaseEntry = {
    id: "at",
    name: "Österreich",
    slug: "oesterreich",
    type: "country",
    parent_id: null,
    bounds: JSON.stringify({
      north: 49.0211,
      south: 46.3723,
      east: 17.1608,
      west: 9.5307,
    }),
    center_lat: 47.5162,
    center_lng: 14.5501,
    geojson: null,
    population: null,
    postal_codes: null,
  };
  result.push(countryRoot);

  for (const f of statesFc.features) {
    const iso = f.properties.iso ? String(f.properties.iso) : null;
    const name = f.properties.name ?? "";
    let rb: RegionBaseEntry | undefined;
    if (iso && stateIsoToRb.has(iso)) rb = stateIsoToRb.get(iso);
    if (!rb) {
      const key = looseNormalize(name);
      if (key && stateNameKeyToRb.has(key)) rb = stateNameKeyToRb.get(key);
    }
    if (!rb) {
      unmatchedStates.push(`${iso ?? "?"}::${name}`);
      continue;
    }
    const bbox = computeBounds(f.geometry);
    const center = computeCenter(bbox);
    const entry: RegionBaseEntry = {
      id: rb.id,
      name: rb.name,
      slug: rb.slug,
      type: "state",
      parent_id: rb.parent_id,
      bounds: JSON.stringify(bbox),
      center_lat: center.lat,
      center_lng: center.lng,
      geojson: JSON.stringify(f),
      population: null,
      postal_codes: null,
    };
    result.push(entry);
  }

  for (const f of districtsFc.features) {
    const iso = f.properties.iso ? String(f.properties.iso) : null;
    const name = f.properties.name ?? "";
    let rb: RegionBaseEntry | undefined;
    if (iso && districtIsoToRb.has(iso)) rb = districtIsoToRb.get(iso);
    if (!rb) {
      const key = looseNormalize(name);
      if (key && districtNameKeyToRb.has(key))
        rb = districtNameKeyToRb.get(key);
    }
    if (!rb) {
      // Allowlist-based inclusion for specific districts even if not in regionBase
      if (iso && manualDistrictIsoWhitelist.has(iso)) {
        const bbox = computeBounds(f.geometry);
        const center = computeCenter(bbox);

        let parentId: string | null = null;
        let parentSlugPart = "unknown";
        const n = Number(iso);
        if (Number.isFinite(n)) {
          const stateIso = String(Math.floor(n / 100));
          const stateRb = stateIsoToRb.get(stateIso);
          if (stateRb) {
            parentId = stateRb.id;
            parentSlugPart = stateRb.slug;
          }
        }

        const slug = name.toLowerCase();
        const idBase = slug.replace(/\s+/g, "-");
        const id = `at-${parentSlugPart}-${idBase}`;

        const entry: RegionBaseEntry = {
          id,
          name,
          slug,
          type: "district",
          parent_id: parentId,
          bounds: JSON.stringify(bbox),
          center_lat: center.lat,
          center_lng: center.lng,
          geojson: JSON.stringify(f),
          population: null,
          postal_codes: null,
        };
        result.push(entry);
        continue;
      }

      unmatchedDistricts.push(`${iso ?? "?"}::${name}`);
      continue;
    }
    const bbox = computeBounds(f.geometry);
    const center = computeCenter(bbox);
    const entry: RegionBaseEntry = {
      id: rb.id,
      name: rb.name,
      slug: rb.slug,
      type: "district",
      parent_id: rb.parent_id,
      bounds: JSON.stringify(bbox),
      center_lat: center.lat,
      center_lng: center.lng,
      geojson: JSON.stringify(f),
      population: null,
      postal_codes: null,
    };
    result.push(entry);
  }

  if (unmatchedStates.length > 0) {
    console.error(`Unmatched states: ${unmatchedStates.length}`);
    for (const u of unmatchedStates) console.error(`  ${u}`);
  }
  if (unmatchedDistricts.length > 0) {
    console.error(`Unmatched districts: ${unmatchedDistricts.length}`);
    for (const u of unmatchedDistricts) console.error(`  ${u}`);
  }

  console.log(JSON.stringify(result, null, 2));
}

main();
