import fs from "fs";
import path from "path";
import { regionBase } from "./data/region-base";

type JsonListing = {
  id: string; // scraper-generated id
  title: string;
  price: number;
  area?: number | null;
  location?: {
    zipCode?: string | null;
    city?: string | null;
    district?: string | null;
    state?: string | null;
  } | null;
  duration?: {
    isLimited: boolean;
    months?: number | null;
  } | null;
  platform: string; // e.g. 'willhaben'
  url: string;
  scrapedAt: string; // ISO string
  seller?: {
    name?: string | null;
    isPrivate?: boolean | null;
    registerDate?: string | null;
    location?: string | null;
    activeAdCount?: number | null;
    totalAdCount?: number | null;
    organisationId?: string | null;
    organisationName?: string | null;
    organisationPhone?: string | null;
    organisationEmail?: string | null;
    organisationWebsite?: string | null;
    hasProfileImage?: boolean | null;
  } | null;
  firstSeenAt?: string | null; // ISO
  lastSeenAt?: string | null; // ISO
  active?: boolean | null;
};

type SellerAggregate = {
  platform: string;
  platformSellerId: string; // required by schema
  name: string | null;
  isPrivate: boolean;
  isVerified: boolean; // default false (unknown in input)
  registerDate: string | null; // keep as text in DB
  location: string | null;
  activeAdCount: number | null;
  totalAdCount: number | null;
  organisationName: string | null;
  organisationPhone: string | null;
  organisationEmail: string | null;
  organisationWebsite: string | null;
  hasProfileImage: boolean;
  firstSeenAtMs: number; // min of scrapedAt observed
  lastSeenAtMs: number; // max of scrapedAt observed
  lastUpdatedAtMs: number; // choose lastSeenAtMs
};

function escapeString(str: string): string {
  return str.replace(/'/g, "''");
}

function toEpochMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : null;
}

function parseExternalIdFromUrl(url: string): string | null {
  // Extract trailing numeric segment if present
  const m = url.match(/(\d+)(?:\/?)(?:[#?].*)?$/);
  return m ? m[1] : null;
}

function derivePlatformSellerId(listing: JsonListing): string {
  const orgId = listing.seller?.organisationId?.trim();
  if (orgId) return orgId;
  const name = listing.seller?.name?.trim();
  if (name && name.length > 0) return `name:${name}`;
  // fall back to a stable identifier from listing id or url
  if (listing.id) return `listing:${listing.id}`;
  return `url:${listing.url}`;
}

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

type UnmatchedListingRecord = {
  id: string;
  platform: string;
  url: string;
  state: string | null;
  district: string | null;
  city: string | null;
  zipCode: string | null;
  normalizedState: string | null;
  normalizedDistrict: string | null;
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

function buildRegionIndices() {
  const idToRegion = new Map<string, RegionBaseEntry>();
  for (const r of regionBase as RegionBaseEntry[]) {
    idToRegion.set(r.id, r);
  }

  const stateKeyToSlug = new Map<string, string>();
  for (const r of regionBase as RegionBaseEntry[]) {
    if (r.type !== "state") continue;
    const bySlug = looseNormalize(r.slug);
    const byName = looseNormalize(r.name);
    if (bySlug) stateKeyToSlug.set(bySlug, r.slug);
    if (byName) stateKeyToSlug.set(byName, r.slug);
  }

  const compositeToDistrictSlug = new Map<string, string>();
  for (const r of regionBase as RegionBaseEntry[]) {
    if (r.type !== "district") continue;
    const parent = r.parent_id ? idToRegion.get(r.parent_id) : undefined;
    if (!parent) continue;

    const stateKeys = new Set<string>();
    const sk1 = looseNormalize(parent.slug);
    const sk2 = looseNormalize(parent.name);
    if (sk1) stateKeys.add(sk1);
    if (sk2) stateKeys.add(sk2);

    const districtCandidates = new Set<string>();
    const d1 = looseNormalize(r.slug);
    const d2 = looseNormalize(r.name);
    if (d1) districtCandidates.add(d1);
    if (d2) districtCandidates.add(d2);
    const baseName = r.name.replace(/\(.*?\)/g, "").trim();
    const d3 = looseNormalize(baseName);
    if (d3) districtCandidates.add(d3);
    const suffixBase = r.slug.replace(/-(stadt|land|umgebung)$/g, "");
    const d4 = looseNormalize(suffixBase);
    if (d4) districtCandidates.add(d4);
    // Add last token of slug (e.g., 'wien-12-meidling' -> 'meidling')
    const lastSlugToken = r.slug.split("-").pop();
    const d5 = looseNormalize(lastSlugToken ?? null);
    if (d5) districtCandidates.add(d5);
    // Vienna-specific: add trailing name part after comma (e.g., 'Wien 12.,Meidling' -> 'Meidling')
    const parentIsVienna =
      looseNormalize(parent.slug) === "wien" ||
      looseNormalize(parent.name) === "wien";
    if (parentIsVienna) {
      const m = r.name.match(/Wien\s*\d+\.,\s*(.+)$/i);
      if (m && m[1]) {
        const d6 = looseNormalize(m[1]);
        if (d6) districtCandidates.add(d6);
      }
    }

    for (const sk of stateKeys) {
      for (const dk of districtCandidates) {
        const key = `${sk}::${dk}`;
        if (!compositeToDistrictSlug.has(key)) {
          compositeToDistrictSlug.set(key, r.slug);
        }
      }
    }
  }

  return { stateKeyToSlug, compositeToDistrictSlug };
}

function resolveRegionSlugForListing(
  indices: ReturnType<typeof buildRegionIndices>,
  location: JsonListing["location"] | null | undefined
): string | null {
  if (!location) return null;
  const stateKey = looseNormalize(location.state);
  if (!stateKey) return null;

  const candidates: Array<string | null | undefined> = [
    location.district,
    location.city,
  ];

  // Vienna edge cases: extract district name from city string fragments
  if (stateKey === "wien" && location.city) {
    const parts = location.city.split(",");
    for (let i = parts.length - 1; i >= 0; i--) {
      const seg = parts[i].trim().replace(/\bBezirk\b/gi, "");
      if (seg) candidates.push(seg);
    }
  }

  for (const cand of candidates) {
    const districtKey = looseNormalize(cand);
    if (!districtKey) continue;
    const slug = indices.compositeToDistrictSlug.get(
      `${stateKey}::${districtKey}`
    );
    if (slug) return slug;
  }

  return null;
}

function getFiles(dir: string, pattern: RegExp): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (pattern.test(entry.name)) files.push(path.join(dir, entry.name));
  }
  // sort by filename to get predictable ordering (usually by date)
  files.sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
  return files;
}

function main(): void {
  const projectRoot = process.cwd();
  const oldDataDir = path.join(projectRoot, "app", "scripts", "old-data");
  const jsonFiles = getFiles(oldDataDir, /^listings-\d{4}-\d{2}-\d{2}\.json$/);

  if (jsonFiles.length === 0) {
    console.error("No listings-*.json files found in app/scripts/old-data");
    process.exit(1);
  }

  const sellersByKey = new Map<string, SellerAggregate>();
  const listingRows: JsonListing[] = [];

  for (const file of jsonFiles) {
    const raw = fs.readFileSync(file, "utf-8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error(`Failed to parse JSON file: ${file}`);
      throw e;
    }
    if (!Array.isArray(parsed)) continue;

    for (const item of parsed as JsonListing[]) {
      // Accumulate listings
      listingRows.push(item);

      // Aggregate sellers
      const platform = item.platform ?? "unknown";
      const platformSellerId = derivePlatformSellerId(item);
      const sellerKey = `${platform}::${platformSellerId}`;

      const scrapedAtMs = toEpochMs(item.scrapedAt) ?? Date.now();
      const name = item.seller?.name ?? null;
      const isPrivate = Boolean(item.seller?.isPrivate ?? false);
      const hasProfileImage = Boolean(item.seller?.hasProfileImage ?? false);
      const registerDate = item.seller?.registerDate ?? null;
      const location = item.seller?.location ?? null;
      const activeAdCount =
        typeof item.seller?.activeAdCount === "number"
          ? item.seller!.activeAdCount!
          : null;
      const totalAdCount =
        typeof item.seller?.totalAdCount === "number"
          ? item.seller!.totalAdCount!
          : null;
      const organisationName = item.seller?.organisationName ?? null;
      const organisationPhone = item.seller?.organisationPhone ?? null;
      const organisationEmail = item.seller?.organisationEmail ?? null;
      const organisationWebsite = item.seller?.organisationWebsite ?? null;

      const existing = sellersByKey.get(sellerKey);
      if (!existing) {
        sellersByKey.set(sellerKey, {
          platform,
          platformSellerId,
          name,
          isPrivate,
          isVerified: false,
          registerDate,
          location,
          activeAdCount,
          totalAdCount,
          organisationName,
          organisationPhone,
          organisationEmail,
          organisationWebsite,
          hasProfileImage,
          firstSeenAtMs: scrapedAtMs,
          lastSeenAtMs: scrapedAtMs,
          lastUpdatedAtMs: scrapedAtMs,
        });
      } else {
        // Update aggregate fields conservatively
        existing.name = existing.name ?? name;
        existing.isPrivate = existing.isPrivate || isPrivate;
        existing.registerDate = existing.registerDate ?? registerDate;
        existing.location = existing.location ?? location;
        existing.activeAdCount =
          existing.activeAdCount ?? activeAdCount ?? null;
        existing.totalAdCount = existing.totalAdCount ?? totalAdCount ?? null;
        existing.organisationName =
          existing.organisationName ?? organisationName;
        existing.organisationPhone =
          existing.organisationPhone ?? organisationPhone;
        existing.organisationEmail =
          existing.organisationEmail ?? organisationEmail;
        existing.organisationWebsite =
          existing.organisationWebsite ?? organisationWebsite;
        existing.hasProfileImage = existing.hasProfileImage || hasProfileImage;
        existing.firstSeenAtMs = Math.min(existing.firstSeenAtMs, scrapedAtMs);
        existing.lastSeenAtMs = Math.max(existing.lastSeenAtMs, scrapedAtMs);
        existing.lastUpdatedAtMs = Math.max(
          existing.lastUpdatedAtMs,
          scrapedAtMs
        );
      }
    }
  }

  const indices = buildRegionIndices();

  const matched: Array<{ item: JsonListing; regionSlug: string }> = [];
  const unmatched: UnmatchedListingRecord[] = [];
  const usedSellerKeys = new Set<string>();

  for (const item of listingRows) {
    const regionSlug = resolveRegionSlugForListing(
      indices,
      item.location ?? null
    );
    if (regionSlug) {
      matched.push({ item, regionSlug });
      const platform = item.platform ?? "unknown";
      const platformSellerId = derivePlatformSellerId(item);
      usedSellerKeys.add(`${platform}::${platformSellerId}`);
    } else {
      unmatched.push({
        id: item.id,
        platform: item.platform ?? "unknown",
        url: item.url,
        state: item.location?.state ?? null,
        district: item.location?.district ?? null,
        city: item.location?.city ?? null,
        zipCode: item.location?.zipCode ?? null,
        normalizedState: looseNormalize(item.location?.state),
        normalizedDistrict: looseNormalize(item.location?.district),
      });
    }
  }

  if (unmatched.length > 0) {
    const debugDir = path.join(projectRoot, "app", "scripts", "debug");
    fs.mkdirSync(debugDir, { recursive: true });
    const debugPath = path.join(
      debugDir,
      `unmatched-listings-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.json`
    );
    fs.writeFileSync(debugPath, JSON.stringify(unmatched, null, 2), "utf-8");
    console.error(
      `Region matching: ${unmatched.length} listings without region. Details written to ${debugPath}`
    );
  }

  const statements: string[] = [];

  // Sellers: conditional inserts to avoid duplicates (only those referenced by matched listings)
  for (const [sellerKey, s] of sellersByKey.entries()) {
    if (!usedSellerKeys.has(sellerKey)) continue;
    const nameValue = s.name === null ? "NULL" : `'${escapeString(s.name)}'`;
    const registerDateValue =
      s.registerDate === null ? "NULL" : `'${escapeString(s.registerDate)}'`;
    const locationValue =
      s.location === null ? "NULL" : `'${escapeString(s.location)}'`;
    const activeAdCountValue =
      s.activeAdCount === null ? "NULL" : String(s.activeAdCount);
    const totalAdCountValue =
      s.totalAdCount === null ? "NULL" : String(s.totalAdCount);
    const organisationNameValue =
      s.organisationName === null
        ? "NULL"
        : `'${escapeString(s.organisationName)}'`;
    const organisationPhoneValue =
      s.organisationPhone === null
        ? "NULL"
        : `'${escapeString(s.organisationPhone)}'`;
    const organisationEmailValue =
      s.organisationEmail === null
        ? "NULL"
        : `'${escapeString(s.organisationEmail)}'`;
    const organisationWebsiteValue =
      s.organisationWebsite === null
        ? "NULL"
        : `'${escapeString(s.organisationWebsite)}'`;

    const sql = `INSERT INTO sellers (platformSellerId, platform, name, isPrivate, isVerified, registerDate, location, activeAdCount, totalAdCount, organisationName, organisationPhone, organisationEmail, organisationWebsite, hasProfileImage, firstSeenAt, lastSeenAt, lastUpdatedAt, createdAt, updatedAt)
SELECT '${escapeString(s.platformSellerId)}', '${escapeString(
      s.platform
    )}', ${nameValue}, ${s.isPrivate ? 1 : 0}, ${
      s.isVerified ? 1 : 0
    }, ${registerDateValue}, ${locationValue}, ${activeAdCountValue}, ${totalAdCountValue}, ${organisationNameValue}, ${organisationPhoneValue}, ${organisationEmailValue}, ${organisationWebsiteValue}, ${
      s.hasProfileImage ? 1 : 0
    }, ${s.firstSeenAtMs}, ${s.lastSeenAtMs}, ${
      s.lastUpdatedAtMs
    }, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM sellers WHERE platformSellerId = '${escapeString(
    s.platformSellerId
  )}' AND platform = '${escapeString(s.platform)}'
);`;
    statements.push(sql);
  }

  // Listings: insert or ignore by unique url (only matched to a known region)
  for (const { item, regionSlug } of matched) {
    const platform = item.platform ?? "unknown";
    const platformSellerId = derivePlatformSellerId(item);

    const priceValue = typeof item.price === "number" ? item.price : 0;
    const areaValue =
      typeof item.area === "number" ? String(item.area) : "NULL";
    const roomsValue = "NULL";
    const zipValue = item.location?.zipCode
      ? `'${escapeString(item.location.zipCode)}'`
      : "NULL";
    const cityValue = item.location?.city
      ? `'${escapeString(item.location.city)}'`
      : "NULL";
    const districtValue = item.location?.district
      ? `'${escapeString(item.location.district)}'`
      : "NULL";
    const stateValue = item.location?.state
      ? `'${escapeString(item.location.state)}'`
      : "NULL";
    const latitudeValue = "NULL";
    const longitudeValue = "NULL";

    const isLimitedValue = item.duration?.isLimited ? 1 : 0;
    const durationMonthsValue =
      typeof item.duration?.months === "number"
        ? String(item.duration!.months!)
        : "NULL";

    const urlEscaped = escapeString(item.url);
    const externalId = parseExternalIdFromUrl(item.url);
    const externalIdValue = externalId ? `'${externalId}'` : "NULL";
    const platformListingIdValue = `'${escapeString(item.id)}'`;

    const firstSeenAtMs =
      toEpochMs(item.firstSeenAt) ?? toEpochMs(item.scrapedAt) ?? Date.now();
    const lastSeenAtMs =
      toEpochMs(item.lastSeenAt) ?? toEpochMs(item.scrapedAt) ?? Date.now();
    const lastScrapedAtMs = toEpochMs(item.scrapedAt);
    const isActiveValue = item.active ? 1 : 0;

    const sql = `INSERT OR IGNORE INTO listings (
  platformListingId, title, price, area, rooms, zipCode, city, district, state, latitude, longitude,
  isLimited, durationMonths,
  platform, url, externalId,
  regionId, sellerId,
  firstSeenAt, lastSeenAt, lastScrapedAt, lastVerifiedAt, deactivatedAt,
  isActive, verificationStatus, notFoundCount,
  createdAt, updatedAt
) VALUES (
  ${platformListingIdValue}, '${escapeString(
      item.title
    )}', ${priceValue}, ${areaValue}, ${roomsValue}, ${zipValue}, ${cityValue}, ${districtValue}, ${stateValue}, ${latitudeValue}, ${longitudeValue},
  ${isLimitedValue}, ${durationMonthsValue},
  '${escapeString(platform)}', '${urlEscaped}', ${externalIdValue},
  (SELECT id FROM regions WHERE slug='${escapeString(regionSlug)}'),
  (SELECT id FROM sellers WHERE platformSellerId='${escapeString(
    platformSellerId
  )}' AND platform='${escapeString(platform)}'),
  ${firstSeenAtMs}, ${lastSeenAtMs}, ${lastScrapedAtMs ?? "NULL"}, NULL, NULL,
  ${isActiveValue}, 'active', 0,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);`;
    statements.push(sql);

    // Price history row for each listing observation
    const priceHistorySql = `INSERT INTO price_history (listingId, price, observedAt, createdAt)
VALUES ((SELECT id FROM listings WHERE url='${urlEscaped}'), ${priceValue}, ${
      toEpochMs(item.scrapedAt) ?? lastSeenAtMs
    }, CURRENT_TIMESTAMP);`;
    statements.push(priceHistorySql);
  }

  // Output
  const header: string[] = [];
  header.push("-- Listings/Sellers Import SQL");
  header.push(`-- Source files: ${jsonFiles.length}`);
  header.push(`-- Total listings (matched): ${matched.length}`);
  header.push(`-- Unique sellers (matched): ${usedSellerKeys.size}`);
  header.push("");
  header.push("BEGIN TRANSACTION;");

  const footer = "COMMIT;";

  console.log(header.join("\n"));
  console.log(statements.join("\n"));
  console.log(footer);
}

main();
