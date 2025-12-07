// Shared normalization + region resolution used by scrapers and repair tools

export type RegionInput = {
  id: string | number;
  name: string;
  slug: string;
  type: "country" | "state" | "district" | "city" | string;
  parentId: string | number | null;
};

// Explicit normalization for certain district names
// Keys are normalized via looseNormalize, values are internal slugs
export const DISTRICT_NORMALIZATION: Record<string, string> = {
  braunauaminn: "braunau",
  kirchdorfanderkrems: "kirchdorf",
  riediminnkreis: "ried",
  graz: "graz-stadt",
  // Extended city mappings
  wels: "stadt-wels",
  linz: "stadt-linz",
  steyr: "stadt-steyr",
  sanktpolten: "sankt-polten-stadt",
  wienerneustadt: "wiener-neustadt-stadt",
  ruststadt: "rust-stadt",
};

export function looseNormalize(raw: string | null | undefined): string | null {
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

export function buildRegionIndices(rows: RegionInput[]) {
  const idToRegion = new Map<string, RegionInput>();
  for (const r of rows) {
    idToRegion.set(String(r.id), r);
  }

  const stateKeyToSlug = new Map<string, string>();
  for (const r of rows) {
    if (r.type !== "state") continue;
    const bySlug = looseNormalize(r.slug);
    const byName = looseNormalize(r.name);
    if (bySlug) stateKeyToSlug.set(bySlug, r.slug);
    if (byName) stateKeyToSlug.set(byName, r.slug);
  }

  const compositeToDistrictSlug = new Map<string, string>();
  const districtKeyToSlug = new Map<string, string>();
  for (const r of rows) {
    if (r.type !== "district") continue;
    const parent =
      r.parentId != null ? idToRegion.get(String(r.parentId)) : undefined;
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
    const lastSlugToken = r.slug.split("-").pop();
    const d5 = looseNormalize(lastSlugToken ?? null);
    if (d5) districtCandidates.add(d5);

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

    for (const dk of districtCandidates) {
      if (!districtKeyToSlug.has(dk)) {
        districtKeyToSlug.set(dk, r.slug);
      }
    }
  }

  return { stateKeyToSlug, compositeToDistrictSlug, districtKeyToSlug };
}

export function resolveRegionSlug(
  indices: ReturnType<typeof buildRegionIndices>,
  location: {
    state?: string | null;
    district?: string | null;
    city?: string | null;
  }
): string | null {
  const stateKey = looseNormalize(location.state);
  if (!stateKey) return null;

  const candidates: Array<string | null | undefined> = [
    location.district,
    location.city,
  ];

  if (stateKey === "wien" && location.city) {
    const parts = location.city.split(",");
    for (let i = parts.length - 1; i >= 0; i--) {
      const seg = parts[i].trim().replace(/\bBezirk\b/gi, "");
      if (seg) candidates.push(seg);
    }
  }

  for (const cand of candidates) {
    const districtKeyRaw = looseNormalize(cand);
    let districtKey = districtKeyRaw
      ? DISTRICT_NORMALIZATION[districtKeyRaw] ?? districtKeyRaw
      : null;
    if (districtKey) districtKey = looseNormalize(districtKey);
    if (!districtKey) continue;
    const slug = indices.compositeToDistrictSlug.get(
      `${stateKey}::${districtKey}`
    );
    if (slug) return slug;

    const byDistrictOnly = indices.districtKeyToSlug.get(districtKey);
    if (byDistrictOnly) return byDistrictOnly;
  }

  const noDistrictOrCity = !location.district && !location.city;
  if (noDistrictOrCity) {
    const stateSlug = indices.stateKeyToSlug.get(stateKey);
    if (stateSlug) return stateSlug;
  }

  return null;
}
