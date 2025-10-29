import * as React from "react";
import { useLocation, useNavigate } from "react-router";

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
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={sortBy}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="lastSeenAt">Datum</option>
          <option value="price">Preis</option>
          <option value="area">Fläche</option>
          <option value="pricePerSqm">Preis/m²</option>
        </select>
      </label>
    </div>
  );
}
