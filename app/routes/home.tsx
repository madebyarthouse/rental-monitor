import type { Route } from "./+types/home";
import { RegionService } from "~/services/region-service";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const regionService = new RegionService(
    context.cloudflare.env.rental_monitor
  );

  const regions = await regionService.getRegions();

  return { regions };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <section>
      <h1>Regions</h1>
      <ul>
        {loaderData.regions.map((region) => (
          <li key={region.id}>{region.name}</li>
        ))}
      </ul>
    </section>
  );
}
