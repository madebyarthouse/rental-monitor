import * as React from "react";
import { GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Feature, FeatureCollection, Geometry } from "geojson";

type Item = {
  slug: string;
  name: string;
  stateSlug?: string;
  stateName?: string;
  geojson?: Feature | FeatureCollection | Geometry;
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
    fillOpacity: 0.8,
  } as L.PathOptions;

  const highlightStyle = {
    color: "#E63946",
    weight: 3,
    fillOpacity: 0.2,
  } as L.PathOptions;

  // Store layer references to update styles when activeSlug changes
  const layerRefs = React.useRef<Map<string, L.Layer>>(new Map());

  const onEachFeature = React.useCallback(
    (feature: Feature, layer: L.Layer) => {
      const props =
        (feature?.properties as {
          slug?: string;
          name?: string;
          stateSlug?: string;
          stateName?: string;
        }) || {};
      const slug = props.slug;
      const name = props.name;
      const stateSlug = props.stateSlug;
      const stateName = props.stateName;
      const isActive = slug && slug === activeSlug;
      const fillColor = slug && getFillColor ? getFillColor(slug) : undefined;

      if (slug) {
        layerRefs.current.set(slug, layer);
      }

      (layer as L.Path).setStyle({
        ...(isActive ? highlightStyle : baseStyle),
        fillColor,
      });

      (layer as L.Path).on({
        mouseover: () => {
          if (onHover && slug && name) {
            const b = (layer as L.Polygon).getBounds();
            onHover({ slug, name, stateSlug, stateName, bounds: b });
          }
          if (!isActive)
            (layer as L.Path).setStyle({
              weight: 2,
              fillOpacity: 0.8,
              fillColor,
            });
        },
        mouseout: () => {
          if (onHover) onHover(undefined);
          if (!isActive)
            (layer as L.Path).setStyle({ ...baseStyle, fillColor });
        },
        click: () => {
          if (slug && onSelect) onSelect(slug, stateSlug);
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
      (layer as L.Path).setStyle({
        ...(isActive ? highlightStyle : baseStyle),
        fillColor,
      });
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

  // Merge features; ensure each feature has properties with slugs for interaction
  const featureCollection = React.useMemo(() => {
    const out: Feature[] = [];
    for (const item of items) {
      const gj = item.geojson;
      if (!gj) continue;
      if ((gj as FeatureCollection).type === "FeatureCollection") {
        const fc = gj as FeatureCollection;
        for (const f of fc.features) {
          const props = (f.properties || {}) as Record<string, unknown>;
          props.slug = item.slug;
          props.name = item.name;
          props.stateSlug = item.stateSlug;
          props.stateName = item.stateName;
          f.properties = props as any;
          out.push(f);
        }
      } else if ((gj as Feature).type === "Feature") {
        const f = gj as Feature;
        const props = (f.properties || {}) as Record<string, unknown>;
        props.slug = item.slug;
        props.name = item.name;
        props.stateSlug = item.stateSlug;
        props.stateName = item.stateName;
        f.properties = props as any;
        out.push(f);
      } else {
        out.push({
          type: "Feature",
          geometry: gj as Geometry,
          properties: {
            slug: item.slug,
            name: item.name,
            stateSlug: item.stateSlug,
            stateName: item.stateName,
          },
        });
      }
    }
    return {
      type: "FeatureCollection",
      features: out,
    } as FeatureCollection;
  }, [items]);

  if (!featureCollection.features.length) return null;

  return (
    <GeoJSON
      data={featureCollection}
      onEachFeature={onEachFeature}
      style={(feature) => {
        if (!feature) return { ...baseStyle };
        const props = (feature.properties as { slug?: string }) || {};
        const slug = props.slug;
        const isActive = slug && slug === activeSlug;
        const fillColor = slug && getFillColor ? getFillColor(slug) : undefined;

        return { ...(isActive ? highlightStyle : baseStyle), fillColor };
      }}
    />
  );
}
