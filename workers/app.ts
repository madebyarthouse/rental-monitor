import { createRequestHandler } from "react-router";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    const handlerContext = { cloudflare: { env, ctx } };

    if (request.method !== "GET") {
      return requestHandler(request, handlerContext);
    }

    const cache = (caches as unknown as { default: Cache }).default;
    const cacheKey = new Request(request.url, request);

    const cached = await cache.match(cacheKey);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set("X-Worker-Cache", "HIT");
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      });
    }

    const originResponse = await requestHandler(request, handlerContext);

    if (originResponse.ok && !originResponse.headers.has("Set-Cookie")) {
      const responseForCache = originResponse.clone();

      const headersForClient = new Headers(originResponse.headers);
      headersForClient.set("X-Worker-Cache", "MISS");
      const responseForClient = new Response(originResponse.body, {
        status: originResponse.status,
        statusText: originResponse.statusText,
        headers: headersForClient,
      });

      ctx.waitUntil(cache.put(cacheKey, responseForCache));
      return responseForClient;
    }

    return originResponse;
  },
} satisfies ExportedHandler<Env>;
