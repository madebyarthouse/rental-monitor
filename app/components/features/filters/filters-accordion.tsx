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
  const [accordionValue, setAccordionValue] = React.useState<string | undefined>(undefined);
  const [local, setLocal] = React.useState<ActiveFilters>(() =>
    parseActiveFilters(location.search)
  );

  React.useEffect(() => {
    // Sync when URL changes externally
    setLocal(parseActiveFilters(location.search));
  }, [location.search]);

  const handleAccordionChange = React.useCallback((value: string | undefined) => {
    setAccordionValue(value);
  }, []);

  const open = accordionValue === "filters";

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
        value={accordionValue}
        onValueChange={handleAccordionChange}
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
                  <input
                    type="number"
                    inputMode="numeric"
                    className="h-9 border-b border-black bg-background px-3 text-sm rounded-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0"
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
                  <span className="text-xs text-muted-foreground">
                    Min. Preis (€)
                  </span>
                </label>
                <label className="grid gap-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    className="h-9 border-b border-black bg-background px-3 text-sm rounded-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0"
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
                  <span className="text-xs text-muted-foreground">
                    Max. Preis (€)
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <label className="grid gap-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    className="h-9 border-b border-black bg-background px-3 text-sm rounded-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0"
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
                  <span className="text-xs text-muted-foreground">
                    Min. Fläche (m²)
                  </span>
                </label>
                <label className="grid gap-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    className="h-9 border-b border-black bg-background px-3 text-sm rounded-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0"
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
                  <span className="text-xs text-muted-foreground">
                    Max. Fläche (m²)
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2" role="group" aria-label="Befristet / Unbefristet">
                <Button
                  type="button"
                  size="sm"
                  variant={local.limited ? "secondary" : "ghost"}
                  aria-pressed={Boolean(local.limited)}
                  onClick={() =>
                    setLocal((s) => ({
                      ...s,
                      limited: s.limited ? undefined : true,
                      unlimited: undefined,
                    }))
                  }
                >
                  Befristet
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={local.unlimited ? "secondary" : "ghost"}
                  aria-pressed={Boolean(local.unlimited)}
                  onClick={() =>
                    setLocal((s) => ({
                      ...s,
                      unlimited: s.unlimited ? undefined : true,
                      limited: undefined,
                    }))
                  }
                >
                  Unbefristet
                </Button>
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
