import * as React from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export function ListingsToolbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const sp = new URLSearchParams(location.search);
  const sortBy = sp.get("sortBy") || "lastSeenAt";

  const onChange = (value: string) => {
    const next = new URLSearchParams(location.search);
    next.set("sortBy", value);
    if (value === "lastSeenAt") {
      // default to desc for date
      next.set("order", "desc");
    } else {
      // keep current order or default desc
      if (!next.get("order")) next.set("order", "desc");
    }
    navigate({ pathname: location.pathname, search: next.toString() });
  };

  return (
    <div className="mb-3 flex items-center justify-end">
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Sortierung</span>
        <Select value={sortBy} onValueChange={onChange}>
          <SelectTrigger
            className="border-black rounded-none shadow-none"
            aria-label="Sortierung"
          >
            <SelectValue>
              {(() => {
                switch (sortBy) {
                  case "lastSeenAt":
                    return "Datum";
                  case "price":
                    return "Preis";
                  case "area":
                    return "Fläche";
                  case "pricePerSqm":
                    return "Preis/m²";
                  default:
                    return "Datum";
                }
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="right-0 rounded-none">
            <SelectItem value="lastSeenAt">Datum</SelectItem>
            <SelectItem value="price">Preis</SelectItem>
            <SelectItem value="area">Fläche</SelectItem>
            <SelectItem value="pricePerSqm">Preis/m²</SelectItem>
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}
