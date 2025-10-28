import { getBoundsForRegion, buildWeatherQuery } from './weatherUtil'
import { ENVIRONMENT } from 'config'
import { getWeatherSponsoring } from 'services/directus/queries'
import { allRegions } from 'services/regions'
import { getMostReadArticles } from 'services/search'
import { logger } from 'utils/logger.server'

export const weatherLoader = async ({ region }: { region: string }) => {
  const mostReadArticlesPromise = getMostReadArticles({ region }).catch(() => null)

  const regions = await allRegions().catch(() => null)
  const regionInfo = regions?.getRegionBySlug(region)

  if (!regionInfo) return null

  // if we do not have any children, we are a district
  const isDistrict = regions?.isDistrict(regionInfo)
  const regionForBounds = isDistrict
    ? regions?.getParentBySlug(region)
    : regions?.getRegionBySlug(region)

  const boundsPromise = regionForBounds?.slug ? getBoundsForRegion(regionForBounds.slug) : null

  const regionParent = regions?.getParentBySlug(region)
  const [
    weatherInfoResult,
    weatherInfoParentResult,
    mostReadArticlesResult,
    boundsResult,
    weatherSponsoringResult,
  ] = await Promise.allSettled([
    buildWeatherQuery({ region, isDistrict }),
    isDistrict && regionParent?.slug ? buildWeatherQuery({ region: regionParent.slug }) : null,
    mostReadArticlesPromise,
    boundsPromise,
    regionInfo?.slug ? getWeatherSponsoring(regionInfo.slug) : null,
  ])

  const weatherInfo = weatherInfoResult?.status === 'fulfilled' ? weatherInfoResult.value : null
  const regionsWithWeather = {
    description: weatherInfo?.description,
    shortDescription: weatherInfo?.shortDescription,
    locations: weatherInfo?.locations.map((regionData) => {
      const regionWithSlug = regions?.getRegionByName(regionData.location.name)

      return {
        ...regionData,
        location: {
          ...regionData.location,
          slug: regionWithSlug?.slug,
        },
      }
    }),
  }

  const results = [
    weatherSponsoringResult,
    boundsResult,
    mostReadArticlesResult,
    weatherInfoParentResult,
  ]

  results.forEach((result) => {
    if (result.status === 'rejected') {
      logger.error(`Error in weatherLoader`, {
        error: result.reason,
      })
    }
  })

  return {
    regionInfo,
    isDistrict: isDistrict ?? false,
    weatherInfo: regionsWithWeather,
    regionForBounds,
    environment: ENVIRONMENT,
    bounds: unwrapSettled(boundsResult),
    mostReadArticles: unwrapSettled(mostReadArticlesResult),
    weatherInfoParent: unwrapSettled(weatherInfoParentResult),
    weatherSponsoring: unwrapSettled(weatherSponsoringResult) ?? null,
  }
}
const unwrapSettled = <T>(result: PromiseSettledResult<T>): T | null => {
  if (result.status === 'fulfilled') {
    return result.value
  }
  return null
}
