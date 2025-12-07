import type { Route } from "./+types/_app._index";
import { buildTitle, canonicalFrom } from "@/lib/seo";
import { ExternalLink } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const canonical = canonicalFrom(url);
  return { canonical };
}

export default function ComingSoon(props: Route.ComponentProps) {
  const title = buildTitle(["Mietmonitor kommt bald zurück"]);
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

      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="w-full border-b border-border">
          <div className="w-[960px] max-w-[calc(100%-40px)] mx-auto border-l border-r border-border flex items-center justify-between max-[350px]:flex-col max-[350px]:items-end max-[350px]:gap-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl 2xl:text-5xl 3xl:text-6xl max-[450px]:text-[clamp(18px,6.2vw,22px)] max-[350px]:text-right font-semibold tracking-tight text-foreground p-6 md:p-8 xl:px-10 2xl:px-12">
              Mietmonitor
            </h1>
            <div className="flex justify-end p-6 md:p-8 xl:px-10 2xl:px-12 max-[350px]:w-full">
              <a
                href="https://www.momentum-institut.at"
                target="_blank"
                rel="noreferrer noopener"
                className="block shrink-0 min-w-[170px] transition-opacity hover:opacity-80"
              >
                <img
                  src="/momentum-institut-logo.png"
                  alt="Momentum Institut"
                  width={1700}
                  height={441}
                  className="h-10 sm:h-12 w-auto"
                />
              </a>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full flex flex-col border-b border-border">
          <div className="w-[960px] h-full grow max-w-[calc(100%-40px)] mx-auto border-l border-r border-border">
            <div className="w-full flex flex-col">
              {/* Title Section */}
              <div className="space-y-4  p-6 md:p-8 xl:p-10 2xl:p-12 border-b border-border">
                <h2 className="text-2xl xs:text-3xl sm:text-4xl xl:text-5xl 3xl:text-6xl font-semibold tracking-tight text-foreground">
                  mietmonitor.at kommt bald zurück
                </h2>
                <p className="text-[20px] 2xl:text-[22px] 3xl:text-[24px] leading-relaxed text-muted-foreground">
                  Bei Fragen erreichen Sie uns über{" "}
                  <a
                    href="mailto:kontakt@momentum-institut.at"
                    className="underline hover:text-foreground transition-colors"
                  >
                    kontakt@momentum-institut.at
                  </a>
                </p>
              </div>

              {/* Article Section */}
              <div className="space-y-4 p-6 md:p-8 xl:p-10 2xl:p-12 border-b border-border">
                <h2 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl 3xl:text-6xl text-muted-foreground">
                  MOMENT.at Artikel
                </h2>

                {/* Horizontal Article Card */}
                <a
                  href="https://www.moment.at/story/befristungs-monitor/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex flex-col sm:flex-row rounded-none border border-border bg-transparent overflow-hidden cursor-pointer"
                >
                  {/* Image - Constrained to left */}
                  <div className="sm:w-40 md:w-48 shrink-0 overflow-hidden bg-muted">
                    <img
                      src="https://www.moment.at/wp-content/uploads/2025/11/house-2368389_1280.webp"
                      alt="Befristungs-Monitor"
                      className="w-full h-40 sm:h-full object-cover"
                    />
                  </div>
                  {/* Content - Right side */}
                  <div className="flex-1 p-5 sm:p-6 pr-12 relative flex flex-col justify-center text-left space-y-3">
                    <h2 className="text-base sm:text-lg md:text-lg lg:text-xl 2xl:text-2xl 3xl:text-3xl font-semibold text-foreground leading-tight">
                      Befristungs-Monitor: Teuer und unsicher
                    </h2>
                    <p className="text-sm sm:text-base 2xl:text-lg 3xl:text-xl text-muted-foreground leading-relaxed">
                      Wir zeigen mit dem Befristungsmonitor, wo in Österreich
                      besonders viele Wohnungen befristet angeboten werden.
                    </p>
                    <div className="absolute bottom-0 right-0 w-7 h-7 bg-black text-white flex items-center justify-center rounded-none">
                      <ExternalLink
                        className="w-3.5 h-3.5"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full border-border mt-auto">
          <div className="w-[960px] max-w-[calc(100%-40px)] mx-auto border-l border-r border-border">
            <div className="p-6 md:p-8 xl:px-10 2xl:px-12">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[20px] 2xl:text-[22px] 3xl:text-[24px] text-muted-foreground">
                {/* Developed by - Left */}
                <p className="text-center sm:text-left">
                  Entwickelt von{" "}
                  <a
                    href="https://github.com/madebyarthouse/rental-monitor"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline hover:text-foreground transition-colors"
                  >
                    Arthouse
                  </a>
                </p>

                {/* Navigation - Right */}
                <nav className="flex items-center gap-2">
                  <a
                    href="https://www.momentum-institut.at/impressum/"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="hover:text-foreground transition-colors"
                  >
                    Impressum
                  </a>
                  <span className="text-border">|</span>
                  <a
                    href="https://www.momentum-institut.at/datenschutzerklaerung/"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="hover:text-foreground transition-colors"
                  >
                    Datenschutz
                  </a>
                </nav>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
