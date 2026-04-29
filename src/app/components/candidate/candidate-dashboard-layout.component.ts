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
            <span>Espace candidat</span>
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
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="candidate-main">
        <router-outlet></router-outlet>
      </main>

      <!-- Bottom Nav (mobile only) -->
      <nav class="bottom-nav">
        <a routerLink="/candidate" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="bottom-nav-item">
          <svg width="22" height="22" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
          </svg>
          <span>Accueil</span>
        </a>
        <a routerLink="/candidate/offers" routerLinkActive="active" class="bottom-nav-item">
          <svg width="22" height="22" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5z" clip-rule="evenodd"/>
            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
          </svg>
          <span>Offres</span>
        </a>
      </nav>
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

    /* Bottom navigation bar (mobile only) */
    .bottom-nav {
      display: none;
    }

    @media (max-width: 768px) {
      .candidate-layout {
        padding-bottom: 64px;
      }

      .candidate-topbar {
        padding: 0 16px;
        height: 60px;
      }

      .topbar-left {
        gap: 16px;
      }

      .logo span {
        display: none;
      }

      .nav-menu {
        display: none;
      }

      .user-name {
        display: none;
      }

      .candidate-main {
        padding: 16px;
      }

      .bottom-nav {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 64px;
        background: white;
        border-top: 1px solid var(--gray-200);
        z-index: 100;
        box-shadow: 0 -2px 12px rgba(0,0,0,0.08);
      }

      .bottom-nav-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        color: var(--gray-500);
        text-decoration: none;
        font-size: 11px;
        font-weight: 500;
        transition: color 0.2s;
      }

      .bottom-nav-item.active {
        color: var(--primary-color);
      }

      .bottom-nav-item svg {
        width: 22px;
        height: 22px;
      }
    }

    @media (max-width: 480px) {
      .candidate-main { padding: 12px; }
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
