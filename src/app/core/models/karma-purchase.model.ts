export interface KarmaPackage {
  id: string;
  karma: number;
  price: string;    // string to preserve exact decimal, e.g. "3.99" — always equals prices.USD
  currency: string; // ISO 4217, always "USD" for this field — see prices for other currencies
  label: string;
  prices: Record<string, string>; // e.g. { USD: "3.99", CLP: "3600" }
}

export interface CreateOrderResponse {
  orderID: string;  // provider's order ID, returned opaquely to the frontend
}

export interface CaptureOrderResponse {
  karma: number;
  karmaAdded: number;
}

export interface CreateMpPreferenceResponse {
  preferenceId: string;
  initPoint: string;
}

export interface MpPurchaseStatusResponse {
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  karmaAdded?: number;
}
