import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { User, UserRole, LoginCredentials, AuthResponse, LoginResult, RiskChallengeData, ForgotPasswordResponse } from '../models/auth.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor() {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('authToken');
    
    if (savedUser && savedToken) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  // Get auth headers with token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private getOrCreateDeviceId(): string {
    const key = 'deviceId';
    const existing = localStorage.getItem(key);
    if (existing && existing.trim().length > 0) return existing;

    const newId = (globalThis.crypto && 'randomUUID' in globalThis.crypto)
      ? (globalThis.crypto as Crypto).randomUUID()
      : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;

    localStorage.setItem(key, newId);
    return newId;
  }

  private getDeviceHeaders(): HttpHeaders {
    const deviceId = this.getOrCreateDeviceId();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId
    });
  }

  private isAuthResponse(result: AuthResponse | RiskChallengeData): result is AuthResponse {
    return (result as AuthResponse)?.token !== undefined && (result as AuthResponse)?.user !== undefined;
  }

  login(credentials: LoginCredentials): Observable<LoginResult> {
    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/auth/login`,
      credentials,
      { headers: this.getDeviceHeaders() }
    ).pipe(
      map(response => response.data as LoginResult),
      tap(result => {
        if (!this.isAuthResponse(result)) return;

        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        localStorage.setItem('authToken', result.token);

        this.currentUserSubject.next(result.user);
      }),
      catchError(error => {
        console.error('Login error:', error);
        // Preserve backend error payload (code/message) for UI to display precise feedback
        return throwError(() => error);
      })
    );
  }

  verifyRisk(riskToken: string, otp: string): Observable<AuthResponse> {
    return this.http.post<{ success: boolean; data: AuthResponse }>(
      `${this.apiUrl}/auth/risk/verify`,
      { riskToken, otp },
      { headers: this.getDeviceHeaders() }
    ).pipe(
      map(response => response.data),
      tap(authResponse => {
        localStorage.setItem('currentUser', JSON.stringify(authResponse.user));
        localStorage.setItem('authToken', authResponse.token);
        this.currentUserSubject.next(authResponse.user);
      }),
      catchError(error => {
        console.error('Risk verify error:', error);
        return throwError(() => error);
      })
    );
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<{ success: boolean; data?: ForgotPasswordResponse; message: string }>(
      `${this.apiUrl}/auth/forgot-password`,
      { email }
    ).pipe(
      map(response => response.data || {}),
      catchError(error => {
        console.error('Forgot password error:', error);
        return throwError(() => error);
      })
    );
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/auth/reset-password`,
      { token, password }
    ).pipe(
      map(response => ({ message: response.message })),
      catchError(error => {
        console.error('Reset password error:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null && !!localStorage.getItem('authToken');
  }

  hasRole(role: UserRole): boolean {
    const user = this.currentUserSubject.value;
    return user !== null && user.role === role;
  }

  updateProfileComplete(userId: string): void {
    const user = this.currentUserSubject.value;
    if (user && user.id === userId) {
      const updatedUser = { ...user, profileComplete: true };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
    }
  }

  // Register new candidate. Password is optional for first-time candidate.
  register(email: string, password: string | undefined, firstName: string, lastName: string): Observable<AuthResponse> {
    const payload: any = { email, firstName, lastName, role: 'candidate' };
    if (password && password.trim().length > 0) {
      payload.password = password;
    }

    return this.http.post<{ success: boolean; data: AuthResponse }>(
      `${this.apiUrl}/auth/register`,
      payload
    ).pipe(
      map(response => response.data),
      tap(authResponse => {
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(authResponse.user));
        localStorage.setItem('authToken', authResponse.token);
        
        this.currentUserSubject.next(authResponse.user);
      }),
      catchError(error => {
        console.error('Registration error:', error);
        return throwError(() => new Error(error.error?.message || 'Registration failed'));
      })
    );
  }

  // Verify token and get current user from backend
  verifyToken(): Observable<User> {
    return this.http.get<{ success: boolean; data: User }>(
      `${this.apiUrl}/auth/me`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => response.data),
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        console.error('Token verification failed:', error);
        this.logout();
        return throwError(() => new Error('Session expired'));
      })
    );
  }
}
