import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { NotificationService, AppNotification } from '../services/notification.service';
import { CandidateService } from '../services/candidate.service';
import { OfferService } from '../services/offer.service';

interface SearchResult {
  type: 'candidate' | 'offer';
  id: string;
  label: string;
  sub: string;
  initials?: string;
  route: string[];
}

@Component({
  selector: 'app-rh-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout">
      <!-- Sidebar overlay (mobile) -->
      <div class="sidebar-overlay" *ngIf="isSidebarOpen" (click)="closeSidebar()"></div>

      <!-- Sidebar -->
      <aside class="sidebar" [class.open]="isSidebarOpen">

        <!-- Logo Section -->
        <div class="sidebar-header">
          <div class="logo-area">
            <div class="logo-icon">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.15)"/>
                <path d="M12 10h8v2h-8v-2zm0 5h8v2h-8v-2zm0 5h5v2h-5v-2z" fill="white"/>
              </svg>
            </div>
            <div class="logo-text-wrap">
              <span class="logo-text">Espace RH</span>
              <span class="logo-pulse"></span>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="sidebar-nav">
          <div class="nav-section-label">Navigation</div>

          <a routerLink="/rh" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}"
             class="nav-item" (click)="closeSidebar()" style="--i:0">
            <span class="nav-icon">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
              </svg>
            </span>
            <span class="nav-label">Dashboard</span>
            <span class="nav-glow"></span>
          </a>

          <a *ngIf="canAccessOffers()" routerLink="/rh/offres" routerLinkActive="active"
             class="nav-item" (click)="closeSidebar()" style="--i:1">
            <span class="nav-icon">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"/>
                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
              </svg>
            </span>
            <span class="nav-label">Offres de stage</span>
            <span class="nav-glow"></span>
          </a>

          <a *ngIf="canAccessCandidatures()" routerLink="/rh/candidatures" routerLinkActive="active"
             class="nav-item" (click)="closeSidebar()" style="--i:2">
            <span class="nav-icon">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
              </svg>
            </span>
            <span class="nav-label">Candidatures</span>
            <span class="nav-glow"></span>
          </a>

          <a *ngIf="canAccessCandidatures()" routerLink="/rh/dossiers" routerLinkActive="active"
             class="nav-item" (click)="closeSidebar()" style="--i:3">
            <span class="nav-icon">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
              </svg>
            </span>
            <span class="nav-label">Dossiers accept&eacute;s</span>
            <span class="nav-glow"></span>
          </a>

          <a *ngIf="isAdmin()" routerLink="/rh/admin/users" routerLinkActive="active"
             class="nav-item" (click)="closeSidebar()" style="--i:4">
            <span class="nav-icon">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
              </svg>
            </span>
            <span class="nav-label">Utilisateurs RH</span>
            <span class="nav-glow"></span>
          </a>
        </nav>

        <!-- Footer -->
        <div class="sidebar-footer">
          <!-- User profile -->
          <div class="user-profile">
            <div class="avatar-wrap">
              <div class="avatar">{{ getUserInitials() }}</div>
            </div>
            <div class="user-info">
              <div class="user-name">{{ getUserName() }}</div>
              <div class="user-role">{{ getRoleLabel() }}</div>
            </div>
          </div>

          <!-- Fingerprint section -->
          <div *ngIf="isFingerprintSupported" class="fingerprint-section">
            <div *ngIf="fingerprintMessage" class="fingerprint-msg"
                 [class.fingerprint-msg-error]="fingerprintError">
              {{ fingerprintMessage }}
            </div>
            <div class="fingerprint-actions">
              <button class="btn-fp" (click)="registerFingerprint()" [disabled]="fpLoading"
                title="{{ hasCredentials ? 'Ajouter une nouvelle empreinte' : 'Configurer l\'empreinte digitale' }}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
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
              <button *ngIf="hasCredentials" class="btn-fp btn-fp-danger"
                      (click)="deleteFingerprints()" [disabled]="fpLoading"
                      title="Supprimer les empreintes enregistr&eacute;es">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Logout -->
          <button class="btn-logout" (click)="logout()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>D&eacute;connexion</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="main-wrapper">

        <!-- Topbar -->
        <header class="topbar">
          <button class="menu-toggle" (click)="toggleSidebar()">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>

          <div class="topbar-greeting">
            <span class="greeting-text">{{ getGreeting() }},&nbsp;</span>
            <span class="greeting-name">{{ getUserName().split(' ')[0] }}</span>
          </div>

          <div class="topbar-center">
            <div class="search-bar" [class.search-active]="searchQuery.length > 0">
              <svg width="17" height="17" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
              </svg>
              <input type="search" placeholder="Rechercher un candidat, une offre..."
                     [(ngModel)]="searchQuery"
                     (input)="onSearchInput()"
                     (focus)="searchFocused = true"
                     (blur)="onSearchBlur()"
                     autocomplete="off">
              <button *ngIf="searchQuery" class="search-clear" (mousedown)="clearSearch()">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>

              <!-- Search Results Dropdown -->
              <div class="search-dropdown" *ngIf="searchFocused && searchQuery.length >= 2">
                <div *ngIf="searchResults.length === 0 && !searchLoading" class="search-empty">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <span>Aucun résultat pour "{{ searchQuery }}"</span>
                </div>

                <div *ngIf="searchLoading" class="search-loading">
                  <span class="search-spinner"></span> Recherche...
                </div>

                <ng-container *ngIf="!searchLoading && searchResults.length > 0">
                  <!-- Candidates group -->
                  <div *ngIf="candidateResults.length > 0">
                    <div class="search-group-label">
                      <span class="search-group-dot search-group-dot-candidate"></span>
                      Candidats
                    </div>
                    <div *ngFor="let r of candidateResults" class="search-item" (mousedown)="goToResult(r)">
                      <div class="search-item-avatar">{{ r.initials }}</div>
                      <div class="search-item-info">
                        <span class="search-item-title">{{ r.label }}</span>
                        <span class="search-item-sub">{{ r.sub }}</span>
                      </div>
                      <span class="search-item-badge search-badge-candidate">Candidat</span>
                    </div>
                  </div>

                  <!-- Offers group -->
                  <div *ngIf="offerResults.length > 0">
                    <div class="search-group-label">
                      <span class="search-group-dot search-group-dot-offer"></span>
                      Offres de stage
                    </div>
                    <div *ngFor="let r of offerResults" class="search-item" (mousedown)="goToResult(r)">
                      <div class="search-item-icon" style="position:relative;width:32px;height:32px;min-width:32px;border-radius:9px;background:linear-gradient(135deg,#ede9fe,#ddd6fe);flex-shrink:0;">
                        <svg width="15" height="15" fill="#7c3aed" viewBox="0 0 20 20" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:block;"><path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"/><path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/></svg>
                      </div>
                      <div class="search-item-info">
                        <span class="search-item-title">{{ r.label }}</span>
                        <span class="search-item-sub">{{ r.sub }}</span>
                      </div>
                      <span class="search-item-badge search-badge-offer">Offre</span>
                    </div>
                  </div>
                </ng-container>
              </div>
            </div>
          </div>

          <div class="topbar-actions">
            <div class="notif-wrap">
              <button class="icon-btn" title="Notifications" (click)="toggleNotifications()">
                <svg width="19" height="19" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                </svg>
                <span class="badge-notification" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
              </button>

              <!-- Backdrop -->
              <div class="notif-backdrop" *ngIf="showNotifications" (click)="closeNotifications()"></div>

              <!-- Dropdown -->
              <div class="notif-panel" *ngIf="showNotifications">
                <div class="notif-header">
                  <span class="notif-title">Notifications</span>
                  <button class="notif-mark-all" (click)="markAllRead()">Tout marquer lu</button>
                </div>
                <div class="notif-list">
                  <div *ngFor="let n of notifications" class="notif-item" [class.unread]="!n.read" (click)="readNotif(n)">
                    <div class="notif-icon" [ngClass]="'notif-icon-' + n.type">
                      <svg *ngIf="n.type === 'new'" width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z"/></svg>
                      <svg *ngIf="n.type === 'doc'" width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/></svg>
                      <svg *ngIf="n.type === 'status'" width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                    </div>
                    <div class="notif-body">
                      <p class="notif-text" [innerHTML]="n.text"></p>
                      <span class="notif-time">{{ n.time }}</span>
                    </div>
                    <div class="notif-dot" *ngIf="!n.read"></div>
                  </div>
                </div>
                <div class="notif-footer">
                  <a routerLink="/rh/candidatures" (click)="closeNotifications()">Voir toutes les candidatures →</a>
                </div>
              </div>
            </div>
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
    /* ===================== RESET / BASE ===================== */
    :host {
      display: block;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    *, *::before, *::after { box-sizing: border-box; }

    /* ===================== LAYOUT ===================== */
    .app-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: #f1f5f9;
    }

    /* ===================== SIDEBAR ===================== */
    .sidebar {
      width: 260px;
      min-width: 260px;
      background: linear-gradient(180deg, #0f1f4d 0%, #1e1a6e 40%, #3b1a7a 80%, #2a0f52 100%);
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 100;
      transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 4px 0 32px rgba(0, 0, 0, 0.35);
    }

    /* ---- Logo ---- */
    .sidebar-header {
      padding: 24px 20px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .logo-area {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.45);
    }

    .logo-text-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.3px;
      background: linear-gradient(90deg, #93c5fd, #c4b5fd);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .logo-pulse {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5);
      animation: pulse-dot 2.2s ease infinite;
    }

    @keyframes pulse-dot {
      0%   { box-shadow: 0 0 0 0   rgba(16,185,129,0.6); }
      70%  { box-shadow: 0 0 0 7px rgba(16,185,129,0); }
      100% { box-shadow: 0 0 0 0   rgba(16,185,129,0); }
    }

    /* ---- Nav ---- */
    .sidebar-nav {
      flex: 1;
      padding: 20px 12px;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.08) transparent;
    }

    .sidebar-nav::-webkit-scrollbar { width: 4px; }
    .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
    .sidebar-nav::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.1);
      border-radius: 2px;
    }

    .nav-section-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.25);
      padding: 0 8px;
      margin-bottom: 10px;
    }

    .nav-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 14px;
      border-radius: 12px;
      color: #94a3b8;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 4px;
      overflow: hidden;
      transition: color 0.2s ease, background 0.2s ease;
      animation: slideInLeft 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      animation-delay: calc(var(--i) * 70ms + 100ms);
    }

    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-22px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    /* Glow layer — slides in on hover */
    .nav-glow {
      position: absolute;
      inset: 0;
      border-radius: 12px;
      background: rgba(37, 99, 235, 0.08);
      border-left: 3px solid #6366f1;
      opacity: 0;
      transform: translateX(-6px);
      transition: opacity 0.22s ease, transform 0.22s ease;
      pointer-events: none;
    }

    .nav-item:hover {
      color: #bfdbfe;
    }

    .nav-item:hover .nav-glow {
      opacity: 1;
      transform: translateX(0);
    }

    /* Active state */
    .nav-item.active {
      background: linear-gradient(90deg, #2563eb, #7c3aed);
      color: #ffffff;
      box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
    }

    .nav-item.active .nav-glow {
      display: none;
    }

    .nav-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      flex-shrink: 0;
    }

    .nav-label {
      flex: 1;
      white-space: nowrap;
    }

    /* ---- Footer ---- */
    .sidebar-footer {
      padding: 16px 16px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.07);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar-wrap {
      position: relative;
      flex-shrink: 0;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.4), 0 0 0 5px rgba(37, 99, 235, 0.12);
    }

    .user-info { flex: 1; min-width: 0; }

    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: #e2e8f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 11px;
      color: rgba(255,255,255,0.35);
      margin-top: 2px;
    }

    /* ---- Fingerprint ---- */
    .fingerprint-section {
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
      border: 1.5px solid rgba(255,255,255,0.12);
      border-radius: 10px;
      background: rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.55);
      font-size: 11.5px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .btn-fp:hover:not(:disabled) {
      border-color: #6366f1;
      color: #a5b4fc;
      background: rgba(37, 99, 235, 0.12);
    }

    .btn-fp:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .btn-fp-danger {
      flex: 0 0 auto;
      padding: 7px 10px;
    }

    .btn-fp-danger:hover:not(:disabled) {
      border-color: #ef4444 !important;
      color: #fca5a5 !important;
      background: rgba(239, 68, 68, 0.12) !important;
    }

    .fingerprint-msg {
      font-size: 11px;
      color: #6ee7b7;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 8px;
      padding: 5px 9px;
      line-height: 1.4;
    }

    .fingerprint-msg.fingerprint-msg-error {
      color: #fca5a5;
      background: rgba(239, 68, 68, 0.12);
      border-color: rgba(239, 68, 68, 0.25);
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
      flex-shrink: 0;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ---- Logout ---- */
    .btn-logout {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      border: 1.5px solid rgba(239, 68, 68, 0.25);
      border-radius: 12px;
      background: rgba(239, 68, 68, 0.06);
      color: rgba(252, 165, 165, 0.75);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.22s ease;
    }

    .btn-logout:hover {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.5);
      color: #fca5a5;
    }

    /* ===================== MAIN WRAPPER ===================== */
    .main-wrapper {
      flex: 1;
      margin-left: 260px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    /* ===================== TOPBAR ===================== */
    .topbar {
      height: 68px;
      background: #ffffff;
      border-bottom: 1px solid #e8edf4;
      display: flex;
      align-items: center;
      padding: 0 28px;
      gap: 20px;
      flex-shrink: 0;
      box-shadow: 0 1px 8px rgba(0,0,0,0.04);
    }

    .menu-toggle {
      display: none;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      background: none;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      cursor: pointer;
      color: #64748b;
      flex-shrink: 0;
      transition: all 0.2s;
    }

    .menu-toggle:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .topbar-greeting {
      display: flex;
      align-items: baseline;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .greeting-text {
      font-size: 15px;
      font-weight: 400;
      color: #64748b;
    }

    .greeting-name {
      font-size: 15px;
      font-weight: 700;
      color: #1e293b;
    }

    .topbar-center {
      flex: 1;
      display: flex;
      justify-content: center;
    }

    .search-bar {
      width: 100%;
      max-width: 440px;
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-bar svg {
      position: absolute;
      left: 13px;
      color: #94a3b8;
      pointer-events: none;
    }

    .search-bar input {
      width: 100%;
      padding: 10px 14px 10px 40px;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      font-size: 13.5px;
      color: #1e293b;
      background: #f8fafc;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    }

    .search-bar input::placeholder { color: #94a3b8; }

    .search-bar input:focus {
      border-color: #6366f1;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    }

    .search-clear {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      align-items: center;
      padding: 2px;
      border-radius: 4px;
      transition: color 0.15s;
    }
    .search-clear:hover { color: #64748b; }

    .search-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: 0;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.13), 0 4px 16px rgba(0,0,0,0.07);
      z-index: 300;
      overflow: hidden;
      animation: dropdownIn 0.18s cubic-bezier(0.34,1.56,0.64,1);
      max-height: 420px;
      overflow-y: auto;
    }

    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-6px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .search-group-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #94a3b8;
      padding: 10px 14px 6px;
      border-top: 1px solid #f1f5f9;
    }
    .search-group-label:first-child { border-top: none; }

    .search-group-dot {
      display: inline-block;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .search-group-dot-candidate { background: #6366f1; }
    .search-group-dot-offer     { background: #7c3aed; }

    .search-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 14px;
      cursor: pointer;
      transition: background 0.12s;
    }
    .search-item:hover { background: #f5f3ff; }

    .search-item-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .search-item-icon {
      width: 32px;
      height: 32px;
      min-width: 32px;
      border-radius: 9px;
      background: linear-gradient(135deg, #ede9fe, #ddd6fe);
      color: #7c3aed;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .search-item-icon svg {
      display: block;
      margin: 0;
    }

    .search-item-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .search-item-title {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .search-item-sub {
      font-size: 11.5px;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .search-item-badge {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 99px;
      flex-shrink: 0;
    }
    .search-badge-candidate { background: #eef2ff; color: #6366f1; }
    .search-badge-offer { background: #f0fdf4; color: #16a34a; }

    .search-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 28px 14px;
      color: #94a3b8;
      font-size: 13px;
    }
    .search-empty svg { color: #cbd5e1; }

    .search-loading {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 14px;
      color: #64748b;
      font-size: 13px;
    }

    .search-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid #e2e8f0;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    .icon-btn {
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      border: 1.5px solid #e2e8f0;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #64748b;
      transition: all 0.2s ease;
    }

    .icon-btn:hover {
      background: #eef2ff;
      border-color: #a5b4fc;
      color: #6366f1;
      box-shadow: 0 4px 12px rgba(99,102,241,0.12);
    }

    .badge-notification {
      position: absolute;
      top: -5px;
      right: -5px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      font-size: 10px;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 6px rgba(239,68,68,0.4);
    }

    /* ===================== MAIN CONTENT ===================== */
    .main-content {
      flex: 1;
      overflow-y: auto;
      background: #f1f5f9;
      padding: 28px;
    }

    /* ===================== OVERLAY ===================== */
    .sidebar-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 99;
      animation: fadeIn 0.2s ease;
      backdrop-filter: blur(2px);
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* ===================== RESPONSIVE ===================== */
    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        width: 280px;
        min-width: 280px;
        z-index: 200;
      }

      .sidebar.open {
        transform: translateX(0);
      }

      .main-wrapper {
        margin-left: 0;
      }

      .menu-toggle {
        display: flex;
      }

      .topbar-greeting { display: none; }
      .topbar { padding: 0 16px; height: 60px; gap: 12px; }
      .main-content { padding: 16px; }
    }

    @media (max-width: 480px) {
      .sidebar { width: 85vw; min-width: unset; max-width: 300px; }
      .main-content { padding: 12px; }
      .topbar { padding: 0 12px; }
      .search-bar input { font-size: 13px; }
    }

    /* ===================== NOTIFICATIONS ===================== */
    .notif-wrap {
      position: relative;
    }

    .notif-backdrop {
      position: fixed;
      inset: 0;
      z-index: 199;
    }

    .notif-panel {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 360px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08);
      z-index: 200;
      overflow: hidden;
      animation: notifSlideIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes notifSlideIn {
      from { opacity: 0; transform: translateY(-8px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 18px 12px;
      border-bottom: 1px solid #f1f5f9;
    }

    .notif-title {
      font-size: 15px;
      font-weight: 700;
      color: #1e293b;
    }

    .notif-mark-all {
      font-size: 12px;
      font-weight: 500;
      color: #6366f1;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      transition: color 0.2s;
    }

    .notif-mark-all:hover { color: #4f46e5; }

    .notif-list {
      max-height: 320px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #e2e8f0 transparent;
    }

    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 13px 18px;
      cursor: pointer;
      transition: background 0.15s;
      position: relative;
      border-bottom: 1px solid #f8fafc;
    }

    .notif-item:hover { background: #f8fafc; }

    .notif-item.unread { background: #f0f4ff; }
    .notif-item.unread:hover { background: #e8eeff; }

    .notif-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .notif-icon-new  { background: #dbeafe; color: #2563eb; }
    .notif-icon-doc  { background: #d1fae5; color: #059669; }
    .notif-icon-status { background: #fef3c7; color: #d97706; }

    .notif-body { flex: 1; min-width: 0; }

    .notif-text {
      font-size: 13px;
      color: #374151;
      line-height: 1.45;
      margin: 0 0 4px;
    }

    .notif-time {
      font-size: 11.5px;
      color: #94a3b8;
    }

    .notif-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #6366f1;
      flex-shrink: 0;
      margin-top: 6px;
    }

    .notif-footer {
      padding: 12px 18px;
      border-top: 1px solid #f1f5f9;
      text-align: center;
    }

    .notif-footer a {
      font-size: 13px;
      font-weight: 600;
      color: #6366f1;
      text-decoration: none;
      transition: color 0.2s;
    }

    .notif-footer a:hover { color: #4f46e5; }
  `]
})
export class RhLayoutComponent implements OnInit, OnDestroy {
  isSidebarOpen = false;
  isFingerprintSupported = typeof PublicKeyCredential !== 'undefined';
  hasCredentials = false;
  fpLoading = false;
  fingerprintMessage = '';
  fingerprintError = false;

  showNotifications = false;
  notifications: AppNotification[] = [];
  notifLoading = false;

  // Search
  searchQuery = '';
  searchFocused = false;
  searchLoading = false;
  searchResults: SearchResult[] = [];
  candidateResults: SearchResult[] = [];
  offerResults: SearchResult[] = [];
  private allCandidates: any[] = [];
  private allOffers: any[] = [];
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  closeNotifications(): void {
    this.showNotifications = false;
  }

  markAllRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.notifService.markAllReadIds(this.notifications.map(n => n.id));
  }

  readNotif(n: AppNotification): void {
    n.read = true;
    this.notifService.markRead(n.id);
  }

  private loadNotifications(): void {
    this.notifLoading = true;
    this.notifService.getNotifications().subscribe({
      next: data => {
        this.notifications = data;
        this.notifLoading = false;
      },
      error: () => { this.notifLoading = false; }
    });
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private notifService: NotificationService,
    private candidateService: CandidateService,
    private offerService: OfferService
  ) {}

  ngOnInit(): void {
    if (this.isFingerprintSupported) {
      this.authService.getWebAuthnCredentials().subscribe({
        next: creds => this.hasCredentials = creds.length > 0,
        error: () => {}
      });
    }
    this.loadNotifications();

    // Pre-load data for search
    this.candidateService.getCandidates()
      .pipe(takeUntil(this.destroy$))
      .subscribe(c => this.allCandidates = c);

    this.offerService.getOffers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(o => this.allOffers = o);

    // Debounce search
    this.searchSubject.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => this.runSearch(q));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onSearchBlur(): void {
    setTimeout(() => { this.searchFocused = false; }, 150);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.candidateResults = [];
    this.offerResults = [];
  }

  private runSearch(q: string): void {
    if (q.length < 2) {
      this.searchResults = [];
      this.candidateResults = [];
      this.offerResults = [];
      return;
    }
    const lower = q.toLowerCase();

    this.candidateResults = this.allCandidates
      .filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(lower) ||
        (c.email || '').toLowerCase().includes(lower) ||
        (c.school || '').toLowerCase().includes(lower)
      )
      .slice(0, 5)
      .map(c => ({
        type: 'candidate' as const,
        id: c.id,
        label: `${c.firstName} ${c.lastName}`,
        sub: c.email || c.school || '',
        initials: `${(c.firstName[0] || '').toUpperCase()}${(c.lastName[0] || '').toUpperCase()}`,
        route: ['/rh/candidatures']
      }));

    this.offerResults = this.allOffers
      .filter((o: any) =>
        (o.title || '').toLowerCase().includes(lower) ||
        (o.department || '').toLowerCase().includes(lower) ||
        (o.location || '').toLowerCase().includes(lower)
      )
      .slice(0, 5)
      .map((o: any) => ({
        type: 'offer' as const,
        id: o.id || o._id,
        label: o.title,
        sub: [o.department, o.location].filter(Boolean).join(' · '),
        route: ['/rh/offres']
      }));

    this.searchResults = [...this.candidateResults, ...this.offerResults];
  }

  goToResult(result: SearchResult): void {
    this.searchFocused = false;
    this.searchQuery = '';
    this.searchResults = [];
    this.candidateResults = [];
    this.offerResults = [];
    if (result.type === 'candidate') {
      this.router.navigate(['/rh/candidatures'], { queryParams: { highlight: result.id } });
    } else {
      this.router.navigate(result.route);
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

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  isAdmin(): boolean {
    const role = this.authService.getCurrentUser()?.role;
    return ['recruiter', 'admin'].includes(role ?? '');
  }

  canAccessOffers(): boolean {
    const role = this.authService.getCurrentUser()?.role;
    return ['recruiter', 'admin', 'rh_offres'].includes(role ?? '');
  }

  canAccessCandidatures(): boolean {
    const role = this.authService.getCurrentUser()?.role;
    return ['recruiter', 'admin', 'rh_candidatures'].includes(role ?? '');
  }

  getRoleLabel(): string {
    const role = this.authService.getCurrentUser()?.role;
    if (role === 'rh_offres') return 'Resp. Offres';
    if (role === 'rh_candidatures') return 'Resp. Candidatures';
    if (role === 'admin') return 'Administrateur';
    return 'Recruteur';
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
