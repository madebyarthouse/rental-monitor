import { useEffect, useMemo, useState, useRef } from "react";
import { MapContainer, useMap, Marker, ZoomControl } from "react-leaflet";
import L from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router";
import BoundaryLayer from "./boundary-layer";
import {
  createAvgPricePerSqmScale,
  createColorScale,
  createLimitedPercentageScale,
} from "./color-scale";
import type { HeatmapResult } from "@/services/map-service";
import type { StatisticsSummary } from "@/services/statistics-service";
import { HeatmapToggles } from "./heatmap-toggles";
import { HeatmapLegend } from "./heatmap-legend";
import { DistrictPopover } from "./district-popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFilteredUrl } from "@/hooks/use-filtered-url";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BoundsTuple = [[number, number], [number, number]];
type RegionDTO = {
  id: number;
  name: string;
  slug: string;
  geojson?: unknown;
  bounds?: BoundsTuple;
  stateSlug?: string;
  stateName?: string;
  centerLat?: number;
  centerLng?: number;
};

type MapViewProps =
  | {
      context: "country";
      country: Pick<RegionDTO, "name" | "slug" | "bounds">;
      districts: Array<
        Pick<
          RegionDTO,
          "id" | "name" | "slug" | "geojson" | "stateSlug" | "stateName"
        >
      >;
      state?: never;
      activeDistrictSlug?: string;
      heatmap?: HeatmapResult;
      districtStats?: Map<string, StatisticsSummary>;
      states?: Array<Pick<RegionDTO, "name" | "slug">>;
    }
  | {
      context: "state" | "district";
      state: Pick<
        RegionDTO,
        "name" | "slug" | "bounds" | "centerLat" | "centerLng"
      >;
      districts: Array<
        Pick<
          RegionDTO,
          "id" | "name" | "slug" | "geojson" | "stateSlug" | "stateName"
        >
      >;
      country?: never;
      activeDistrictSlug?: string;
      heatmap?: HeatmapResult;
      districtStats?: Map<string, StatisticsSummary>;
    };

function ChangeView({
  bounds,
  dragging,
}: {
  bounds?: BoundsTuple;
  dragging?: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    const b = L.latLngBounds(
      [bounds[0][0], bounds[0][1]],
      [bounds[1][0], bounds[1][1]]
    );
    map.fitBounds(b, { animate: false });
    map.setMaxBounds(b);

    if (dragging !== undefined) {
      if (dragging) {
        map.dragging.enable();
      } else {
        map.dragging.disable();
      }
    }
  }, [bounds, map, dragging]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!bounds) return;
      const b = L.latLngBounds(
        [bounds[0][0], bounds[0][1]],
        [bounds[1][0], bounds[1][1]]
      );
      map.invalidateSize();
      map.fitBounds(b, { animate: false });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [bounds, map]);

  return null;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (e: L.LeafletMouseEvent) => void;
}) {
  const map = useMap();
  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      // Check if the click hit a GeoJSON boundary by checking the DOM element
      // GeoJSON boundaries are rendered as SVG path elements
      const domTarget = e.originalEvent.target as HTMLElement;
      const isBoundaryClick = domTarget.tagName === "path";

      // If click is not on a boundary (path element), call the handler
      if (!isBoundaryClick) {
        onMapClick(e);
      }
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onMapClick]);

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

export default function MapView(props: MapViewProps) {
  if (typeof window === "undefined") return null;

  const isAustria = props.context === "country";
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const bounds: BoundsTuple | undefined = useMemo(() => {
    // First try to get bounds from props (from database)
    let calculatedBounds: BoundsTuple | undefined;
    if (props.context === "country") {
      calculatedBounds = props.country.bounds;
    } else {
      calculatedBounds = props.state.bounds;
    }

    // If bounds not available, calculate from GeoJSON features
    if (!calculatedBounds && props.districts.length > 0) {
      try {
        const allBounds: L.LatLngBounds[] = [];
        for (const district of props.districts) {
          if (district.geojson) {
            const layer = L.geoJSON(
              district.geojson as unknown as GeoJSON.GeoJSON
            );
            const b = layer.getBounds();
            if (b.isValid()) {
              allBounds.push(b);
            }
          }
        }
        if (allBounds.length > 0) {
          const combinedBounds = allBounds.reduce((acc, b) => {
            return acc.extend(b);
          }, allBounds[0]);
          calculatedBounds = [
            [combinedBounds.getSouth(), combinedBounds.getWest()],
            [combinedBounds.getNorth(), combinedBounds.getEast()],
          ];
        }
      } catch {
        // If calculation fails, return undefined
      }
    }

    return calculatedBounds;
  }, [props]);

  const [hoverRect, setHoverRect] = useState<{
    slug: string;
    name: string;
    stateSlug?: string;
    stateName?: string;
    bounds: BoundsTuple;
  } | null>(null);
  const [lockedDistrict, setLockedDistrict] = useState<{
    slug: string;
    name: string;
    stateSlug?: string;
    stateName?: string;
  } | null>(null);
  const lastClickRef = useRef<{ slug: string; ts: number } | null>(null);

  const handleBoundaryHover = (
    info?: {
      slug: string;
      name: string;
      stateSlug?: string;
      stateName?: string;
      bounds: L.LatLngBounds;
    } | null
  ) => {
    if (!info) {
      // Only clear hover if there's no locked district
      if (!lockedDistrict) {
        setHoverRect(null);
      }
      return;
    }
    // Don't show hover if there's a locked district
    if (lockedDistrict) return;
    const b = info.bounds;
    const tuple: BoundsTuple = [
      [b.getSouth(), b.getWest()],
      [b.getNorth(), b.getEast()],
    ];
    setHoverRect({
      slug: info.slug,
      name: info.name,
      stateSlug: info.stateSlug,
      stateName: info.stateName,
      bounds: tuple,
    });
  };

  const handleBoundaryClick = (slug: string, stateSlug?: string) => {
    const district = props.districts.find((d) => d.slug === slug);
    if (!district) return;

    const now = Date.now();
    const prev = lastClickRef.current;
    const sameAsPrev = prev && prev.slug === slug && now - prev.ts <= 2000;

    if (sameAsPrev) {
      // Double click: navigate to district route
      const targetStateSlug =
        props.context === "country" ? stateSlug : props.state?.slug;
      if (targetStateSlug) {
        navigate(
          getFilteredUrl(`/${targetStateSlug}/${slug}`, { target: "map" })
        );
        lastClickRef.current = null;
        return;
      }
    }

    // Single click: lock the popover
    if (isMobile) {
      setLockedDistrict({
        slug,
        name: district.name,
        stateSlug,
        stateName: district.stateName,
      });
    } else {
      setLockedDistrict({
        slug,
        name: district.name,
        stateSlug,
        stateName: district.stateName,
      });
      setHoverRect(null);
    }

    lastClickRef.current = { slug, ts: now };
  };

  const activePopup = useMemo(() => {
    if (!(props.context === "state" || props.context === "district"))
      return null;
    const targetSlug = lockedDistrict?.slug || props.activeDistrictSlug;
    if (!targetSlug) return null;
    const d = props.districts.find((x) => x.slug === targetSlug);
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
  }, [
    lockedDistrict?.slug,
    props.activeDistrictSlug,
    props.context,
    props.districts,
  ]);

  const getFillColor = useMemo(() => {
    const h = props.heatmap;
    if (!h) return undefined;

    const values: Record<string, number | null> | undefined = (() => {
      if ("values" in h) return h.values as Record<string, number | null>;
      if ("byRegion" in h && Array.isArray(h.byRegion)) {
        return Object.fromEntries(
          h.byRegion.map((x) => [x.slug, x.value])
        ) as Record<string, number | null>;
      }
      return undefined;
    })();
    if (!values) return undefined;

    if (h.metric === "limitedPercentage") {
      const scale = createLimitedPercentageScale();
      const mapper = (slug: string) => {
        const raw = values[slug];
        const v =
          raw == null ? null : typeof raw === "number" ? raw : Number(raw);
        if (v == null || !Number.isFinite(v)) return "#B8C1CC";
        let color: string;
        if (v <= 20) color = scale(10);
        else if (v <= 40) color = scale(30);
        else if (v <= 60) color = scale(50);
        else if (v <= 80) color = scale(70);
        else color = scale(90);

        return color;
      };
      return mapper;
    }

    if (h.metric === "avgPricePerSqm") {
      // Fixed bins for €/m²: 0-5, 5-10, 10-15, 15-20, 20+
      const scale = createAvgPricePerSqmScale();
      const mapper = (slug: string) => {
        const raw = values[slug];
        const v =
          raw == null ? null : typeof raw === "number" ? raw : Number(raw);
        if (v == null || !Number.isFinite(v)) return "#B8C1CC";
        // Determine bin
        const bin = v <= 5 ? 0 : v <= 10 ? 1 : v <= 15 ? 2 : v <= 20 ? 3 : 4;
        const midpoints = [2.5, 7.5, 12.5, 17.5, 22.5];
        const color = scale(midpoints[bin]);

        return color;
      };
      return mapper;
    }

    // For other metrics, use 5 equal steps across the dynamic range
    const min = h.range?.min ?? null;
    const max = h.range?.max ?? null;
    if (min == null || max == null) return undefined;
    const scale = createColorScale(min, max);
    const step = (max - min) / 5;
    const mapper = (slug: string) => {
      const raw = values[slug];
      const v =
        raw == null ? null : typeof raw === "number" ? raw : Number(raw);
      if (v == null || !Number.isFinite(v)) return "#B8C1CC";
      let color: string;
      if (v <= min + step * 1) color = scale(min + step * 0.5);
      else if (v <= min + step * 2) color = scale(min + step * 1.5);
      else if (v <= min + step * 3) color = scale(min + step * 2.5);
      else if (v <= min + step * 4) color = scale(min + step * 3.5);
      else color = scale(min + step * 4.5);

      return color;
    };
    return mapper;
  }, [props.heatmap]);

  const getFilteredUrl = useFilteredUrl();

  // Mobile select options
  const mobileSelectOptions = useMemo(() => {
    if (props.context === "country" && props.states) {
      return props.states.map((s) => ({ value: s.slug, label: s.name }));
    }
    if (props.context === "state" || props.context === "district") {
      return props.districts.map((d) => ({
        value: d.slug,
        label: d.name,
      }));
    }
    return [];
  }, [props]);

  const mobileSelectValue = useMemo(() => {
    if (props.context === "district" && props.activeDistrictSlug) {
      return props.activeDistrictSlug;
    }
    return undefined;
  }, [props.context, props.activeDistrictSlug]);

  const handleMobileSelectChange = (value: string) => {
    if (props.context === "country") {
      navigate(getFilteredUrl(`/${value}`, { target: "map" }));
    } else if (props.context === "state" || props.context === "district") {
      const stateSlug = props.state.slug;
      navigate(getFilteredUrl(`/${stateSlug}/${value}`, { target: "map" }));
    }
  };

  // Custom popover refs and map area
  const [popoverRef, setPopoverRef] = useState<HTMLDivElement | null>(null);
  const [mobilePopoverRef, setMobilePopoverRef] =
    useState<HTMLDivElement | null>(null);
  const [mapAreaRef, setMapAreaRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (hoverRect && popoverRef && !isMobile && !lockedDistrict) {
      // Simple fade-in animation using CSS
      popoverRef.style.opacity = "0";
      popoverRef.style.transform = "translateX(-20px)";
      requestAnimationFrame(() => {
        if (popoverRef) {
          popoverRef.style.transition =
            "opacity 0.2s ease-out, transform 0.2s ease-out";
          popoverRef.style.opacity = "1";
          popoverRef.style.transform = "translateX(0)";
        }
      });
    }
  }, [hoverRect, isMobile, popoverRef, lockedDistrict]);

  // Austria bounds: [[46.0, 9.0], [49.0, 17.0]]
  const austriaBounds: BoundsTuple = [
    [46.0, 9.0],
    [49.0, 17.0],
  ];

  // Close locked popover when clicking outside the map or pressing Escape
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!lockedDistrict) return;
      const t = e.target as Node;
      const insideMap = mapAreaRef ? mapAreaRef.contains(t) : false;
      const insideDesktopPopover = popoverRef ? popoverRef.contains(t) : false;
      const insideMobilePopover = mobilePopoverRef
        ? mobilePopoverRef.contains(t)
        : false;
      if (insideDesktopPopover || insideMobilePopover) return;
      if (insideMap) return;
      setLockedDistrict(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!lockedDistrict) return;
      if (e.key === "Escape") setLockedDistrict(null);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [lockedDistrict, mapAreaRef, popoverRef, mobilePopoverRef]);

  // Handle map clicks to close popover when clicking outside boundaries
  const handleMapClick = useMemo(() => {
    return (_e: L.LeafletMouseEvent) => {
      if (!lockedDistrict) return;
      // This handler is only called when click is NOT on a boundary
      // (checked in MapClickHandler), so we can safely close the popover
      setLockedDistrict(null);
    };
  }, [lockedDistrict]);

  const toGeoJSON = (
    g: unknown
  ): Feature | FeatureCollection | Geometry | undefined => {
    if (!g || typeof g !== "object") return undefined;
    const maybeType = (g as { type?: unknown }).type;
    if (typeof maybeType !== "string") return undefined;
    return g as Feature | FeatureCollection | Geometry;
  };

  return (
    <div className="w-full relative">
      {/* Mobile select and toggle buttons */}
      {isMobile && mobileSelectOptions.length > 0 && (
        <>
          <div className="flex xs:items-center flex-col xs:flex-row gap-2 mb-3 relative z-900">
            <div className="flex-1">
              <Select
                value={mobileSelectValue}
                onValueChange={handleMobileSelectChange}
              >
                <SelectTrigger className="w-full border-black rounded-none shadow-none">
                  <SelectValue placeholder="Region auswählen" />
                </SelectTrigger>
                <SelectContent className="z-900 rounded-none">
                  {mobileSelectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="pointer-events-auto">
              <HeatmapToggles />
            </div>
          </div>
          {/* Legend - static positioned, full width beneath select/toggle row */}
          {props.heatmap && (
            <div className="w-full mb-3 relative md:z-700">
              <HeatmapLegend
                min={props.heatmap.range?.min ?? null}
                max={props.heatmap.range?.max ?? null}
                avg={props.heatmap.range?.avg ?? null}
                metric={props.heatmap.metric}
              />
            </div>
          )}
        </>
      )}
      <div
        className={`w-full h-[350px] md:h-[500px]`}
        style={{ touchAction: isMobile ? "none" : "pan-y" }}
        ref={setMapAreaRef}
      >
        <MapContainer
          key={props.context === "country" ? "country" : `${props.state.slug}`}
          style={{ height: "100%", width: "100%", backgroundColor: "#F8F5F2" }}
          center={
            props.context !== "country" &&
            props.state.centerLat != null &&
            props.state.centerLng != null
              ? [props.state.centerLat, props.state.centerLng]
              : [47.5162, 14.5501]
          }
          zoom={isMobile && !isAustria ? 12 : 9}
          minZoom={isMobile && !isAustria ? 9 : 6}
          maxZoom={13}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
          boxZoom={false}
          keyboard={false}
          zoomControl={false}
          maxBounds={L.latLngBounds(
            [austriaBounds[0][0], austriaBounds[0][1]],
            [austriaBounds[1][0], austriaBounds[1][1]]
          )}
          maxBoundsViscosity={1.0}
        >
          {isMobile && <ZoomControl position="topright" />}
          <ChangeView bounds={bounds} dragging={isMobile} />
          <MapClickHandler onMapClick={handleMapClick} />
          <BoundaryLayer
            items={props.districts.map((d) => ({
              slug: d.slug,
              name: d.name,
              stateSlug: d.stateSlug,
              stateName: d.stateName,
              geojson: toGeoJSON(d.geojson),
            }))}
            activeSlug={lockedDistrict?.slug ?? props.activeDistrictSlug}
            onSelect={handleBoundaryClick}
            onHover={handleBoundaryHover}
            getFillColor={getFillColor}
          />
          {activePopup && (
            <Marker
              interactive={false}
              position={[
                (activePopup.bounds[0][0] + activePopup.bounds[1][0]) / 2,
                (activePopup.bounds[0][1] + activePopup.bounds[1][1]) / 2,
              ]}
              icon={L.divIcon({
                className: "",
                html: `<div style="transform: translate(-50%, -100%);display: block; width: fit-content; pointer-events: none;" class="px-2 py-1 text-sm font-medium bg-background/90 rounded-md shadow">${escapeHtml(
                  activePopup.name
                )}</div>`,
              })}
            ></Marker>
          )}
        </MapContainer>
      </div>
      {/* Custom popover - Desktop */}
      {!isMobile && (lockedDistrict || hoverRect) && (
        <div
          ref={setPopoverRef}
          className="absolute left-0 top-4 z-800 pointer-events-auto"
          onMouseEnter={() => {
            if (hoverRect && !lockedDistrict) {
              setHoverRect(hoverRect);
            }
          }}
          onMouseLeave={() => {
            if (!lockedDistrict) {
              handleBoundaryHover(null);
            }
          }}
        >
          <DistrictPopover
            slug={lockedDistrict?.slug || hoverRect!.slug}
            name={lockedDistrict?.name || hoverRect!.name}
            stateSlug={lockedDistrict?.stateSlug || hoverRect!.stateSlug}
            stateName={lockedDistrict?.stateName || hoverRect!.stateName}
            stats={props.districtStats?.get(
              lockedDistrict?.slug || hoverRect!.slug
            )}
            heatmap={props.heatmap}
            context={props.context}
            currentStateSlug={
              props.context === "state" || props.context === "district"
                ? props.state.slug
                : undefined
            }
            currentStateName={
              props.context === "state" || props.context === "district"
                ? props.state.name
                : undefined
            }
            activeDistrictSlug={props.activeDistrictSlug}
            showCloseButton={!!lockedDistrict}
            autoFocusClose={!!lockedDistrict}
            isMobileView={false}
            onClose={() => setLockedDistrict(null)}
          />
        </div>
      )}
      {/* Mobile popup overlay */}
      {isMobile && lockedDistrict && (
        <div className="absolute top-[85%] left-0 right-0 pointer-events-none z-800 px-4 pb-[50px]">
          <div
            ref={setMobilePopoverRef}
            className="pointer-events-auto border border-border rounded-md bg-background shadow-lg w-full sm:w-full"
          >
            <DistrictPopover
              slug={lockedDistrict.slug}
              name={lockedDistrict.name}
              stateSlug={lockedDistrict.stateSlug}
              stateName={lockedDistrict.stateName}
              stats={props.districtStats?.get(lockedDistrict.slug)}
              heatmap={props.heatmap}
              context={props.context}
              currentStateSlug={
                props.context === "state" || props.context === "district"
                  ? props.state.slug
                  : undefined
              }
              currentStateName={
                props.context === "state" || props.context === "district"
                  ? props.state.name
                  : undefined
              }
              activeDistrictSlug={props.activeDistrictSlug}
              showCloseButton={true}
              autoFocusClose={true}
              isMobileView={true}
              onClose={() => setLockedDistrict(null)}
            />
          </div>
        </div>
      )}
      {/* Overlays - Desktop */}
      {!isMobile && (
        <>
          <div className="pointer-events-none absolute left-0 bottom-0 z-600">
            <div className="pointer-events-auto">
              <HeatmapToggles />
            </div>
          </div>
          {props.heatmap && (
            <div className="pointer-events-none absolute right-0 bg-background bottom-0 z-600">
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
        </>
      )}
      {/* Overlays - Mobile */}
      {isMobile && (
        <>{/* No mobile overlays - legend is static positioned above */}</>
      )}
    </div>
  );
}
