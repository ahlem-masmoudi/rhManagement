import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MatchingService } from '../../../services/matching.service';
import { OfferService } from '../../../services/offer.service';
import { Application, Offer } from '../../../models';

@Component({
  selector: 'app-candidate-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="candidate-home">
      <div class="welcome-section">
        <h1>Bonjour {{ firstName }} 👋</h1>
        <p class="text-muted">Bienvenue sur votre espace candidat</p>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card card">
          <div class="stat-icon" style="background: #EEF2FF;">
            <svg width="24" height="24" fill="#4F46E5" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ myApplications.length }}</div>
            <div class="stat-label">Candidatures envoyées</div>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon" style="background: #D1FAE5;">
            <svg width="24" height="24" fill="#10B981" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ availableOffers }}</div>
            <div class="stat-label">Offres disponibles</div>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon" style="background: #FEF3C7;">
            <svg width="24" height="24" fill="#F59E0B" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ pendingApplications }}</div>
            <div class="stat-label">En attente de réponse</div>
          </div>
        </div>
      </div>

      <!-- My Applications -->
      <div class="section">
        <div class="section-header">
          <h2>Mes candidatures récentes</h2>
          <a routerLink="/candidate" class="view-all">Tout voir →</a>
        </div>

        <div *ngIf="myApplications.length === 0" class="empty-message card">
          <svg width="48" height="48" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
          </svg>
          <h3>Aucune candidature pour le moment</h3>
          <p>Commencez par parcourir les offres disponibles</p>
          <a routerLink="/candidate/offers" class="btn btn-primary">Voir les offres</a>
        </div>

        <div *ngIf="myApplications.length > 0" class="applications-list">
          <div *ngFor="let app of myApplications.slice(0, 5)" class="application-card card">
            <div class="app-header">
              <div>
                <h3>{{ getOfferTitle(app.offerId) }}</h3>
                <p class="app-company">{{ getOfferDepartment(app.offerId) }}</p>
              </div>
              <span class="badge" [ngClass]="getStatusBadgeClass(app.status)">
                {{ getStatusLabel(app.status) }}
              </span>
            </div>

            <div class="app-meta">
              <span class="meta-item">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                </svg>
                Postulé le {{ formatDate(app.appliedAt) }}
              </span>
            </div>

            <div *ngIf="app.matchingScore" class="app-score">
              <div class="score-label">Score de matching</div>
              <div class="score-value" [style.color]="getScoreColor(app.matchingScore.global)">
                {{ app.matchingScore.global }}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="section">
        <h2>Actions rapides</h2>
        <div class="actions-grid">
          <a routerLink="/candidate/offers" class="action-card card">
            <svg width="32" height="32" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
            </svg>
            <h3>Parcourir les offres</h3>
            <p>Découvrez {{ availableOffers }} offres de stage</p>
          </a>

          <div class="action-card card">
            <svg width="32" height="32" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
            </svg>
            <h3>Compléter mon profil</h3>
            <p>Optimisez vos chances d'être recruté</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .candidate-home {
      max-width: 1200px;
      margin: 0 auto;
    }

    .welcome-section {
      margin-bottom: 32px;
    }

    .welcome-section h1 {
      font-size: 32px;
      margin-bottom: 8px;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      display: flex;
      gap: 16px;
      padding: 24px;
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--gray-900);
      line-height: 1.2;
    }

    .stat-label {
      font-size: 14px;
      color: var(--gray-500);
      margin-top: 4px;
    }

    /* Sections */
    .section {
      margin-bottom: 40px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .section h2 {
      font-size: 20px;
      margin: 0 0 20px 0;
    }

    .view-all {
      color: var(--primary-color);
      font-weight: 500;
      text-decoration: none;
    }

    /* Applications List */
    .applications-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .application-card {
      padding: 20px;
    }

    .app-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .app-header h3 {
      font-size: 16px;
      margin: 0 0 4px 0;
    }

    .app-company {
      font-size: 14px;
      color: var(--gray-500);
      margin: 0;
    }

    .app-meta {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--gray-500);
    }

    .app-score {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: var(--gray-50);
      border-radius: var(--radius-md);
    }

    .score-label {
      font-size: 13px;
      color: var(--gray-600);
      font-weight: 500;
    }

    .score-value {
      font-size: 20px;
      font-weight: 700;
    }

    /* Actions Grid */
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .action-card {
      padding: 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      color: inherit;
    }

    .action-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }

    .action-card svg {
      color: var(--primary-color);
      margin-bottom: 16px;
    }

    .action-card h3 {
      font-size: 16px;
      margin: 0 0 8px 0;
    }

    .action-card p {
      color: var(--gray-500);
      font-size: 14px;
      margin: 0;
    }

    /* Empty Message */
    .empty-message {
      text-align: center;
      padding: 48px 24px;
    }

    .empty-message svg {
      color: var(--gray-300);
      margin-bottom: 16px;
    }

    .empty-message h3 {
      margin: 0 0 8px 0;
      color: var(--gray-900);
    }

    .empty-message p {
      color: var(--gray-500);
      margin: 0 0 24px 0;
    }

    @media (max-width: 768px) {
      .stats-grid,
      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CandidateHomeComponent implements OnInit {
  firstName = '';
  myApplications: Application[] = [];
  availableOffers = 0;
  pendingApplications = 0;

  offers: Offer[] = [];

  constructor(
    private authService: AuthService,
    private matchingService: MatchingService,
    private offerService: OfferService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.firstName = user.firstName;

      // Load user's applications
      this.matchingService.getApplications().subscribe(apps => {
        this.myApplications = apps.filter(app => app.candidateId === user.id);
        this.pendingApplications = this.myApplications.filter(
          app => ['nouveau', 'preselection', 'entretien'].includes(app.status)
        ).length;
      });
    }

    // Load available offers
    this.offerService.getOffers().subscribe(offers => {
      this.offers = offers;
      this.availableOffers = offers.filter(o => o.status === 'publiee').length;
    });
  }

  getOfferTitle(offerId: string): string {
    const offer = this.offers.find(o => o.id === offerId);
    return offer?.title || '';
  }

  getOfferDepartment(offerId: string): string {
    const offer = this.offers.find(o => o.id === offerId);
    return offer?.department || '';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'nouveau': 'Reçue',
      'preselection': 'En présélection',
      'entretien': 'Entretien planifié',
      'test': 'Test technique',
      'offre': 'Offre reçue',
      'rejete': 'Refusée',
      'accepte': 'Acceptée'
    };
    return labels[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'nouveau': 'badge-info',
      'preselection': 'badge-warning',
      'entretien': 'badge-primary',
      'test': 'badge-warning',
      'offre': 'badge-success',
      'rejete': 'badge-danger',
      'accepte': 'badge-success'
    };
    return classes[status] || 'badge-gray';
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
}
