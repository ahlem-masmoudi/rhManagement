import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CandidateService } from '../../services/candidate.service';
import { Candidate, CandidateStatus, BulkStatusChange } from '../../models';

@Component({
  selector: 'app-bulk-status-update',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bulk-update-container" *ngIf="selectedCandidates.length > 0">
      <div class="bulk-update-bar card">
        <div class="selection-info">
          <span class="selection-count">{{ selectedCandidates.length }}</span>
          <span class="selection-label">candidat(s) sélectionné(s)</span>
        </div>

        <div class="bulk-actions">
          <select [(ngModel)]="newStatus" class="status-select">
            <option value="">Changer le statut...</option>
            <option value="nouveau">Nouveau</option>
            <option value="preselectionne">Présélectionné</option>
            <option value="en_attente_documents">En attente de documents</option>
            <option value="documents_recus">Documents reçus</option>
            <option value="entretien_programme">Entretien programmé</option>
            <option value="entretien_realise">Entretien réalisé</option>
            <option value="test_technique">Test technique</option>
            <option value="validation_finale">Validation finale</option>
            <option value="offre_envoyee">Offre envoyée</option>
            <option value="offre_acceptee">Offre acceptée</option>
            <option value="offre_refusee">Offre refusée</option>
            <option value="rejete">Rejeté</option>
            <option value="abandonne">Abandonné</option>
          </select>

          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="sendEmail" checked>
            Envoyer les emails de notification
          </label>

          <button 
            class="btn-primary" 
            (click)="updateStatuses()" 
            [disabled]="!newStatus || isProcessing">
            <span *ngIf="!isProcessing">✓ Appliquer</span>
            <span *ngIf="isProcessing">⏳ Envoi en cours...</span>
          </button>

          <button class="btn-secondary" (click)="clearSelection()">
            Annuler
          </button>
        </div>
      </div>

      <!-- Zone de commentaire optionnel -->
      <div class="comment-section card" *ngIf="newStatus">
        <label>Commentaire (optionnel)</label>
        <textarea 
          [(ngModel)]="comment" 
          placeholder="Ajouter un commentaire qui sera inclus dans l'email..."
          rows="3"></textarea>
      </div>

      <!-- Résultat -->
      <div class="result-message card" *ngIf="result">
        <div class="alert" [class.alert-success]="result.failed === 0" [class.alert-warning]="result.failed > 0">
          <strong>✓ Opération terminée</strong>
          <p>{{ result.success }} candidature(s) mise(s) à jour</p>
          <p *ngIf="result.failed > 0">{{ result.failed }} échec(s)</p>
          <p *ngIf="emailsSent > 0">📧 {{ emailsSent }} email(s) envoyé(s) en masse</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bulk-update-container {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 1000px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .bulk-update-bar {
      padding: var(--spacing-lg);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: white;
      border: 2px solid #667eea;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }

    .selection-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .selection-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #667eea;
      color: white;
      border-radius: 50%;
      font-weight: bold;
      font-size: 1rem;
    }

    .selection-label {
      font-weight: 600;
      color: #374151;
    }

    .bulk-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .status-select {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      min-width: 200px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      cursor: pointer;
      user-select: none;
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .comment-section {
      padding: var(--spacing-lg);
      background: white;
    }

    .comment-section label {
      display: block;
      margin-bottom: var(--spacing-sm);
      font-weight: 600;
      font-size: 0.875rem;
    }

    .comment-section textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-family: inherit;
      font-size: 0.875rem;
      resize: vertical;
    }

    .result-message {
      padding: var(--spacing-lg);
      background: white;
    }

    .alert {
      padding: var(--spacing-md);
      border-radius: 8px;
    }

    .alert-success {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #10b981;
    }

    .alert-warning {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #f59e0b;
    }

    .alert strong {
      display: block;
      margin-bottom: 4px;
    }

    .alert p {
      margin: 2px 0;
      font-size: 0.875rem;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .bulk-update-bar {
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .bulk-actions {
        flex-wrap: wrap;
        width: 100%;
      }

      .status-select {
        flex: 1;
        min-width: 0;
      }
    }
  `]
})
export class BulkStatusUpdateComponent {
  @Input() selectedCandidates: Candidate[] = [];
  @Output() selectionCleared = new EventEmitter<void>();
  @Output() statusUpdated = new EventEmitter<void>();

  newStatus: CandidateStatus | '' = '';
  sendEmail = true;
  comment = '';
  isProcessing = false;
  result: { success: number; failed: number } | null = null;
  emailsSent = 0;

  constructor(private candidateService: CandidateService) {}

  updateStatuses(): void {
    if (!this.newStatus || this.selectedCandidates.length === 0) {
      return;
    }

    this.isProcessing = true;
    this.result = null;

    const bulkChange: BulkStatusChange = {
      candidateIds: this.selectedCandidates.map(c => c.id),
      newStatus: this.newStatus,
      comment: this.comment || undefined,
      sendEmail: this.sendEmail
    };

    this.candidateService.bulkUpdateStatus(bulkChange).subscribe(result => {
      this.result = result;
      this.emailsSent = this.sendEmail ? result.success : 0;
      this.isProcessing = false;
      this.statusUpdated.emit();

      // Auto-fermeture après 5 secondes
      setTimeout(() => {
        this.clearSelection();
      }, 5000);
    });
  }

  clearSelection(): void {
    this.newStatus = '';
    this.comment = '';
    this.result = null;
    this.emailsSent = 0;
    this.selectionCleared.emit();
  }
}
