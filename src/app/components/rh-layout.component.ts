import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-rh-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout">
      <!-- Sidebar overlay (mobile) -->
      <div class="sidebar-overlay" *ngIf="isSidebarOpen" (click)="closeSidebar()"></div>

      <!-- Sidebar -->
      <aside class="sidebar" [class.open]="isSidebarOpen">
        <div class="sidebar-header">
          <div class="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#4F46E5"/>
              <path d="M12 10h8v2h-8v-2zm0 5h8v2h-8v-2zm0 5h5v2h-5v-2z" fill="white"/>
            </svg>
            <span>Espace admin RH</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/rh" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item" (click)="closeSidebar()">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
            </svg>
            <span>Tableau de bord</span>
          </a>

          <a routerLink="/rh/offres" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"/>
              <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
            </svg>
            <span>Offres de stage</span>
          </a>

          <a routerLink="/rh/candidatures" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
            </svg>
            <span>Candidatures</span>
          </a>

          <a routerLink="/rh/matching" routerLinkActive="active" class="nav-item" (click)="closeSidebar()">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>Intelligent Matching</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-profile">
            <div class="avatar">{{ getUserInitials() }}</div>
            <div class="user-info">
              <div class="user-name">{{ getUserName() }}</div>
              <div class="user-role">Recruteur</div>
            </div>
          </div>

          <div *ngIf="isFingerprintSupported" class="fingerprint-section">
            <div *ngIf="fingerprintMessage" class="fingerprint-msg" [class.fingerprint-msg-error]="fingerprintError">
              {{ fingerprintMessage }}
            </div>

            <div class="fingerprint-actions">
              <button class="btn-fp" (click)="registerFingerprint()" [disabled]="fpLoading"
                title="{{ hasCredentials ? 'Ajouter une nouvelle empreinte' : 'Configurer l\'empreinte digitale' }}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
                  <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
                  <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
                  <path d="M2 12a10 10 0 0 1 18-6"/>
                  <path d="M2 16h.01"/>
                  <path d="M21.8 16c.2-2 .131-5.354 0-6"/>
                  <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/>
                  <path d="M8.65 22c.21-.66.45-1.32.57-2"/>
                  <path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
                </svg>
                <span>{{ hasCredentials ? 'Ajouter empreinte' : 'Configurer empreinte' }}</span>
                <span *ngIf="fpLoading" class="fp-spinner"></span>
              </button>

              <button *ngIf="hasCredentials" class="btn-fp btn-fp-danger" (click)="deleteFingerprints()" [disabled]="fpLoading" title="Supprimer les empreintes enregistrées">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </div>

          <button class="btn btn-secondary btn-sm" (click)="logout()" style="margin-top: 8px; width: 100%;">
            Déconnexion
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="main-wrapper">
        <!-- Topbar -->
        <header class="topbar">
          <button class="menu-toggle" (click)="toggleSidebar()">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>

          <span class="topbar-title">Espace admin RH</span>

          <div class="search-bar">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
            </svg>
            <input type="search" placeholder="Rechercher un candidat, une offre...">
          </div>

          <div class="topbar-actions">
            <button class="icon-btn">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
              </svg>
              <span class="badge-notification">3</span>
            </button>
          </div>
        </header>

        <!-- Page Content -->
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* Sidebar */
    .sidebar {
      width: 260px;
      background: white;
      border-right: 1px solid var(--gray-200);
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 100;
      transition: transform 0.3s ease;
    }

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid var(--gray-200);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      font-size: 18px;
      color: var(--gray-900);
    }

    .sidebar-nav {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      color: var(--gray-600);
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s;
      margin-bottom: 4px;
    }

    .nav-item:hover {
      background: var(--gray-50);
      color: var(--gray-900);
    }

    .nav-item.active {
      background: #EEF2FF;
      color: var(--primary-color);
    }

    .sidebar-footer {
      padding: 20px;
      border-top: 1px solid var(--gray-200);
    }

    .user-profile {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }

    .user-info {
      flex: 1;
      min-width: 0;
    }

    .user-name {
      font-weight: 600;
      font-size: 14px;
      color: var(--gray-900);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 12px;
      color: var(--gray-500);
    }

    /* Main Wrapper */
    .main-wrapper {
      flex: 1;
      margin-left: 260px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Topbar */
    .topbar {
      height: 70px;
      background: white;
      border-bottom: 1px solid var(--gray-200);
      display: flex;
      align-items: center;
      padding: 0 24px;
      gap: 20px;
    }

    .menu-toggle {
      display: none;
    }

    .search-bar {
      flex: 1;
      max-width: 500px;
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-bar svg {
      position: absolute;
      left: 12px;
      color: var(--gray-400);
    }

    .search-bar input {
      width: 100%;
      padding: 10px 12px 10px 40px;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-md);
      font-size: 14px;
    }

    .topbar-actions {
      display: flex;
      gap: 12px;
    }

    .icon-btn {
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      border: 1px solid var(--gray-200);
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .icon-btn:hover {
      background: var(--gray-50);
    }

    .badge-notification {
      position: absolute;
      top: -4px;
      right: -4px;
      background: var(--danger-color);
      color: white;
      font-size: 11px;
      font-weight: 600;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 5px;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      overflow-y: auto;
      background: var(--gray-50);
      padding: 24px;
    }

    /* Fingerprint Section */
    .fingerprint-section {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .fingerprint-actions {
      display: flex;
      gap: 6px;
    }

    .btn-fp {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 10px;
      border: 1.5px solid var(--gray-200);
      border-radius: var(--radius-md);
      background: white;
      color: var(--gray-600);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .btn-fp:hover:not(:disabled) {
      border-color: var(--primary-color);
      color: var(--primary-color);
      background: #EEF2FF;
    }

    .btn-fp:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-fp-danger {
      flex: 0 0 auto;
      padding: 7px 10px;
    }

    .btn-fp-danger:hover:not(:disabled) {
      border-color: var(--danger-color);
      color: var(--danger-color);
      background: #FEF2F2;
    }

    .fingerprint-msg {
      font-size: 11px;
      color: #166534;
      background: #DCFCE7;
      border: 1px solid #86EFAC;
      border-radius: var(--radius-sm);
      padding: 5px 8px;
      line-height: 1.4;
    }

    .fingerprint-msg.fingerprint-msg-error {
      color: #991B1B;
      background: #FEE2E2;
      border-color: #FCA5A5;
    }

    .fp-spinner {
      display: inline-block;
      width: 10px;
      height: 10px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin-left: 2px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Topbar title (hidden on desktop, shown on mobile) */
    .topbar-title {
      display: none;
      font-weight: 600;
      font-size: 15px;
      color: var(--gray-900);
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Sidebar overlay backdrop */
    .sidebar-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      z-index: 99;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        width: 280px;
        z-index: 200;
      }

      .sidebar.open {
        transform: translateX(0);
        box-shadow: 4px 0 24px rgba(0,0,0,0.18);
      }

      .main-wrapper {
        margin-left: 0;
      }

      .menu-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: none;
        border: none;
        cursor: pointer;
        flex-shrink: 0;
      }

      .topbar-title { display: block; }
      .search-bar { display: none; }
      .topbar { padding: 0 12px; height: 60px; gap: 10px; }
      .main-content { padding: 16px; }
    }

    @media (max-width: 480px) {
      .sidebar { width: 85vw; max-width: 300px; }
      .main-content { padding: 12px; }
      .topbar { padding: 0 10px; }
    }
  `]
})
export class RhLayoutComponent implements OnInit {
  isSidebarOpen = false;
  isFingerprintSupported = typeof PublicKeyCredential !== 'undefined';
  hasCredentials = false;
  fpLoading = false;
  fingerprintMessage = '';
  fingerprintError = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.isFingerprintSupported) {
      this.authService.getWebAuthnCredentials().subscribe({
        next: creds => this.hasCredentials = creds.length > 0,
        error: () => {}
      });
    }
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  getUserName(): string {
    const user = this.authService.getCurrentUser();
    return user ? `${user.firstName} ${user.lastName}` : 'Admin RH';
  }

  getUserInitials(): string {
    const user = this.authService.getCurrentUser();
    return user ? `${user.firstName[0]}${user.lastName[0]}` : 'RH';
  }

  registerFingerprint(): void {
    this.fpLoading = true;
    this.fingerprintMessage = '';
    this.fingerprintError = false;

    this.authService.registerFingerprint()
      .then(() => {
        this.fpLoading = false;
        this.hasCredentials = true;
        this.fingerprintMessage = 'Empreinte enregistrée avec succès.';
        this.fingerprintError = false;
        setTimeout(() => this.fingerprintMessage = '', 4000);
      })
      .catch(err => {
        this.fpLoading = false;
        this.fingerprintError = true;
        if (err?.name === 'NotAllowedError') {
          this.fingerprintMessage = 'Enregistrement annulé ou refusé.';
        } else {
          this.fingerprintMessage = err?.error?.message || err?.message || 'Erreur lors de l\'enregistrement.';
        }
        setTimeout(() => this.fingerprintMessage = '', 5000);
      });
  }

  deleteFingerprints(): void {
    this.fpLoading = true;
    this.fingerprintMessage = '';
    this.fingerprintError = false;

    this.authService.deleteWebAuthnCredentials().subscribe({
      next: () => {
        this.fpLoading = false;
        this.hasCredentials = false;
        this.fingerprintMessage = 'Empreintes supprimées.';
        this.fingerprintError = false;
        setTimeout(() => this.fingerprintMessage = '', 3000);
      },
      error: err => {
        this.fpLoading = false;
        this.fingerprintError = true;
        this.fingerprintMessage = err?.error?.message || 'Erreur lors de la suppression.';
        setTimeout(() => this.fingerprintMessage = '', 5000);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
