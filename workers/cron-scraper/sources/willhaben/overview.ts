import { fetchHtml } from "../../lib/http";
import type {
  WillhabenResultPage,
  AdvertSummary,
  SearchResult,
} from "./types/result-page";

export interface OverviewItem {
  id: string;
  url: string;
  title: string;
  price?: number;
  area?: number;
  rooms?: number;
  zipCode?: string;
  city?: string;
  district?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  isPrivate?: boolean;
  platformSellerId?: string;
}

function extractJson(html: string): WillhabenResultPage | null {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!match || !match[1]) return null;
  try {
    return JSON.parse(match[1]) as WillhabenResultPage;
  } catch {
    return null;
  }
}

function extractSeoUrl(listing: AdvertSummary): string | undefined {
  const seoUrlAttr = listing.attributes.attribute.find(
    (a) => a.name === "SEO_URL"
  );
  return seoUrlAttr?.values?.[0];
}

function getAttr(listing: AdvertSummary, name: string): string | undefined {
  const a = listing.attributes.attribute.find((x) => x.name === name);
  return a?.values?.[0];
}

export async function fetchOverview(
  page: number,
  rows: number
): Promise<string> {
  const url =
    "https://www.willhaben.at/iad/immobilien/mietwohnungen/mietwohnung-angebote";
  const u = new URL(url);
  u.searchParams.set("rows", String(rows));
  u.searchParams.set("page", String(page));
  u.searchParams.set("isNavigation", "true");
  // Optional: stable sfId seems not required for basic paging
  return await fetchHtml(u.toString());
}

export function parseOverview(html: string): OverviewItem[] {
  const json = extractJson(html);
  if (!json?.props?.pageProps?.searchResult) return [];
  const list =
    json.props.pageProps.searchResult.advertSummaryList.advertSummary;
  return list.map((ad) => {
    const seo = extractSeoUrl(ad);
    const url = seo
      ? `https://willhaben.at/iad/${seo}`
      : `https://willhaben.at/iad/immobilien/d/${ad.id}`;

    const priceStr =
      getAttr(ad, "RENT/PER_MONTH_LETTINGS") ??
      getAttr(ad, "PRICE") ??
      undefined;
    let price: number | undefined = undefined;
    if (priceStr != null) {
      const n = parseFloat(priceStr.replace(/[^0-9.,]/g, "").replace(",", "."));
      price = Number.isFinite(n) ? n : undefined;
    }

    const areaStr =
      getAttr(ad, "ESTATE_SIZE/LIVING_AREA") ??
      getAttr(ad, "ESTATE_SIZE") ??
      undefined;
    let area: number | undefined = undefined;
    if (areaStr != null) {
      const a = parseFloat(areaStr.replace(",", "."));
      area = Number.isFinite(a) ? a : undefined;
    }

    const roomsStr = getAttr(ad, "NUMBER_OF_ROOMS");
    let rooms: number | undefined = undefined;
    if (roomsStr != null) {
      const r = parseInt(roomsStr.replace(/[^0-9]/g, ""), 10);
      rooms = Number.isFinite(r) ? r : undefined;
    }

    const zipCode = getAttr(ad, "POSTCODE");
    const city = getAttr(ad, "LOCATION");
    const district = getAttr(ad, "DISTRICT");
    const state = getAttr(ad, "STATE");

    const coords = getAttr(ad, "COORDINATES");
    let latitude: number | undefined;
    let longitude: number | undefined;
    if (coords && coords.includes(",")) {
      const [latStr, lngStr] = coords.split(",");
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!Number.isNaN(lat)) latitude = lat;
      if (!Number.isNaN(lng)) longitude = lng;
    }

    const isPrivateStr = getAttr(ad, "ISPRIVATE");
    const isPrivate = isPrivateStr
      ? isPrivateStr === "1" || isPrivateStr.toLowerCase() === "true"
      : undefined;

    const platformSellerId = getAttr(ad, "ORG_UUID");

    const normalizedId = String(ad.id).replace(/[^0-9A-Za-z_\-]/g, "");
    if (normalizedId !== ad.id) {
      console.warn(
        `[willhaben] normalized id mismatch: ${ad.id} -> ${normalizedId}`
      );
    }

    return {
      id: normalizedId,
      url,
      title: ad.description,
      price,
      area,
      rooms,
      zipCode,
      city,
      district,
      state,
      latitude,
      longitude,
      isPrivate,
      platformSellerId,
    };
  });
}

export function extractOverviewDebug(html: string): {
  hasNextData: boolean;
  hasSearchResult: boolean;
  pageRequested?: number;
  rowsRequested?: number;
  rowsFound?: number;
  rowsReturned?: number;
  itemsCount?: number;
} {
  const json = extractJson(html);
  const hasNextData = !!json;
  const sr: SearchResult | undefined = json?.props?.pageProps?.searchResult as
    | SearchResult
    | undefined;
  const hasSearchResult = !!sr;
  const pageRequested = sr?.pageRequested;
  const rowsRequested = sr?.rowsRequested;
  const rowsFound = sr?.rowsFound;
  const rowsReturned = sr?.rowsReturned;
  const items = sr?.advertSummaryList?.advertSummary;
  const itemsCount = Array.isArray(items) ? items.length : undefined;
  return {
    hasNextData,
    hasSearchResult,
    pageRequested,
    rowsRequested,
    rowsFound,
    rowsReturned,
    itemsCount,
  };
}
