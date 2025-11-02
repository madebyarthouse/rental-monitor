export interface WillhabenListingPage {
  props: {
    pageProps: {
      advertDetails: {
        id: string;
        description: string;
        attributes: { attribute: Array<{ name: string; values: string[] }> };
        seoMetaData: { canonicalUrl: string };
        advertAddressDetails?: {
          postCode?: string;
          postalName?: string;
          province?: string;
        };
      };
    };
  };
}


