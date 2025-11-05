import * as React from "react";
import type { ListingItem } from "@/services/listings-service";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

function formatCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "-";
  try {
    return new Intl.NumberFormat("de-AT", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} €`;
  }
}

function formatArea(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "-";
  return `${value} m²`;
}

function formatRooms(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "-";
  return `${value} Zimmer`;
}

function formatDate(value: Date | number | string | null | undefined): string {
  if (value == null) return "-";
  let ms: number | null = null;
  if (value instanceof Date) {
    ms = value.getTime();
  } else if (typeof value === "number") {
    // Heuristic: treat seconds as < 1e12
    ms = value < 1e12 ? value * 1000 : value;
  } else if (typeof value === "string") {
    const num = Number(value);
    if (Number.isFinite(num)) {
      ms = num < 1e12 ? num * 1000 : num;
    } else {
      const parsed = Date.parse(value);
      ms = Number.isFinite(parsed) ? parsed : null;
    }
  }
  if (ms == null) return "-";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("de-AT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function ListingRow({
  item,
  className,
}: {
  item: ListingItem;
  className?: string;
}) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group grid grid-cols-[1fr_auto] gap-5 border border-border p-3 md:p-5 lg:p-6 hover:bg-secondary/40",
        className
      )}
    >
      <div className="min-w-0">
        <div className="font-medium md:text-lg xl:text-xl max-w-[60ch] text-foreground">
          {item.title}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1  md:text-lg text-muted-foreground">
          <span>{formatCurrency(item.price)}</span>
          <span>•</span>
          <span>{formatArea(item.area)}</span>
          {item.rooms != null && (
            <>
              <span>•</span>
              <span>{formatRooms(item.rooms)}</span>
            </>
          )}
          <span>•</span>
          <span>
            {item.isLimited
              ? `befristet ${
                  item.durationMonths
                    ? `(${item.durationMonths / 12} Jahre)`
                    : ""
                }`
              : "unbefristet"}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="uppercase tracking-wide">{item.platform}</span>
          <span>•</span>
          <span>zuletzt gesehen: {formatDate(item.lastSeenAt)}</span>
        </div>
      </div>
      <div className="flex items-start pt-1 pr-1">
        <ExternalLink className="size-5 lg:size-6 text-muted-foreground group-hover:text-foreground" />
      </div>
    </a>
  );
}
