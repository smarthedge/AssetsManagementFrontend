import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Router } from '@angular/router';

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    email: string;
    roles: { id: number; name: string }[];
    status: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly AUTH_URL = 'http://localhost:8080/api/auth/login';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  // Use HttpBackend (bypasses interceptors) to avoid circular dependency:
  // HttpClient → jwtInterceptor → AuthService → HttpClient
  private http: HttpClient;

  constructor(
    handler: HttpBackend,
    private router: Router,
  ) {
    this.http = new HttpClient(handler);
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        this.currentUserSubject.next(JSON.parse(userJson));
      } catch {
        this.clearStorage();
      }
    }
  }

  login(username: string, password: string): Observable<User> {
    return this.http.post<LoginResponse>(this.AUTH_URL, { username, password }).pipe(
      map((resp) => {
        const apiUser = resp.user;
        const user: User = {
          id: String(apiUser.id),
          username: apiUser.username,
          email: apiUser.email,
          role: apiUser.roles?.[0]?.name ?? 'user',
          token: resp.access_token,
        };
        localStorage.setItem(this.TOKEN_KEY, resp.access_token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
        return user;
      }),
      catchError((err) => {
        const msg = err.error?.message ?? 'Invalid credentials';
        return throwError(() => new Error(msg));
      }),
    );
  }

  logout(): void {
    this.clearStorage();
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

  decodeToken(token: string): User | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
      return {
        id: String(payload.sub ?? ''),
        username: payload.username ?? String(payload.sub ?? ''),
        email: payload.email ?? '',
        role: payload.role ?? 'user',
        token,
      };
    } catch {
      return null;
    }
  }

  private clearStorage(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}
