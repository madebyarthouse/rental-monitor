import type { Route } from "./+types/export[.]csv";
import { ExportService } from "@/services/export-service";
import type { ExportRow } from "@/services/export-service";
import { cacheHeader } from "pretty-cache-header";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "\uFEFF";
  const headers = Object.keys(rows[0]!);
  const esc = (v: unknown) => {
    if (v == null) return "";
    const s = typeof v === "string" ? v : String(v);
    const needs = /[",\n\r]/.test(s);
    const q = s.replace(/"/g, '""');
    return needs ? `"${q}"` : q;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc((r as any)[h])).join(",")),
  ];
  return "\uFEFF" + lines.join("\n");
}

export async function loader({ context }: Route.LoaderArgs) {
  const service = new ExportService(context.cloudflare.env.rental_monitor);
  const data = await service.getActiveListingsWithRegionForExport();

  const germanRows = data.map((r: ExportRow) => ({
    Titel: r.title,
    Preis: r.price,
    "Fläche (m²)": r.area ?? "",
    Zimmer: r.rooms ?? "",
    PLZ: r.zipCode ?? "",
    Stadt: r.city ?? "",
    Bezirk: r.district ?? "",
    Bundesland: r.state ?? "",
    Befristet: r.isLimited ? "Befristet" : "Unbefristet",
    Befristungsmonate: r.durationMonths ?? "",
    Plattform: r.platform,
    URL: r.url,
    "Externe ID": r.externalId ?? "",
    "Erstmalig gesehen": r.firstSeenAt,
    "Zuletzt gesehen": r.lastSeenAt,
    Region: r.regionName ?? "",
  }));

  const csv = toCsv(germanRows);

  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const filename = `export-${yyyy}-${mm}-${dd}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": cacheHeader({
        public: true,
        sMaxage: "1d",
        staleWhileRevalidate: "1h",
      }),
    },
  });
}
