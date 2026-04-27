import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface AppMenuItem {
  label: string;
  icon?: string;
  routerLink?: string;
  items?: AppMenuItem[][];
  roles?: string[];
  alignRight?: boolean;
  open?: boolean;
  mobileOpen?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  getMenuItems(): Observable<AppMenuItem[]> {
    return of([
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        routerLink: '/dashboard'
      },
      {
        label: 'Assets',
        icon: 'pi pi-box',
        items: [[
          { label: 'All Assets', icon: 'pi pi-list', routerLink: '/assets' },
          { label: 'Portfolio', icon: 'pi pi-chart-pie', routerLink: '/assets/portfolio' },
          { label: 'Reports', icon: 'pi pi-file', routerLink: '/assets/reports' }
        ]]
      },
      {
        label: 'Markets',
        icon: 'pi pi-chart-line',
        items: [[
          { label: 'Stocks', icon: 'pi pi-arrow-up', routerLink: '/markets/stocks' },
          { label: 'Bonds', icon: 'pi pi-shield', routerLink: '/markets/bonds' },
          { label: 'Commodities', icon: 'pi pi-shopping-cart', routerLink: '/markets/commodities' }
        ]]
      },
      {
        label: 'Admin',
        icon: 'pi pi-cog',
        alignRight: true,
        roles: ['admin'],
        items: [[
          { label: 'Users', icon: 'pi pi-users', routerLink: '/admin' },
          { label: 'Settings', icon: 'pi pi-sliders-h', routerLink: '/admin' },
          { label: 'Audit Log', icon: 'pi pi-history', routerLink: '/admin' }
        ]]
      }
    ]);
  }
}
