import { dbClient } from "@/db/client";
import { runDiscovery } from "./runs/discovery";
import { runSweep } from "./runs/sweep";
import { runVerification } from "./runs/verification";

const SCHEDULES = {
  discovery: "*/30 * * * *",
  sweep: "0 */3 * * *",
  verification: "0 * * * *",
} as const;

export default {
  async scheduled(event, env, ctx) {
    console.log(`[cron] received: cron=${event.cron}`);
    const db = dbClient(env.rental_monitor);
    if (event.cron === SCHEDULES.discovery) {
      console.log(`[cron] dispatch: discovery`);
      ctx.waitUntil(runDiscovery(db));
    } else if (event.cron === SCHEDULES.sweep) {
      console.log(`[cron] dispatch: sweep`);
      ctx.waitUntil(runSweep(db));
    } else if (event.cron === SCHEDULES.verification) {
      console.log(`[cron] dispatch: verification`);
      ctx.waitUntil(runVerification(db));
    }
  },
} satisfies ExportedHandler<Env>;
