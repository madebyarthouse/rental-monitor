import { fetchHtml } from "../../lib/http";
import type { WillhabenListingPage } from "./types/listing-page";
import type { UnifiedRentalListing } from "../../models/unified";
import { enhanceLocationData } from "../../utils/location-parser";

function extractJson(html: string): WillhabenListingPage | null {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!match || !match[1]) return null;
  try {
    return JSON.parse(match[1]) as WillhabenListingPage;
  } catch {
    return null;
  }
}

function getAttr(
  attributes: { attribute: Array<{ name: string; values: string[] }> },
  name: string
): string | undefined {
  const a = attributes.attribute.find((x) => x.name === name);
  return a?.values?.[0];
}

export async function fetchDetail(url: string): Promise<string> {
  return await fetchHtml(url);
}

export function parseDetail(html: string): UnifiedRentalListing | null {
  const json = extractJson(html);
  const details = json?.props?.pageProps?.advertDetails;
  if (!details) return null;

  const attrs = details.attributes;
  const url = details.seoMetaData.canonicalUrl;

  const priceStr =
    getAttr(attrs, "RENT/PER_MONTH_LETTINGS") ||
    getAttr(attrs, "RENTAL_PRICE/PER_MONTH");
  const price = priceStr
    ? parseFloat(priceStr.replace(/[^0-9.,]/g, "").replace(",", "."))
    : 0;

  const areaStr = getAttr(attrs, "ESTATE_SIZE/LIVING_AREA");
  const area = areaStr ? parseFloat(areaStr.replace(",", ".")) : 0;

  const isLimited = getAttr(attrs, "DURATION/HASTERMLIMIT") === "befristet";
  const durationText = getAttr(attrs, "DURATION/TERMLIMITTEXT");
  const months = durationText
    ? parseInt(durationText.match(/\d+/)?.[0] || "0") * 12
    : undefined;

  const address = details.advertAddressDetails;
  const rawLoc = {
    zipCode: address?.postCode,
    city: address?.postalName,
    district: getAttr(attrs, "DISTRICT"),
    state: address?.province,
  };
  const loc = enhanceLocationData(rawLoc, url);

  const isPrivate = details.sellerProfileUserData?.private;
  // Seller extraction
  const isCommercialSeller =
    isPrivate === false ? true : isPrivate === true ? false : undefined;

  return {
    id: details.id,
    title: details.description,
    price,
    area,
    location: {
      zipCode: loc.zipCode || undefined,
      city: loc.city || undefined,
      district: loc.district || undefined,
      state: loc.state || undefined,
    },
    duration: { isLimited, months },
    platform: "willhaben",
    url,
    scrapedAt: new Date().toISOString(),
    isCommercialSeller: isCommercialSeller,
  };
}
