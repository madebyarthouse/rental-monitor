import * as React from "react";
import { GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Item = { slug: string; geojson?: any };

export default function BoundaryLayer({
  items,
  activeSlug,
  onSelect,
}: {
  items: Item[];
  activeSlug?: string;
  onSelect?: (slug: string) => void;
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
      const slug = (feature?.properties as any)?.slug as string | undefined;
      const isActive = slug && slug === activeSlug;
      layer.setStyle(isActive ? highlightStyle : baseStyle);

      layer.on({
        mouseover: () => {
          if (!isActive) layer.setStyle({ weight: 2, fillOpacity: 0.3 });
        },
        mouseout: () => {
          if (!isActive) layer.setStyle(baseStyle);
        },
        click: () => {
          if (slug && onSelect) onSelect(slug);
        },
      });
    },
    [activeSlug]
  );

  // Merge features; ensure each feature has properties.slug for interaction
  const featureCollection = React.useMemo(() => {
    const features: any[] = [];
    for (const item of items) {
      if (!item.geojson) continue;
      const f = item.geojson;
      if (!f.properties) f.properties = {};
      (f.properties as any).slug = item.slug;
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
