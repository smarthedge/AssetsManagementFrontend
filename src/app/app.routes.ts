import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AssetsListComponent } from './features/assets/assets-list/assets-list.component';
import { AdminComponent } from './features/admin/admin.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'assets', component: AssetsListComponent },
      { path: 'admin', component: AdminComponent, canActivate: [roleGuard], data: { roles: ['admin'] } },
    ]
  },
  { path: '**', redirectTo: '' }
];
