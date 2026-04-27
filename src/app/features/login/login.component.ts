import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, CardModule, PasswordModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900">
      <div class="w-full max-w-md px-4">
        <div class="bg-white rounded-2xl shadow-2xl p-8">
          <div class="text-center mb-8">
            <div class="flex justify-center mb-4">
              <div class="bg-indigo-600 rounded-full p-4">
                <i class="pi pi-chart-bar text-white text-3xl"></i>
              </div>
            </div>
            <h1 class="text-2xl font-bold text-gray-800">Assets Management</h1>
            <p class="text-gray-500 mt-1">Sign in to your account</p>
          </div>

          <div *ngIf="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {{ errorMessage }}
          </div>

          <form (ngSubmit)="onLogin()" #loginForm="ngForm">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                pInputText
                type="text"
                [(ngModel)]="username"
                name="username"
                required
                placeholder="Enter username"
                class="w-full"
              />
            </div>
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <p-password
                [(ngModel)]="password"
                name="password"
                required
                [feedback]="false"
                [toggleMask]="true"
                placeholder="Enter password"
                styleClass="w-full"
                inputStyleClass="w-full"
              ></p-password>
            </div>

            <button
              pButton
              type="submit"
              label="Sign In"
              icon="pi pi-sign-in"
              [loading]="loading"
              class="w-full"
              severity="primary"
            ></button>
          </form>

          <div class="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p class="font-semibold mb-2">Demo Credentials:</p>
            <p>Admin: <code>admin</code> / <code>admin123</code></p>
            <p>User: <code>user</code> / <code>user123</code></p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {
    this.loading = true;
    this.errorMessage = '';
    try {
      this.authService.login(this.username, this.password).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err: Error) => {
          this.loading = false;
          this.errorMessage = err.message || 'Login failed';
        }
      });
    } catch (err: unknown) {
      this.loading = false;
      this.errorMessage = err instanceof Error ? err.message : 'Invalid credentials';
    }
  }
}
