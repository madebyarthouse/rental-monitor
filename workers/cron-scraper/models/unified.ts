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
  seller?: {
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
  };
}


