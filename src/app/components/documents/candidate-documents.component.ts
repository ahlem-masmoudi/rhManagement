import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../services/document.service';
import { CandidateDocument, DocumentType, DocumentStatus } from '../../models';

@Component({
  selector: 'app-candidate-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="documents-container">
      <div class="documents-header">
        <h3>📎 Documents de candidature</h3>
        <button *ngIf="allowUpload" class="btn-primary" (click)="triggerFileUpload()">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
          </svg>
          Ajouter un document
        </button>
        <input #fileInput type="file" (change)="onFileSelected($event)" style="display: none" multiple>
      </div>

      <!-- Selection du type de document -->
      <div *ngIf="showUploadForm" class="upload-form card mb-md">
        <h4>Type de document</h4>
        <select [(ngModel)]="selectedDocType" class="form-control">
          <option value="cv">CV</option>
          <option value="lettre_motivation">Lettre de motivation</option>
          <option value="demande_stage">Demande de stage</option>
          <option value="convention_stage">Convention de stage</option>
          <option value="attestation">Attestation</option>
          <option value="autre">Autre</option>
        </select>
        <div class="form-actions">
          <button class="btn-secondary" (click)="cancelUpload()">Annuler</button>
          <button class="btn-primary" (click)="uploadFile()" [disabled]="!selectedFile">Uploader</button>
        </div>
      </div>

      <!-- Liste des documents -->
      <div class="documents-list">
        <div *ngIf="documents.length === 0" class="empty-state">
          <svg width="48" height="48" fill="currentColor" opacity="0.3" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
          </svg>
          <p>Aucun document</p>
        </div>

        <div *ngFor="let doc of documents" class="document-item card">
          <div class="document-icon" [class]="'doc-type-' + doc.type">
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
            </svg>
          </div>

          <div class="document-info">
            <h4>{{ doc.name }}</h4>
            <p class="document-meta">
              {{ getDocTypeLabel(doc.type) }} • 
              Uploadé le {{ formatDate(doc.uploadedAt) }}
              <span *ngIf="doc.uploadedBy !== 'candidate'"> par RH</span>
            </p>
          </div>

          <div class="document-status">
            <span class="status-badge" [class]="'status-' + doc.status">
              {{ getStatusLabel(doc.status) }}
            </span>
            <span *ngIf="doc.isSigned" class="signed-badge">
              ✓ Signé
            </span>
          </div>

          <div class="document-actions">
            <button class="icon-btn" (click)="downloadDocument(doc)" title="Télécharger">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
            <button *ngIf="isRH && doc.status === 'soumis'" class="icon-btn btn-success" (click)="validateDocument(doc)" title="Valider">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </button>
            <button *ngIf="isRH && doc.status === 'soumis'" class="icon-btn btn-danger" (click)="rejectDocument(doc)" title="Rejeter">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
            <button *ngIf="isRH && doc.type === 'convention_stage' && !doc.isSigned" class="btn-sm btn-primary" (click)="signDocument(doc)">
              ✍️ Signer
            </button>
            <button *ngIf="allowDelete" class="icon-btn btn-danger" (click)="deleteDocument(doc)" title="Supprimer">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <div class="confirm-overlay" *ngIf="confirmDialog.show" (click)="closeConfirmDialog()">
      <div class="confirm-box" (click)="$event.stopPropagation()">
        <div class="confirm-icon" [ngClass]="confirmDialog.iconType">
          <svg *ngIf="confirmDialog.iconType==='danger'" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          <svg *ngIf="confirmDialog.iconType==='warning'" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          <svg *ngIf="confirmDialog.iconType==='info'" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
        </div>
        <h3 class="confirm-title">{{ confirmDialog.title }}</h3>
        <p class="confirm-msg" [innerHTML]="confirmDialog.message"></p>
        <div class="confirm-actions">
          <button class="confirm-cancel" (click)="closeConfirmDialog()">Annuler</button>
          <button class="confirm-ok" [ngClass]="confirmDialog.iconType" (click)="executeConfirm()">{{ confirmDialog.confirmLabel }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .documents-container {
      margin: var(--spacing-lg) 0;
    }

    .documents-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
    }

    .documents-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .upload-form {
      padding: var(--spacing-lg);
    }

    .upload-form h4 {
      margin-bottom: var(--spacing-md);
      font-size: 1rem;
    }

    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      margin-bottom: var(--spacing-md);
    }

    .form-actions {
      display: flex;
      gap: var(--spacing-md);
      justify-content: flex-end;
    }

    .documents-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .document-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
    }

    .document-icon {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: #f3f4f6;
    }

    .doc-type-cv { background: #dbeafe; color: #1e40af; }
    .doc-type-lettre_motivation { background: #fce7f3; color: #9f1239; }
    .doc-type-demande_stage { background: #fef3c7; color: #92400e; }
    .doc-type-convention_stage { background: #ddd6fe; color: #5b21b6; }
    .doc-type-convention_signee { background: #d1fae5; color: #065f46; }
    .doc-type-attestation { background: #e0f2fe; color: #075985; }

    .document-info {
      flex: 1;
    }

    .document-info h4 {
      margin: 0 0 4px 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .document-meta {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .document-status {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-en_attente { background: #fef3c7; color: #92400e; }
    .status-soumis { background: #dbeafe; color: #1e40af; }
    .status-valide { background: #d1fae5; color: #065f46; }
    .status-rejete { background: #fee2e2; color: #991b1b; }
    .status-signe { background: #dcfce7; color: #166534; }

    .signed-badge {
      padding: 2px 8px;
      background: #dcfce7;
      color: #166534;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .document-actions {
      display: flex;
      gap: var(--spacing-sm);
      align-items: center;
    }

    .empty-state {
      text-align: center;
      padding: var(--spacing-xxl);
      color: #9ca3af;
    }

    .empty-state svg {
      margin-bottom: var(--spacing-md);
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 0.875rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-success {
      color: #065f46;
    }

    .btn-success:hover {
      background: #d1fae5;
    }

    .btn-danger {
      color: #991b1b;
    }

    .btn-danger:hover {
      background: #fee2e2;
    }

    @media (max-width: 640px) {
      .document-item {
        flex-wrap: wrap;
        gap: var(--spacing-sm);
      }

      .document-icon { display: none; }

      .document-info {
        flex: 1 1 100%;
        order: 1;
      }

      .document-status {
        flex-direction: row;
        align-items: center;
        order: 2;
        flex: 1 1 auto;
      }

      .document-actions {
        order: 3;
        flex: 0 0 auto;
      }

      .documents-header h3 { font-size: 1rem; }
    }

    @media (max-width: 480px) {
      .form-actions { flex-direction: column; }
      .form-actions button { width: 100%; }
      .document-item { padding: 10px 12px; }
      .document-actions { gap: 4px; }
      .document-actions button { font-size: 11px; padding: 5px 8px; }
    }

    @media (max-width: 360px) {
      .document-status { flex-direction: column; align-items: flex-start; }
    }

    /* ── Confirm Dialog ── */
    @keyframes confirmPop { from{opacity:0;transform:scale(0.92) translateY(16px)} to{opacity:1;transform:none} }
    .confirm-overlay {
      position:fixed; top:0; left:0; width:100vw; height:100vh;
      background:rgba(0,0,0,0.42); backdrop-filter:blur(4px);
      display:flex; align-items:center; justify-content:center;
      z-index:9999; padding:20px; box-sizing:border-box;
    }
    .confirm-box {
      background:#fff; border-radius:20px; padding:36px 32px 28px;
      max-width:420px; width:100%; text-align:center;
      box-shadow:0 24px 64px rgba(0,0,0,0.18);
      animation:confirmPop 0.28s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    .confirm-icon {
      width:64px; height:64px; border-radius:50%; margin:0 auto 18px;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 4px 16px rgba(0,0,0,0.12);
    }
    .confirm-icon.danger  { background:linear-gradient(135deg,#FEE2E2,#FECACA); color:#DC2626; }
    .confirm-icon.warning { background:linear-gradient(135deg,#FEF3C7,#FDE68A); color:#D97706; }
    .confirm-icon.info    { background:linear-gradient(135deg,#DBEAFE,#BFDBFE); color:#1565C0; }
    .confirm-title { font-size:18px; font-weight:800; color:#111827; margin:0 0 10px; }
    .confirm-msg   { font-size:13.5px; color:#6B7280; line-height:1.6; margin:0 0 26px; }
    .confirm-msg strong { color:#374151; }
    .confirm-actions { display:flex; gap:10px; }
    .confirm-cancel {
      flex:1; padding:11px 0; border-radius:12px;
      border:1.5px solid #E5E7EB; background:#F9FAFB; color:#374151;
      font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s;
    }
    .confirm-cancel:hover { background:#F3F4F6; border-color:#D1D5DB; }
    .confirm-ok {
      flex:1; padding:11px 0; border-radius:12px;
      border:none; color:#fff; font-size:14px; font-weight:700;
      cursor:pointer; transition:all 0.25s;
    }
    .confirm-ok.danger  { background:linear-gradient(135deg,#DC2626,#EF4444); box-shadow:0 4px 14px rgba(220,38,38,0.32); }
    .confirm-ok.danger:hover  { background:linear-gradient(135deg,#B91C1C,#DC2626); transform:translateY(-1px); }
    .confirm-ok.warning { background:linear-gradient(135deg,#D97706,#F59E0B); box-shadow:0 4px 14px rgba(217,119,6,0.32); }
    .confirm-ok.warning:hover { background:linear-gradient(135deg,#B45309,#D97706); transform:translateY(-1px); }
    .confirm-ok.info    { background:linear-gradient(135deg,#1565C0,#1976D2); box-shadow:0 4px 14px rgba(21,101,192,0.32); }
    .confirm-ok.info:hover    { background:linear-gradient(135deg,#0D47A1,#1565C0); transform:translateY(-1px); }
  `]
})
export class CandidateDocumentsComponent implements OnInit {
  @Input() candidateId!: string;
  @Input() isRH: boolean = false;
  @Input() allowUpload: boolean = true;
  @Input() allowDelete: boolean = false;

  confirmDialog: { show: boolean; title: string; message: string; confirmLabel: string; iconType: 'danger'|'warning'|'info'; action: (() => void) | null } =
    { show: false, title: '', message: '', confirmLabel: 'Confirmer', iconType: 'danger', action: null };

  openConfirmDialog(cfg: { title: string; message: string; confirmLabel: string; iconType: 'danger'|'warning'|'info'; action: () => void }): void {
    this.confirmDialog = { show: true, ...cfg };
  }
  closeConfirmDialog(): void {
    this.confirmDialog = { show: false, title: '', message: '', confirmLabel: 'Confirmer', iconType: 'danger', action: null };
  }
  executeConfirm(): void {
    if (this.confirmDialog.action) this.confirmDialog.action();
    this.closeConfirmDialog();
  }

  documents: CandidateDocument[] = [];
  showUploadForm = false;
  selectedFile: File | null = null;
  selectedDocType: DocumentType = 'cv';

  constructor(private documentService: DocumentService) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.documents = this.documentService.getCandidateDocuments(this.candidateId);
  }

  triggerFileUpload(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.showUploadForm = true;
    }
  }

  uploadFile(): void {
    if (this.selectedFile) {
      const uploadedBy = this.isRH ? 'RH' : 'candidate';
      this.documentService.uploadDocument(
        this.candidateId,
        this.selectedFile,
        this.selectedDocType,
        uploadedBy
      ).subscribe(() => {
        this.loadDocuments();
        this.cancelUpload();
      });
    }
  }

  cancelUpload(): void {
    this.showUploadForm = false;
    this.selectedFile = null;
    this.selectedDocType = 'cv';
  }

  downloadDocument(doc: CandidateDocument): void {
    this.documentService.downloadDocument(doc);
  }

  validateDocument(doc: CandidateDocument): void {
    this.documentService.validateDocument(this.candidateId, doc.id);
    this.loadDocuments();
  }

  rejectDocument(doc: CandidateDocument): void {
    this.openConfirmDialog({
      title: 'Rejeter ce document ?',
      message: `Vous êtes sur le point de rejeter <strong>« ${doc.name} »</strong>.`,
      confirmLabel: 'Rejeter',
      iconType: 'warning',
      action: () => { this.documentService.rejectDocument(this.candidateId, doc.id); this.loadDocuments(); }
    });
  }

  signDocument(doc: CandidateDocument): void {
    this.openConfirmDialog({
      title: 'Signer ce document ?',
      message: `Confirmer la signature de <strong>« ${doc.name} »</strong> en tant que RH Manager.`,
      confirmLabel: 'Signer',
      iconType: 'info',
      action: () => { this.documentService.signDocument(this.candidateId, doc.id, 'RH Manager'); this.loadDocuments(); }
    });
  }

  deleteDocument(doc: CandidateDocument): void {
    this.openConfirmDialog({
      title: 'Supprimer ce document ?',
      message: `Vous êtes sur le point de supprimer définitivement <strong>« ${doc.name} »</strong>. Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      iconType: 'danger',
      action: () => { this.documentService.deleteDocument(this.candidateId, doc.id); this.loadDocuments(); }
    });
  }

  getDocTypeLabel(type: DocumentType): string {
    const labels: Record<DocumentType, string> = {
      'cv': 'CV',
      'lettre_motivation': 'Lettre de motivation',
      'demande_stage': 'Demande de stage',
      'convention_stage': 'Convention de stage',
      'convention_signee': 'Convention signée',
      'attestation': 'Attestation',
      'autre': 'Autre'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: DocumentStatus): string {
    const labels: Record<DocumentStatus, string> = {
      'en_attente': 'En attente',
      'soumis': 'Soumis',
      'valide': 'Validé',
      'rejete': 'Rejeté',
      'signe': 'Signé'
    };
    return labels[status] || status;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
