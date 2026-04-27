import { Component, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MenuService, AppMenuItem } from '../../../../core/services/menu.service';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MenuModule, AvatarModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  menuItems: AppMenuItem[] = [];
  leftMenuItems: AppMenuItem[] = [];
  rightMenuItems: AppMenuItem[] = [];
  currentUser: User | null = null;
  isMobileMenuOpen = signal(false);
  userMenuItems: MenuItem[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private menuService: MenuService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.menuService.getMenuItems().pipe(takeUntil(this.destroy$)).subscribe(items => {
      this.menuItems = items;
      this.leftMenuItems = items.filter(i => !i.alignRight);
      this.rightMenuItems = items.filter(i => i.alignRight);
    });

    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      this.userMenuItems = [
        { label: user?.email || '', icon: 'pi pi-envelope', disabled: true },
        { separator: true },
        { label: 'Logout', icon: 'pi pi-sign-out', command: () => this.logout() }
      ];
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.closeAllDropdowns();
  }

  toggleDropdown(item: AppMenuItem, event: Event): void {
    event.stopPropagation();
    const wasOpen = item.open;
    this.closeAllDropdowns();
    item.open = !wasOpen;
  }

  closeAllDropdowns(): void {
    this.menuItems.forEach(item => item.open = false);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  logout(): void {
    this.closeMobileMenu();
    this.authService.logout();
  }

  hasAccess(item: AppMenuItem): boolean {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some(role => this.authService.hasRole(role));
  }
}
