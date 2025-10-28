import { useEffect, useMemo } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation } from "react-router";
import BoundaryLayer from "./boundary-layer";

type BoundsTuple = [[number, number], [number, number]];
type RegionDTO = {
  id?: number;
  name: string;
  slug: string;
  geojson?: any;
  bounds?: BoundsTuple;
};

type MapViewProps =
  | {
      context: "country";
      country: Pick<RegionDTO, "name" | "slug" | "bounds">;
      districts: Array<Pick<RegionDTO, "id" | "name" | "slug" | "geojson">>;
      state?: never;
      activeDistrictSlug?: string;
    }
  | {
      context: "state" | "district";
      state: Pick<RegionDTO, "name" | "slug" | "bounds">;
      districts: Array<Pick<RegionDTO, "id" | "name" | "slug" | "geojson">>;
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

export default function MapView(props: MapViewProps) {
  if (typeof window === "undefined") return null;

  const location = useLocation();
  const bounds: BoundsTuple | undefined = useMemo(() => {
    if (props.context === "country") return props.country.bounds;
    return props.state.bounds;
  }, [props]);

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
        {/* <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /> */}
        <BoundaryLayer
          items={props.districts.map((d) => ({
            slug: d.slug,
            geojson: d.geojson,
          }))}
          activeSlug={props.activeDistrictSlug}
        />
      </MapContainer>
    </div>
  );
}
