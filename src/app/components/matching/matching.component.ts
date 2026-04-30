import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatchingService } from '../../services/matching.service';
import { OfferService } from '../../services/offer.service';
import { CandidateService } from '../../services/candidate.service';
import { Application, Offer, Candidate } from '../../models';

interface MatchedCandidate {
  candidate: Candidate;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  hasApplied: boolean;
  application: Application | null;
}

@Component({
  selector: 'app-matching',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="matching-page">
      <div class="page-header">
        <div>
          <h1>Intelligent Matching</h1>
          <p class="text-muted">Trouvez les meilleurs candidats pour chaque offre</p>
        </div>
      </div>

      <!-- Offer Selector -->
      <div class="card mb-lg">
        <div class="offer-selector">
          <div class="selector-label">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"/>
            </svg>
            Offre :
          </div>
          <select [(ngModel)]="selectedOfferId" (change)="onOfferChange()" class="offer-select">
            <option value="">Choisir une offre...</option>
            <option *ngFor="let offer of offers" [value]="offer.id">{{ offer.title }}</option>
          </select>
        </div>

        <!-- Offer required skills chips -->
        <div class="offer-skills" *ngIf="selectedOffer">
          <span class="offer-skills-label">Compétences requises :</span>
          <span *ngFor="let s of requiredSkills" class="skill-chip required">{{ s }}</span>
          <span *ngIf="requiredSkills.length === 0" class="text-muted" style="font-size:13px">Aucune compétence définie pour cette offre</span>
        </div>
      </div>

      <!-- Results -->
      <div *ngIf="selectedOfferId">
        <!-- Stats bar -->
        <div class="stats-bar card mb-lg">
          <div class="stat-item">
            <span class="stat-num">{{ matchedCandidates.length }}</span>
            <span class="stat-lbl">candidats analysés</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">{{ appliedCount }}</span>
            <span class="stat-lbl">ont postulé</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">{{ strongMatchCount }}</span>
            <span class="stat-lbl">forte compatibilité (≥70%)</span>
          </div>
        </div>

        <!-- Filter bar -->
        <div class="filter-bar card mb-lg">
          <div class="filter-item">
            <label>Score minimum : <strong>{{ minScore }}%</strong></label>
            <input type="range" min="0" max="100" step="5" [(ngModel)]="minScore" class="slider">
          </div>
          <div class="filter-item">
            <label>Afficher :</label>
            <select [(ngModel)]="showFilter" class="filter-select">
              <option value="all">Tous les candidats</option>
              <option value="applied">Ont postulé uniquement</option>
              <option value="not_applied">N'ont pas postulé</option>
            </select>
          </div>
          <div class="filter-item">
            <label>Trier par :</label>
            <select [(ngModel)]="sortBy" class="filter-select">
              <option value="score">Score (meilleur en premier)</option>
              <option value="name">Nom</option>
              <option value="applied">Postulé en premier</option>
            </select>
          </div>
        </div>

        <!-- Candidate cards -->
        <div class="matches-list" *ngIf="filteredCandidates.length > 0">
          <div *ngFor="let m of filteredCandidates; let i = index" class="match-card card">

            <!-- Rank + avatar + name -->
            <div class="card-top">
              <div class="rank-badge" [class.gold]="i===0" [class.silver]="i===1" [class.bronze]="i===2">
                #{{ i + 1 }}
              </div>
              <div class="candidate-avatar">{{ initials(m.candidate) }}</div>
              <div class="candidate-info">
                <div class="name-row">
                  <h3>{{ m.candidate.firstName }} {{ m.candidate.lastName }}</h3>
                  <span *ngIf="m.hasApplied" class="badge-applied">A postulé</span>
                  <span *ngIf="m.application" class="badge-status status-{{ m.application.status }}">
                    {{ getStatusLabel(m.application.status) }}
                  </span>
                </div>
                <p class="candidate-meta">{{ m.candidate.school }} • {{ m.candidate.location }}</p>
              </div>

              <!-- Score circle -->
              <div class="score-circle" [style.background]="scoreGradient(m.score)">
                <span class="score-num">{{ m.score }}</span>
                <span class="score-pct">%</span>
              </div>
            </div>

            <!-- Score bar -->
            <div class="score-bar-wrap">
              <div class="score-bar" [style.width.%]="m.score" [style.background]="scoreColor(m.score)"></div>
            </div>

            <!-- Skills -->
            <div class="skills-section">
              <div class="skills-row" *ngIf="m.matchedSkills.length > 0">
                <span class="skills-label matched-label">✓ Maîtrisées :</span>
                <span *ngFor="let s of m.matchedSkills" class="skill-chip matched">{{ s }}</span>
              </div>
              <div class="skills-row" *ngIf="m.missingSkills.length > 0">
                <span class="skills-label missing-label">✗ Manquantes :</span>
                <span *ngFor="let s of m.missingSkills" class="skill-chip missing">{{ s }}</span>
              </div>
              <div *ngIf="m.matchedSkills.length === 0 && requiredSkills.length > 0" class="no-match-note">
                Aucune compétence requise maîtrisée
              </div>
            </div>

            <!-- Actions -->
            <div class="card-actions">
              <a [routerLink]="['/profil', m.candidate.id]" class="btn btn-secondary btn-sm">Voir le profil</a>
              <button
                *ngIf="m.hasApplied && m.application?.status === 'nouveau'"
                class="btn btn-primary btn-sm"
                (click)="shortlist(m)">
                Présélectionner
              </button>
              <span *ngIf="m.hasApplied && m.application?.status !== 'nouveau'" class="in-pipeline-note">
                En pipeline
              </span>
            </div>
          </div>
        </div>

        <!-- Empty state (offer selected but no candidates) -->
        <div class="empty-state card" *ngIf="filteredCandidates.length === 0">
          <svg width="48" height="48" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
          </svg>
          <h3>Aucun candidat trouvé</h3>
          <p>Ajustez le score minimum ou changez de filtre</p>
        </div>
      </div>

      <!-- Empty state (no offer selected) -->
      <div class="empty-state card" *ngIf="!selectedOfferId">
        <svg width="64" height="64" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <h3>Sélectionnez une offre</h3>
        <p>Tous les candidats de votre base seront analysés et classés par compatibilité</p>
      </div>
    </div>
  `,
  styles: [`
    .matching-page { max-width: 1000px; }
    .page-header { margin-bottom: var(--spacing-xl); }

    /* Offer selector */
    .offer-selector {
      display: flex; align-items: center; gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }
    .selector-label {
      display: flex; align-items: center; gap: 8px;
      font-weight: 600; color: var(--gray-700); white-space: nowrap;
    }
    .offer-select {
      flex: 1; max-width: 480px; padding: 10px 12px;
      border: 1px solid var(--gray-300); border-radius: var(--radius-md); font-size: 14px;
    }
    .offer-skills {
      display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
      padding-top: var(--spacing-md); border-top: 1px solid var(--gray-100);
    }
    .offer-skills-label { font-size: 13px; color: var(--gray-500); font-weight: 500; white-space: nowrap; }

    /* Skill chips */
    .skill-chip {
      padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500;
    }
    .skill-chip.required  { background: #EEF2FF; color: #4338CA; }
    .skill-chip.matched   { background: #D1FAE5; color: #065F46; }
    .skill-chip.missing   { background: #FEE2E2; color: #991B1B; }

    /* Stats bar */
    .stats-bar {
      display: flex; align-items: center; gap: var(--spacing-lg);
      padding: var(--spacing-md) var(--spacing-lg);
    }
    .stat-item { text-align: center; }
    .stat-num { display: block; font-size: 24px; font-weight: 700; color: var(--gray-900); }
    .stat-lbl { font-size: 12px; color: var(--gray-500); }
    .stat-divider { width: 1px; height: 40px; background: var(--gray-200); }

    /* Filter bar */
    .filter-bar {
      display: flex; align-items: center; flex-wrap: wrap; gap: var(--spacing-lg);
      padding: var(--spacing-md) var(--spacing-lg);
    }
    .filter-item { display: flex; align-items: center; gap: 8px; font-size: 14px; }
    .filter-item label { color: var(--gray-600); white-space: nowrap; }
    .filter-select {
      padding: 6px 10px; border: 1px solid var(--gray-300);
      border-radius: var(--radius-md); font-size: 13px;
    }
    .slider { width: 120px; }

    /* Match cards */
    .matches-list { display: flex; flex-direction: column; gap: var(--spacing-lg); }
    .match-card { padding: var(--spacing-lg); transition: box-shadow 0.2s; }
    .match-card:hover { box-shadow: var(--shadow-lg); }

    .card-top {
      display: flex; align-items: center; gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }

    .rank-badge {
      width: 32px; height: 32px; border-radius: 50%;
      background: #E5E7EB; color: #6B7280;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; flex-shrink: 0;
    }
    .rank-badge.gold   { background: #FEF3C7; color: #92400E; }
    .rank-badge.silver { background: #F3F4F6; color: #374151; }
    .rank-badge.bronze { background: #FEE2E2; color: #7C2D12; }

    .candidate-avatar {
      width: 44px; height: 44px; border-radius: 50%;
      background: var(--primary-color); color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 15px; flex-shrink: 0;
    }

    .candidate-info { flex: 1; }
    .name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 3px; }
    .name-row h3 { margin: 0; font-size: 15px; font-weight: 600; }
    .candidate-meta { margin: 0; font-size: 13px; color: var(--gray-500); }

    .badge-applied {
      padding: 2px 8px; border-radius: 10px;
      background: #D1FAE5; color: #065F46;
      font-size: 11px; font-weight: 600;
    }
    .badge-status {
      padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600;
    }
    .status-nouveau        { background: #DBEAFE; color: #1E40AF; }
    .status-preselectionne { background: #FEF3C7; color: #92400E; }
    .status-entretien_programme { background: #EDE9FE; color: #5B21B6; }
    .status-offre_acceptee { background: #D1FAE5; color: #065F46; }
    .status-rejete         { background: #FEE2E2; color: #991B1B; }

    .score-circle {
      width: 60px; height: 60px; border-radius: 50%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      color: white; flex-shrink: 0; margin-left: auto;
    }
    .score-num { font-size: 20px; font-weight: 700; line-height: 1; }
    .score-pct { font-size: 11px; opacity: 0.9; }

    /* Score bar */
    .score-bar-wrap {
      height: 6px; background: #E5E7EB; border-radius: 3px;
      margin-bottom: var(--spacing-md); overflow: hidden;
    }
    .score-bar { height: 100%; border-radius: 3px; transition: width 0.4s; }

    /* Skills section */
    .skills-section { margin-bottom: var(--spacing-md); }
    .skills-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
    .skills-label { font-size: 12px; font-weight: 600; white-space: nowrap; }
    .matched-label { color: #065F46; }
    .missing-label { color: #991B1B; }
    .no-match-note { font-size: 12px; color: var(--gray-400); font-style: italic; }

    /* Card actions */
    .card-actions {
      display: flex; gap: var(--spacing-sm); align-items: center;
      padding-top: var(--spacing-md); border-top: 1px solid var(--gray-100);
    }
    .in-pipeline-note { font-size: 12px; color: var(--gray-400); }

    /* Empty state */
    .empty-state { text-align: center; padding: var(--spacing-xxl); color: var(--gray-400); }
    .empty-state svg { margin-bottom: var(--spacing-md); }
    .empty-state h3 { color: var(--gray-700); margin-bottom: 8px; }
    .empty-state p { margin: 0; font-size: 14px; }

    @media (max-width: 768px) {
      .offer-selector { flex-direction: column; align-items: stretch; }
      .offer-select { max-width: 100%; }
      .stats-bar { flex-wrap: wrap; gap: var(--spacing-md); }
      .filter-bar { flex-direction: column; align-items: flex-start; }
      .card-top { flex-wrap: wrap; }
      .score-circle { margin-left: 0; }
    }

    @media (max-width: 480px) {
      .rank-badge { display: none; }
      .match-card { padding: var(--spacing-md); }
      .score-circle { width: 50px; height: 50px; }
      .score-num { font-size: 16px; }
    }
  `]
})
export class MatchingComponent implements OnInit {
  offers: Offer[] = [];
  applications: Application[] = [];
  candidates: Candidate[] = [];
  selectedOfferId = '';
  minScore = 0;
  sortBy = 'score';
  showFilter = 'all';

  constructor(
    private offerService: OfferService,
    private matchingService: MatchingService,
    private candidateService: CandidateService
  ) {}

  ngOnInit(): void {
    this.offerService.getOffers().subscribe(offers => {
      this.offers = offers.filter(o => o.status === 'publiee');
    });
    this.candidateService.getCandidates().subscribe(c => this.candidates = c);
    this.matchingService.getApplications().subscribe(a => this.applications = a);
  }

  onOfferChange(): void {
    this.minScore = 0;
    this.showFilter = 'all';
  }

  get selectedOffer(): Offer | null {
    return this.offers.find(o => o.id === this.selectedOfferId) || null;
  }

  get requiredSkills(): string[] {
    return (this.selectedOffer?.matchingCriteria?.requiredSkills || [])
      .map((s: any) => s.name || s);
  }

  get matchedCandidates(): MatchedCandidate[] {
    if (!this.selectedOfferId) return [];
    const required = this.requiredSkills.map(s => s.toLowerCase().trim());

    return this.candidates.map(candidate => {
      const candSkills = (candidate.skills || []).map((s: any) =>
        (s.name || s).toLowerCase().trim()
      );
      const matched = required.filter(r =>
        candSkills.some(cs => cs.includes(r) || r.includes(cs))
      );
      const missing = required.filter(r =>
        !candSkills.some(cs => cs.includes(r) || r.includes(cs))
      );
      const score = required.length > 0
        ? Math.round((matched.length / required.length) * 100)
        : 50;

      const application = this.applications.find(
        app => app.candidateId === candidate.id && app.offerId === this.selectedOfferId
      ) || null;

      return {
        candidate,
        score,
        matchedSkills: matched.map(s => this.requiredSkills.find(r => r.toLowerCase() === s) || s),
        missingSkills: missing.map(s => this.requiredSkills.find(r => r.toLowerCase() === s) || s),
        hasApplied: !!application,
        application
      };
    });
  }

  get filteredCandidates(): MatchedCandidate[] {
    return this.matchedCandidates
      .filter(m => m.score >= this.minScore)
      .filter(m => {
        if (this.showFilter === 'applied') return m.hasApplied;
        if (this.showFilter === 'not_applied') return !m.hasApplied;
        return true;
      })
      .sort((a, b) => {
        if (this.sortBy === 'name') {
          return a.candidate.firstName.localeCompare(b.candidate.firstName);
        }
        if (this.sortBy === 'applied') {
          if (a.hasApplied !== b.hasApplied) return a.hasApplied ? -1 : 1;
          return b.score - a.score;
        }
        return b.score - a.score;
      });
  }

  get appliedCount(): number {
    return this.matchedCandidates.filter(m => m.hasApplied).length;
  }

  get strongMatchCount(): number {
    return this.matchedCandidates.filter(m => m.score >= 70).length;
  }

  shortlist(m: MatchedCandidate): void {
    if (!m.application) return;
    this.matchingService.updateApplicationStatus(m.application.id, 'preselectionne').subscribe(() => {
      if (m.application) m.application.status = 'preselectionne' as any;
    });
  }

  initials(c: Candidate): string {
    return `${(c.firstName || '')[0] || ''}${(c.lastName || '')[0] || ''}`.toUpperCase();
  }

  scoreColor(score: number): string {
    if (score >= 70) return '#10B981';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  }

  scoreGradient(score: number): string {
    if (score >= 70) return 'linear-gradient(135deg, #10B981, #059669)';
    if (score >= 40) return 'linear-gradient(135deg, #F59E0B, #D97706)';
    return 'linear-gradient(135deg, #EF4444, #DC2626)';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'nouveau': 'Nouveau', 'preselectionne': 'Présélectionné',
      'entretien_programme': 'Entretien', 'test_technique': 'Test',
      'offre_acceptee': 'Accepté', 'rejete': 'Rejeté'
    };
    return labels[status] || status;
  }
}
