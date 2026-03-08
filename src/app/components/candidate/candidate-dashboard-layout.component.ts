import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatchingService } from '../../services/matching.service';
import { OfferService } from '../../services/offer.service';
import { Application, Offer } from '../../models';

@Component({
  selector: 'app-candidate-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive],
  template: `
    <div class="candidate-layout">
      <!-- Topbar -->
      <header class="candidate-topbar">
        <div class="topbar-left">
          <div class="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#4F46E5"/>
              <path d="M12 10h8v2h-8v-2zm0 5h8v2h-8v-2zm0 5h5v2h-5v-2z" fill="white"/>
            </svg>
            <span>RH Platform</span>
          </div>

          <nav class="nav-menu">
            <a routerLink="/candidate" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
              Dashboard
            </a>
            <a routerLink="/candidate/offers" routerLinkActive="active">
              Offres disponibles
            </a>
          </nav>
        </div>

        <div class="topbar-right">
          <div class="user-menu">
            <div class="user-avatar">{{ getUserInitials() }}</div>
            <span class="user-name">{{ getUserName() }}</span>
            <button class="btn btn-secondary btn-sm" (click)="logout()">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="candidate-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .candidate-layout {
      min-height: 100vh;
      background: var(--gray-50);
    }

    .candidate-topbar {
      background: white;
      border-bottom: 1px solid var(--gray-200);
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 70px;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 40px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      font-size: 18px;
      color: var(--gray-900);
    }

    .nav-menu {
      display: flex;
      gap: 8px;
    }

    .nav-menu a {
      padding: 8px 16px;
      border-radius: var(--radius-md);
      font-weight: 500;
      color: var(--gray-600);
      text-decoration: none;
      transition: all 0.2s;
    }

    .nav-menu a:hover {
      background: var(--gray-50);
      color: var(--gray-900);
    }

    .nav-menu a.active {
      background: #EEF2FF;
      color: var(--primary-color);
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }

    .user-name {
      font-weight: 500;
      color: var(--gray-900);
    }

    .candidate-main {
      padding: 32px 24px;
    }

    @media (max-width: 768px) {
      .topbar-left {
        gap: 20px;
      }

      .nav-menu {
        display: none;
      }

      .user-name {
        display: none;
      }
    }
  `]
})
export class CandidateDashboardLayoutComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  getUserName(): string {
    const user = this.authService.getCurrentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  getUserInitials(): string {
    const user = this.authService.getCurrentUser();
    return user ? `${user.firstName[0]}${user.lastName[0]}` : '';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
