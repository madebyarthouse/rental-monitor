import { dbClient } from "@/db/client";
import { runDiscovery } from "./runs/discovery";
import { runSweep } from "./runs/sweep";
import { runVerification } from "./runs/verification";

const SCHEDULES = {
  discovery: "*/30 * * * *",
  sweep: "0 */3 * * *",
  verification: "0 */6 * * *",
} as const;

export default {
  async scheduled(event, env, ctx) {
    const db = dbClient(env.rental_monitor);
    if (event.cron === SCHEDULES.discovery) {
      ctx.waitUntil(runDiscovery(db));
    } else if (event.cron === SCHEDULES.sweep) {
      ctx.waitUntil(runSweep(db));
    } else if (event.cron === SCHEDULES.verification) {
      ctx.waitUntil(runVerification(db));
    }
  },
} satisfies ExportedHandler<Env>;
