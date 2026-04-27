export interface Asset {
  id: string;
  name: string;
  type: string; // maps to API 'category'
  value: number;
  currency: string; // not in API, defaults to 'USD'
  status: string; // 'Active' | 'Inactive' — API uses boolean
  lastUpdated: string;
  description?: string;
  serialNumber?: string;
  purchaseDate?: string;
  version?: number;
}
