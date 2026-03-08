import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatchingService } from '../../services/matching.service';
import { OfferService } from '../../services/offer.service';
import { CandidateService } from '../../services/candidate.service';
import { Application, Offer, Candidate } from '../../models';

@Component({
  selector: 'app-matching',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="matching-page">
      <div class="page-header">
        <div>
          <h1>Intelligent Matching</h1>
          <p class="text-muted">Système de matching intelligent basé sur les embeddings et règles métier</p>
        </div>
      </div>

      <!-- Offer Selector -->
      <div class="card mb-lg">
        <div class="offer-selector">
          <div class="selector-label">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"/>
            </svg>
            Offre sélectionnée:
          </div>
          <select [(ngModel)]="selectedOfferId" (change)="onOfferChange()" class="offer-select">
            <option value="">Choisir une offre...</option>
            <option *ngFor="let offer of offers" [value]="offer.id">{{ offer.title }}</option>
          </select>
        </div>

        <div class="ai-explanation" *ngIf="selectedOfferId">
          <div class="explanation-header">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"/>
            </svg>
            <strong>Intelligence Artificielle</strong>
          </div>
          <p class="explanation-text">
            Le système analyse les profils en utilisant des embeddings sémantiques pour comprendre la similarité 
            entre les compétences des candidats et les exigences du poste, combiné à des règles métier personnalisées.
          </p>
        </div>
      </div>

      <!-- Matching Results -->
      <div class="matching-layout" *ngIf="selectedOfferId && applications.length > 0">
        <!-- Filters Panel -->
        <aside class="filters-panel card">
          <h3>Filtres</h3>

          <div class="filter-section">
            <label>Score minimum</label>
            <input type="range" min="0" max="100" [(ngModel)]="minScore" class="slider">
            <span class="slider-value">{{ minScore }}%</span>
          </div>

          <div class="filter-section">
            <label>Compétences</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox">
                <span>React</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox">
                <span>TypeScript</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox">
                <span>Node.js</span>
              </label>
            </div>
          </div>

          <div class="filter-section">
            <label>Disponibilité</label>
            <select class="w-full">
              <option>Toutes</option>
              <option>Immédiate</option>
              <option>1 mois</option>
              <option>3 mois</option>
            </select>
          </div>
        </aside>

        <!-- Results -->
        <div class="results-container">
          <div class="results-header">
            <h2>{{ filteredApplications.length }} candidat(s) trouvé(s)</h2>
            <div class="sort-controls">
              <label>Trier par:</label>
              <select [(ngModel)]="sortBy">
                <option value="score">Score global</option>
                <option value="semantic">Score sémantique</option>
                <option value="rules">Score règles</option>
                <option value="date">Date candidature</option>
              </select>
            </div>
          </div>

          <div class="matches-list">
            <div *ngFor="let application of filteredApplications" class="match-card card">
              <div class="match-header">
                <div class="candidate-info-row">
                  <div class="candidate-avatar">{{ getInitials(application.candidateId) }}</div>
                  <div class="candidate-details">
                    <h3 class="candidate-name">
                      <a [routerLink]="['/profil', application.candidateId]">
                        {{ getCandidateName(application.candidateId) }}
                      </a>
                    </h3>
                    <p class="candidate-school">{{ getCandidateSchool(application.candidateId) }}</p>
                  </div>
                </div>

                <div class="scores-row">
                  <div class="score-badge global" [style.background]="getScoreColor(application.matchingScore?.global || 0)">
                    <div class="score-value">{{ application.matchingScore?.global || 0 }}</div>
                    <div class="score-label">Global</div>
                  </div>
                  <div class="score-detail">
                    <div class="score-mini">
                      <span class="score-mini-label">Sémantique</span>
                      <span class="score-mini-value">{{ application.matchingScore?.semantic || 0 }}%</span>
                    </div>
                    <div class="score-mini">
                      <span class="score-mini-label">Règles</span>
                      <span class="score-mini-value">{{ application.matchingScore?.rules || 0 }}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="match-skills">
                <span *ngFor="let skill of getCandidateSkills(application.candidateId).slice(0, 5)" class="skill-tag">
                  {{ skill.name }}
                </span>
              </div>

              <div class="match-explanation" *ngIf="showExplanations[application.id]">
                <div class="explanation-section">
                  <h4 class="explanation-title strengths">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    Points forts
                  </h4>
                  <ul class="explanation-list">
                    <li *ngFor="let strength of application.matchingScore?.explanations?.strengths">{{ strength }}</li>
                  </ul>
                </div>

                <div class="explanation-section">
                  <h4 class="explanation-title weaknesses">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                    Points d'attention
                  </h4>
                  <ul class="explanation-list">
                    <li *ngFor="let weakness of application.matchingScore?.explanations?.weaknesses">{{ weakness }}</li>
                  </ul>
                </div>
              </div>

              <div class="match-actions">
                <button class="btn btn-secondary btn-sm" (click)="toggleExplanation(application.id)">
                  {{ showExplanations[application.id] ? 'Masquer' : 'Voir' }} l'analyse
                </button>
                <button class="btn btn-primary btn-sm" [routerLink]="['/profil', application.candidateId]">
                  Voir le profil
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state card" *ngIf="!selectedOfferId">
        <svg width="64" height="64" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <h3>Sélectionnez une offre</h3>
        <p>Choisissez une offre de stage pour voir les candidats matchés par notre IA</p>
      </div>
    </div>
  `,
  styles: [`
    .matching-page {
      max-width: 1400px;
    }

    .page-header {
      margin-bottom: var(--spacing-xl);
    }

    /* Offer Selector */
    .offer-selector {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }

    .selector-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: var(--gray-700);
      white-space: nowrap;
    }

    .offer-select {
      flex: 1;
      max-width: 500px;
      padding: 10px 12px;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-md);
      font-size: 14px;
    }

    /* AI Explanation */
    .ai-explanation {
      background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
      border: 1px solid #C7D2FE;
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
    }

    .explanation-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--primary-color);
      margin-bottom: 8px;
    }

    .explanation-text {
      color: var(--gray-700);
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
    }

    /* Matching Layout */
    .matching-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: var(--spacing-lg);
    }

    /* Filters Panel */
    .filters-panel {
      position: sticky;
      top: 88px;
      height: fit-content;
    }

    .filters-panel h3 {
      font-size: 16px;
      margin: 0 0 var(--spacing-lg) 0;
    }

    .filter-section {
      margin-bottom: var(--spacing-lg);
      padding-bottom: var(--spacing-lg);
      border-bottom: 1px solid var(--gray-200);
    }

    .filter-section:last-child {
      border-bottom: none;
    }

    .filter-section label {
      display: block;
      font-weight: 600;
      margin-bottom: var(--spacing-sm);
    }

    .slider {
      width: 100%;
      margin-bottom: 8px;
    }

    .slider-value {
      display: block;
      text-align: center;
      font-weight: 600;
      color: var(--primary-color);
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-weight: normal;
    }

    /* Results */
    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
    }

    .results-header h2 {
      font-size: 20px;
      margin: 0;
    }

    .sort-controls {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .sort-controls label {
      font-size: 14px;
      color: var(--gray-600);
    }

    /* Match Card */
    .matches-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .match-card {
      transition: all 0.2s;
    }

    .match-card:hover {
      box-shadow: var(--shadow-lg);
    }

    .match-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-md);
    }

    .candidate-info-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .candidate-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 16px;
    }

    .candidate-name {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }

    .candidate-name a {
      color: var(--gray-900);
    }

    .candidate-school {
      font-size: 13px;
      color: var(--gray-500);
      margin: 0;
    }

    .scores-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .score-badge.global {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .score-value {
      font-size: 24px;
      font-weight: 700;
    }

    .score-label {
      font-size: 10px;
      opacity: 0.9;
    }

    .score-detail {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .score-mini {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    .score-mini-label {
      font-size: 12px;
      color: var(--gray-500);
    }

    .score-mini-value {
      font-size: 12px;
      font-weight: 600;
      color: var(--gray-900);
    }

    .match-skills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: var(--spacing-md);
    }

    .skill-tag {
      background: #EEF2FF;
      color: var(--primary-color);
      padding: 6px 12px;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 500;
    }

    /* Explanations */
    .match-explanation {
      background: var(--gray-50);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }

    .explanation-section {
      margin-bottom: var(--spacing-md);
    }

    .explanation-section:last-child {
      margin-bottom: 0;
    }

    .explanation-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      margin: 0 0 var(--spacing-sm) 0;
    }

    .explanation-title.strengths {
      color: var(--success);
    }

    .explanation-title.weaknesses {
      color: var(--warning);
    }

    .explanation-list {
      margin: 0;
      padding-left: 24px;
    }

    .explanation-list li {
      font-size: 13px;
      color: var(--gray-700);
      margin-bottom: 4px;
    }

    .match-actions {
      display: flex;
      gap: var(--spacing-sm);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--gray-200);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--spacing-xl);
    }

    .empty-state svg {
      color: var(--gray-300);
      margin-bottom: var(--spacing-md);
    }

    .empty-state h3 {
      color: var(--gray-900);
      margin-bottom: var(--spacing-sm);
    }

    .empty-state p {
      color: var(--gray-500);
      margin: 0;
    }

    @media (max-width: 1024px) {
      .matching-layout {
        grid-template-columns: 1fr;
      }

      .filters-panel {
        position: static;
      }
    }
  `]
})
export class MatchingComponent implements OnInit {
  offers: Offer[] = [];
  applications: Application[] = [];
  candidates: Candidate[] = [];
  selectedOfferId: string = '';
  minScore: number = 0;
  sortBy: string = 'score';
  showExplanations: { [key: string]: boolean } = {};

  constructor(
    private offerService: OfferService,
    private matchingService: MatchingService,
    private candidateService: CandidateService
  ) {}

  ngOnInit(): void {
    this.offerService.getOffers().subscribe(offers => {
      this.offers = offers.filter(o => o.status === 'publiee');
    });

    this.candidateService.getCandidates().subscribe(candidates => {
      this.candidates = candidates;
    });

    this.matchingService.getApplications().subscribe(applications => {
      this.applications = applications;
    });
  }

  onOfferChange(): void {
    // Filter applications by selected offer
  }

  get filteredApplications(): Application[] {
    return this.applications
      .filter(app => app.offerId === this.selectedOfferId)
      .filter(app => (app.matchingScore?.global || 0) >= this.minScore)
      .sort((a, b) => {
        const scoreA = a.matchingScore?.global || 0;
        const scoreB = b.matchingScore?.global || 0;
        return scoreB - scoreA;
      });
  }

  toggleExplanation(applicationId: string): void {
    this.showExplanations[applicationId] = !this.showExplanations[applicationId];
  }

  getCandidateName(candidateId: string): string {
    const candidate = this.candidates.find(c => c.id === candidateId);
    return candidate ? `${candidate.firstName} ${candidate.lastName}` : '';
  }

  getInitials(candidateId: string): string {
    const candidate = this.candidates.find(c => c.id === candidateId);
    return candidate ? `${candidate.firstName[0]}${candidate.lastName[0]}` : '';
  }

  getCandidateSchool(candidateId: string): string {
    const candidate = this.candidates.find(c => c.id === candidateId);
    return candidate?.school || '';
  }

  getCandidateSkills(candidateId: string): any[] {
    const candidate = this.candidates.find(c => c.id === candidateId);
    return candidate?.skills || [];
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
    if (score >= 60) return 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)';
    return 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
  }
}
