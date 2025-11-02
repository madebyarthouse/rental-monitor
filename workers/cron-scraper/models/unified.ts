export interface UnifiedRentalListing {
  id: string;
  title: string;
  price: number;
  area?: number;
  location?: {
    zipCode?: string;
    city?: string;
    district?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
  };
  duration?: { isLimited: boolean; months?: number };
  platform: string;
  url: string;
  scrapedAt: string;
  firstSeenAt?: string;
  lastSeenAt?: string;
  active?: boolean;
}


