export interface KarmaPackage {
  id: string;
  karma: number;
  price: string;    // string to preserve exact decimal, e.g. "3.99"
  currency: string; // ISO 4217, e.g. "USD", "CLP"
  label: string;
}

export interface CreateOrderResponse {
  orderID: string;  // provider's order ID, returned opaquely to the frontend
}

export interface CaptureOrderResponse {
  karma: number;
  karmaAdded: number;
}
