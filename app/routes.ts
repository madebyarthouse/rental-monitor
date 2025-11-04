import {
  type RouteConfig,
  layout,
  route,
  index,
} from "@react-router/dev/routes";

export default [
  layout("routes/_app.tsx", [
    index("routes/_app._index.tsx"),
    route("methodik", "routes/_app.methodik.tsx"),
    route("inserate", "routes/_app.inserate.tsx"),
    route(":state", "routes/_app.$state._index.tsx"),
    route(":state/inserate", "routes/_app.$state.inserate.tsx"),
    route(":state/:district", "routes/_app.$state.$district._index.tsx"),
    route(
      ":state/:district/inserate",
      "routes/_app.$state.$district.inserate.tsx"
    ),

    route("data/export.csv", "routes/export[.]csv.ts"),
  ]),
] satisfies RouteConfig;
