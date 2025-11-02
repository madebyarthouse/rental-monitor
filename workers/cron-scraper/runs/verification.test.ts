import { describe, it, expect } from "vitest";
import { parseDetail } from "../sources/willhaben/detail";

function wrapDetailJson(json: unknown): string {
  const payload = JSON.stringify(json);
  return `<!doctype html><html><body><script id=\"__NEXT_DATA__\" type=\"application/json\">${payload}</script></body></html>`;
}

describe("verification flow primitives", () => {
  it("treats missing advertDetails as not found (parseDetail returns null)", () => {
    const html = wrapDetailJson({ props: { pageProps: {} } });
    const listing = parseDetail(html);
    expect(listing).toBeNull();
  });

  it("parses detail when advert exists", () => {
    const html = wrapDetailJson({
      props: {
        pageProps: {
          advertDetails: {
            id: "id-2",
            description: "Another listing",
            attributes: {
              attribute: [
                { name: "RENT/PER_MONTH_LETTINGS", values: ["€ 900,00"] },
                { name: "ESTATE_SIZE/LIVING_AREA", values: ["38,0"] },
              ],
            },
            seoMetaData: { canonicalUrl: "https://willhaben.at/iad/immobilien/d/id-2" },
            advertAddressDetails: { postCode: "1030", postalName: "Wien", province: "Wien" },
          },
        },
      },
    });
    const listing = parseDetail(html);
    expect(listing).not.toBeNull();
    expect(listing!.url).toContain("id-2");
    expect(listing!.price).toBeGreaterThan(0);
  });
});


