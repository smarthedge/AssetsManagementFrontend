import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Asset } from '../models/asset.model';

const MOCK_ASSETS: Asset[] = [
  { id: '1', name: 'Apple Inc.', type: 'Stock', value: 187.65, currency: 'USD', status: 'Active', lastUpdated: '2024-01-15' },
  { id: '2', name: 'US Treasury Bond 10Y', type: 'Bond', value: 98.50, currency: 'USD', status: 'Active', lastUpdated: '2024-01-15' },
  { id: '3', name: 'Gold Futures', type: 'Commodity', value: 2045.30, currency: 'USD', status: 'Active', lastUpdated: '2024-01-14' },
  { id: '4', name: 'Microsoft Corp.', type: 'Stock', value: 375.80, currency: 'USD', status: 'Active', lastUpdated: '2024-01-15' },
  { id: '5', name: 'EUR/USD', type: 'Forex', value: 1.0892, currency: 'USD', status: 'Active', lastUpdated: '2024-01-15' },
  { id: '6', name: 'Bitcoin ETF', type: 'ETF', value: 42100.00, currency: 'USD', status: 'Active', lastUpdated: '2024-01-15' },
  { id: '7', name: 'Amazon.com Inc.', type: 'Stock', value: 185.40, currency: 'USD', status: 'Active', lastUpdated: '2024-01-15' },
  { id: '8', name: 'Corporate Bond Fund', type: 'Bond', value: 102.25, currency: 'USD', status: 'Inactive', lastUpdated: '2024-01-10' },
  { id: '9', name: 'Silver Futures', type: 'Commodity', value: 23.45, currency: 'USD', status: 'Active', lastUpdated: '2024-01-14' },
  { id: '10', name: 'S&P 500 ETF', type: 'ETF', value: 478.25, currency: 'USD', status: 'Active', lastUpdated: '2024-01-15' },
];

@Injectable({ providedIn: 'root' })
export class AssetService {
  getAssets(): Observable<Asset[]> {
    return of(MOCK_ASSETS);
  }

  getAssetById(id: string): Observable<Asset | undefined> {
    return of(MOCK_ASSETS.find(a => a.id === id));
  }
}
