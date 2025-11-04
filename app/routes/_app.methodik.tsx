export default function Methodik() {
  return (
    <div className="w-[75ch] max-w-full mx-auto py-10 px-4 sm:px-6">
      <strong>WORK IN PROGRESS, NICHT FINAL</strong>
      <h1 className="text-2xl font-semibold tracking-tight mb-4">Methodik</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Der Mietmonitor soll Entwicklungen am Mietwohnungsmarkt nachvollziehbar
        machen. Wir dokumentieren hier die Herkunft der Daten, die wichtigsten
        Verarbeitungsschritte sowie zentrale Einschränkungen – für Transparenz
        und eine sachliche Einordnung der Ergebnisse.
      </p>

      <section className="space-y-2 mb-8">
        <h2 className="text-lg font-medium">Datenquelle</h2>
        <p className="text-sm text-muted-foreground">
          Die Auswertungen basieren auf Angeboten für Mietwohnungen auf der
          Plattform Willhaben. Es werden ausschließlich Wohnungen
          berücksichtigt. Inserate für Häuser sind nicht Teil der Analyse.
        </p>
      </section>

      <section className="space-y-2 mb-8">
        <h2 className="text-lg font-medium">Zeitraum und Aktualisierung</h2>
        <p className="text-sm text-muted-foreground">
          Die Erhebung läuft fortlaufend seit dem 01.01.2024. Die Daten werden
          täglich automatisiert aktualisiert. Neue Inserate und Änderungen
          bestehender Inserate fließen damit zeitnah in den Mietmonitor ein.
        </p>
      </section>

      <section className="space-y-2 mb-8">
        <h2 className="text-lg font-medium">
          Aufbereitung und Qualitätssicherung
        </h2>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
          <li>
            Dubletten werden entfernt, soweit technisch möglich (z. B.
            Mehrfachschaltungen desselben Objekts).
          </li>
          <li>
            Plausibilitätsprüfungen identifizieren Ausreißer, etwa auffällige
            Kombinationen aus Preis und Fläche.
          </li>
          <li>
            Basisangaben (z. B. Wohnfläche, Gesamtmiete) werden harmonisiert, um
            Vergleiche über Regionen zu erleichtern.
          </li>
        </ul>
      </section>

      <section className="space-y-2 mb-8">
        <h2 className="text-lg font-medium">Abdeckung und Ausschlüsse</h2>
        <p className="text-sm text-muted-foreground">
          Der Mietmonitor bildet das veröffentlichte Angebot ab. Spezifische
          Segmente (z. B. möblierte Kurzzeitmieten) oder unvollständig
          beschriebene Inserate können – je nach Datenlage – anders gewichtet
          sein. Häuser sind explizit ausgeschlossen; betrachtet werden
          ausschließlich Mietwohnungen.
        </p>
      </section>

      <section className="space-y-2 mb-8">
        <h2 className="text-lg font-medium">Interpretation und Grenzen</h2>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
          <li>
            Inserate spiegeln Angebotspreise wider, nicht notwendigerweise die
            tatsächlich vereinbarten Mieten.
          </li>
          <li>
            Angebot und Nachfrage können sich rasch ändern; kurzfristige
            Schwankungen sind möglich.
          </li>
          <li>
            Zeitliche Lücken (z. B. aufgrund technischer Störungen) werden
            dokumentiert, soweit relevant.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Rückfragen und Feedback</h2>
        <p className="text-sm text-muted-foreground">
          Hinweise zur Datenqualität und methodische Anregungen sind willkommen.
          Sie helfen, den Mietmonitor laufend zu verbessern.
        </p>
      </section>
    </div>
  );
}
