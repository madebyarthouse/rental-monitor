export interface WillhabenListingPage {
  props: {
    pageProps: {
      advertDetails: {
        id: string;
        description: string;
        attributes: { attribute: Array<{ name: string; values: string[] }> };
        seoMetaData: { canonicalUrl: string };
        sellerProfileUserData?: {
          name?: string;
          private?: boolean;
          registerDate?: string;
          location?: string;
          activeAdCount?: number;
          hasProfileImage?: boolean;
          orgUUID?: string | null;
        };
        organisationDetails?: {
          id?: number;
          uuid?: string;
          orgName?: string | null;
          orgPhone?: string | null;
          orgEmail?: string | null;
          organisationDetailLinkList?: {
            contextLink?: Array<{ id: string; uri: string }>;
          };
        };
        advertAddressDetails?: {
          postCode?: string;
          postalName?: string;
          province?: string;
        };
      };
    };
  };
}


