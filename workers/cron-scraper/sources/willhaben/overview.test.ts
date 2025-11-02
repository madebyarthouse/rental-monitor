import { describe, it, expect } from "vitest";
import { parseOverview } from "./overview";

function wrapJson(json: unknown): string {
  const payload = JSON.stringify(json);
  return `<!doctype html><html><head></head><body><script id="__NEXT_DATA__" type="application/json">${payload}</script></body></html>`;
}

describe("parseOverview", () => {
  it("extracts items from willhaben result JSON", () => {
    const html = wrapJson({
      props: {
        pageProps: {
          searchResult: {
            pageRequested: 5,
            advertSummaryList: {
              advertSummary: [
                {
                  id: "123",
                  description: "Nice flat",
                  attributes: { attribute: [{ name: "SEO_URL", values: ["immobilien/d/123"] }] },
                },
              ],
            },
          },
        },
      },
    });
    const items = parseOverview(html);
    expect(items).toHaveLength(1);
    expect(items[0].url).toContain("willhaben.at/iad/");
    expect(items[0].title).toBe("Nice flat");
  });
});


