import { Link, useLocation } from '@remix-run/react'
import { GoogleAdSlot } from '../ads/googleAds/googleAdSlot'
import { WeatherChart } from './weatherChart'
import { WeatherHeading } from './weatherHeading'
import { WeatherListWidget } from './weatherList'
import { WeatherSponsor } from './weatherSponsor'
import type {
  DailyWeatherWithHourlyDefaultType,
  DailyWeatherWithHourlyDistrictType,
} from './weatherDetails/types'

import type { EnvironmentType } from 'config'
import type { FeatureCollection } from 'geojson'

import type { WeatherSponsoringType } from 'services/directus/queries'
import type { RegionDataType } from 'services/regions'
import type { DefaultCurrentWeatherType } from 'services/weather/weatherUtil'
import { css, cx } from 'panda/css'
import { prose, heading } from 'panda/recipes'
import { OutbrainWidget, OutbrainWidgetIds } from 'ui/components/outbrainWidget'
import { Sharebar } from 'ui/components/sharebar'
import { WeatherDetails } from 'ui/features/weather/weatherDetails'
import { WeatherMap } from 'ui/features/weather/weatherMap.client'
import { ClientOnly } from 'utils/clientOnly'

type WeatherDataType<TIsDistrict extends boolean> = {
  locations?: {
    description: string
    current: DefaultCurrentWeatherType
    shortDescription: string
    daily: TIsDistrict extends true
      ? DailyWeatherWithHourlyDistrictType[]
      : DailyWeatherWithHourlyDefaultType[]
    location: {
      name: string
      slug?: string | null
    }
  }[]
  shortDescription?: string
  description?: string
}

type WeatherDataForMapType = {
  locations: {
    current: DefaultCurrentWeatherType
    daily: {
      minTemp: number
      maxTemp: number
      icon: string
    }[]
    location: {
      name: string
      slug?: string | null
    }
  }[]
}

type WeatherPageType = {
  regionInfo?: RegionDataType
  weatherInfoParent: WeatherDataForMapType | null
  regionBounds: FeatureCollection | null
  regionForBounds: RegionDataType | undefined
  environment: EnvironmentType
  weatherSponsoring: WeatherSponsoringType | null
} & (
  | {
      weatherInfo: WeatherDataType<true>
      isDistrict: true
    }
  | {
      weatherInfo: WeatherDataType<false>
      isDistrict: false
    }
)
const obExternalSecondaryId = 'weather'

export const WeatherPage = ({
  regionInfo,
  weatherInfo,
  weatherInfoParent,
  regionBounds,
  regionForBounds,
  isDistrict,
  environment,
  weatherSponsoring,
}: WeatherPageType) => {
  const location = useLocation()

  const sponsorLogo = weatherSponsoring?.sponsor_logo
  const sponsorUrl = weatherSponsoring?.sponsor_link
  const hasWeatherSponsor = !!sponsorLogo && !!sponsorUrl

  const obExternalId = isDistrict
    ? `${regionForBounds?.slug} | ${regionInfo?.slug}`
    : regionForBounds?.slug

  const description = isDistrict ? weatherInfo.locations?.[0].description : weatherInfo.description
  const shortDescription = isDistrict
    ? weatherInfo.locations?.[0].shortDescription
    : weatherInfo.shortDescription

  const weatherRegions = weatherInfo.locations

  const weatherHeading = (
    <WeatherHeading
      location={regionInfo?.title ?? ''}
      description={shortDescription ?? ''}
      isDistrict={isDistrict}
    />
  )

  if (weatherRegions === undefined) {
    return (
      <section>
        {weatherHeading}

        <div
          className={css({
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            alignItems: 'start',
          })}
        >
          <h2
            className={cx(
              heading({
                level: 'h2',
              }),
              css({
                color: 'rmaRed.100',
              }),
            )}
          >
            Es ist ein Fehler passiert!
          </h2>

          <Link
            className={css({
              color: 'white',
              backgroundColor: 'rmaRed.100',
              padding: '10px 20px',
              fontWeight: 'semiBold',
            })}
            to={`${location.pathname}${location.search}`}
          >
            Seite neu laden
          </Link>
        </div>
      </section>
    )
  }

  return (
    <div
      className={css({
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'wrap',
        gap: {
          base: '2.5',
          md: '8',
        },
        width: '100%',
      })}
    >
      {weatherHeading}

      {hasWeatherSponsor && (
        <aside>
          <WeatherSponsor sponsor={weatherSponsoring} />
        </aside>
      )}

      {isDistrict && weatherRegions !== undefined ? (
        <WeatherDetails
          key={`weather-details-${regionInfo?.slug}`}
          weatherInfo={
            weatherRegions.map((item) => ({
              ...item,
              daily: item.daily.slice(0, 3),
            }))[0]
          }
        />
      ) : null}

      {isDistrict && description && (
        <div
          className={weatherDescriptionStyle}
          dangerouslySetInnerHTML={{ __html: description }}
        ></div>
      )}

      {isDistrict && (
        <GoogleAdSlot
          slotId="slider"
          className={css({
            margin: '0 auto',
          })}
        />
      )}

      {isDistrict && weatherRegions !== undefined ? (
        <WeatherChart weatherInfo={weatherRegions[0]} />
      ) : null}

      {!isDistrict && weatherRegions !== undefined && regionInfo !== undefined ? (
        <WeatherListWidget weatherInfo={weatherRegions} regionInfo={regionInfo} />
      ) : null}

      {regionBounds !== null &&
      regionForBounds !== undefined &&
      weatherRegions !== undefined &&
      regionInfo !== undefined ? (
        <ClientOnly
          fallback={
            <div
              id="skeleton"
              className={css({
                height: '546px',
                background: '#ffffff',
                aspectRatio: '5/6',
                borderWidth: '1px rmaNeutral.200',
                maxWidth: '100%',
              })}
            />
          }
        >
          {() => (
            <WeatherMap
              weatherData={
                isDistrict && weatherInfoParent ? weatherInfoParent.locations : weatherRegions
              }
              mapContainerStyle={css({
                height: { base: '300px', md: '500px' },
                maxWidth: '100%',
              })}
              countries={regionBounds}
              regionInfo={regionInfo}
              regionForBounds={regionForBounds}
            />
          )}
        </ClientOnly>
      ) : null}

      {!isDistrict && description && (
        <div
          className={weatherDescriptionStyle}
          dangerouslySetInnerHTML={{ __html: description }}
        ></div>
      )}

      <WeatherSponsor />

      <Sharebar />

      <OutbrainWidget
        environment={environment}
        externalId={obExternalId}
        externalSecondaryId={obExternalSecondaryId}
        widgetId={OutbrainWidgetIds.AR10}
      />
    </div>
  )
}

const weatherDescriptionStyle = cx(
  prose({
    size: {
      base: 'md',
      md: 'lg',
    },
  }),
  css({
    mt: {
      base: 0,
      md: 6.5,
    },
    maxWidth: '100%',
  }),
)
