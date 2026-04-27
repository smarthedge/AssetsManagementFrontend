import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Asset } from '../models/asset.model';

interface AssetResponse {
  id: number;
  name: string;
  description?: string;
  category?: string;
  serialNumber?: string;
  purchaseDate?: string;
  value?: number;
  status: boolean;
  lastChangedDateTime?: string;
  version?: number;
}

interface AssetRequest {
  name: string;
  description?: string;
  category?: string;
  serialNumber?: string;
  purchaseDate?: string;
  value?: number;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly BASE_URL = 'http://localhost:8080/api/assets';

  constructor(private http: HttpClient) {}

  getAssets(page = 0, size = 100): Observable<Asset[]> {
    return this.http
      .get<PageResponse<AssetResponse>>(`${this.BASE_URL}?page=${page}&size=${size}`)
      .pipe(map((resp) => resp.content.map((r) => this.toAsset(r))));
  }

  getAssetById(id: string): Observable<Asset | undefined> {
    return this.http.get<AssetResponse>(`${this.BASE_URL}/${id}`).pipe(map((r) => this.toAsset(r)));
  }

  addAsset(asset: Asset): Observable<Asset> {
    return this.http
      .post<AssetResponse>(this.BASE_URL, this.toRequest(asset))
      .pipe(map((r) => this.toAsset(r)));
  }

  updateAsset(id: string, changes: Partial<Asset>): Observable<Asset> {
    return this.http
      .put<AssetResponse>(`${this.BASE_URL}/${id}`, this.toRequest(changes as Asset))
      .pipe(map((r) => this.toAsset(r)));
  }

  deleteAsset(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`);
  }

  private toAsset(r: AssetResponse): Asset {
    return {
      id: String(r.id),
      name: r.name,
      type: r.category ?? '',
      value: r.value ?? 0,
      currency: 'USD',
      status: r.status ? 'Active' : 'Inactive',
      lastUpdated: r.lastChangedDateTime
        ? r.lastChangedDateTime.split('T')[0]
        : (r.purchaseDate ?? ''),
      description: r.description,
      serialNumber: r.serialNumber,
      purchaseDate: r.purchaseDate,
      version: r.version,
    };
  }

  private toRequest(asset: Asset): AssetRequest {
    return {
      name: asset.name,
      category: asset.type,
      value: asset.value,
      description: asset.description,
      serialNumber: asset.serialNumber,
      purchaseDate: asset.purchaseDate,
    };
  }
}
