import { fetchHtml } from "../../lib/http";
import type { WillhabenResultPage, AdvertSummary } from "./types/result-page";

export interface OverviewItem {
  url: string;
  title: string;
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

export async function fetchOverview(page: number, rows: number): Promise<string> {
  const url = "https://www.willhaben.at/iad/immobilien/mietwohnungen/mietwohnung-angebote";
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
  const list = json.props.pageProps.searchResult.advertSummaryList.advertSummary;
  return list.map((ad) => {
    const seo = extractSeoUrl(ad);
    const url = seo
      ? `https://willhaben.at/iad/${seo}`
      : `https://willhaben.at/iad/immobilien/d/${ad.id}`;
    return { url, title: ad.description };
  });
}


