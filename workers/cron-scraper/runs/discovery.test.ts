import { describe, it, expect } from "vitest";
import { parseOverview } from "../sources/willhaben/overview";
import { parseDetail } from "../sources/willhaben/detail";

function wrapOverviewJson(json: unknown): string {
  const payload = JSON.stringify(json);
  return `<!doctype html><html><body><script id="__NEXT_DATA__" type="application/json">${payload}</script></body></html>`;
}

function wrapDetailJson(json: unknown): string {
  const payload = JSON.stringify(json);
  return `<!doctype html><html><body><script id="__NEXT_DATA__" type="application/json">${payload}</script></body></html>`;
}

describe("discovery flow primitives", () => {
  it("parses overview items and corresponding detail listing", () => {
    const overviewHtml = wrapOverviewJson({
      props: {
        pageProps: {
          searchResult: {
            pageRequested: 1,
            advertSummaryList: {
              advertSummary: [
                {
                  id: "id-1",
                  description: "Listing 1",
                  attributes: {
                    attribute: [
                      { name: "SEO_URL", values: ["immobilien/d/id-1"] },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    });
    const items = parseOverview(overviewHtml);
    expect(items).toHaveLength(1);
    expect(items[0].url).toContain("id-1");

    const detailHtml = wrapDetailJson({
      props: {
        pageProps: {
          advertDetails: {
            id: "id-1",
            description: "Listing 1",
            attributes: {
              attribute: [
                { name: "RENT/PER_MONTH_LETTINGS", values: ["€ 1.100,00"] },
                { name: "ESTATE_SIZE/LIVING_AREA", values: ["45,0"] },
              ],
            },
            seoMetaData: {
              canonicalUrl: items[0].url,
            },
            advertAddressDetails: { postCode: "1010", postalName: "Wien", province: "Wien" },
          },
        },
      },
    });
    const listing = parseDetail(detailHtml);
    expect(listing).not.toBeNull();
    expect(listing!.url).toBe(items[0].url);
    expect(listing!.price).toBeGreaterThan(0);
    expect(listing!.duration?.isLimited).toBeTypeOf("boolean");
  });
});


