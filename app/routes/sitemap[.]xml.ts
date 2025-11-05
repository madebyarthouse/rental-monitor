import type { Route } from "./+types/sitemap[.]xml";
import { RegionService } from "@/services/region-service";
import { cacheHeader } from "pretty-cache-header";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const regionService = new RegionService(
    context.cloudflare.env.rental_monitor
  );
  const url = new URL(request.url);
  const origin = url.origin;

  const [states, statesWithDistricts] = await Promise.all([
    regionService.getAllStates(),
    regionService.getStatesWithDistricts(),
  ]);

  const urls: string[] = [
    `${origin}/`,
    `${origin}/methodik`,
    `${origin}/inserate`,
  ];

  for (const state of states) {
    urls.push(`${origin}/${state.slug}`);
    urls.push(`${origin}/${state.slug}/inserate`);
  }

  for (const stateData of statesWithDistricts) {
    for (const district of stateData.districts) {
      urls.push(`${origin}/${stateData.state.slug}/${district.slug}`);
      urls.push(`${origin}/${stateData.state.slug}/${district.slug}/inserate`);
    }
  }

  const urlset = urls
    .map((url) => {
      const escaped = escapeXml(url);
      return `  <url>
    <loc>${escaped}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": cacheHeader({
        public: true,
        sMaxage: "12h",
        staleWhileRevalidate: "1d",
      }),
    },
  });
}
