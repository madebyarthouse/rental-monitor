import * as React from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [accordionValue, setAccordionValue] = React.useState<
    string | undefined
  >(undefined);
  const [local, setLocal] = React.useState<ActiveFilters>(() => {
    const parsed = parseActiveFilters(location.search);
    return parsed;
  });

  React.useEffect(() => {
    // Sync when URL changes externally
    const parsed = parseActiveFilters(location.search);
    setLocal(parsed);
  }, [location.search]);

  const handleAccordionChange = React.useCallback(
    (value: string | undefined) => {
      setAccordionValue(value);
    },
    []
  );

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
    const cleared: ActiveFilters = {} as ActiveFilters;
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
    const next: ActiveFilters = { ...local };
    if (key === "platforms") next.platforms = [];
    else {
      next[key] = undefined;
    }
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
      f.limited === true ||
      f.unlimited === true
    );
  }, [location.search]);

  return (
    <div className={cn("space-y-2", className)}>
      <Accordion
        type="single"
        collapsible
        value={accordionValue}
        className="section-header-border"
        onValueChange={handleAccordionChange}
      >
        <AccordionItem value="filters">
          <div className="sticky top-0 z-30 bg-background ">
            <AccordionTrigger className="px-2 py-2">
              <span className="text-xl font-medium text-muted-foreground">
                Filter
              </span>
            </AccordionTrigger>
          </div>
          {!open && hasAnyActive && (
            <FilterChips
              className="px-2 pt-1"
              size="md"
              filters={parseActiveFilters(location.search)}
              onRemove={onRemoveChip}
            />
          )}
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

              <div className="flex items-center gap-4">
                <Select
                  value={
                    local.limited === true && local.unlimited !== true
                      ? "limited"
                      : local.unlimited === true && local.limited !== true
                      ? "unlimited"
                      : "all"
                  }
                  onValueChange={(val) => {
                    setLocal((s) => {
                      if (val === "limited") {
                        return { ...s, limited: true, unlimited: undefined };
                      }
                      if (val === "unlimited") {
                        return { ...s, unlimited: true, limited: undefined };
                      }
                      return { ...s, limited: undefined, unlimited: undefined };
                    });
                  }}
                >
                  <SelectTrigger aria-label="Befristung wählen">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="all">Alle Befristungen</SelectItem>
                    <SelectItem value="unlimited">Unbefristet</SelectItem>
                    <SelectItem value="limited">Befristet</SelectItem>
                  </SelectContent>
                </Select>
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
