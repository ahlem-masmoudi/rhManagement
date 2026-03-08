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
  `]
})
export class CandidateDocumentsComponent implements OnInit {
  @Input() candidateId!: string;
  @Input() isRH: boolean = false;
  @Input() allowUpload: boolean = true;
  @Input() allowDelete: boolean = false;

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
    if (confirm(`Êtes-vous sûr de vouloir rejeter le document "${doc.name}" ?`)) {
      this.documentService.rejectDocument(this.candidateId, doc.id);
      this.loadDocuments();
    }
  }

  signDocument(doc: CandidateDocument): void {
    if (confirm(`Signer le document "${doc.name}" ?`)) {
      this.documentService.signDocument(this.candidateId, doc.id, 'RH Manager');
      this.loadDocuments();
    }
  }

  deleteDocument(doc: CandidateDocument): void {
    if (confirm(`Supprimer définitivement "${doc.name}" ?`)) {
      this.documentService.deleteDocument(this.candidateId, doc.id);
      this.loadDocuments();
    }
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
