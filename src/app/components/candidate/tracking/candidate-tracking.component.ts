import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CandidateService } from '../../../services/candidate.service';
import { Candidate, StatusChange, CandidateDocument } from '../../../models';

@Component({
  selector: 'app-candidate-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tracking-page">
      <div class="page-header">
        <div class="logo">🎓 Suivi de candidature</div>
      </div>

      <div class="container" *ngIf="candidate; else notFound">
        <!-- Info candidat -->
        <div class="card welcome-card">
          <h1>Bonjour {{ candidate.firstName }} {{ candidate.lastName }} ! 👋</h1>
          <p>Bienvenue sur votre espace de suivi de candidature.</p>
        </div>

        <!-- Statut actuel -->
        <div class="card status-card">
          <h2>📊 Statut de votre candidature</h2>
          <div class="current-status">
            <div class="status-badge-large" [style.background]="getStatusColor(candidate.status)">
              {{ getStatusLabel(candidate.status) }}
            </div>
            <p class="status-description">{{ getStatusDescription(candidate.status) }}</p>
          </div>
        </div>

        <!-- Discord card — accepted candidates only -->
        <div class="card discord-card" *ngIf="candidate.status === 'offre_acceptee'">
          <div class="discord-inner">
            <div class="discord-logo">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </div>
            <div class="discord-body">
              <h3>Rejoignez notre groupe Discord</h3>
              <p>Afin de faciliter la communication durant votre encadrement, nous avons créé un groupe Discord. N'hésitez pas à rejoindre ce groupe pour échanger avec votre encadrant.</p>
              <a href="https://discord.gg/aeFTt2AgpA" target="_blank" class="discord-btn">
                Rejoindre le Discord →
              </a>
            </div>
          </div>
        </div>

        <!-- Timeline des changements de statut -->
        <div class="card timeline-card">
          <h2>📜 Historique</h2>
          <div class="timeline">
            <div *ngFor="let change of getStatusHistory(); let isLast = last" 
                 class="timeline-item" 
                 [class.is-current]="isLast">
              <div class="timeline-marker" [style.background]="getStatusColor(change.newStatus)">
                <span *ngIf="isLast">✓</span>
              </div>
              <div class="timeline-content">
                <div class="timeline-status">
                  <strong>{{ getStatusLabel(change.newStatus) }}</strong>
                  <span class="timeline-date">{{ formatDate(change.changedAt) }}</span>
                </div>
                <p *ngIf="change.comment" class="timeline-comment">{{ change.comment }}</p>
                <span *ngIf="change.emailSent" class="email-sent-badge">
                  📧 Email envoyé
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Interview info (preselectionne / entretien_programme) -->
        <div class="card interview-card" *ngIf="hasInterviewInfo()">
          <h2>📅 Votre entretien</h2>
          <div class="interview-info">
            <div class="interview-row">
              <span class="interview-icon">🗓️</span>
              <div>
                <div class="interview-label">Date</div>
                <div class="interview-value">{{ formatInterviewDate(application?.interviewDate) }}</div>
              </div>
            </div>
            <div class="interview-row">
              <span class="interview-icon">🕐</span>
              <div>
                <div class="interview-label">Heure</div>
                <div class="interview-value">{{ application?.interviewTime }}</div>
              </div>
            </div>
            <div class="interview-row" *ngIf="application?.offer?.title">
              <span class="interview-icon">💼</span>
              <div>
                <div class="interview-label">Poste</div>
                <div class="interview-value">{{ application?.offer?.title }}</div>
              </div>
            </div>
            <div class="interview-row" *ngIf="application?.interviewNotes">
              <span class="interview-icon">📝</span>
              <div>
                <div class="interview-label">Notes</div>
                <div class="interview-value">{{ application?.interviewNotes }}</div>
              </div>
            </div>
          </div>
          <div class="interview-advice">
            💡 Merci de vous présenter à l'heure indiquée. En cas d'empêchement, contactez-nous dans les meilleurs délais.
          </div>
        </div>

        <!-- Upload demande de stage -->
        <div class="card upload-card" *ngIf="canUploadDemandeStage()">
          <h2>📤 Déposer votre demande de stage</h2>
          <p class="upload-intro">
            Félicitations ! Votre candidature avance. Veuillez déposer votre <strong>demande de stage</strong> (PDF) afin que l'équipe RH puisse la signer et vous la retourner.
          </p>

          <!-- Already uploaded + unsigned -->
          <div *ngIf="getUnsignedDemandeStage()" class="doc-pending-banner">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
            <div>
              <strong>{{ getUnsignedDemandeStage()?.name }}</strong> — en attente de signature RH
              <div style="font-size:12px; color:#92400e; margin-top:2px;">Vous pouvez remplacer le fichier si nécessaire.</div>
            </div>
          </div>

          <!-- Signed doc ready to download -->
          <div *ngIf="getSignedDemandeStage()" class="doc-signed-banner">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            <div style="flex:1">
              <strong>Demande signée disponible !</strong>
              <div style="font-size:12px; margin-top:2px;">{{ getSignedDemandeStage()?.name }}</div>
            </div>
            <button class="btn-download-doc" (click)="downloadDocument(getSignedDemandeStage()!)">
              Télécharger
            </button>
          </div>

          <!-- File picker -->
          <div class="file-drop" (click)="fileInput.click()" [class.has-file]="selectedFile">
            <svg width="32" height="32" fill="currentColor" opacity="0.4" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
            <p *ngIf="!selectedFile">Cliquez pour sélectionner un fichier PDF</p>
            <p *ngIf="selectedFile"><strong>{{ selectedFile.name }}</strong> ({{ formatFileSize(selectedFile.size) }})</p>
            <input #fileInput type="file" accept=".pdf,application/pdf" style="display:none" (change)="onFileSelected($event)">
          </div>

          <div *ngIf="uploadError" class="upload-error">{{ uploadError }}</div>

          <button class="btn-upload" [disabled]="!selectedFile || uploadLoading" (click)="uploadDemandeStage()">
            <span *ngIf="!uploadLoading">Déposer ma demande de stage</span>
            <span *ngIf="uploadLoading">Dépôt en cours...</span>
          </button>

          <div *ngIf="uploadSuccess" class="upload-success">
            ✓ Document déposé avec succès. L'équipe RH va le traiter prochainement.
          </div>
        </div>

        <!-- Other documents (signed letters, etc.) -->
        <div class="card documents-card" *ngIf="getOtherDocuments().length > 0">
          <h2>📎 Mes documents</h2>
          <div *ngFor="let doc of getOtherDocuments()" class="tracking-doc-item">
            <div>
              <strong>{{ doc.name }}</strong>
              <div class="tracking-doc-meta">
                {{ getDocTypeLabel(doc.type) }}
                <span *ngIf="doc.isSigned" class="signed-chip">Signé ✓</span>
              </div>
            </div>
            <button class="btn-download-doc" (click)="downloadDocument(doc)">Télécharger</button>
          </div>
        </div>

        <!-- Coordonnées -->
        <div class="card contact-card">
          <h2>📞 Besoin d'aide ?</h2>
          <p>Si vous avez des questions concernant votre candidature, n'hésitez pas à nous contacter :</p>
          <ul>
            <li>📧 Email : recrutement&#64;entreprise.fr</li>
            <li>📞 Téléphone : +33 1 23 45 67 89</li>
            <li>⏰ Disponibilité : Lundi - Vendredi, 9h - 18h</li>
          </ul>
        </div>
      </div>

      <ng-template #notFound>
        <div class="container">
          <div class="card error-card">
            <svg width="64" height="64" fill="currentColor" opacity="0.3" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <h2>Candidature non trouvée</h2>
            <p>Le lien de suivi que vous avez utilisé n'est pas valide ou a expiré.</p>
            <p>Veuillez vérifier votre email ou contacter notre service RH.</p>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .tracking-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: var(--spacing-xl);
    }

    .page-header {
      text-align: center;
      margin-bottom: var(--spacing-xl);
    }

    .logo {
      font-size: 2rem;
      font-weight: bold;
      color: white;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: var(--spacing-xl);
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .welcome-card h1 {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: 1.75rem;
      color: #1f2937;
    }

    .welcome-card p {
      margin: 0;
      color: #6b7280;
    }

    .card h2 {
      margin: 0 0 var(--spacing-lg) 0;
      font-size: 1.25rem;
      color: #1f2937;
    }

    .current-status {
      text-align: center;
      padding: var(--spacing-xl);
    }

    .status-badge-large {
      display: inline-block;
      padding: 16px 32px;
      border-radius: 24px;
      color: white;
      font-size: 1.25rem;
      font-weight: bold;
      margin-bottom: var(--spacing-md);
    }

    .status-description {
      font-size: 1rem;
      color: #6b7280;
      margin: 0;
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      position: relative;
      padding-left: 40px;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 15px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e5e7eb;
    }

    .timeline-item {
      position: relative;
    }

    .timeline-marker {
      position: absolute;
      left: -40px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      border: 4px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .timeline-content {
      background: #f9fafb;
      padding: var(--spacing-md);
      border-radius: 8px;
    }

    .timeline-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .timeline-status strong {
      font-size: 1rem;
      color: #1f2937;
    }

    .timeline-date {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .timeline-comment {
      margin: 8px 0 0 0;
      font-size: 0.875rem;
      color: #4b5563;
      font-style: italic;
    }

    .email-sent-badge {
      display: inline-block;
      padding: 4px 8px;
      background: #dbeafe;
      color: #1e40af;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-top: 8px;
    }

    .is-current .timeline-content {
      background: #ede9fe;
      border: 2px solid #8b5cf6;
    }

    .upload-reminder {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      margin-top: var(--spacing-md);
    }

    .upload-reminder svg {
      flex-shrink: 0;
      color: #f59e0b;
    }

    .upload-reminder p {
      margin: 0;
      color: #92400e;
      font-size: 0.875rem;
    }

    .empty-documents {
      padding: var(--spacing-md);
      border: 1px dashed #d1d5db;
      border-radius: 8px;
      color: #6b7280;
      margin-bottom: var(--spacing-md);
    }

    .tracking-doc-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      margin-bottom: var(--spacing-md);
    }

    .tracking-doc-meta {
      font-size: 0.875rem;
      color: #6b7280;
      margin-top: 4px;
    }

    .btn-download-doc {
      border: none;
      background: #2563eb;
      color: white;
      border-radius: 8px;
      padding: 10px 14px;
      cursor: pointer;
      font-weight: 600;
    }

    .upload-card h2 { margin: 0 0 8px; }
    .upload-intro { color: #4b5563; font-size: 14px; margin: 0 0 16px; line-height: 1.6; }

    .doc-pending-banner {
      display: flex; align-items: flex-start; gap: 10px;
      background: #fef3c7; border: 1px solid #f59e0b;
      border-radius: 10px; padding: 12px 14px; margin-bottom: 14px;
      font-size: 13px; color: #78350f;
    }
    .doc-pending-banner svg { flex-shrink: 0; color: #d97706; margin-top: 1px; }

    .doc-signed-banner {
      display: flex; align-items: center; gap: 10px;
      background: #dcfce7; border: 1px solid #86efac;
      border-radius: 10px; padding: 12px 14px; margin-bottom: 14px;
      font-size: 13px; color: #14532d;
    }
    .doc-signed-banner svg { flex-shrink: 0; color: #16a34a; }

    .file-drop {
      border: 2px dashed #d1d5db; border-radius: 10px;
      padding: 28px 16px; text-align: center; cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      margin-bottom: 12px;
    }
    .file-drop:hover, .file-drop.has-file {
      border-color: #6366f1; background: #eef2ff;
    }
    .file-drop p { margin: 8px 0 0; color: #6b7280; font-size: 14px; }
    .file-drop.has-file p { color: #4338ca; font-weight: 600; }

    .upload-error {
      color: #dc2626; font-size: 13px;
      background: #fef2f2; border: 1px solid #fca5a5;
      border-radius: 8px; padding: 8px 12px; margin-bottom: 10px;
    }

    .upload-success {
      color: #065f46; font-size: 13px;
      background: #d1fae5; border: 1px solid #6ee7b7;
      border-radius: 8px; padding: 10px 14px; margin-top: 10px;
    }

    .btn-upload {
      width: 100%; padding: 12px;
      background: #6366f1; color: white;
      border: none; border-radius: 10px;
      font-size: 15px; font-weight: 600; cursor: pointer;
      transition: background 0.2s;
    }
    .btn-upload:hover:not(:disabled) { background: #4f46e5; }
    .btn-upload:disabled { opacity: 0.5; cursor: default; }

    .signed-chip {
      display: inline-block; background: #dcfce7; color: #166534;
      padding: 2px 8px; border-radius: 999px; font-size: 11px;
      font-weight: 600; margin-left: 6px;
    }

    .contact-card ul {
      list-style: none;
      padding: 0;
      margin: var(--spacing-md) 0 0 0;
    }

    .contact-card li {
      padding: var(--spacing-sm) 0;
      color: #4b5563;
    }

    .error-card {
      text-align: center;
      padding: var(--spacing-xxl);
    }

    .error-card svg {
      margin-bottom: var(--spacing-lg);
      color: #ef4444;
    }

    .error-card h2 {
      color: #1f2937;
      margin-bottom: var(--spacing-md);
    }

    .error-card p {
      color: #6b7280;
      margin: var(--spacing-sm) 0;
    }

    /* Discord card */
    .discord-card { background: linear-gradient(135deg, #5865f2, #7289da); border: none; padding: 0; overflow: hidden; }
    .discord-inner { display: flex; align-items: flex-start; gap: 20px; padding: 24px; }
    .discord-logo { width: 52px; height: 52px; background: rgba(255,255,255,0.15); border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .discord-body { flex: 1; }
    .discord-body h3 { margin: 0 0 8px; color: white; font-size: 17px; font-weight: 700; }
    .discord-body p { margin: 0 0 16px; color: rgba(255,255,255,0.85); font-size: 14px; line-height: 1.6; }
    .discord-btn { display: inline-block; background: white; color: #5865f2; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; transition: transform .15s, box-shadow .15s; }
    .discord-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,0.2); }

    /* Interview card */
    .interview-card { border-left: 4px solid #06b6d4; }
    .interview-info { display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px; }
    .interview-row { display: flex; align-items: flex-start; gap: 12px; }
    .interview-icon { font-size: 22px; line-height: 1; }
    .interview-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; }
    .interview-value { font-size: 16px; font-weight: 600; color: #111827; margin-top: 2px; }
    .interview-advice { background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #0e7490; }

    @media (max-width: 768px) {
      .tracking-page { padding: var(--spacing-md); }
      .timeline { padding-left: 32px; }
      .timeline-marker { left: -32px; width: 24px; height: 24px; font-size: 0.75rem; }
    }

    @media (max-width: 480px) {
      .tracking-page { padding: 12px; }
      .timeline { padding-left: 24px; }
      .timeline-marker { left: -24px; width: 20px; height: 20px; font-size: 0.65rem; }
      .timeline-card { padding: 12px; }
      .status-badge { font-size: 11px; padding: 3px 8px; }
      .tracking-header h1 { font-size: 18px; }
    }

    @media (max-width: 360px) {
      .tracking-page { padding: 8px; }
      .timeline-item { margin-bottom: 12px; }
    }
  `]
})
export class CandidateTrackingComponent implements OnInit {
  candidate: Candidate | undefined;
  trackingToken: string = '';

  constructor(
    private route: ActivatedRoute,
    private candidateService: CandidateService
  ) {}

  ngOnInit(): void {
    this.trackingToken = this.route.snapshot.paramMap.get('token') || '';
    if (this.trackingToken) {
      this.candidateService.getTrackingCandidate(this.trackingToken).subscribe({
        next: (candidate) => {
          this.application = candidate.application || null;
          this.candidate = {
            id: candidate._id,
            firstName: candidate.userId?.firstName || '',
            lastName: candidate.userId?.lastName || '',
            email: candidate.userId?.email || '',
            phone: candidate.phone || '',
            status: candidate.status || 'nouveau',
            school: candidate.school || '',
            level: candidate.educationLevel || '',
            expectedDegree: candidate.expectedDegree || '',
            expectedGraduation: candidate.expectedGraduation || '',
            location: candidate.location || '',
            availability: candidate.availability || '',
            skills: (candidate.skills || []).map((skill: string) => ({ name: skill })),
            experiences: [],
            projects: [],
            languages: [],
            documents: candidate.documents || [],
            statusHistory: candidate.statusHistory || [],
            createdAt: candidate.createdAt,
            updatedAt: candidate.updatedAt
          };
        },
        error: () => {
          this.candidate = undefined;
        }
      });
    }
  }

  // Upload state
  selectedFile: File | null = null;
  uploadLoading = false;
  uploadError = '';
  uploadSuccess = false;

  application: any = null;

  get needsDocuments(): boolean {
    return this.candidate?.status === 'en_attente_documents' ||
           this.candidate?.status === 'offre_acceptee';
  }

  hasInterviewInfo(): boolean {
    return !!this.application?.interviewDate && !!this.application?.interviewTime;
  }

  canUploadDemandeStage(): boolean {
    const active = ['offre_acceptee', 'en_attente_documents', 'documents_recus'];
    return active.includes(this.candidate?.status || '');
  }

  getUnsignedDemandeStage(): CandidateDocument | null {
    return (this.candidate?.documents || [])
      .find((d: any) => d.type === 'demande_stage' && !d.isSigned) || null;
  }

  getSignedDemandeStage(): CandidateDocument | null {
    return (this.candidate?.documents || [])
      .find((d: any) => d.type === 'demande_stage' && d.isSigned) || null;
  }

  getOtherDocuments(): CandidateDocument[] {
    return (this.candidate?.documents || [])
      .filter((d: any) => d.type !== 'demande_stage');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
    this.uploadError = '';
    this.uploadSuccess = false;
  }

  uploadDemandeStage(): void {
    if (!this.selectedFile || !this.trackingToken) return;
    if (this.selectedFile.size > 10 * 1024 * 1024) {
      this.uploadError = 'Le fichier ne doit pas dépasser 10 Mo.';
      return;
    }
    this.uploadLoading = true;
    this.uploadError = '';
    this.uploadSuccess = false;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      this.candidateService.uploadTrackingDocument(this.trackingToken, {
        name: this.selectedFile!.name,
        content: base64,
        type: 'demande_stage'
      }).subscribe({
        next: () => {
          this.uploadLoading = false;
          this.uploadSuccess = true;
          this.selectedFile = null;
          // Reload candidate to reflect the new document
          this.candidateService.getTrackingCandidate(this.trackingToken).subscribe({
            next: (c) => {
              if (this.candidate) this.candidate.documents = c.documents || [];
            }
          });
        },
        error: (msg: string) => {
          this.uploadLoading = false;
          this.uploadError = msg || 'Erreur lors du dépôt.';
        }
      });
    };
    reader.readAsDataURL(this.selectedFile);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }

  getStatusHistory(): StatusChange[] {
    return this.candidate?.statusHistory || [];
  }

  getDocuments(): CandidateDocument[] {
    return this.candidate?.documents || [];
  }

  getDocTypeLabel(type: any): string {
    const labels: Record<string, string> = {
      cv: 'CV',
      lettre_motivation: 'Lettre de motivation',
      demande_stage: 'Demande de stage',
      convention_stage: 'Convention de stage',
      convention_signee: 'Convention signee',
      attestation: 'Lettre d affectation',
      autre: 'Autre'
    };
    return labels[type || 'autre'] || (type || 'Document');
  }

  getDocumentStatusLabel(status: any): string {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      soumis: 'Soumis',
      valide: 'Valide',
      rejete: 'Rejete',
      signe: 'Signe'
    };
    return labels[status || 'soumis'] || (status || 'soumis');
  }

  downloadDocument(doc: CandidateDocument): void {
    if (!this.trackingToken) return;

    this.candidateService.downloadTrackingDocument(this.trackingToken, doc.id).subscribe({
      next: (response) => {
        const content = response.content || '';
        const name = response.name || doc.name;
        let blob: Blob;
        const isBase64 = content.length > 0 && /^[A-Za-z0-9+/=\r\n]+$/.test(content.trim());
        if (isBase64) {
          const binary = atob(content.replace(/\s/g, ''));
          const arr = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
          const lower = name.toLowerCase();
          const mime = lower.endsWith('.pdf') ? 'application/pdf'
            : lower.endsWith('.png') ? 'image/png'
            : lower.endsWith('.jpg') || lower.endsWith('.jpeg') ? 'image/jpeg'
            : 'application/octet-stream';
          blob = new Blob([arr], { type: mime });
        } else {
          blob = new Blob([content], { type: 'text/html;charset=utf-8' });
        }
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = name;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'nouveau': 'Nouveau',
      'preselectionne': 'Présélectionné',
      'en_attente_documents': 'En attente de documents',
      'documents_recus': 'Documents reçus',
      'entretien_programme': 'Entretien programmé',
      'entretien_realise': 'Entretien réalisé',
      'validation_finale': 'Validation finale',
      'offre_envoyee': 'Offre envoyée',
      'offre_acceptee': 'Offre acceptée',
      'offre_refusee': 'Offre refusée',
      'rejete': 'Rejeté',
      'abandonne': 'Abandonné'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'nouveau': '#6b7280',
      'preselectionne': '#3b82f6',
      'en_attente_documents': '#f59e0b',
      'documents_recus': '#8b5cf6',
      'entretien_programme': '#06b6d4',
      'entretien_realise': '#0ea5e9',
      'validation_finale': '#6366f1',
      'offre_envoyee': '#10b981',
      'offre_acceptee': '#059669',
      'offre_refusee': '#ef4444',
      'rejete': '#dc2626',
      'abandonne': '#6b7280'
    };
    return colors[status] || '#6b7280';
  }

  getStatusDescription(status: string): string {
    const descriptions: Record<string, string> = {
      'nouveau': 'Votre candidature a bien été reçue et est en cours d\'examen.',
      'preselectionne': 'Félicitations ! Votre profil a retenu notre attention. Consultez ci-dessous la date et l\'heure de votre entretien.',
      'en_attente_documents': 'Votre candidature est acceptée. Veuillez déposer votre demande de stage (formulaire vierge) ci-dessous.',
      'documents_recus': 'Votre demande de stage a été reçue. Le service RH est en train de la traiter.',
      'entretien_programme': 'Votre entretien est confirmé. Consultez les détails ci-dessous.',
      'entretien_realise': 'Merci pour votre participation à l\'entretien.',
      'validation_finale': 'Votre candidature est en validation finale.',
      'offre_envoyee': 'Une offre vous a été envoyée !',
      'offre_acceptee': 'Bienvenue dans l\'équipe ! Rejoignez notre groupe Discord d\'encadrement.',
      'offre_refusee': 'Nous avons pris note de votre décision.',
      'rejete': 'Nous ne pouvons pas donner suite pour le moment.',
      'abandonne': 'Votre candidature semble inactive.'
    };
    return descriptions[status] || '';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatInterviewDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }
}
