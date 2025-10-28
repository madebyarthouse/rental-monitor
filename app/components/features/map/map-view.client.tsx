import { useEffect, useMemo, useState } from "react";
import { MapContainer, useMap, Popup, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation, useNavigate, useParams } from "react-router";
import BoundaryLayer from "./boundary-layer";

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
    }
  | {
      context: "state" | "district";
      state: Pick<RegionDTO, "name" | "slug" | "bounds">;
      districts: Array<
        Pick<RegionDTO, "id" | "name" | "slug" | "geojson" | "stateSlug">
      >;
      country?: never;
      activeDistrictSlug?: string;
    };

function FitToBounds({ bounds }: { bounds?: BoundsTuple }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    console.log("bounds", bounds);
    const b = L.latLngBounds(
      [bounds[0][0], bounds[0][1]],
      [bounds[1][0], bounds[1][1]]
    );
    map.fitBounds(b, { padding: [16, 16] });
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

export default function MapView(props: MapViewProps) {
  if (typeof window === "undefined") return null;

  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
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

  return (
    <div className="w-full h-[70vh]">
      <MapContainer
        key={location.key}
        style={{ height: "100%", width: "100%" }}
        center={[47.5162, 14.5501]}
        zoom={7}
        scrollWheelZoom
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
          onSelect={onSelectRegion}
          onHover={(info) => {
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
          }}
        />
        {hoverRect && (
          <Popup
            position={[
              (hoverRect.bounds[0][0] + hoverRect.bounds[1][0]) / 2,
              (hoverRect.bounds[0][1] + hoverRect.bounds[1][1]) / 2,
            ]}
            closeButton={false}
            autoPan={false}
            interactive={false}
            autoClose={false}
            closeOnClick={false}
            className="no-tip"
          >
            <div className="px-2 py-1 text-xs font-medium bg-background/90 rounded-md shadow">
              {hoverRect.name}
            </div>
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
  );
}
