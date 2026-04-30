import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatchingService } from '../../services/matching.service';
import { OfferService } from '../../services/offer.service';
import { Application, Offer } from '../../models';
import { environment } from '../../../environments/environment';

interface AiCandidate {
  candidateId: string;
  firstName: string;
  lastName: string;
  email: string;
  school: string;
  location: string;
  skills: string[];
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  reason: string;
  cvBased: boolean;
  hasCv: boolean;
  hasApplied: boolean;
  application: Application | null;
}

@Component({
  selector: 'app-matching',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="matching-page">
      <div class="page-header">
        <div>
          <h1>Intelligent Matching <span class="ai-badge">IA</span></h1>
          <p class="text-muted">Analyse sémantique par intelligence artificielle (Google Gemini)</p>
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
          <select [(ngModel)]="selectedOfferId" (change)="onOfferChange()" class="offer-select" [disabled]="aiLoading">
            <option value="">{{ offersLoading ? 'Chargement...' : offers.length === 0 ? 'Aucune offre disponible' : 'Choisir une offre...' }}</option>
            <option *ngFor="let offer of offers" [value]="offer.id">{{ offer.title }}</option>
          </select>
        </div>

        <div class="offer-skills" *ngIf="selectedOffer">
          <span class="offer-skills-label">Compétences requises :</span>
          <span *ngFor="let s of requiredSkills" class="skill-chip required">{{ s }}</span>
          <span *ngIf="requiredSkills.length === 0" class="text-muted" style="font-size:13px">Aucune compétence définie pour cette offre</span>
        </div>
      </div>

      <!-- AI Loading state -->
      <div class="ai-loading card" *ngIf="aiLoading">
        <div class="spinner"></div>
        <div>
          <p class="ai-loading-title">Analyse IA en cours...</p>
          <p class="ai-loading-sub">Google Gemini analyse la compatibilité de chaque candidat</p>
        </div>
      </div>

      <!-- Error -->
      <div class="error-box card" *ngIf="aiError && !aiLoading">
        <p>{{ aiError }}</p>
        <button class="btn btn-primary btn-sm" (click)="runAiScore()">Réessayer</button>
      </div>

      <!-- Results -->
      <div *ngIf="results.length > 0 && !aiLoading">
        <!-- Stats bar -->
        <div class="stats-bar card mb-lg">
          <div class="stat-item">
            <span class="stat-num">{{ results.length }}</span>
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
          <div class="stat-divider"></div>
          <div class="stat-item ai-powered">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span class="stat-lbl">Scores IA Gemini</span>
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
              <option value="score">Score IA (meilleur en premier)</option>
              <option value="name">Nom</option>
              <option value="applied">Postulé en premier</option>
            </select>
          </div>
        </div>

        <!-- Candidate cards -->
        <div class="matches-list" *ngIf="filteredCandidates.length > 0">
          <div *ngFor="let m of filteredCandidates; let i = index" class="match-card card">

            <div class="card-top">
              <div class="rank-badge" [class.gold]="i===0" [class.silver]="i===1" [class.bronze]="i===2">
                #{{ i + 1 }}
              </div>
              <div class="candidate-avatar">{{ initials(m) }}</div>
              <div class="candidate-info">
                <div class="name-row">
                  <h3>{{ m.firstName }} {{ m.lastName }}</h3>
                  <span *ngIf="m.hasCv" class="badge-cv">CV analysé</span>
                  <span *ngIf="!m.hasCv" class="badge-no-cv">Sans CV</span>
                  <span *ngIf="m.hasApplied" class="badge-applied">A postulé</span>
                  <span *ngIf="m.application" class="badge-status status-{{ m.application.status }}">
                    {{ getStatusLabel(m.application.status) }}
                  </span>
                </div>
                <p class="candidate-meta">{{ m.school }} <span *ngIf="m.location">• {{ m.location }}</span></p>
              </div>
              <div class="score-circle" [style.background]="scoreGradient(m.score)">
                <span class="score-num">{{ m.score }}</span>
                <span class="score-pct">%</span>
              </div>
            </div>

            <!-- Score bar -->
            <div class="score-bar-wrap">
              <div class="score-bar" [style.width.%]="m.score" [style.background]="scoreColor(m.score)"></div>
            </div>

            <!-- AI reason -->
            <div class="ai-reason" *ngIf="m.reason">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              {{ m.reason }}
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
            </div>

            <!-- Actions -->
            <div class="card-actions">
              <button
                *ngIf="m.hasApplied && m.application?.status === 'nouveau'"
                class="btn btn-primary btn-sm"
                (click)="shortlist(m)">
                Présélectionner
              </button>
              <span *ngIf="m.hasApplied && m.application?.status && m.application?.status !== 'nouveau'" class="in-pipeline-note">
                En pipeline — {{ getStatusLabel(m.application!.status) }}
              </span>
              <span *ngIf="!m.hasApplied" class="not-applied-note">N'a pas encore postulé</span>
            </div>
          </div>
        </div>

        <div class="empty-state card" *ngIf="filteredCandidates.length === 0">
          <h3>Aucun candidat trouvé</h3>
          <p>Ajustez le score minimum ou changez de filtre</p>
        </div>
      </div>

      <!-- Initial empty state -->
      <div class="empty-state card" *ngIf="!selectedOfferId && !aiLoading">
        <svg width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
        </svg>
        <h3>Sélectionnez une offre</h3>
        <p>Google Gemini analysera la compatibilité de tous vos candidats avec l'offre choisie</p>
      </div>
    </div>
  `,
  styles: [`
    .matching-page { max-width: 1000px; }
    .page-header { margin-bottom: var(--spacing-xl); }

    .ai-badge {
      display: inline-block; padding: 2px 8px; border-radius: 12px;
      background: linear-gradient(135deg, #4F46E5, #7C3AED);
      color: white; font-size: 12px; font-weight: 700;
      vertical-align: middle; margin-left: 8px;
    }

    /* Offer selector */
    .offer-selector { display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-md); }
    .selector-label { display: flex; align-items: center; gap: 8px; font-weight: 600; color: var(--gray-700); white-space: nowrap; }
    .offer-select { flex: 1; max-width: 480px; padding: 10px 12px; border: 1px solid var(--gray-300); border-radius: var(--radius-md); font-size: 14px; }
    .offer-skills { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding-top: var(--spacing-md); border-top: 1px solid var(--gray-100); }
    .offer-skills-label { font-size: 13px; color: var(--gray-500); font-weight: 500; white-space: nowrap; }

    /* AI Loading */
    .ai-loading {
      display: flex; align-items: center; gap: var(--spacing-lg);
      padding: var(--spacing-xl); margin-bottom: var(--spacing-lg);
    }
    .spinner {
      width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
      border: 3px solid #EEF2FF; border-top-color: #4F46E5;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .ai-loading-title { margin: 0 0 4px; font-weight: 600; color: var(--gray-900); }
    .ai-loading-sub { margin: 0; font-size: 13px; color: var(--gray-500); }

    .error-box { padding: var(--spacing-lg); background: #FEF2F2; border: 1px solid #FECACA; display: flex; align-items: center; gap: var(--spacing-md); }
    .error-box p { margin: 0; color: #991B1B; flex: 1; }

    /* Skill chips */
    .skill-chip { padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .skill-chip.required { background: #EEF2FF; color: #4338CA; }
    .skill-chip.matched  { background: #D1FAE5; color: #065F46; }
    .skill-chip.missing  { background: #FEE2E2; color: #991B1B; }

    /* Stats bar */
    .stats-bar { display: flex; align-items: center; gap: var(--spacing-lg); padding: var(--spacing-md) var(--spacing-lg); flex-wrap: wrap; }
    .stat-item { text-align: center; }
    .stat-num { display: block; font-size: 24px; font-weight: 700; color: var(--gray-900); }
    .stat-lbl { font-size: 12px; color: var(--gray-500); }
    .stat-divider { width: 1px; height: 40px; background: var(--gray-200); }
    .ai-powered { display: flex; align-items: center; gap: 6px; color: #4F46E5; }
    .ai-powered svg { color: #4F46E5; }

    /* Filter bar */
    .filter-bar { display: flex; align-items: center; flex-wrap: wrap; gap: var(--spacing-lg); padding: var(--spacing-md) var(--spacing-lg); }
    .filter-item { display: flex; align-items: center; gap: 8px; font-size: 14px; }
    .filter-item label { color: var(--gray-600); white-space: nowrap; }
    .filter-select { padding: 6px 10px; border: 1px solid var(--gray-300); border-radius: var(--radius-md); font-size: 13px; }
    .slider { width: 120px; }

    /* Match cards */
    .matches-list { display: flex; flex-direction: column; gap: var(--spacing-lg); }
    .match-card { padding: var(--spacing-lg); transition: box-shadow 0.2s; }
    .match-card:hover { box-shadow: var(--shadow-lg); }

    .card-top { display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-md); }
    .rank-badge { width: 32px; height: 32px; border-radius: 50%; background: #E5E7EB; color: #6B7280; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .rank-badge.gold   { background: #FEF3C7; color: #92400E; }
    .rank-badge.silver { background: #F3F4F6; color: #374151; }
    .rank-badge.bronze { background: #FEE2E2; color: #7C2D12; }
    .candidate-avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px; flex-shrink: 0; }
    .candidate-info { flex: 1; }
    .name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 3px; }
    .name-row h3 { margin: 0; font-size: 15px; font-weight: 600; }
    .candidate-meta { margin: 0; font-size: 13px; color: var(--gray-500); }

    .badge-cv    { padding: 2px 8px; border-radius: 10px; background: #EEF2FF; color: #4338CA; font-size: 11px; font-weight: 600; }
    .badge-no-cv { padding: 2px 8px; border-radius: 10px; background: #F3F4F6; color: #9CA3AF; font-size: 11px; font-weight: 500; }
    .badge-applied { padding: 2px 8px; border-radius: 10px; background: #D1FAE5; color: #065F46; font-size: 11px; font-weight: 600; }
    .badge-status { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .status-nouveau             { background: #DBEAFE; color: #1E40AF; }
    .status-preselectionne      { background: #FEF3C7; color: #92400E; }
    .status-entretien_programme { background: #EDE9FE; color: #5B21B6; }
    .status-offre_acceptee      { background: #D1FAE5; color: #065F46; }
    .status-rejete              { background: #FEE2E2; color: #991B1B; }

    .score-circle { width: 60px; height: 60px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; flex-shrink: 0; margin-left: auto; }
    .score-num { font-size: 20px; font-weight: 700; line-height: 1; }
    .score-pct { font-size: 11px; opacity: 0.9; }

    .score-bar-wrap { height: 6px; background: #E5E7EB; border-radius: 3px; margin-bottom: var(--spacing-sm); overflow: hidden; }
    .score-bar { height: 100%; border-radius: 3px; transition: width 0.4s; }

    /* AI reason */
    .ai-reason {
      display: flex; align-items: flex-start; gap: 6px;
      padding: 8px 12px; border-radius: var(--radius-md);
      background: #F5F3FF; color: #5B21B6;
      font-size: 13px; font-style: italic;
      margin-bottom: var(--spacing-md);
    }
    .ai-reason svg { flex-shrink: 0; margin-top: 2px; }

    /* Skills section */
    .skills-section { margin-bottom: var(--spacing-md); }
    .skills-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
    .skills-label { font-size: 12px; font-weight: 600; white-space: nowrap; }
    .matched-label { color: #065F46; }
    .missing-label { color: #991B1B; }

    /* Card actions */
    .card-actions { display: flex; gap: var(--spacing-sm); align-items: center; padding-top: var(--spacing-md); border-top: 1px solid var(--gray-100); }
    .in-pipeline-note { font-size: 12px; color: #92400E; }
    .not-applied-note { font-size: 12px; color: var(--gray-400); }

    /* Empty state */
    .empty-state { text-align: center; padding: var(--spacing-xxl); color: var(--gray-400); }
    .empty-state svg { margin-bottom: var(--spacing-md); }
    .empty-state h3 { color: var(--gray-700); margin-bottom: 8px; }
    .empty-state p { margin: 0; font-size: 14px; }

    @media (max-width: 768px) {
      .offer-selector { flex-direction: column; align-items: stretch; }
      .offer-select { max-width: 100%; }
      .stats-bar { gap: var(--spacing-md); }
      .filter-bar { flex-direction: column; align-items: flex-start; }
      .card-top { flex-wrap: wrap; }
      .score-circle { margin-left: 0; }
    }
  `]
})
export class MatchingComponent implements OnInit {
  offers: Offer[] = [];
  applications: Application[] = [];
  results: AiCandidate[] = [];
  selectedOfferId = '';
  minScore = 0;
  sortBy = 'score';
  showFilter = 'all';
  offersLoading = true;
  aiLoading = false;
  aiError = '';

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private offerService: OfferService,
    private matchingService: MatchingService
  ) {}

  ngOnInit(): void {
    this.offerService.getOffers().subscribe(offers => {
      this.offers = offers;
      this.offersLoading = false;
    });
    this.matchingService.getApplications().subscribe(a => this.applications = a);
  }

  onOfferChange(): void {
    this.results = [];
    this.aiError = '';
    this.minScore = 0;
    this.showFilter = 'all';
    if (this.selectedOfferId) this.runAiScore();
  }

  runAiScore(): void {
    this.aiLoading = true;
    this.aiError = '';
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` });

    this.http.post<{ success: boolean; data: any[] }>(
      `${this.apiUrl}/matching/ai-score`,
      { offerId: this.selectedOfferId },
      { headers }
    ).subscribe({
      next: (res) => {
        this.results = res.data.map(r => ({
          ...r,
          hasApplied: this.applications.some(a => a.candidateId?.toString() === r.candidateId?.toString() && a.offerId?.toString() === this.selectedOfferId?.toString()),
          application: this.applications.find(a => a.candidateId?.toString() === r.candidateId?.toString() && a.offerId?.toString() === this.selectedOfferId?.toString()) || null
        }));
        this.aiLoading = false;
      },
      error: (err) => {
        this.aiError = err.error?.message || 'Erreur lors de l\'analyse IA. Vérifiez la clé GEMINI_API_KEY.';
        this.aiLoading = false;
      }
    });
  }

  get selectedOffer(): Offer | null {
    return this.offers.find(o => o.id === this.selectedOfferId) || null;
  }

  get requiredSkills(): string[] {
    return (this.selectedOffer?.matchingCriteria?.requiredSkills || []).map((s: any) => s.name || s);
  }

  get filteredCandidates(): AiCandidate[] {
    return this.results
      .filter(m => m.score >= this.minScore)
      .filter(m => {
        if (this.showFilter === 'applied') return m.hasApplied;
        if (this.showFilter === 'not_applied') return !m.hasApplied;
        return true;
      })
      .sort((a, b) => {
        if (this.sortBy === 'name') return a.firstName.localeCompare(b.firstName);
        if (this.sortBy === 'applied') {
          if (a.hasApplied !== b.hasApplied) return a.hasApplied ? -1 : 1;
          return b.score - a.score;
        }
        return b.score - a.score;
      });
  }

  get appliedCount(): number { return this.results.filter(m => m.hasApplied).length; }
  get strongMatchCount(): number { return this.results.filter(m => m.score >= 70).length; }

  shortlist(m: AiCandidate): void {
    if (!m.application) return;
    this.matchingService.updateApplicationStatus(m.application.id, 'preselectionne').subscribe(() => {
      if (m.application) m.application.status = 'preselectionne' as any;
    });
  }

  initials(m: AiCandidate): string {
    return `${(m.firstName || '')[0] || ''}${(m.lastName || '')[0] || ''}`.toUpperCase();
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
