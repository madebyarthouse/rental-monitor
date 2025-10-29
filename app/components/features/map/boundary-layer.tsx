import * as React from "react";
import { GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Item = { slug: string; name: string; stateSlug?: string; geojson?: any };
type HoverInfo = {
  slug: string;
  name: string;
  stateSlug?: string;
  bounds: L.LatLngBounds;
};

export default function BoundaryLayer({
  items,
  activeSlug,
  onSelect,
  onHover,
  getFillColor,
}: {
  items: Item[];
  activeSlug?: string;
  onSelect?: (slug: string, stateSlug?: string) => void;
  onHover?: (info?: HoverInfo) => void;
  getFillColor?: (slug: string) => string | undefined;
}) {
  if (typeof window === "undefined") return null;

  const baseStyle = {
    color: "#457B9D",
    weight: 1,
    fillOpacity: 0.2,
  } as L.PathOptions;

  const highlightStyle = {
    color: "#E63946",
    weight: 2,
    fillOpacity: 0.35,
  } as L.PathOptions;

  const onEachFeature = React.useCallback(
    (feature: any, layer: any) => {
      const props = (feature?.properties as any) ?? {};
      const slug = props.slug as string | undefined;
      const name = props.name as string | undefined;
      const stateSlug = props.stateSlug as string | undefined;
      const isActive = slug && slug === activeSlug;
      const fillColor = slug && getFillColor ? getFillColor(slug) : undefined;
      layer.setStyle({ ...(isActive ? highlightStyle : baseStyle), fillColor });

      layer.on({
        mouseover: () => {
          if (onHover && slug && name) {
            const b = (layer as L.Polygon).getBounds();
            onHover({ slug, name, stateSlug, bounds: b });
          }
          if (!isActive)
            layer.setStyle({ weight: 2, fillOpacity: 0.3, fillColor });
        },
        mouseout: () => {
          if (onHover) onHover(undefined);
          if (!isActive) layer.setStyle({ ...baseStyle, fillColor });
        },
        click: () => {
          if (slug && onSelect)
            onSelect(slug, props.stateSlug as string | undefined);
        },
      });
    },
    [activeSlug, onHover, onSelect, getFillColor]
  );

  // Merge features; ensure each feature has properties.slug for interaction
  const featureCollection = React.useMemo(() => {
    const features: any[] = [];
    for (const item of items) {
      if (!item.geojson) continue;
      const f = item.geojson;
      if (!f.properties) f.properties = {};
      (f.properties as any).slug = item.slug;
      (f.properties as any).name = item.name;
      (f.properties as any).stateSlug = item.stateSlug;
      features.push(f);
    }
    return {
      type: "FeatureCollection",
      features,
    } as any;
  }, [items]);

  if (!featureCollection.features.length) return null;

  return (
    <GeoJSON data={featureCollection as any} onEachFeature={onEachFeature} />
  );
}
