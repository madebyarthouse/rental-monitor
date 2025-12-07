import type { Route } from "./+types/_app._index";
import { buildTitle, canonicalFrom } from "@/lib/seo";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const canonical = canonicalFrom(url);
  return { canonical };
}

export default function ComingSoon(props: Route.ComponentProps) {
  const title = buildTitle(["Kommen bald zurück"]);
  const description =
    "Der Mietmonitor wird derzeit überarbeitet. Wir sind bald wieder für Sie da.";
  const canonical = props.loaderData?.canonical as string | undefined;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      <meta name="robots" content="noindex,nofollow" />
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="max-w-xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
              Kommen bald zurück
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Der Mietmonitor wird derzeit überarbeitet. Wir arbeiten an
              Verbesserungen und sind bald wieder für Sie da.
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Bei Fragen erreichen Sie uns unter{" "}
              <a
                href="mailto:kontakt@momentum-institut.at"
                className="underline hover:text-foreground transition-colors"
              >
                kontakt@momentum-institut.at
              </a>
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 pt-4">
            <a
              href="https://www.momentum-institut.at"
              target="_blank"
              rel="noreferrer noopener"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Momentum Institut
            </a>
            <a
              href="https://madebyarthouse.com"
              target="_blank"
              rel="noreferrer noopener"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Arthouse
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
