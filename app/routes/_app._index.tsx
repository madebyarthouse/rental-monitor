import type { Route } from "./+types/_app._index";
import { RegionService } from "@/services/region-service";
import MapViewBasic from "@/components/features/map/map-view";

type RegionPreview = { name: string };
type CountryData = { level: "country"; regions: unknown[] };
type StateData = {
  level: "state";
  state: RegionPreview;
  districts: unknown[];
};
type DistrictData = {
  level: "district";
  state: RegionPreview;
  district: RegionPreview;
  districts: unknown[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCountryData(value: unknown): value is CountryData {
  return (
    isObject(value) && value.level === "country" && Array.isArray(value.regions)
  );
}

function isStateData(value: unknown): value is StateData {
  if (!isObject(value) || value.level !== "state") return false;
  const state = (value as Record<string, unknown>).state;
  return (
    isObject(state) &&
    "name" in state &&
    typeof (state as Record<string, unknown>).name === "string" &&
    Array.isArray((value as Record<string, unknown>).districts)
  );
}

function isDistrictData(value: unknown): value is DistrictData {
  if (!isObject(value) || value.level !== "district") return false;
  const state = (value as Record<string, unknown>).state;
  const district = (value as Record<string, unknown>).district;
  return (
    isObject(state) &&
    "name" in state &&
    typeof (state as Record<string, unknown>).name === "string" &&
    isObject(district) &&
    "name" in district &&
    typeof (district as Record<string, unknown>).name === "string" &&
    Array.isArray((value as Record<string, unknown>).districts)
  );
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const regionService = new RegionService(
    context.cloudflare.env.rental_monitor
  );
  const p = params as unknown as { state?: string; district?: string };
  const stateSlug = p.state;
  const districtSlug = p.district;

  if (!stateSlug) {
    // Austria level: fetch all states
    const states = await regionService.getAllStates();
    return { level: "country" as const, regions: states };
  }

  const stateData = await regionService.getStateWithDistricts(stateSlug);
  if (!stateData) throw new Response("Not Found", { status: 404 });

  if (!districtSlug) {
    // State level: return state + districts
    return {
      level: "state" as const,
      state: stateData.state,
      districts: stateData.districts,
    };
  }

  // District level: return state bounds + district
  const district = stateData.districts.find((d) => d.slug === districtSlug);
  if (!district) throw new Response("Not Found", { status: 404 });

  return {
    level: "district" as const,
    state: stateData.state,
    district,
    districts: stateData.districts,
  };
}

export default function MapView({ loaderData }: Route.ComponentProps) {
  return (
    <MapViewBasic>
      <p>Level: {loaderData.level}</p>
      {isCountryData(loaderData) && (
        <p>Regions: {(loaderData as CountryData).regions.length} states</p>
      )}
      {isStateData(loaderData) && (
        <>
          <p>State: {(loaderData as StateData).state.name}</p>
          <p>Districts: {(loaderData as StateData).districts.length}</p>
        </>
      )}
      {isDistrictData(loaderData) && (
        <>
          <p>State: {(loaderData as DistrictData).state.name}</p>
          <p>District: {(loaderData as DistrictData).district.name}</p>
        </>
      )}
    </MapViewBasic>
  );
}
