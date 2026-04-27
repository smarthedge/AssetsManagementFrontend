import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { provideRouter } from '@angular/router';
import { lastValueFrom } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), AuthService]
    });
    localStorage.clear();
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login with valid admin credentials', async () => {
    const user = await lastValueFrom(service.login('admin', 'admin123'));
    expect(user.username).toBe('Admin User');
    expect(user.role).toBe('admin');
  });

  it('should login with valid user credentials', async () => {
    const user = await lastValueFrom(service.login('user', 'user123'));
    expect(user.username).toBe('John Doe');
    expect(user.role).toBe('user');
  });

  it('should throw with invalid credentials', () => {
    expect(() => service.login('invalid', 'wrong')).toThrow();
  });

  it('should be logged in after login', async () => {
    await lastValueFrom(service.login('admin', 'admin123'));
    expect(service.isLoggedIn()).toBe(true);
  });

  it('should check role correctly', async () => {
    await lastValueFrom(service.login('admin', 'admin123'));
    expect(service.hasRole('admin')).toBe(true);
    expect(service.hasRole('user')).toBe(false);
  });

  it('should store token in localStorage', async () => {
    await lastValueFrom(service.login('admin', 'admin123'));
    expect(localStorage.getItem('auth_token')).toBeTruthy();
  });
});
