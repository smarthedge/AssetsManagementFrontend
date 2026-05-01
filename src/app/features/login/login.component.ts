import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [
    `
      :host {
        display: block;
      }

      .page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #c0cfe0 0%, #8fa3be 100%);
        padding: 16px;
      }

      /* ── Card shell ── */
      .auth-card {
        position: relative;
        overflow: hidden;
        width: min(768px, 100%);
        height: 480px;
        background: #e8eaf0;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
      }

      /* ── Form containers ── */
      .form-container {
        position: absolute;
        top: 0;
        height: 100%;
        width: 50%;
        transition: all 0.6s ease-in-out;
      }

      .sign-in-container {
        left: 0;
        z-index: 2;
      }
      .sign-up-container {
        left: 50%;
        z-index: 1;
        opacity: 0;
      }

      .auth-card.active .sign-in-container {
        transform: translateX(100%);
        opacity: 0;
        z-index: 1;
      }

      .auth-card.active .sign-up-container {
        opacity: 1;
        z-index: 5;
        animation: showPanel 0.6s;
      }

      @keyframes showPanel {
        0%,
        49.99% {
          opacity: 0;
          z-index: 1;
        }
        50%,
        100% {
          opacity: 1;
          z-index: 5;
        }
      }

      .form-inner {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 28px 36px;
      }

      /* ── Blue sliding overlay ── */
      .overlay-container {
        position: absolute;
        top: 0;
        left: 50%;
        width: 50%;
        height: 100%;
        overflow: hidden;
        transition: transform 0.6s ease-in-out;
        z-index: 100;
      }

      .auth-card.active .overlay-container {
        transform: translateX(-100%);
      }

      .overlay {
        position: relative;
        left: -100%;
        width: 200%;
        height: 100%;
        transition: transform 0.6s ease-in-out;
      }

      .auth-card.active .overlay {
        transform: translateX(50%);
      }

      .overlay-panel {
        position: absolute;
        top: 0;
        width: 50%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 0 44px;
        pointer-events: none;
        background: #3d52a0;
      }

      /* Blob: right edge curves inward when panel is on the left */
      .overlay-left {
        left: 0;
        border-top-right-radius: 50% 50%;
        border-bottom-right-radius: 50% 50%;
      }

      /* Blob: left edge curves inward when panel is on the right */
      .overlay-right {
        right: 0;
        border-top-left-radius: 50% 50%;
        border-bottom-left-radius: 50% 50%;
        pointer-events: auto;
      }

      .auth-card.active .overlay-left {
        pointer-events: auto;
      }
      .auth-card.active .overlay-right {
        pointer-events: none;
      }

      /* ── Typography ── */
      .form-title {
        font-size: 24px;
        font-weight: 700;
        color: #1a1a2e;
        margin: 0 0 16px;
      }

      .overlay-title {
        font-size: 24px;
        font-weight: 700;
        color: #fff;
        margin: 0 0 10px;
      }

      .overlay-desc {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.85);
        line-height: 1.6;
        margin: 0 0 22px;
      }

      /* ── Social icon row ── */
      .social-icons {
        display: flex;
        gap: 10px;
        margin-bottom: 12px;
      }

      .social-btn {
        width: 38px;
        height: 38px;
        border: 1px solid #ccc;
        border-radius: 8px;
        background: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
        color: #555;
        cursor: pointer;
        transition:
          border-color 0.2s,
          color 0.2s;
        font-family: inherit;
      }

      .social-btn:hover {
        border-color: #3d52a0;
        color: #3d52a0;
      }

      .divider-text {
        font-size: 12px;
        color: #888;
        margin: 0 0 12px;
      }

      /* ── Inputs ── */
      .auth-input {
        width: 100%;
        background: #f0f0f0;
        border: none;
        border-radius: 8px;
        padding: 11px 14px;
        font-size: 14px;
        outline: none;
        margin-bottom: 9px;
        transition: background 0.2s;
        font-family: inherit;
      }

      .auth-input:focus {
        background: #e4e4e4;
      }

      .forgot-btn {
        background: none;
        border: none;
        font-size: 13px;
        color: #888;
        cursor: pointer;
        padding: 2px 0;
        margin-bottom: 6px;
        font-family: inherit;
      }

      .forgot-btn:hover {
        color: #3d52a0;
      }

      /* ── Primary button ── */
      .btn-primary {
        width: 100%;
        background: #3d52a0;
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 11px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        cursor: pointer;
        margin-top: 4px;
        transition: background 0.25s;
        font-family: inherit;
      }

      .btn-primary:hover {
        background: #2c3d8a;
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* ── Ghost button (on blue panel) ── */
      .btn-ghost {
        background: transparent;
        color: #fff;
        border: 2px solid #fff;
        border-radius: 20px;
        padding: 10px 36px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        cursor: pointer;
        transition:
          background 0.25s,
          color 0.25s;
        font-family: inherit;
      }

      .btn-ghost:hover {
        background: #fff;
        color: #3d52a0;
      }

      /* ── Error banner ── */
      .error-msg {
        width: 100%;
        padding: 8px 12px;
        background: #fee2e2;
        border: 1px solid #fca5a5;
        border-radius: 8px;
        color: #dc2626;
        font-size: 13px;
        margin-bottom: 8px;
      }

      /* ── Demo credentials ── */
      .demo-info {
        margin-top: 14px;
        padding: 8px 12px;
        background: #f4f4f6;
        border-radius: 8px;
        font-size: 11.5px;
        color: #666;
        width: 100%;
        line-height: 1.6;
      }

      .demo-info code {
        background: #e4e4e6;
        padding: 1px 4px;
        border-radius: 3px;
      }
    `,
  ],
  template: `
    <div class="page">
      <div class="auth-card" [class.active]="isSignUpActive">
        <!-- Sign In Form (left) -->
        <div class="form-container sign-in-container">
          <div class="form-inner">
            <h2 class="form-title">Sign In</h2>

            <div class="social-icons">
              <button class="social-btn" type="button" title="Google">G+</button>
              <button class="social-btn" type="button" title="Facebook">f</button>
              <button class="social-btn" type="button" title="GitHub">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.23c-3.34.72-4.03-1.42-4.03-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.005 2.05.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"
                  />
                </svg>
              </button>
              <button class="social-btn" type="button" title="LinkedIn">in</button>
            </div>

            <p class="divider-text">or use your email password</p>

            <div *ngIf="errorMessage" class="error-msg" role="alert">{{ errorMessage }}</div>

            <form (ngSubmit)="onLogin()" style="width:100%">
              <input
                class="auth-input"
                type="text"
                placeholder="Email"
                [(ngModel)]="username"
                name="username"
                autocomplete="username"
                required
              />
              <input
                class="auth-input"
                type="password"
                placeholder="Password"
                [(ngModel)]="password"
                name="password"
                autocomplete="current-password"
                required
              />
              <button class="forgot-btn" type="button">Forget Your Password?</button>
              <button class="btn-primary" type="submit" [disabled]="loading">
                {{ loading ? 'Signing in...' : 'Sign In' }}
              </button>
            </form>

            <div class="demo-info">
              <strong>Demo —</strong>
              Admin: <code>admin</code>&nbsp;/&nbsp;<code>admin123</code> &nbsp;&nbsp;User:
              <code>user</code>&nbsp;/&nbsp;<code>user123</code>
            </div>
          </div>
        </div>

        <!-- Sign Up Form (right, UI only) -->
        <div class="form-container sign-up-container">
          <div class="form-inner">
            <h2 class="form-title">Create Account</h2>

            <div class="social-icons">
              <button class="social-btn" type="button" title="Google">G+</button>
              <button class="social-btn" type="button" title="Facebook">f</button>
              <button class="social-btn" type="button" title="GitHub">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.23c-3.34.72-4.03-1.42-4.03-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.005 2.05.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"
                  />
                </svg>
              </button>
              <button class="social-btn" type="button" title="LinkedIn">in</button>
            </div>

            <p class="divider-text">or use your email for registration</p>

            <form style="width:100%">
              <input class="auth-input" type="text" placeholder="Name" autocomplete="name" />
              <input class="auth-input" type="email" placeholder="Email" autocomplete="email" />
              <input
                class="auth-input"
                type="password"
                placeholder="Password"
                autocomplete="new-password"
              />
              <button class="btn-primary" type="button">Sign Up</button>
            </form>
          </div>
        </div>

        <!-- Blue overlay panel (slides left ↔ right) -->
        <div class="overlay-container">
          <div class="overlay">
            <!-- Shown in sign-up mode (panel on left) -->
            <div class="overlay-panel overlay-left">
              <h2 class="overlay-title">Welcome Back!</h2>
              <p class="overlay-desc">Enter your personal details to use all of site features</p>
              <button class="btn-ghost" type="button" (click)="toggleMode()">Sign In</button>
            </div>
            <!-- Shown in sign-in mode (panel on right) -->
            <div class="overlay-panel overlay-right">
              <h2 class="overlay-title">Hello, Friend!</h2>
              <p class="overlay-desc">
                Register with your personal details to use all of site features
              </p>
              <button class="btn-ghost" type="button" (click)="toggleMode()">Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  isSignUpActive = false;
  username = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  toggleMode(): void {
    this.isSignUpActive = !this.isSignUpActive;
    this.errorMessage = '';
  }

  onLogin(): void {
    this.loading = true;
    this.errorMessage = '';
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: Error) => {
        this.loading = false;
        this.errorMessage = err.message || 'Login failed';
      },
    });
  }
}
