// src/app/core/services/auth.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let apiService: jasmine.SpyObj<ApiService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['post']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set currentUser on successful login', async () => {
    const mockResponse = {
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      user: {
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'admin' as const,
        createdAt: new Date()
      }
    };

    apiService.post.and.returnValue(of(mockResponse));

    await service.login({
      email: 'test@test.com',
      password: 'password123'
    });

    expect(service.currentUser()).toEqual(mockResponse.user);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should clear user on logout', () => {
    // Primero setear usuario
    service.currentUser.set({
      id: '1',
      email: 'test@test.com',
      name: 'Test User',
      role: 'admin',
      createdAt: new Date()
    });

    service.logout();

    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should compute isAdmin correctly', () => {
    service.currentUser.set({
      id: '1',
      email: 'test@test.com',
      name: 'Test User',
      role: 'admin',
      createdAt: new Date()
    });

    expect(service.isAdmin()).toBe(true);
  });
});