/// <reference types="node" />
import fs from "fs";
import path from "path";

interface RegionData {
  center_lat: number;
  center_lng: number;
  id: string;
  name: string;
  parent_id: string | null;
  slug: string;
  type: string;
  bounds: string | null;
  geojson: string | null;
}

interface TransformedRegion {
  id: number;
  name: string;
  slug: string;
  type: string;
  parentId: number | null;
  centerLat: number;
  centerLng: number;
  bounds: string | null;
  geojson: string | null;
}

function escapeString(str: string): string {
  return str.replace(/'/g, "''");
}

function transformRegions(regions: RegionData[]): TransformedRegion[] {
  // Create a mapping from string ID to integer ID
  const idMap = new Map<string, number>();

  regions.forEach((region, index) => {
    idMap.set(region.id, index + 1);
  });

  // Transform regions with integer IDs
  return regions.map((region, index) => ({
    id: index + 1,
    name: region.name,
    slug: region.slug,
    type: region.type,
    parentId: region.parent_id ? idMap.get(region.parent_id) ?? null : null,
    centerLat: region.center_lat,
    centerLng: region.center_lng,
    bounds: region.bounds ?? null,
    geojson: region.geojson ?? null,
  }));
}

function generateInsertStatements(regions: TransformedRegion[]): string {
  const statements: string[] = [];

  for (const region of regions) {
    const parentIdValue = region.parentId === null ? "NULL" : region.parentId;
    const boundsValue =
      region.bounds === null ? "NULL" : `'${escapeString(region.bounds)}'`;
    const geojsonValue =
      region.geojson === null ? "NULL" : `'${escapeString(region.geojson)}'`;

    const sql = `INSERT INTO regions (id, name, slug, type, parentId, centerLat, centerLng, bounds, geojson, createdAt, updatedAt) VALUES (${
      region.id
    }, '${escapeString(region.name)}', '${escapeString(region.slug)}', '${
      region.type
    }', ${parentIdValue}, ${region.centerLat}, ${
      region.centerLng
    }, ${boundsValue}, ${geojsonValue}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`;

    statements.push(sql);
  }

  return statements.join("\n");
}

// Main execution
const regionsJsonPath = path.join(
  process.cwd(),
  "app",
  "scripts",
  "data",
  "regions.json"
);

let regions: RegionData[] = [];
try {
  const raw = fs.readFileSync(regionsJsonPath, "utf-8");
  regions = JSON.parse(raw) as RegionData[];
} catch (e) {
  console.error(
    `Failed to read regions JSON at ${regionsJsonPath}. Generate it with: pnpm run data:generate-regions-json`
  );
  throw e;
}

const transformedRegions = transformRegions(regions);
const sql = generateInsertStatements(transformedRegions);

console.log("-- Region Import SQL");
console.log("-- Total regions:", transformedRegions.length);
console.log();
console.log(sql);
