const SITE_NAME = "Momentum Mietmonitor";
const BASE_TITLE = "Momentum Mietmonitor";

export function buildTitle(parts: string[]): string {
  if (parts.length === 0) {
    return BASE_TITLE;
  }
  const suffix = parts.join(" – ");
  return `${BASE_TITLE} – ${suffix}`;
}

export function buildDescription(context: {
  scope: "country" | "state" | "district" | "listings" | "methodik";
  name?: string;
}): string {
  const { scope, name } = context;

  switch (scope) {
    case "country":
      return "Aktuelle Mietpreise und Befristungsquoten in Österreich. Analysiere regionale Unterschiede sowie befristete vs. unbefristete Mieten.";
    case "state":
      return `Aktuelle Mietpreise und Befristungsquoten in ${name}. Analysiere regionale Unterschiede sowie befristete vs. unbefristete Mieten.`;
    case "district":
      return `Aktuelle Mietpreise und Befristungsquoten in ${name}. Analysiere regionale Unterschiede sowie befristete vs. unbefristete Mieten.`;
    case "listings":
      return "Durchsuche aktuelle Mietwohnungsinserate in Österreich. Filtere nach Preis, Fläche, Zimmeranzahl, Befristung und mehr.";
    case "methodik":
      return "Informationen zur Datengrundlage, Methodik und Einschränkungen des Momentum Mietmonitors. Erfahre mehr über die Erhebung und Analyse von Mietpreisdaten.";
    default:
      return "Aktuelle Mietpreise und Befristungsquoten in Österreich.";
  }
}

export function canonicalFrom(url: URL): string {
  const canonical = new URL(url);
  canonical.search = "";
  return canonical.toString();
}

export function hasFilterParams(searchParams: URLSearchParams): boolean {
  const filterParams = [
    "minPrice",
    "maxPrice",
    "minArea",
    "maxArea",
    "limited",
    "unlimited",
    "platforms",
    "rooms",
    "metric",
    "page",
    "sortBy",
    "order",
  ];
  return filterParams.some((param) => searchParams.has(param));
}
