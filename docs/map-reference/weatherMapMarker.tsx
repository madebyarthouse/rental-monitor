import { useNavigate } from '@remix-run/react'
import L from 'leaflet'
import { Marker, Tooltip } from 'react-leaflet'
import { defaultStyle, hoverStyle } from './weatherMap.client'
import type { Feature } from 'geojson'
import { css } from 'panda/css'

interface MapMarkerProps {
  data: Feature
  geoJsonRef: React.MutableRefObject<L.GeoJSON | null>
}

export const MapMarker = ({ data, geoJsonRef }: MapMarkerProps) => {
  const navigate = useNavigate()
  const geometry = data.geometry

  if (geometry.type !== 'MultiPolygon') return null

  const coordinates = geometry.coordinates[0][0] as unknown as [number, number][]
  const centroidCoord = coordinates.reduce(
    (acc, coord) => {
      const [lat, lng] = coord
      return [acc[0] + lat, acc[1] + lng]
    },
    [0, 0] as [number, number],
  )
  centroidCoord[0] /= coordinates.length
  centroidCoord[1] /= coordinates.length

  const customIcon = L.icon({
    iconSize: [32, 32],
    iconAnchor: [16, 27],
    popupAnchor: [1, -24],
    iconUrl: '/rma_build/icons/weather/' + data.properties?.icon + '.svg',
  })

  if (geometry.type !== 'MultiPolygon' || !data.properties?.show_on_map) return null

  return (
    <Marker
      key={data.properties.slug}
      position={[data.properties?.center.coordinates[1], data.properties?.center.coordinates[0]]}
      icon={customIcon}
    >
      <Tooltip
        permanent={true}
        direction={'bottom'}
        interactive={true}
        className={css({
          backgroundColor: 'transparent !important',
          borderColor: 'transparent !important',
          borderRadius: '0 !important',
          padding: '0 !important',
          boxShadow: 'none !important',
          textAlign: 'center !important',
          marginTop: '2px !important',
          opacity: '1 !important',
          _before: { display: 'none' },
        })}
        eventHandlers={{
          mouseover: () => {
            geoJsonRef.current?.getLayers()?.forEach((layer) => {
              const geoJsonLayer = layer as L.GeoJSON

              if (geoJsonLayer.feature?.type === 'Feature' && geoJsonLayer.feature.properties) {
                const slug = geoJsonLayer.feature.properties.slug

                if (slug === data.properties?.slug) {
                  geoJsonLayer.setStyle(hoverStyle)
                }
              }
            })
          },
          mouseout: () => {
            geoJsonRef.current?.getLayers()?.forEach((layer) => {
              const geoJsonLayer = layer as L.GeoJSON

              if (geoJsonLayer.feature?.type === 'Feature' && geoJsonLayer.feature.properties) {
                const slug = geoJsonLayer.feature.properties.slug

                if (slug === data.properties?.slug) {
                  geoJsonLayer.setStyle(defaultStyle)
                }
              }
            })
          },
        }}
      >
        <div>
          <button
            className={css({
              display: 'block',
              height: '45px',
              width: '40px',
              background: 'transparent',
              position: 'absolute',
              top: '-30px',
              left: '0',
              right: '0',
              cursor: 'pointer',
            })}
            onClick={() => {
              navigate(`/${data?.properties?.slug.toLowerCase()}/wetter`)
            }}
          />
          <span
            className={css({
              color: '#121212',
              fontSize: 'xs',
              fontWeight: 'bold',
              textShadow: '-1px 1px 0px #fff, 1px 1px 0px #fff, 1px -1px 0 #fff, -1px -1px 0 #fff',
            })}
          >
            {Math.round(data.properties?.minTemp)}°
          </span>
          <span
            color="rmaNeutral.500"
            className={css({
              margin: '0 2px',
            })}
          >
            /
          </span>
          <span
            className={css({
              color: '#121212',
              fontSize: 'xs',
              fontWeight: 'bold',
              textShadow: '-1px 1px 0px #fff, 1px 1px 0px #fff, 1px -1px 0 #fff, -1px -1px 0 #fff',
            })}
          >
            {Math.round(data.properties?.maxTemp)}°
          </span>
        </div>
      </Tooltip>
    </Marker>
  )
}
