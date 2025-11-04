export default function Methodik() {
  return (
    <div className="w-[75ch] max-w-full mx-auto py-10 px-4 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-4">Methodik</h1>

      <p className="text-muted-foreground mb-8">
        Der Mietmonitor erfasst täglich Mietwohnungsinserate auf Willhaben und
        analysiert, wie sich Befristung und regionale Lage auf die Mietpreise
        auswirken.
      </p>

      <section className="space-y-2 mb-8">
        <h2 className="text-lg font-medium">Datengrundlage</h2>
        <p className="text-muted-foreground">
          Ausgewertet werden ausschließlich Inserate für private Mietwohnungen.
          Häuser und betriebliche Vermietungen sind ausgeschlossen.
        </p>
        <p className="text-muted-foreground">
          Die Erhebung von neuen Daten erfolgt täglich. Als einfach Heuristik
          werden Inserate über 50.000 € Monatsmiete nicht erfasst, da es sich
          wahrscheinlich um Kaufinserate handelt die falsch kategorisiert
          wurden.
        </p>
      </section>

      <section className="space-y-2 mb-8">
        <h2 className="text-lg font-medium">Einschränkungen</h2>
        <p className="text-muted-foreground">
          Die Daten zeigen Angebotspreise, nicht die tatsächlich vereinbarten
          Mieten. Kurzfristige technische Ausfälle bei der Datenerfassung können
          zu Lücken führen. Da die Daten täglich upgedated werden kann es zu
          leichten Abweichungen zwischen Mietmonitor und aktuellen
          Willhaben-Daten führen.
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
    </div>
  );
}
