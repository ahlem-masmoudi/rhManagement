import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User, UserRole, LoginCredentials, AuthResponse } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  // Demo users for testing
  private demoUsers: Array<User & { password: string }> = [
    {
      id: '1',
      email: 'admin@rh.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'RH',
      role: 'recruiter',
      profileComplete: true,
      createdAt: new Date('2024-01-01')
    },
    {
      id: '1b',
      email: 'rh@example.com',
      password: 'password',
      firstName: 'Admin',
      lastName: 'RH',
      role: 'recruiter',
      profileComplete: true,
      createdAt: new Date('2024-01-01')
    },
    {
      id: '2',
      email: 'candidate@example.com',
      password: 'candidate123',
      firstName: 'Sophie',
      lastName: 'Martin',
      role: 'candidate',
      profileComplete: true,
      createdAt: new Date('2024-01-15')
    },
    {
      id: '3',
      email: 'newcandidate@example.com',
      password: 'new123',
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'candidate',
      profileComplete: false,
      createdAt: new Date('2024-03-01')
    }
  ];

  constructor() {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    // Simulate API call with delay
    const user = this.demoUsers.find(
      u => u.email === credentials.email && u.password === credentials.password
    );

    if (user) {
      const { password, ...userWithoutPassword } = user;
      const authResponse: AuthResponse = {
        user: userWithoutPassword,
        token: 'demo-jwt-token-' + user.id
      };

      // Save to localStorage
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      localStorage.setItem('authToken', authResponse.token);
      
      this.currentUserSubject.next(userWithoutPassword);

      return of(authResponse).pipe(delay(300));
    }

    // Return an error Observable
    return new Observable(observer => {
      setTimeout(() => {
        observer.error(new Error('Invalid credentials'));
      }, 300);
    });
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
    return this.currentUserSubject.value !== null;
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

  // Register new candidate (demo)
  register(email: string, password: string, firstName: string, lastName: string): Observable<AuthResponse> {
    const newUser: User & { password: string } = {
      id: Date.now().toString(),
      email,
      password,
      firstName,
      lastName,
      role: 'candidate',
      profileComplete: false,
      createdAt: new Date()
    };

    this.demoUsers.push(newUser);

    const { password: _, ...userWithoutPassword } = newUser;
    const authResponse: AuthResponse = {
      user: userWithoutPassword,
      token: 'demo-jwt-token-' + newUser.id
    };

    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    localStorage.setItem('authToken', authResponse.token);
    this.currentUserSubject.next(userWithoutPassword);

    return of(authResponse).pipe(delay(500));
  }
}
