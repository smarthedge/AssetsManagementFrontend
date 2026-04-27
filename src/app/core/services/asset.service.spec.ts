import { TestBed } from '@angular/core/testing';
import { AssetService } from './asset.service';
import { lastValueFrom } from 'rxjs';

describe('AssetService', () => {
  let service: AssetService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AssetService] });
    service = TestBed.inject(AssetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return assets list', async () => {
    const assets = await lastValueFrom(service.getAssets());
    expect(assets).toBeTruthy();
    expect(assets.length).toBeGreaterThan(0);
  });

  it('should return asset by id', async () => {
    const asset = await lastValueFrom(service.getAssetById('1'));
    expect(asset).toBeTruthy();
    expect(asset?.id).toBe('1');
  });

  it('should return undefined for non-existent id', async () => {
    const asset = await lastValueFrom(service.getAssetById('999'));
    expect(asset).toBeUndefined();
  });
});
