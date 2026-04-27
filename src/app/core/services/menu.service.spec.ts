import { TestBed } from '@angular/core/testing';
import { MenuService } from './menu.service';
import { lastValueFrom } from 'rxjs';

describe('MenuService', () => {
  let service: MenuService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MenuService] });
    service = TestBed.inject(MenuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return menu items', async () => {
    const items = await lastValueFrom(service.getMenuItems());
    expect(items).toBeTruthy();
    expect(items.length).toBeGreaterThan(0);
  });

  it('should have Admin item with alignRight', async () => {
    const items = await lastValueFrom(service.getMenuItems());
    const admin = items.find(i => i.label === 'Admin');
    expect(admin).toBeTruthy();
    expect(admin?.alignRight).toBe(true);
  });
});
