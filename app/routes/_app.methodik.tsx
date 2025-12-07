import type { Route } from "./+types/_app.methodik";
import { buildTitle, buildDescription, canonicalFrom } from "@/lib/seo";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const canonical = canonicalFrom(url);
  return { canonical };
}

export default function Methodik(props: Route.ComponentProps) {
  const title = buildTitle(["Methodik"]);
  const description = buildDescription({ scope: "methodik" });
  const canonical = props.loaderData?.canonical as string | undefined;
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      <meta name="robots" content="index,follow" />
      <div className="max-w-[75ch] w-full mx-auto py-6 lg:py-10 px-4 sm:px-6">
        <p className="text-muted-foreground mb-8">
          Der Mietmonitor erfasst Mietwohnungsinserate und analysiert, wie sich
          Befristung und regionale Lage auf die Mietpreise auswirken.
        </p>

        <section className="space-y-2 mb-8">
          <h2 className="text-lg font-medium">Datengrundlage</h2>
          <p className="text-muted-foreground">
            Ausgewertet werden ausschließlich Inserate für private
            Mietwohnungen. Häuser und betriebliche Vermietungen sind
            ausgeschlossen.
          </p>
          <p className="text-muted-foreground">
            Als einfache Heuristik werden Inserate über 50.000 € Monatsmiete
            nicht erfasst, da es sich wahrscheinlich um Kaufinserate handelt die
            falsch kategorisiert wurden.
          </p>
        </section>

        <section className="space-y-2 mb-8">
          <h2 className="text-lg font-medium">Einschränkungen</h2>
          <p className="text-muted-foreground">
            Die Daten zeigen Angebotspreise, nicht die tatsächlich vereinbarten
            Mieten. Kurzfristige technische Ausfälle bei der Datenerfassung
            können zu Lücken führen.
          </p>
        </section>

        <section className="space-y-2 mb-8">
          <h2 className="text-lg font-medium">Ziel</h2>
          <p className="text-muted-foreground">
            Der Mietmonitor macht transparent, wie Befristung und regionale
            Unterschiede die Mietpreise beeinflussen – als Grundlage für
            öffentliche Debatte, Politik und Wissenschaft.
          </p>
        </section>

        <section className="space-y-2 mb-8">
          <h2 className="text-lg font-medium">Entwicklung</h2>
          <p className="text-muted-foreground">
            Der Mietmonitor ist eine gemeinsame Entwicklung vom{" "}
            <a
              className="underline"
              href="https://www.momentum-institut.at"
              target="_blank"
              rel="noreferrer noopener"
            >
              Momentum Institut
            </a>{" "}
            und{" "}
            <a
              className="underline"
              href="https://madebyarthouse.com"
              target="_blank"
              rel="noreferrer noopener"
            >
              Arthouse
            </a>
            .
          </p>
        </section>

        <section className="space-y-2 mb-8">
          <h2 className="text-lg font-medium">Code & Daten</h2>
          <p className="text-muted-foreground">
            Code sowie Daten des Mietmonitor sind open-source und auf GitHub
            verfügbar:{" "}
            <a
              className="underline"
              href="https://github.com/madebyarthouse/rental-monitor"
              target="_blank"
              rel="noreferrer noopener"
            >
              github.com/madebyarthouse/rental-monitor
            </a>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-medium">Kontakt</h2>
          <p className="text-muted-foreground">
            Für Fragen und Feedback kannst du uns unter{" "}
            <a className="underline" href="mailto:kontakt@momentum-institut.at">
              kontakt@momentum-institut.at
            </a>{" "}
            erreichen.
          </p>
        </section>

        <section className="space-y-2 mt-4">
          <p className="text-muted-foreground">
            Rechtliches: Siehe{" "}
            <a
              className="underline"
              href="https://www.momentum-institut.at/impressum/"
              target="_blank"
              rel="noreferrer noopener"
            >
              Impressum
            </a>{" "}
            und{" "}
            <a
              className="underline"
              href="https://www.momentum-institut.at/datenschutzerklaerung/"
              target="_blank"
              rel="noreferrer noopener"
            >
              Datenschutz
            </a>{" "}
            des Momentum Instituts.
          </p>
        </section>
      </div>
    </>
  );
}
