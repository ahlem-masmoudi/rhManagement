import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CandidateService } from '../../services/candidate.service';
import { MatchingService } from '../../services/matching.service';
import { OfferService } from '../../services/offer.service';
import { Candidate, CandidateStatus, Application, Offer } from '../../models';
import { BulkStatusUpdateComponent } from '../bulk-status/bulk-status-update.component';

@Component({
  selector: 'app-candidatures',
  standalone: true,
  imports: [CommonModule, FormsModule, BulkStatusUpdateComponent],
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

      <!-- Document preview modal -->
      <div *ngIf="previewVisible" class="doc-preview-overlay" (click)="closePreview()">
        <div class="doc-preview" (click)="$event.stopPropagation()">
          <div class="doc-preview-header">
            <h3 style="margin:0">{{ previewData?.name }}</h3>
            <button class="btn-secondary" (click)="closePreview()">Fermer</button>
          </div>

            <div class="doc-preview-body">
              <ng-container *ngIf="previewData && previewData.mime === 'application/pdf'">
                <object [data]="getPreviewDataUrl()" type="application/pdf" width="100%" height="600">Votre navigateur ne peut pas afficher le PDF.</object>
              </ng-container>
              <ng-container *ngIf="previewData && previewData.mime && previewData.mime.indexOf('image/') === 0">
                <img [src]="getPreviewDataUrl()" alt="{{ previewData.name }}" style="max-width:100%; max-height:600px; display:block; margin:auto;" />
              </ng-container>
              <ng-container *ngIf="previewData && previewData.mime === 'text/plain'">
                <pre style="white-space:pre-wrap; max-height:600px; overflow:auto">{{ previewData.content }}</pre>
              </ng-container>
              <ng-container *ngIf="previewData && previewData.mime === 'application/octet-stream'">
                <p>Prévisualisation non disponible pour ce type de fichier. Vous pouvez le télécharger.</p>
              </ng-container>
            </div>

          <div class="doc-preview-footer">
            <button class="btn-primary" (click)="saveContentAsFilePublic(previewData?.name || 'document', previewData?.content || '')">Télécharger</button>
          </div>
        </div>
      </div>

      <!-- Archives section for accepted candidates -->
      <div class="archives-section card mt-lg">
        <div class="archives-header" style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h2>Archives (Acceptés)</h2>
          </div>
          <div class="archives-actions">
            <button class="btn-secondary" (click)="exportArchivedCSV()">Exporter CSV</button>
          </div>
        </div>

        <div class="archives-grid" style="display:flex; gap:12px; flex-wrap:wrap; margin-top:12px;">
          <div *ngFor="let app of getArchivedApplications()" class="archive-card card" style="width:min(320px, 100%); padding:12px; position:relative;">
            <div style="display:flex; gap:12px; align-items:center;">
              <div class="candidate-avatar">{{ getInitials(app.candidateId) }}</div>
              <div style="flex:1; min-width:0;">
                <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">{{ app.candidate?.firstName || '' }} {{ app.candidate?.lastName || '' }}</h4>
                <div style="font-size:12px; color:var(--gray-500)">{{ app.offer?.title || '' }}</div>
              </div>
            </div>

            <div style="margin-top:12px;">
              <div style="font-size:12px; color:var(--gray-500);">Candidature : {{ formatDate(app.appliedAt) }}</div>

              <div *ngIf="(archivedDocs[app.candidateId] || []).length > 0" style="margin-top:8px;">
                <div *ngFor="let doc of archivedDocs[app.candidateId]" style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:6px 0; border-top:1px solid var(--gray-100);">
                  <div style="min-width:0;">
                    <div style="font-size:13px; font-weight:600">{{ doc.name }}</div>
                    <div style="font-size:12px; color:var(--gray-500);">{{ doc.isSigned ? 'Signé' : 'Non signé' }}{{ doc.signedAt ? ' • ' + formatDate(doc.signedAt) : '' }}</div>
                  </div>
                  <div style="display:flex; gap:8px;">
                    <button class="btn-secondary" (click)="openPreview(app.candidateId, doc.id)">Prévisualiser</button>
                    <button class="btn-secondary" (click)="downloadSingleDocument(app.candidateId, doc.id, doc.name)">Télécharger</button>
                  </div>
                </div>
              </div>

              <div *ngIf="!(archivedDocs[app.candidateId] || []).length" style="margin-top:8px; color:var(--gray-500);">
                <div *ngIf="archivedDocsLoading[app.candidateId]" style="margin-top:4px;">Chargement des documents...</div>
                <div *ngIf="!archivedDocsLoading[app.candidateId]" style="display:flex; gap:8px; align-items:center;">
                  <button class="btn-secondary" (click)="loadArchivedDocumentsForCandidate(app.candidateId)">Charger les documents</button>
                  <div style="color:var(--gray-500);">Aucun document disponible</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card filters-bar mb-lg">
        <input type="search" placeholder="Rechercher un candidat..." class="search-input" [(ngModel)]="searchTerm">
        <select [(ngModel)]="selectedOffer">
          <option value="">Toutes les offres</option>
          <option *ngFor="let o of offers" [value]="o.id">{{ o.title || ('Offre ' + o.id) }}</option>
        </select>
        <select [(ngModel)]="selectedScoreRange">
          <option value="">Tous les scores</option>
          <option value="80-100">80-100</option>
          <option value="60-79">60-79</option>
          <option value="0-59">0-59</option>
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
        [class.accepted]="application.status === 'offre_acceptee'"
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

              <!-- Badge for accepted candidates -->
              <div *ngIf="application.status === 'offre_acceptee'" class="accepted-badge">
                Accepté
              </div>

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
                <div class="card-actions" (click)="$event.stopPropagation()">
                  <button class="icon-btn" (click)="toggleDropdown(application.id, $event)">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                    </svg>
                  </button>
                  <div class="status-dropdown" *ngIf="activeDropdown === application.id"
                       [style.top.px]="dropdownY" [style.left.px]="dropdownX">
                    <div class="dropdown-item" *ngFor="let col of kanbanColumns"
                         [class.active]="application.status === col.status"
                         (click)="changeStatus(application, col.status)">
                      {{ col.title }}
                    </div>
                  </div>
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
      overflow: visible; /* allow badges to sit outside the card without being clipped */
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

    /* Accepted card visual */
    .candidate-card.accepted {
      border-color: #059669;
      background: #f0fdf4;
      box-shadow: 0 0 0 4px rgba(5,150,105,0.06);
    }

    .accepted-badge {
      position: absolute;
      /* place the badge slightly above the top edge so it doesn't overlap the score */
      top: -10px;
      right: 12px;
      background: #059669;
      color: white;
      padding: 5px 9px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 11px;
      box-shadow: 0 2px 6px rgba(5,150,105,0.18);
      z-index: 20;
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
      position: relative;
    }

    .status-dropdown {
      position: fixed;
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-md);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      z-index: 9999;
      min-width: 190px;
      max-height: 280px;
      overflow-y: auto;
    }

    .dropdown-item {
      padding: 9px 14px;
      font-size: 13px;
      color: var(--gray-700);
      cursor: pointer;
      transition: background 0.15s;
    }

    .dropdown-item:hover { background: var(--gray-50); }
    .dropdown-item.active { background: #EEF2FF; color: var(--primary-color); font-weight: 600; }

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
      .page-header { flex-direction: column; align-items: flex-start; gap: var(--spacing-md); }
      .header-actions { width: 100%; justify-content: flex-start; }

      .kanban-board {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 8px;
      }

      .kanban-column {
        flex: 0 0 280px;
        min-width: 280px;
      }

      .archives-section { padding: var(--spacing-md); }
    }

    @media (max-width: 480px) {
      .kanban-column { flex: 0 0 260px; min-width: 260px; }
      .doc-preview { margin: 8px; max-height: calc(100vh - 16px); border-radius: var(--radius-md); }
      .doc-preview-header { padding: 12px 16px; }
      .archive-card { width: 100% !important; }
    }
  `]
})
export class CandidaturesComponent implements OnInit {
  applications: Application[] = [];
  candidates: Candidate[] = [];
  offers: Offer[] = [];
  // Map candidateId -> documents[] for archived candidates
  archivedDocs: { [candidateId: string]: any[] } = {};
  // loading state per candidate when fetching documents on demand
  archivedDocsLoading: { [candidateId: string]: boolean } = {};
  selectedOffer: string = '';
  searchTerm: string = '';
  selectedScoreRange: string = '';
  selectMode = false;
  selectedCandidates: Set<string> = new Set();
  
  kanbanColumns = [
    { status: 'nouveau' as CandidateStatus, title: 'Nouveau' },
    { status: 'preselectionne' as CandidateStatus, title: 'Présélection' },
    { status: 'en_attente_documents' as CandidateStatus, title: 'En attente de documents' },
    { status: 'documents_recus' as CandidateStatus, title: 'Documents reçus' },
    { status: 'entretien_programme' as CandidateStatus, title: 'Entretien' },
    { status: 'test_technique' as CandidateStatus, title: 'Test technique' },
    { status: 'offre_envoyee' as CandidateStatus, title: 'Offre envoyée' },
    { status: 'rejete' as CandidateStatus, title: 'Rejeté' }
  ];

  constructor(
    private candidateService: CandidateService,
    private matchingService: MatchingService,
    private offerService: OfferService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.matchingService.getApplications().subscribe(applications => {
      this.applications = applications;
      console.log('Applications loaded in component:', this.applications);
      // preload archived candidates' documents
      this.loadArchivedDocuments();
    });

    // Load candidate objects so getSelectedCandidates() can return the actual Candidate[]
    // (selectedCandidates is a Set of ids; we need the candidate list to map ids -> objects
    // for the bulk component input)
    this.candidateService.getCandidates().subscribe(candidates => {
      this.candidates = candidates;
      // keep a quick log for debugging selection issues
      console.log('Candidates loaded in component:', this.candidates.length);
    });

    // Load offers for the filter dropdown
    this.offerService.getOffers().subscribe(offers => {
      this.offers = offers;
      console.log('Offers loaded in candidatures component:', this.offers.length);
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
      // Navigation vers le profil du candidat (relative path since we're inside /rh)
      this.router.navigate(['/rh/profil', candidateId]);
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
    this.ngOnInit();
  }

  activeDropdown: string | null = null;
  dropdownX = 0;
  dropdownY = 0;

  toggleDropdown(appId: string, event: MouseEvent): void {
    if (this.activeDropdown === appId) {
      this.activeDropdown = null;
      return;
    }
    this.activeDropdown = appId;
    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    this.dropdownX = rect.right - 190;
    this.dropdownY = rect.bottom + 4;
  }

  changeStatus(application: any, newStatus: string): void {
    this.activeDropdown = null;
    this.candidateService.bulkUpdateStatus({
      candidateIds: [application.candidateId],
      newStatus: newStatus as any,
      sendEmail: false
    }).subscribe(() => this.onStatusUpdated());
  }

  getApplicationsByStatus(status: CandidateStatus): Application[] {
    return this.applications
      .filter(app => app.status === status)
      .filter(app => !this.selectedOffer || app.offerId === this.selectedOffer)
      .filter(app => {
        // Text search across candidate name, email and skills
        if (!this.searchTerm) return true;
        const term = this.searchTerm.toLowerCase();
        const cand = app.candidate || {} as any;
        const fullName = `${cand.firstName || ''} ${cand.lastName || ''}`.toLowerCase();
        const email = (cand.email || '').toLowerCase();
        const skills = (cand.skills || []).join(' ').toLowerCase();
        return fullName.includes(term) || email.includes(term) || skills.includes(term);
      })
      .filter(app => {
        // Score range filter (matchingScore.global)
        if (!this.selectedScoreRange) return true;
        const score = app.matchingScore?.global || 0;
        if (this.selectedScoreRange === '80-100') return score >= 80 && score <= 100;
        if (this.selectedScoreRange === '60-79') return score >= 60 && score <= 79;
        if (this.selectedScoreRange === '0-59') return score >= 0 && score <= 59;
        return true;
      });
  }

  getColumnCount(status: CandidateStatus): number {
    return this.getApplicationsByStatus(status).length;
  }

  getCandidateName(candidateId: string): string {
    const application = this.applications.find(app => app.candidateId === candidateId);
    if (application && application.candidate) {
      return `${application.candidate.firstName} ${application.candidate.lastName}`;
    }
    return '';
  }

  getInitials(candidateId: string): string {
    const application = this.applications.find(app => app.candidateId === candidateId);
    if (application && application.candidate) {
      const firstInitial = application.candidate.firstName?.[0] || '';
      const lastInitial = application.candidate.lastName?.[0] || '';
      return firstInitial + lastInitial;
    }
    return '?';
  }

  getCandidateSchool(candidateId: string): string {
    const application = this.applications.find(app => app.candidateId === candidateId);
    return application?.candidate?.school || '';
  }

  getCandidateSkills(candidateId: string): any[] {
    const application = this.applications.find(app => app.candidateId === candidateId);
    const skills = application?.candidate?.skills || [];
    // Convert string array to objects with name property for template
    return skills.map((skill: string) => ({ name: skill }));
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

  // --- Archives helpers ---
  getArchivedApplications(): Application[] {
    return this.applications.filter(a => a.status === 'offre_acceptee');
  }

  exportArchivedCSV(): void {
    const apps = this.getArchivedApplications();
    if (!apps || apps.length === 0) return;

    const header = ['Candidate','Email','Offer','AppliedAt','ApplicationId','CandidateId','Documents'];
    const rows = apps.map(a => {
      const docs = (this.archivedDocs[a.candidateId] || []).map(d => `${d.name}${d.isSigned ? ' (Signé' + (d.signedAt ? ' ' + this.formatDate(d.signedAt) : '') + ')' : ''}`);
      return [
        `${a.candidate?.firstName || ''} ${a.candidate?.lastName || ''}`,
        a.candidate?.email || '',
        a.offer?.title || '',
        new Date(a.appliedAt).toLocaleString('fr-FR'),
        a.id,
        a.candidateId,
        docs.join(' | ')
      ];
    });

    const csvContent = [header, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archives_candidats_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Load documents for archived applicants (offre_acceptee)
  loadArchivedDocuments(): void {
    const archived = this.getArchivedApplications();
    const uniqueCandidateIds = Array.from(new Set(archived.map(a => a.candidateId).filter(id => !!id)));

    uniqueCandidateIds.forEach(id => {
      // Only fetch if not already loaded
      if (this.archivedDocs[id]) return;
      this.candidateService.getCandidateFull(id).subscribe(candidate => {
        this.archivedDocs[id] = candidate.documents || [];
      }, err => {
        console.error('Failed to load candidate documents for', id, err);
        this.archivedDocs[id] = [];
      });
    });
  }

  // Load documents for a single archived candidate on demand (shows loading state)
  loadArchivedDocumentsForCandidate(id: string): void {
    if (!id) return;
    if (this.archivedDocs[id]) return; // already loaded
    this.archivedDocsLoading[id] = true;
    this.candidateService.getCandidateFull(id).subscribe(candidate => {
      this.archivedDocs[id] = candidate.documents || [];
      this.archivedDocsLoading[id] = false;
    }, err => {
      console.error('Failed to load candidate documents for', id, err);
      this.archivedDocs[id] = [];
      this.archivedDocsLoading[id] = false;
      alert('Impossible de charger les documents pour ce candidat. Vérifiez la connexion au serveur.');
    });
  }

  // Download a single document for a candidate
  downloadSingleDocument(candidateId: string, docId: string, filename?: string): void {
    this.candidateService.downloadDocument(candidateId, docId).subscribe(resp => {
      const name = resp.name || filename || 'document';
      const content = resp.content || '';
      this.saveContentAsFile(name, content);
    }, err => {
      console.error('Failed to download document', err);
      alert('Erreur lors du téléchargement du document.');
    });
  }

  downloadAllDocuments(app: Application): void {
    if (!app?.candidateId) return;
    // Fetch full candidate record (contains documents)
    this.candidateService.getCandidateFull(app.candidateId).subscribe(candidate => {
      const docs = candidate.documents || [];
      if (!docs || docs.length === 0) {
        alert('Aucun document disponible pour ce candidat.');
        return;
      }

      // Download each document sequentially
      docs.forEach((doc: any) => {
        this.candidateService.downloadDocument(app.candidateId, doc.id).subscribe(resp => {
          const name = resp.name || doc.name || 'document';
          const content = resp.content || doc.content || '';
          this.saveContentAsFile(name, content);
        }, err => {
          console.error('Failed to download document', err);
        });
      });
    }, err => {
      console.error('Failed to load candidate for documents', err);
    });
  }

  private saveContentAsFile(filename: string, content: string) {
    try {
      // Try to treat content as base64
      const byteChars = atob(content);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // Fallback: save as plain text
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  }

  // Public wrapper so template can call download (private method is not accessible from template)
  saveContentAsFilePublic(filename: string, content: string) {
    this.saveContentAsFile(filename, content);
  }

  // --- Document preview modal ---
  previewVisible: boolean = false;
  previewData: { name?: string; content?: string; mime?: string } | null = null;

  openPreview(candidateId: string, docId: string) {
    const docs = this.archivedDocs[candidateId] || [];
    const doc = docs.find((d: any) => d.id === docId);
    if (doc && doc.content) {
      this.previewData = {
        name: doc.name,
        content: doc.content,
        mime: this.detectMimeType(doc.name)
      };
      this.previewVisible = true;
      return;
    }

    // fetch from backend if not preloaded
    this.candidateService.downloadDocument(candidateId, docId).subscribe(resp => {
      this.previewData = {
        name: resp.name || doc?.name || 'document',
        content: resp.content || '',
        mime: this.detectMimeType(resp.name || doc?.name || '')
      };
      this.previewVisible = true;
    }, err => {
      console.error('Failed to load document for preview', err);
      alert('Impossible de charger le document pour prévisualisation.');
    });
  }

  closePreview() {
    this.previewVisible = false;
    this.previewData = null;
  }

  private detectMimeType(filename: string): string {
    const lower = (filename || '').toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.txt') || lower.endsWith('.csv')) return 'text/plain';
    return 'application/octet-stream';
  }

  // Return a data URL suitable for embedding in img/object/src
  getPreviewDataUrl(): string {
    if (!this.previewData || !this.previewData.content) return '';
    const mime = this.previewData.mime || 'application/octet-stream';
    // If content looks like base64 (no spaces and contains padding), assume base64
    const isBase64 = /^[A-Za-z0-9+/=\s]+$/.test(this.previewData.content.trim());
    if (isBase64) {
      return `data:${mime};base64,${this.previewData.content}`;
    }
    // otherwise, URI encode the plain text
    return `data:${mime};charset=utf-8,${encodeURIComponent(this.previewData.content)}`;
  }
}
