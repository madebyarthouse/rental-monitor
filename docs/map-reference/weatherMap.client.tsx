import { useMediaQuery } from '@mantine/hooks'
import { useNavigate } from '@remix-run/react'
import { regionAustria } from '@rma-mono/rma-regions'
import bbox from '@turf/bbox'
import centroid from '@turf/centroid'
import { LatLng, LatLngBounds } from 'leaflet'
import { useRef } from 'react'
import { MapContainer, GeoJSON, useMap } from 'react-leaflet'
import { MapMarker } from './weatherMapMarker'

import type { Feature, FeatureCollection, BBox } from 'geojson'
import type { GeoJSON as LGeoJson, LatLngExpression, Map, Polygon } from 'leaflet'

import type { RegionDataType } from 'services/regions'
import type { DefaultCurrentWeatherType } from 'services/weather/weatherUtil'
import { css, cx } from 'panda/css'
import { strings } from 'strings'

interface WeatherMapProps {
  mapContainerStyle: string
  countries: FeatureCollection
  regionInfo: RegionDataType
  regionForBounds: RegionDataType
  weatherData: {
    daily: {
      minTemp: number
      maxTemp: number
      icon: string
    }[]
    current: DefaultCurrentWeatherType
    location: {
      name: string
      slug?: string | null
    }
  }[]
}

export const WeatherMap = ({
  mapContainerStyle,
  countries,
  regionInfo,
  weatherData,
  regionForBounds,
}: WeatherMapProps) => {
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 768px)')

  const mapRef = useRef<Map>(null)
  const geoJsonRef = useRef<LGeoJson>(null)

  const mapCentroid = centroid(countries)
  const position: LatLngExpression = new LatLng(
    mapCentroid.geometry.coordinates[1],
    mapCentroid.geometry.coordinates[0],
  )
  const mapBbox = bbox(countries) as BBox

  const updatedCountriesData = countries.features.map((feature: Feature) => {
    const locationName = feature.properties?.name
    const locationSlug = feature.properties?.slug
    const locationData = weatherData
      ? weatherData.find((data) => {
          const locationMap =
            stateToCityMapping[locationName] !== undefined
              ? stateToCityMapping[locationName]
              : locationName
          return data.location.name === locationMap
        })
      : undefined

    // @ts-expect-error - coulnd't find a way for TS to correctly infer the type of regionForBounds
    const matchingObject = regionForBounds?.children?.find((obj) => obj.slug === locationSlug)

    if (locationData) {
      return {
        ...feature,
        properties: {
          ...feature.properties,
          minTemp: locationData.daily[0]?.minTemp && locationData.daily[0]?.minTemp,
          maxTemp: locationData.daily[0]?.maxTemp && locationData.daily[0]?.maxTemp,
          icon: locationData.current?.icon && locationData.current?.icon,
          show_on_map: matchingObject?.show_on_map,
          center: matchingObject?.center,
        },
      }
    }

    return feature
  })

  const locationTranslation =
    regionInfo.title === regionAustria
      ? strings.regions.oesterreichLabel
      : strings.regions.regionBySlug({ slug: regionForBounds.slug ?? '' })

  const onEachFeature = (feature: Feature, layer: Polygon) => {
    const slug = feature.properties?.slug

    layer.on('mouseover', () => {
      layer.setStyle(hoverStyle)
    })
    layer.on('mouseout', () => {
      layer.setStyle(defaultStyle)
    })
    layer.on('click', () => {
      navigate(`/${slug.toLowerCase()}/wetter`)
    })
  }

  return (
    <div
      className={css({
        flexGrow: 1,
        width: '100%',
        borderWidth: '1px',
        borderColor: 'rmaNeutral.200',
        overflow: 'hidden',
      })}
    >
      <div
        className={css({
          display: 'flex',
          pl: 3,
          pr: 4,
          pt: 2.5,
          pb: 3,
          borderBottomWidth: '1px',
          borderColor: 'rmaNeutral.200',
        })}
      >
        <p
          className={css({
            fontSize: 'sm',
            fontWeight: 'semiBold',
          })}
        >
          {locationTranslation}
        </p>
      </div>
      <MapContainer
        ref={mapRef}
        className={cx(mapContainerStyle, css({ backgroundColor: '#FFFFFF' }))}
        zoomControl={false}
        center={position}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        zoomSnap={0.25}
      >
        <GeoJSON
          ref={geoJsonRef}
          key={`leaflet-geojson-${regionForBounds.slug}`}
          data={countries}
          style={defaultStyle}
          onEachFeature={onEachFeature}
        />
        {updatedCountriesData.map((data: Feature, index: number) => (
          <MapMarker
            key={`map-marker-${data.id}-${data.properties?.slug}`}
            data={data}
            geoJsonRef={geoJsonRef}
          />
        ))}
        <ChangeView
          key={`leaflet-change-view-${regionForBounds.slug}`}
          dragging={!isMobile}
          mapBbox={mapBbox}
        />
      </MapContainer>
    </div>
  )
}

export function ChangeView({ mapBbox, dragging }: { mapBbox: BBox; dragging?: boolean }) {
  const map = useMap()

  const bounds = new LatLngBounds(
    new LatLng(mapBbox[1], mapBbox[0]),
    new LatLng(mapBbox[3], mapBbox[2]),
  )
  map.fitBounds(bounds, {
    animate: false,
  })
  map.setMaxBounds(bounds)

  dragging && map.dragging.enable()
  !dragging && map.dragging.disable()

  return null
}

export const hoverStyle = {
  fillColor: 'var(--colors-rma-neutral-400)',
  weight: 2,
  color: 'white',
  fillOpacity: 1,
}

export const defaultStyle = {
  fillColor: 'var(--colors-rma-neutral-300)',
  weight: 1.5,
  color: 'white',
  fillOpacity: 1,
}

const stateToCityMapping: Record<string, string> = {
  Steiermark: 'Graz',
  Kärnten: 'Klagenfurt',
  Burgenland: 'Eisenstadt',
  Niederösterreich: 'St. Pölten',
  Oberösterreich: 'Linz',
  Salzburg: 'Salzburg-Stadt',
  Tirol: 'Innsbruck',
  Vorarlberg: 'Bregenz',
  Wien: 'Wien',
}
