import type { Route } from "./+types/robots[.]txt";
import { cacheHeader } from "pretty-cache-header";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const origin = url.origin;
  const robotsContent = `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml`;

  return new Response(robotsContent, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": cacheHeader({
        public: true,
        sMaxage: "1d",
        staleWhileRevalidate: "1w",
      }),
    },
  });
}
