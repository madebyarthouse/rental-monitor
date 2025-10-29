import type { ListingsResult } from "@/services/listings-service";
import { ListingsToolbar } from "./listings-toolbar";
import { ListingList } from "./listing-list";

export function ListingsPage({ data }: { data: ListingsResult }) {
  return (
    <div className="py-6 px-4">
      <ListingsToolbar />
      <ListingList data={data} />
    </div>
  );
}
