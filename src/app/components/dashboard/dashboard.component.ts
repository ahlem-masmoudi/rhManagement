import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CandidateService } from '../../services/candidate.service';
import { OfferService } from '../../services/offer.service';
import { Candidate, Offer } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <h1>Tableau de bord</h1>
        <p class="text-muted">Vue d'ensemble de vos recrutements</p>
      </div>

      <!-- KPIs -->
      <div class="grid-4 mb-lg">
        <div class="card kpi-card">
          <div class="kpi-icon" style="background: #EEF2FF;">
            <svg width="24" height="24" fill="#4F46E5" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Candidats actifs</div>
            <div class="kpi-value">{{ totalCandidates }}</div>
            <div class="kpi-change positive">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd"/>
              </svg>
              +12% ce mois
            </div>
          </div>
        </div>

        <div class="card kpi-card">
          <div class="kpi-icon" style="background: #D1FAE5;">
            <svg width="24" height="24" fill="#10B981" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Offres publiées</div>
            <div class="kpi-value">{{ publishedOffers }}</div>
            <div class="kpi-change positive">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd"/>
              </svg>
              +3 cette semaine
            </div>
          </div>
        </div>

        <div class="card kpi-card">
          <div class="kpi-icon" style="background: #FEF3C7;">
            <svg width="24" height="24" fill="#F59E0B" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
              </svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">En entretien</div>
            <div class="kpi-value">{{ interviewCount }}</div>
            <div class="kpi-change neutral">
              8 planifiés
            </div>
          </div>
        </div>

        <div class="card kpi-card">
          <div class="kpi-icon" style="background: #DBEAFE;">
            <svg width="24" height="24" fill="#3B82F6" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Taux de matching</div>
            <div class="kpi-value">78%</div>
            <div class="kpi-change positive">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd"/>
              </svg>
              +5% vs. mois dernier
            </div>
          </div>
        </div>
      </div>

      <div class="grid-3">
        <!-- Alerts -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Alertes & Actions</h3>
          </div>
          <div class="alerts-list">
            <div class="alert alert-warning">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              <div>
                <div class="alert-title">3 entretiens à planifier</div>
                <div class="alert-text">Des candidats attendent votre retour</div>
              </div>
            </div>

            <div class="alert alert-info">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>
              <div>
                <div class="alert-title">Nouvelle offre à valider</div>
                <div class="alert-text">"Stage DevOps" attend validation</div>
              </div>
            </div>

            <div class="alert alert-success">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              <div>
                <div class="alert-title">5 nouveaux candidats matchés</div>
                <div class="alert-text">Score moyen: 85%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Priority Candidates -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Candidats prioritaires</h3>
          </div>
          <div class="candidates-list">
            <div *ngFor="let candidate of priorityCandidates" class="candidate-item">
              <div class="candidate-avatar">{{ candidate.firstName[0] }}{{ candidate.lastName[0] }}</div>
              <div class="candidate-info">
                <div class="candidate-name">{{ candidate.firstName }} {{ candidate.lastName }}</div>
                <div class="candidate-meta">{{ candidate.school }}</div>
              </div>
              <div class="score-badge" [style.background]="getScoreColor(92)">92</div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Activité récente</h3>
          </div>
          <div class="activity-list">
            <div class="activity-item">
              <div class="activity-icon" style="background: #EEF2FF;">
                <svg width="16" height="16" fill="#4F46E5" viewBox="0 0 20 20">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z"/>
                </svg>
              </div>
              <div class="activity-content">
                <div class="activity-text"><strong>Sophie Martin</strong> a postulé à "Stage Full-Stack"</div>
                <div class="activity-time">Il y a 5 minutes</div>
              </div>
            </div>

            <div class="activity-item">
              <div class="activity-icon" style="background: #D1FAE5;">
                <svg width="16" height="16" fill="#10B981" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="activity-content">
                <div class="activity-text">Offre <strong>"Stage Data Scientist"</strong> publiée</div>
                <div class="activity-time">Il y a 2 heures</div>
              </div>
            </div>

            <div class="activity-item">
              <div class="activity-icon" style="background: #FEF3C7;">
                <svg width="16" height="16" fill="#F59E0B" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="activity-content">
                <div class="activity-text">Entretien planifié avec <strong>Thomas Dubois</strong></div>
                <div class="activity-time">Il y a 3 heures</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1400px;
    }

    .page-header {
      margin-bottom: var(--spacing-xl);
    }

    .page-header h1 {
      margin-bottom: var(--spacing-xs);
    }

    /* KPI Cards */
    .kpi-card {
      display: flex;
      gap: var(--spacing-md);
    }

    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-content {
      flex: 1;
    }

    .kpi-label {
      font-size: 13px;
      color: var(--gray-500);
      margin-bottom: var(--spacing-xs);
    }

    .kpi-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--gray-900);
      margin-bottom: var(--spacing-xs);
    }

    .kpi-change {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 500;
    }

    .kpi-change.positive {
      color: var(--success);
    }

    .kpi-change.neutral {
      color: var(--gray-500);
    }

    /* Alerts */
    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .alert {
      display: flex;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      border-left: 3px solid;
    }

    .alert-warning {
      background: #FFFBEB;
      border-color: var(--warning);
      color: #92400E;
    }

    .alert-info {
      background: #EFF6FF;
      border-color: var(--info);
      color: #1E40AF;
    }

    .alert-success {
      background: #F0FDF4;
      border-color: var(--success);
      color: #166534;
    }

    .alert svg {
      flex-shrink: 0;
    }

    .alert-title {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 2px;
    }

    .alert-text {
      font-size: 13px;
      opacity: 0.8;
    }

    /* Candidates List */
    .candidates-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .candidate-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .candidate-avatar {
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
      flex-shrink: 0;
    }

    .candidate-info {
      flex: 1;
    }

    .candidate-name {
      font-weight: 600;
      font-size: 14px;
      color: var(--gray-900);
    }

    .candidate-meta {
      font-size: 13px;
      color: var(--gray-500);
    }

    .score-badge {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      color: white;
    }

    /* Activity List */
    .activity-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .activity-item {
      display: flex;
      gap: var(--spacing-md);
    }

    .activity-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-content {
      flex: 1;
    }

    .activity-text {
      font-size: 14px;
      color: var(--gray-900);
      margin-bottom: 4px;
    }

    .activity-time {
      font-size: 12px;
      color: var(--gray-500);
    }
  `]
})
export class DashboardComponent implements OnInit {
  totalCandidates = 0;
  publishedOffers = 0;
  interviewCount = 0;
  priorityCandidates: Candidate[] = [];

  constructor(
    private candidateService: CandidateService,
    private offerService: OfferService
  ) {}

  ngOnInit(): void {
    this.candidateService.getCandidates().subscribe(candidates => {
      this.totalCandidates = candidates.length;
      this.priorityCandidates = candidates.slice(0, 5);
      this.interviewCount = candidates.filter(c => c.status === 'entretien_programme' || c.status === 'entretien_realise').length;
    });

    this.offerService.getOffers().subscribe(offers => {
      this.publishedOffers = offers.filter(o => o.status === 'publiee').length;
    });
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
    if (score >= 60) return 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)';
    return 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
  }
}
