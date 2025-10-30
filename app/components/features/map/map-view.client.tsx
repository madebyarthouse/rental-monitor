import { useEffect, useMemo, useState } from "react";
import { MapContainer, useMap, Popup, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation, useNavigate, useParams } from "react-router";
import BoundaryLayer from "./boundary-layer";
import { createColorScale } from "./color-scale";
import type { HeatmapResult } from "@/services/map-service";
import type { StatisticsSummary } from "@/services/statistics-service";
import { HeatmapToggles } from "./heatmap-toggles";
import { HeatmapLegend } from "./heatmap-legend";
import { useIsMobile } from "@/hooks/use-mobile";

type BoundsTuple = [[number, number], [number, number]];
type RegionDTO = {
  id: number;
  name: string;
  slug: string;
  geojson?: unknown;
  bounds?: BoundsTuple;
  stateSlug?: string;
};

type MapViewProps =
  | {
      context: "country";
      country: Pick<RegionDTO, "name" | "slug" | "bounds">;
      districts: Array<
        Pick<RegionDTO, "id" | "name" | "slug" | "geojson" | "stateSlug">
      >;
      state?: never;
      activeDistrictSlug?: string;
      heatmap?: HeatmapResult;
      districtStats?: Map<string, StatisticsSummary>;
    }
  | {
      context: "state" | "district";
      state: Pick<RegionDTO, "name" | "slug" | "bounds">;
      districts: Array<
        Pick<RegionDTO, "id" | "name" | "slug" | "geojson" | "stateSlug">
      >;
      country?: never;
      activeDistrictSlug?: string;
      heatmap?: HeatmapResult;
      districtStats?: Map<string, StatisticsSummary>;
    };

function FitToBounds({ bounds }: { bounds?: BoundsTuple }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    const b = L.latLngBounds(
      [bounds[0][0], bounds[0][1]],
      [bounds[1][0], bounds[1][1]]
    );
    map.fitBounds(b, { animate: false, padding: [16, 16] });
  }, [bounds, map]);
  return null;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatNumber(
  n: number | null | undefined,
  opts?: Intl.NumberFormatOptions
): string {
  if (n == null || !Number.isFinite(n as number)) return "-";
  return new Intl.NumberFormat("de-AT", opts).format(n as number);
}

export default function MapView(props: MapViewProps) {
  if (typeof window === "undefined") return null;

  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const isMobile = useIsMobile();
  const bounds: BoundsTuple | undefined = useMemo(() => {
    if (props.context === "country") return props.country.bounds;
    return props.state.bounds;
  }, [props]);

  const [hoverRect, setHoverRect] = useState<{
    slug: string;
    name: string;
    stateSlug?: string;
    bounds: BoundsTuple;
  } | null>(null);
  const [clickedDistrict, setClickedDistrict] = useState<{
    slug: string;
    name: string;
    stateSlug?: string;
  } | null>(null);

  const handleBoundaryHover = (
    info?: {
      slug: string;
      name: string;
      stateSlug?: string;
      bounds: L.LatLngBounds;
    } | null
  ) => {
    if (!info) {
      setHoverRect(null);
      return;
    }
    const b = info.bounds;
    const tuple: BoundsTuple = [
      [b.getSouth(), b.getWest()],
      [b.getNorth(), b.getEast()],
    ];
    setHoverRect({
      slug: info.slug,
      name: info.name,
      stateSlug: info.stateSlug,
      bounds: tuple,
    });
  };

  const handleBoundaryClick = (slug: string, stateSlug?: string) => {
    if (isMobile) {
      const district = props.districts.find((d) => d.slug === slug);
      if (district) {
        setClickedDistrict({ slug, name: district.name, stateSlug });
      }
    } else {
      onSelectRegion(slug, stateSlug);
    }
  };

  const activePopup = useMemo(() => {
    if (!props.activeDistrictSlug) return null;
    if (!(props.context === "state" || props.context === "district"))
      return null;
    const d = props.districts.find((x) => x.slug === props.activeDistrictSlug);
    if (!d || !d.geojson) return null;
    try {
      const layer = L.geoJSON(d.geojson as unknown as GeoJSON.GeoJSON);
      const b = layer.getBounds();
      const tuple: BoundsTuple = [
        [b.getSouth(), b.getWest()],
        [b.getNorth(), b.getEast()],
      ];
      return { name: d.name, bounds: tuple };
    } catch {
      return null;
    }
  }, [props.activeDistrictSlug, props.context, props.districts]);

  const onSelectRegion = (slug: string, stateSlug?: string) => {
    // If we're at state context, navigate to /:state/:district using current state and clicked district
    if (props.context === "state" || props.context === "district") {
      const stateSlug =
        props.context === "state" ? props.state.slug : props.state.slug;
      navigate(`/${stateSlug}/${slug}`);
      return;
    }
    // If country view, we need state slug to navigate to /:state/:district
    if (props.context === "country" && stateSlug) {
      navigate(`/${stateSlug}/${slug}`);
    }
  };

  const getFillColor = useMemo(() => {
    const h = props.heatmap;
    if (!h) return undefined;
    let values: Record<string, number | null> | undefined;
    if ("values" in h) {
      values = h.values as Record<string, number | null>;
    } else if ("byRegion" in h && Array.isArray(h.byRegion)) {
      values = Object.fromEntries(
        h.byRegion.map((x) => [x.slug, x.value])
      ) as Record<string, number | null>;
    }
    if (!values) return undefined;

    if (h.metric === "limitedPercentage") {
      const scale = createColorScale(0, 100);
      // Discrete five bins with midpoints 10,30,50,70,90
      return (slug: string) => {
        const v = values![slug];
        if (v == null || !Number.isFinite(v)) return "#B8C1CC";
        if (v <= 20) return scale(10);
        if (v <= 40) return scale(30);
        if (v <= 60) return scale(50);
        if (v <= 80) return scale(70);
        return scale(90);
      };
    }
    // For other metrics, use 5 equal steps across the range
    const min = h.range?.min ?? null;
    const max = h.range?.max ?? null;
    if (min == null || max == null) return undefined;
    const scale = createColorScale(min, max);
    const step = (max - min) / 5;
    return (slug: string) => {
      const v = values![slug];
      if (v == null || !Number.isFinite(v)) return "#B8C1CC";
      if (v <= min + step * 1) return scale(min + step * 0.5);
      if (v <= min + step * 2) return scale(min + step * 1.5);
      if (v <= min + step * 3) return scale(min + step * 2.5);
      if (v <= min + step * 4) return scale(min + step * 3.5);
      return scale(min + step * 4.5);
    };
  }, [props.heatmap]);

  const getHeatmapValue = (slug: string): number | null => {
    const h = props.heatmap;
    if (!h) return null;
    let values: Record<string, number | null> | undefined;
    if ("values" in h) {
      values = h.values as Record<string, number | null>;
    } else if ("byRegion" in h && Array.isArray(h.byRegion)) {
      values = Object.fromEntries(
        h.byRegion.map((x) => [x.slug, x.value])
      ) as Record<string, number | null>;
    }
    return values?.[slug] ?? null;
  };

  const renderPopupContent = (slug: string, name: string) => {
    const stats = props.districtStats?.get(slug);
    const heatmapValue = getHeatmapValue(slug);
    const metric = props.heatmap?.metric;

    return (
      <div className="px-3 py-2 text-xs bg-background/95 rounded-md shadow-lg border border-border min-w-[180px]">
        <div className="font-semibold mb-2 text-foreground">{name}</div>
        {stats && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inserate gesamt</span>
              <span
                className={`font-medium ${
                  metric === "totalListings" ? "text-primary font-semibold" : ""
                }`}
              >
                {formatNumber(stats.total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ø Preis</span>
              <span className="font-medium">
                {formatNumber(stats.avgPrice, { maximumFractionDigits: 0 })} €
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ø Fläche</span>
              <span className="font-medium">
                {formatNumber(stats.avgArea, { maximumFractionDigits: 1 })} m²
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ø €/m²</span>
              <span
                className={`font-medium ${
                  metric === "avgPricePerSqm"
                    ? "text-primary font-semibold"
                    : ""
                }`}
              >
                {formatNumber(stats.avgPricePerSqm, {
                  maximumFractionDigits: 1,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">% befristet</span>
              <span
                className={`font-medium ${
                  metric === "limitedPercentage"
                    ? "text-primary font-semibold"
                    : ""
                }`}
              >
                {stats.limitedPct == null
                  ? "-"
                  : `${formatNumber(stats.limitedPct, {
                      maximumFractionDigits: 1,
                    })}%`}
              </span>
            </div>
          </div>
        )}
        {!stats && heatmapValue != null && Number.isFinite(heatmapValue) && (
          <div className="mt-1 text-[11px] text-muted-foreground">
            {metric === "limitedPercentage" &&
              `${Math.round(heatmapValue)}% befristet`}
            {metric === "avgPricePerSqm" && `${Math.round(heatmapValue)} €/m²`}
            {metric === "totalListings" &&
              `${Math.round(heatmapValue)} Inserate`}
          </div>
        )}
      </div>
    );
  };

  // Austria bounds: [[46.0, 9.0], [49.0, 17.0]]
  const austriaBounds: BoundsTuple = [
    [46.0, 9.0],
    [49.0, 17.0],
  ];

  return (
    <div className="w-full relative">
      <div
        className={`w-full ${isMobile ? "h-[calc(100vh-12rem)]" : "h-[500px]"}`}
        style={{ touchAction: "pan-y" }}
      >
        <MapContainer
          style={{ height: "100%", width: "100%", backgroundColor: "#F8F5F2" }}
          center={[47.5162, 14.5501]}
          zoom={9}
          minZoom={6}
          maxZoom={13}
          scrollWheelZoom
          maxBounds={L.latLngBounds(
            [austriaBounds[0][0], austriaBounds[0][1]],
            [austriaBounds[1][0], austriaBounds[1][1]]
          )}
          maxBoundsViscosity={1.0}
        >
          <FitToBounds bounds={bounds} />
          <style>{`.leaflet-popup.no-tip .leaflet-popup-tip { display: none; }`}</style>
          <BoundaryLayer
            items={props.districts.map((d) => ({
              slug: d.slug,
              name: d.name,
              stateSlug: d.stateSlug,
              geojson: d.geojson,
            }))}
            activeSlug={props.activeDistrictSlug}
            onSelect={handleBoundaryClick}
            onHover={handleBoundaryHover}
            getFillColor={getFillColor}
          />
          {!isMobile && hoverRect && (
            <Popup
              position={[
                (hoverRect.bounds[0][0] + hoverRect.bounds[1][0]) / 2,
                (hoverRect.bounds[0][1] + hoverRect.bounds[1][1]) / 2,
              ]}
              closeButton={false}
              autoPan={false}
              interactive={true}
              autoClose={false}
              closeOnClick={false}
              className="no-tip p-0"
              eventHandlers={{
                mouseover: () => {
                  if (hoverRect) {
                    setHoverRect(hoverRect);
                  }
                },
                mouseout: () => {
                  handleBoundaryHover(null);
                },
              }}
            >
              {renderPopupContent(hoverRect.slug, hoverRect.name)}
            </Popup>
          )}
          {activePopup && (
            <Marker
              interactive={false}
              position={[
                (activePopup.bounds[0][0] + activePopup.bounds[1][0]) / 2,
                (activePopup.bounds[0][1] + activePopup.bounds[1][1]) / 2,
              ]}
              icon={L.divIcon({
                className: "",
                html: `<div style="transform: translate(-50%, -100%);display: block; width: fit-content; pointer-events: none;" class="px-2 py-1 text-xs font-medium bg-background/90 rounded-md shadow">${escapeHtml(
                  activePopup.name
                )}</div>`,
              })}
            ></Marker>
          )}
        </MapContainer>
      </div>
      {/* Mobile popup below map */}
      {isMobile && clickedDistrict && (
        <div className="mt-4 border border-border rounded-md bg-background shadow-lg">
          {renderPopupContent(clickedDistrict.slug, clickedDistrict.name)}
          <div className="px-3 pb-3 pt-2">
            <button
              onClick={() => {
                onSelectRegion(clickedDistrict.slug, clickedDistrict.stateSlug);
                setClickedDistrict(null);
              }}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
            >
              Zu {clickedDistrict.name} navigieren
            </button>
            <button
              onClick={() => setClickedDistrict(null)}
              className="w-full mt-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
      {/* Overlays */}
      <div className="pointer-events-none absolute left-0 bottom-2 z-20">
        <div className="pointer-events-auto">
          <HeatmapToggles />
        </div>
      </div>
      {props.heatmap && (
        <div className="pointer-events-none absolute right-0 bg-background bottom-10 z-30">
          <div className="pointer-events-auto">
            <HeatmapLegend
              min={props.heatmap.range?.min ?? null}
              max={props.heatmap.range?.max ?? null}
              avg={props.heatmap.range?.avg ?? null}
              metric={props.heatmap.metric}
            />
          </div>
        </div>
      )}
    </div>
  );
}
