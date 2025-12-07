import { Outlet } from "react-router";
import type { Route } from "./+types/_app";
import { cacheHeader } from "pretty-cache-header";

export async function loader(_args: Route.LoaderArgs) {
  return {};
}

export function headers() {
  return {
    "Cache-Control": cacheHeader({
      public: true,
      maxAge: "1d",
      sMaxage: "12h",
      staleWhileRevalidate: "1w",
    }),
  };
}

export default function AppLayout(_props: Route.ComponentProps) {
  return <Outlet />;
}
