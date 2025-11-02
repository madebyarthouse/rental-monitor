export interface WillhabenResultPage {
  props: {
    pageProps: {
      searchResult: {
        pageRequested: number;
        advertSummaryList: {
          advertSummary: AdvertSummary[];
        };
      };
    };
  };
}

export interface AdvertSummary {
  id: string;
  description: string;
  attributes: {
    attribute: Array<{ name: string; values: string[] }>;
  };
}


