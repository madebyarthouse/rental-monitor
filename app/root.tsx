import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { buildTitle, buildDescription } from "@/lib/seo";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  return {
    origin: url.origin,
  };
}

export const meta: Route.MetaFunction = ({ data }) => {
  const origin = data?.origin || "";
  const defaultTitle = buildTitle([]);
  const defaultDescription = buildDescription({ scope: "country" });

  return [
    { title: defaultTitle },
    { name: "description", content: defaultDescription },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Momentum Mietmonitor" },
    { property: "og:locale", content: "de_AT" },
    { property: "og:title", content: defaultTitle },
    { property: "og:description", content: defaultDescription },
    { property: "og:image", content: `${origin}/og.png` },
    { name: "twitter:card", content: "summary_large_image" },
  ];
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" type="favicon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <meta name="msapplication-TileColor" content="#F25E33" />
        <meta name="theme-color" content="#F8F5F0" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="manifest" href="/site.webmanifest" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
