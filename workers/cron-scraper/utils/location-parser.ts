export const VIENNA_ZIP_TO_DISTRICT: Record<string, string> = {
  "1010": "Innere Stadt",
  "1020": "Leopoldstadt",
  "1030": "Landstraße",
  "1040": "Wieden",
  "1050": "Margareten",
  "1060": "Mariahilf",
  "1070": "Neubau",
  "1080": "Josefstadt",
  "1090": "Alsergrund",
  "1100": "Favoriten",
  "1110": "Simmering",
  "1120": "Meidling",
  "1130": "Hietzing",
  "1140": "Penzing",
  "1150": "Rudolfsheim-Fünfhaus",
  "1160": "Ottakring",
  "1170": "Hernals",
  "1180": "Währing",
  "1190": "Döbling",
  "1200": "Brigittenau",
  "1210": "Floridsdorf",
  "1220": "Donaustadt",
  "1230": "Liesing",
};

export const VIENNA_DISTRICT_TO_ZIP: Record<string, string> = Object.fromEntries(
  Object.entries(VIENNA_ZIP_TO_DISTRICT).map(([zip, district]) => [
    normalizeDistrictName(district),
    zip,
  ])
);

export const STATE_URL_TO_NAME: Record<string, string> = {
  wien: "Wien",
  niederoesterreich: "Niederösterreich",
  niederosterreich: "Niederösterreich",
  oberoesterreich: "Oberösterreich",
  oberosterreich: "Oberösterreich",
  steiermark: "Steiermark",
  kaernten: "Kärnten",
  karnten: "Kärnten",
  salzburg: "Salzburg",
  tirol: "Tirol",
  vorarlberg: "Vorarlberg",
  burgenland: "Burgenland",
};

export function normalizeDistrictName(district: string): string {
  return district
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseViennaCityField(city: string): {
  cleanCity: string;
  district?: string;
  districtNumber?: string;
} {
  if (!city || !city.includes("Bezirk")) return { cleanCity: city };
  const m = city.match(/Wien,?\s+(\d{1,2})\.\s+Bezirk,?\s*(.+)?/i);
  if (m) {
    const districtNumber = m[1].padStart(2, "0");
    const districtNameFromCity = m[2]?.trim();
    const zipCode = `1${districtNumber}0`;
    let district = VIENNA_ZIP_TO_DISTRICT[zipCode];
    if (!district && districtNameFromCity) district = districtNameFromCity;
    return { cleanCity: "Wien", district, districtNumber };
  }
  return { cleanCity: city };
}

export function extractViennaDistrictFromUrlSegment(segment: string): {
  district?: string;
  zipCode?: string;
} {
  if (!segment || !segment.startsWith("wien-")) return {};
  const parts = segment.split("-");
  if (parts.length < 3) return {};
  const zipCode = parts[1];
  if (!/^1\d{2}0$/.test(zipCode)) return {};
  const district = VIENNA_ZIP_TO_DISTRICT[zipCode];
  return { district, zipCode };
}

export function extractLocationFromWillhabenUrl(url: string): {
  state?: string;
  district?: string;
  zipCode?: string;
} {
  try {
    const urlPath = new URL(url).pathname;
    const pathParts = urlPath.split("/").filter(Boolean);
    const propertyTypeIndex = pathParts.findIndex((p) =>
      ["mietwohnungen", "neubauprojekt", "eigentumswohnungen"].includes(p)
    );
    if (propertyTypeIndex === -1 || propertyTypeIndex + 2 >= pathParts.length) return {};
    const stateSegment = pathParts[propertyTypeIndex + 1];
    const districtSegment = pathParts[propertyTypeIndex + 2];
    if (/\d{5,}$/.test(districtSegment)) {
      const state = STATE_URL_TO_NAME[stateSegment.toLowerCase()] || stateSegment;
      return { state };
    }
    const state = STATE_URL_TO_NAME[stateSegment.toLowerCase()] || stateSegment;
    if (state === "Wien") {
      const vienna = extractViennaDistrictFromUrlSegment(districtSegment);
      return { state, ...vienna };
    }
    return { state, district: districtSegment };
  } catch {
    return {};
  }
}

export function getViennaDistrictFromZip(zip: string): string | undefined {
  return VIENNA_ZIP_TO_DISTRICT[zip];
}

export function getViennaZipFromDistrict(district: string): string | undefined {
  const normalized = normalizeDistrictName(district);
  return VIENNA_DISTRICT_TO_ZIP[normalized];
}

export interface LocationData {
  zipCode?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
}

export function enhanceLocationData(location: LocationData, url?: string): LocationData {
  const enhanced: LocationData = { ...location };
  if (url) {
    const urlLoc = extractLocationFromWillhabenUrl(url);
    if (urlLoc.state && !enhanced.state) enhanced.state = urlLoc.state;
    if (urlLoc.district && !enhanced.district) enhanced.district = urlLoc.district;
    if (urlLoc.zipCode && !enhanced.zipCode) enhanced.zipCode = urlLoc.zipCode;
  }
  if (
    enhanced.district &&
    (enhanced.district.includes("zimmerwohnung") ||
      enhanced.district.includes("wohnung") ||
      /\d{5,}$/.test(enhanced.district))
  ) {
    enhanced.district = null;
  }
  if (enhanced.city && enhanced.state === "Wien") {
    const parsed = parseViennaCityField(enhanced.city);
    enhanced.city = parsed.cleanCity;
    if (parsed.district && !enhanced.district) enhanced.district = parsed.district;
    if (parsed.districtNumber && !enhanced.zipCode) enhanced.zipCode = `1${parsed.districtNumber}0`;
  }
  if (enhanced.state === "Wien") {
    if (enhanced.zipCode && !enhanced.district) {
      const d = getViennaDistrictFromZip(enhanced.zipCode);
      if (d) enhanced.district = d;
    }
    if (enhanced.district && !enhanced.zipCode) {
      const z = getViennaZipFromDistrict(enhanced.district);
      if (z) enhanced.zipCode = z;
    }
    if (enhanced.district && enhanced.zipCode) {
      const official = getViennaDistrictFromZip(enhanced.zipCode);
      if (official) enhanced.district = official;
    }
  }
  return enhanced;
}


