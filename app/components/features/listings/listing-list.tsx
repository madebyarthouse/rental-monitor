import * as React from "react";
import type { ListingsResult } from "@/services/listings-service";
import { ListingRow } from "./listing-row";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useLocation } from "react-router";

function useBuildHref() {
  const location = useLocation();
  return React.useCallback(
    (updates: Record<string, string | number | undefined | null>) => {
      const url = new URL(location.pathname + location.search, "http://dummy");
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === null || v === "")
          url.searchParams.delete(k);
        else url.searchParams.set(k, String(v));
      }
      return url.pathname + (url.search ? url.search : "");
    },
    [location.pathname, location.search]
  );
}

export function ListingList({ data }: { data: ListingsResult }) {
  const buildHref = useBuildHref();
  const { items, page, totalPages } = data;

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          Keine Inserate gefunden.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((it) => (
            <ListingRow key={it.id} item={it} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className="mt-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={page > 1 ? buildHref({ page: page - 1 }) : undefined}
                aria-disabled={page <= 1}
                onClick={(e) => {
                  if (page <= 1) e.preventDefault();
                }}
              />
            </PaginationItem>

            {/* Simple windowed pages: current -1, current, current +1 */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) => Math.abs(p - page) <= 1 || p === 1 || p === totalPages
              )
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && (
                      <PaginationItem>
                        <span className="px-2 text-muted-foreground">…</span>
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        href={buildHref({ page: p })}
                        isActive={p === page}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  </React.Fragment>
                );
              })}

            <PaginationItem>
              <PaginationNext
                href={
                  page < totalPages ? buildHref({ page: page + 1 }) : undefined
                }
                aria-disabled={page >= totalPages}
                onClick={(e) => {
                  if (page >= totalPages) e.preventDefault();
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
