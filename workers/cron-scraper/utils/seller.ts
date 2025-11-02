import type { DrizzleD1Database } from "drizzle-orm/d1";
import { sellers, sellerHistory } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export interface ParsedSeller {
  platformSellerId?: string;
  name?: string;
  isPrivate?: boolean;
  registerDate?: string;
  location?: string;
  activeAdCount?: number;
  organisationName?: string;
  organisationPhone?: string;
  organisationEmail?: string;
  organisationWebsite?: string;
  hasProfileImage?: boolean;
}

export async function upsertSeller(
  db: DrizzleD1Database<typeof import("@/db/schema")>,
  platform: string,
  seller: ParsedSeller | undefined
): Promise<number | null> {
  if (!seller?.platformSellerId) return null;
  const now = new Date();

  const existing = await db
    .select({ id: sellers.id })
    .from(sellers)
    .where(
      and(
        eq(sellers.platform, platform),
        eq(sellers.platformSellerId, seller.platformSellerId)
      )
    )
    .get();

  if (existing?.id) {
    await db
      .update(sellers)
      .set({
        name: seller.name ?? undefined,
        isPrivate: seller.isPrivate ?? undefined,
        registerDate: seller.registerDate ?? undefined,
        location: seller.location ?? undefined,
        activeAdCount: seller.activeAdCount ?? undefined,
        organisationName: seller.organisationName ?? undefined,
        organisationPhone: seller.organisationPhone ?? undefined,
        organisationEmail: seller.organisationEmail ?? undefined,
        organisationWebsite: seller.organisationWebsite ?? undefined,
        hasProfileImage: seller.hasProfileImage ?? undefined,
        lastSeenAt: now,
        lastUpdatedAt: now,
      })
      .where(eq(sellers.id, existing.id))
      .run();

    if (typeof seller.activeAdCount === "number") {
      await db
        .insert(sellerHistory)
        .values({
          sellerId: existing.id,
          activeAdCount: seller.activeAdCount,
          totalAdCount: null,
          observedAt: now,
        })
        .run();
    }

    return existing.id;
  }

  await db
    .insert(sellers)
    .values({
      platformSellerId: seller.platformSellerId,
      platform,
      name: seller.name ?? null,
      isPrivate: seller.isPrivate ?? null,
      isVerified: false,
      registerDate: seller.registerDate ?? null,
      location: seller.location ?? null,
      activeAdCount: seller.activeAdCount ?? null,
      totalAdCount: null,
      organisationName: seller.organisationName ?? null,
      organisationPhone: seller.organisationPhone ?? null,
      organisationEmail: seller.organisationEmail ?? null,
      organisationWebsite: seller.organisationWebsite ?? null,
      hasProfileImage: seller.hasProfileImage ?? null,
      firstSeenAt: now,
      lastSeenAt: now,
      lastUpdatedAt: now,
    })
    .run();

  const created = await db
    .select({ id: sellers.id })
    .from(sellers)
    .where(
      and(
        eq(sellers.platform, platform),
        eq(sellers.platformSellerId, seller.platformSellerId)
      )
    )
    .get();

  if (created?.id && typeof seller.activeAdCount === "number") {
    await db
      .insert(sellerHistory)
      .values({
        sellerId: created.id,
        activeAdCount: seller.activeAdCount,
        totalAdCount: null,
        observedAt: now,
      })
      .run();
  }

  return created?.id ?? null;
}


