/** Mirror of the POST /trips/:id/itinerary body (contract §2.5, plan F78 "Shared contract"). */
export interface DestinationFacts {
  country: string;            // display name in the app language
  flag?: string;
  visa?: string;              // already-localized label, or the "set your country" CTA text
  currency?: string;
  plug?: string;
  cities: { name: string; timeDiff?: string }[];   // timeDiff only when the timezone is known
}
