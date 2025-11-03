// Minimal subset from Next.js __NEXT_DATA__ payload we actually consume.
export interface WillhabenResultPage {
  props: {
    pageProps: {
      searchResult: SearchResult;
    };
  };
}

export interface SearchResult {
  pageRequested: number;
  rowsRequested?: number;
  rowsFound?: number;
  rowsReturned?: number;
  advertSummaryList: {
    advertSummary: AdvertSummary[];
  };
}

export interface AdvertSummary {
  id: string;
  description: string;
  attributes: {
    attribute: Array<{ name: string; values: string[] }>;
  };
}
