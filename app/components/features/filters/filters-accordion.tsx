import * as React from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FilterChips, type ActiveFilters } from "./filter-chips";

function parseActiveFilters(search: string): ActiveFilters {
  const sp = new URLSearchParams(search);
  const num = (k: string) => {
    const v = sp.get(k);
    return v != null ? Number(v) : undefined;
  };
  const bool = (k: string) =>
    sp.get(k) != null ? sp.get(k) === "true" : undefined;
  return {
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    minArea: num("minArea"),
    maxArea: num("maxArea"),
    limited: bool("limited"),
    unlimited: bool("unlimited"),
  };
}

function setParams(
  sp: URLSearchParams,
  key: string,
  value?: string | number | boolean | null
) {
  if (value === undefined || value === null || value === "") sp.delete(key);
  else sp.set(key, String(value));
}

export function FiltersAccordion({ className }: { className?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [local, setLocal] = React.useState<ActiveFilters>(() =>
    parseActiveFilters(location.search)
  );

  React.useEffect(() => {
    // Sync when URL changes externally
    setLocal(parseActiveFilters(location.search));
  }, [location.search]);

  const apply = () => {
    const sp = new URLSearchParams(location.search);
    setParams(sp, "minPrice", local.minPrice);
    setParams(sp, "maxPrice", local.maxPrice);
    setParams(sp, "minArea", local.minArea);
    setParams(sp, "maxArea", local.maxArea);
    setParams(sp, "limited", local.limited);
    setParams(sp, "unlimited", local.unlimited);
    navigate({ pathname: location.pathname, search: sp.toString() });
  };

  const clearAll = () => {
    const cleared: ActiveFilters = {};
    setLocal(cleared);
    const sp = new URLSearchParams(location.search);
    [
      "minPrice",
      "maxPrice",
      "minArea",
      "maxArea",
      "limited",
      "unlimited",
    ].forEach((k) => sp.delete(k));
    navigate({ pathname: location.pathname, search: sp.toString() });
  };

  const onRemoveChip = (key: keyof ActiveFilters) => {
    const next = { ...local } as any;
    if (key === "platforms") next.platforms = [];
    else next[key] = undefined;
    setLocal(next);
    const sp = new URLSearchParams(location.search);
    sp.delete(String(key));
    navigate({ pathname: location.pathname, search: sp.toString() });
  };

  const hasAnyActive = React.useMemo(() => {
    const f = parseActiveFilters(location.search);
    return (
      f.minPrice != null ||
      f.maxPrice != null ||
      f.minArea != null ||
      f.maxArea != null ||
      (f.limited ?? false) !== (f.unlimited ?? false)
    );
  }, [location.search]);

  return (
    <div className={cn("space-y-2", className)}>
      <Accordion
        type="single"
        collapsible
        value={open ? "filters" : undefined}
        onValueChange={(v) => setOpen(v === "filters")}
      >
        <AccordionItem value="filters">
          <AccordionTrigger>
            <div className="flex w-full flex-col gap-1">
              <span className="px-2 pb-1 text-xl font-medium text-muted-foreground">
                Filter
              </span>
              {!open && hasAnyActive && (
                <FilterChips
                  className="pt-0.5"
                  size="md"
                  filters={parseActiveFilters(location.search)}
                  onRemove={onRemoveChip}
                />
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-3 px-2">
              <div className="grid grid-cols-1 gap-2">
                <label className="grid gap-1">
                  <span className="text-xs text-muted-foreground">
                    Min. Preis (€)
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={local.minPrice ?? ""}
                    onChange={(e) =>
                      setLocal((s) => ({
                        ...s,
                        minPrice: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs text-muted-foreground">
                    Max. Preis (€)
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={local.maxPrice ?? ""}
                    onChange={(e) =>
                      setLocal((s) => ({
                        ...s,
                        maxPrice: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <label className="grid gap-1">
                  <span className="text-xs text-muted-foreground">
                    Min. Fläche (m²)
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={local.minArea ?? ""}
                    onChange={(e) =>
                      setLocal((s) => ({
                        ...s,
                        minArea: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs text-muted-foreground">
                    Max. Fläche (m²)
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={local.maxArea ?? ""}
                    onChange={(e) =>
                      setLocal((s) => ({
                        ...s,
                        maxArea: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(local.limited)}
                    onChange={(e) =>
                      setLocal((s) => ({
                        ...s,
                        limited: e.target.checked || undefined,
                      }))
                    }
                  />
                  Befristet
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(local.unlimited)}
                    onChange={(e) =>
                      setLocal((s) => ({
                        ...s,
                        unlimited: e.target.checked || undefined,
                      }))
                    }
                  />
                  Unbefristet
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Zurücksetzen
                </Button>
                <Button size="sm" onClick={apply}>
                  Anwenden
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
