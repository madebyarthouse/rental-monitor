import { describe, it, expect } from "vitest";
import { parseDetail } from "./detail";

function wrapJson(json: unknown): string {
  const payload = JSON.stringify(json);
  return `<!doctype html><html><head></head><body><script id="__NEXT_DATA__" type="application/json">${payload}</script></body></html>`;
}

describe("parseDetail", () => {
  it("extracts essential fields", () => {
    const html = wrapJson({
      props: {
        pageProps: {
          advertDetails: {
            id: "abc",
            description: "Listing title",
            attributes: {
              attribute: [
                { name: "RENT/PER_MONTH_LETTINGS", values: ["€ 1.234,00"] },
                { name: "ESTATE_SIZE/LIVING_AREA", values: ["55,5"] },
              ],
            },
            seoMetaData: {
              canonicalUrl: "https://willhaben.at/iad/immobilien/d/abc",
            },
            advertAddressDetails: {
              postCode: "1010",
              postalName: "Wien",
              province: "Wien",
            },
          },
        },
      },
    });
    const detail = parseDetail(html);
    expect(detail).not.toBeNull();
    expect(detail!.title).toBe("Listing title");
    expect(detail!.price).toBeGreaterThan(0);
    expect(detail!.area).toBeGreaterThan(0);
    expect(detail!.location?.state).toBe("Wien");
  });
});
