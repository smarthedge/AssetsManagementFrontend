import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';
import { Router } from '@angular/router';

function createMockJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 }));
  const sig = btoa('mock-signature');
  return `${header}.${body}.${sig}`;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private router: Router) {
    this.loadUserFromToken();
  }

  private loadUserFromToken(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      const user = this.decodeToken(token);
      if (user) {
        this.currentUserSubject.next(user);
      }
    }
  }

  decodeToken(token: string): User | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      return {
        id: payload.sub,
        username: payload.username,
        email: payload.email,
        role: payload.role,
        avatarUrl: payload.avatarUrl,
        token
      };
    } catch {
      return null;
    }
  }

  login(username: string, password: string): Observable<User> {
    const mockUsers: Record<string, { password: string; user: Omit<User, 'token'> }> = {
      admin: {
        password: 'admin123',
        user: { id: '1', username: 'Admin User', email: 'admin@example.com', role: 'admin', avatarUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=6366f1&color=fff' }
      },
      user: {
        password: 'user123',
        user: { id: '2', username: 'John Doe', email: 'john@example.com', role: 'user', avatarUrl: 'https://ui-avatars.com/api/?name=John+Doe&background=22c55e&color=fff' }
      }
    };

    const mockUser = mockUsers[username.toLowerCase()];
    if (mockUser && mockUser.password === password) {
      const token = createMockJwt({
        sub: mockUser.user.id,
        username: mockUser.user.username,
        email: mockUser.user.email,
        role: mockUser.user.role,
        avatarUrl: mockUser.user.avatarUrl
      });
      const user: User = { ...mockUser.user, token };
      localStorage.setItem(this.TOKEN_KEY, token);
      this.currentUserSubject.next(user);
      return of(user);
    }
    throw new Error('Invalid credentials');
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  hasRole(role: string): boolean {
    return this.currentUserSubject.value?.role === role;
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
