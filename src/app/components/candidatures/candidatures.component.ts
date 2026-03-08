import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CandidateService } from '../../services/candidate.service';
import { MatchingService } from '../../services/matching.service';
import { Candidate, CandidateStatus, Application } from '../../models';
import { BulkStatusUpdateComponent } from '../bulk-status/bulk-status-update.component';

@Component({
  selector: 'app-candidatures',
  standalone: true,
  imports: [CommonModule, BulkStatusUpdateComponent],
  template: `
    <div class="candidatures-page">
      <div class="page-header">
        <div>
          <h1>Pipeline de candidatures</h1>
          <p class="text-muted">Gérez le parcours de vos candidats</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="toggleSelectMode()">
            {{ selectMode ? '✓ Mode sélection' : '☑️ Sélectionner' }}
          </button>
          <span *ngIf="selectedCandidates.size > 0" class="selection-count-badge">
            {{ selectedCandidates.size }} sélectionné(s)
          </span>
        </div>
      </div>

      <!-- Filters -->
      <div class="card filters-bar mb-lg">
        <input type="search" placeholder="Rechercher un candidat..." class="search-input">
        <select>
          <option>Toutes les offres</option>
        </select>
        <select>
          <option>Tous les scores</option>
          <option>80-100</option>
          <option>60-79</option>
          <option>0-59</option>
        </select>
      </div>

      <!-- Kanban Board -->
      <div class="kanban-board">
        <div class="kanban-column" *ngFor="let column of kanbanColumns">
          <div class="column-header">
            <h3>{{ column.title }}</h3>
            <span class="column-count">{{ getColumnCount(column.status) }}</span>
          </div>

          <div class="column-body">
            <div *ngFor="let application of getApplicationsByStatus(column.status)" 
                 class="candidate-card"
                 [class.selected]="isCandidateSelected(application.candidateId)"
                 (click)="handleCardClick(application.candidateId, $event)">
              
              <!-- Checkbox en mode sélection -->
              <div *ngIf="selectMode" class="selection-checkbox" (click)="$event.stopPropagation()">
                <input type="checkbox" 
                       [checked]="isCandidateSelected(application.candidateId)"
                       (change)="toggleCandidateSelection(application.candidateId)">
              </div>

              <div class="card-header-row">
                <div class="candidate-avatar">{{ getInitials(application.candidateId) }}</div>
                <div class="score-badge" [style.background]="getScoreColor(application.matchingScore?.global || 0)">
                  {{ application.matchingScore?.global || 0 }}
                </div>
              </div>

              <h4 class="candidate-name">{{ getCandidateName(application.candidateId) }}</h4>
              <p class="candidate-school">{{ getCandidateSchool(application.candidateId) }}</p>

              <div class="candidate-skills">
                <span *ngFor="let skill of getCandidateSkills(application.candidateId).slice(0, 3)" class="skill-tag">
                  {{ skill.name }}
                </span>
              </div>

              <div class="card-footer">
                <div class="candidate-meta">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                  </svg>
                  {{ formatDate(application.appliedAt) }}
                </div>
                <div class="card-actions">
                  <button class="icon-btn" (click)="$event.stopPropagation()">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Composant de mise à jour en masse -->
      <app-bulk-status-update
        [selectedCandidates]="getSelectedCandidates()"
        (selectionCleared)="clearSelection()"
        (statusUpdated)="onStatusUpdated()">
      </app-bulk-status-update>
    </div>
  `,
  styles: [`
    .candidatures-page {
      max-width: 100%;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-xl);
    }

    .page-header h1 {
      margin-bottom: var(--spacing-xs);
    }

    .header-actions {
      display: flex;
      gap: var(--spacing-md);
      align-items: center;
    }

    .selection-count-badge {
      background: #667eea;
      color: white;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    /* Filters */
    .filters-bar {
      display: flex;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
    }

    .search-input {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-md);
    }

    /* Kanban Board */
    .kanban-board {
      display: flex;
      gap: var(--spacing-lg);
      overflow-x: auto;
      padding-bottom: var(--spacing-md);
    }

    .kanban-column {
      flex: 0 0 300px;
      background: var(--gray-50);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
    }

    .column-header {
      padding: var(--spacing-md);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid var(--gray-200);
    }

    .column-header h3 {
      font-size: 14px;
      font-weight: 600;
      color: var(--gray-700);
      margin: 0;
    }

    .column-count {
      background: var(--gray-200);
      color: var(--gray-700);
      padding: 4px 8px;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 600;
    }

    .column-body {
      padding: var(--spacing-md);
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    /* Candidate Card */
    .candidate-card {
      background: white;
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      border: 1px solid var(--gray-200);
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .candidate-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .candidate-card.selected {
      border-color: #667eea;
      background: #f5f3ff;
      box-shadow: 0 0 0 2px #667eea;
    }

    .selection-checkbox {
      position: absolute;
      top: 8px;
      left: 8px;
      z-index: 10;
    }

    .selection-checkbox input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
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
    }

    .score-badge {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      color: white;
    }

    .candidate-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--gray-900);
      margin: 0 0 4px 0;
    }

    .candidate-school {
      font-size: 13px;
      color: var(--gray-500);
      margin: 0 0 var(--spacing-md) 0;
    }

    .candidate-skills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: var(--spacing-md);
    }

    .skill-tag {
      background: #EEF2FF;
      color: var(--primary-color);
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 500;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--gray-200);
    }

    .candidate-meta {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--gray-500);
    }

    .card-actions {
      display: flex;
      gap: 4px;
    }

    .icon-btn {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-md);
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--gray-400);
      transition: all 0.2s;
    }

    .icon-btn:hover {
      background: var(--gray-100);
      color: var(--gray-600);
    }

    @media (max-width: 768px) {
      .kanban-board {
        flex-direction: column;
      }

      .kanban-column {
        flex: 1 1 auto;
      }
    }
  `]
})
export class CandidaturesComponent implements OnInit {
  applications: Application[] = [];
  candidates: Candidate[] = [];
  selectMode = false;
  selectedCandidates: Set<string> = new Set();
  
  kanbanColumns = [
    { status: 'nouveau' as CandidateStatus, title: 'Nouveau' },
    { status: 'preselectionne' as CandidateStatus, title: 'Présélection' },
    { status: 'entretien_programme' as CandidateStatus, title: 'Entretien' },
    { status: 'test_technique' as CandidateStatus, title: 'Test technique' },
    { status: 'offre_envoyee' as CandidateStatus, title: 'Offre envoyée' },
    { status: 'rejete' as CandidateStatus, title: 'Rejeté' }
  ];

  constructor(
    private candidateService: CandidateService,
    private matchingService: MatchingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.candidateService.getCandidates().subscribe(candidates => {
      this.candidates = candidates;
    });

    this.matchingService.getApplications().subscribe(applications => {
      this.applications = applications;
    });
  }

  toggleSelectMode(): void {
    this.selectMode = !this.selectMode;
    if (!this.selectMode) {
      this.selectedCandidates.clear();
    }
  }

  toggleCandidateSelection(candidateId: string): void {
    if (this.selectedCandidates.has(candidateId)) {
      this.selectedCandidates.delete(candidateId);
    } else {
      this.selectedCandidates.add(candidateId);
    }
  }

  isCandidateSelected(candidateId: string): boolean {
    return this.selectedCandidates.has(candidateId);
  }

  handleCardClick(candidateId: string, event: Event): void {
    if (this.selectMode) {
      this.toggleCandidateSelection(candidateId);
    } else {
      // Navigation vers le profil du candidat
      this.router.navigate(['/profil', candidateId]);
    }
  }

  getSelectedCandidates(): Candidate[] {
    return this.candidates.filter(c => this.selectedCandidates.has(c.id));
  }

  clearSelection(): void {
    this.selectedCandidates.clear();
    this.selectMode = false;
  }

  onStatusUpdated(): void {
    // Recharger les données après mise à jour
    this.ngOnInit();
  }

  getApplicationsByStatus(status: CandidateStatus): Application[] {
    return this.applications.filter(app => {
      const candidate = this.candidates.find(c => c.id === app.candidateId);
      return candidate?.status === status;
    });
  }

  getColumnCount(status: CandidateStatus): number {
    return this.getApplicationsByStatus(status).length;
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

  formatDate(date: Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }
}
