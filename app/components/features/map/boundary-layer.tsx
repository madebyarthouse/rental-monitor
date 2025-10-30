import * as React from "react";
import { GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Item = {
  slug: string;
  name: string;
  stateSlug?: string;
  stateName?: string;
  geojson?: any;
};
type HoverInfo = {
  slug: string;
  name: string;
  stateSlug?: string;
  stateName?: string;
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
    weight: 3,
    fillOpacity: 0.2,
  } as L.PathOptions;

  // Store layer references to update styles when activeSlug changes
  const layerRefs = React.useRef<Map<string, L.Layer>>(new Map());

  const onEachFeature = React.useCallback(
    (feature: any, layer: any) => {
      const props = (feature?.properties as any) ?? {};
      const slug = props.slug as string | undefined;
      const name = props.name as string | undefined;
      const stateSlug = props.stateSlug as string | undefined;
      const stateName = props.stateName as string | undefined;
      const isActive = slug && slug === activeSlug;
      const fillColor = slug && getFillColor ? getFillColor(slug) : undefined;

      if (slug) {
        layerRefs.current.set(slug, layer);
      }

      layer.setStyle({ ...(isActive ? highlightStyle : baseStyle), fillColor });

      layer.on({
        mouseover: () => {
          if (onHover && slug && name) {
            const b = (layer as L.Polygon).getBounds();
            onHover({ slug, name, stateSlug, stateName, bounds: b });
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

  // Update styles when activeSlug or getFillColor changes
  React.useEffect(() => {
    layerRefs.current.forEach((layer, slug) => {
      const isActive = slug === activeSlug;
      const fillColor = getFillColor ? getFillColor(slug) : undefined;
      layer.setStyle({ ...(isActive ? highlightStyle : baseStyle), fillColor });
    });
  }, [activeSlug, getFillColor]);

  // Clear layer refs when items change (e.g., switching states)
  React.useEffect(() => {
    const currentSlugs = new Set(items.map((item) => item.slug));
    layerRefs.current.forEach((_, slug) => {
      if (!currentSlugs.has(slug)) {
        layerRefs.current.delete(slug);
      }
    });
  }, [items]);

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
      (f.properties as any).stateName = item.stateName;
      features.push(f);
    }
    return {
      type: "FeatureCollection",
      features,
    } as any;
  }, [items]);

  if (!featureCollection.features.length) return null;

  return (
    <GeoJSON
      data={featureCollection as any}
      onEachFeature={onEachFeature}
      style={(feature: any) => {
        const props = (feature?.properties as any) ?? {};
        const slug = props.slug as string | undefined;
        const isActive = slug && slug === activeSlug;
        const fillColor = slug && getFillColor ? getFillColor(slug) : undefined;
        return {
          ...(isActive ? highlightStyle : baseStyle),
          fillColor,
        } as L.PathOptions;
      }}
    />
  );
}
