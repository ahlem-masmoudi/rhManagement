import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CandidateService } from '../../services/candidate.service';
import { MatchingService } from '../../services/matching.service';
import { take } from 'rxjs';
import { Candidate, CandidateStatus, BulkStatusChange } from '../../models';

const APP_NAME = 'I.NET – Gestion des Stages';

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
            <option value="entretien_programme">Entretien programmé</option>
            <option value="offre_acceptee">Accepté(e)</option>
            <option value="offre_refusee">Refusé(e)</option>
          </select>

          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="sendEmail" checked>
            Envoyer les emails de notification
          </label>

          <button
            *ngIf="sendEmail && newStatus"
            class="btn-preview"
            type="button"
            (click)="openEmailPreview()">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
            </svg>
            Voir l'email
          </button>

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

    <!-- Email preview modal -->
    <div class="email-preview-overlay" *ngIf="showEmailPreview" (click)="closeEmailPreview()">
      <div class="email-preview-modal" (click)="$event.stopPropagation()">
        <div class="email-preview-header">
          <div class="email-preview-meta">
            <span class="email-preview-label">Aperçu de l'email</span>
            <div class="email-preview-info">
              <span class="email-meta-row">
                <span class="email-meta-key">À :</span>
                <span class="email-meta-val">
                  {{ selectedCandidates[0]?.email }}
                  <span *ngIf="selectedCandidates.length > 1" class="email-more">
                    + {{ selectedCandidates.length - 1 }} autre(s)
                  </span>
                </span>
              </span>
              <span class="email-meta-row">
                <span class="email-meta-key">Objet :</span>
                <span class="email-meta-val">{{ getEmailSubject() }}</span>
              </span>
            </div>
          </div>
          <button class="email-preview-close" (click)="closeEmailPreview()">×</button>
        </div>

        <div class="email-preview-body">
          <ng-container *ngIf="hasEmailForStatus(); else noEmailTpl">
            <div [innerHTML]="previewHtml"></div>
          </ng-container>
          <ng-template #noEmailTpl>
            <div class="no-email-notice">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <p>Aucun email n'est défini pour le statut <strong>{{ getStatusLabel() }}</strong>.</p>
              <p class="no-email-sub">La notification par email ne sera pas envoyée pour ce changement de statut.</p>
            </div>
          </ng-template>
        </div>

        <div class="email-preview-footer">
          <div class="email-nav" *ngIf="hasEmailForStatus() && selectedCandidates.length > 1">
            <button class="email-nav-btn" (click)="prevCandidate()" [disabled]="previewIndex === 0">‹</button>
            <span class="email-nav-label">
              {{ selectedCandidates[previewIndex]?.firstName }} {{ selectedCandidates[previewIndex]?.lastName }}
              <span class="email-nav-count">{{ previewIndex + 1 }} / {{ selectedCandidates.length }}</span>
            </span>
            <button class="email-nav-btn" (click)="nextCandidate()" [disabled]="previewIndex === selectedCandidates.length - 1">›</button>
          </div>
          <span class="email-preview-note" *ngIf="!hasEmailForStatus() || selectedCandidates.length === 1">
            📧 Cet email sera envoyé à {{ selectedCandidates.length }} candidat(s) avec leur prénom/nom respectifs.
          </span>
          <button class="btn-secondary" (click)="closeEmailPreview()">Fermer</button>
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

    .btn-preview {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: #EEF2FF;
      color: #4338CA;
      border: 1.5px solid #C7D2FE;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.18s;
      white-space: nowrap;
    }
    .btn-preview:hover { background: #E0E7FF; border-color: #A5B4FC; }

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

    .result-message { padding: var(--spacing-lg); background: white; }

    .alert { padding: var(--spacing-md); border-radius: 8px; }
    .alert-success { background: #d1fae5; color: #065f46; border: 1px solid #10b981; }
    .alert-warning { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
    .alert strong { display: block; margin-bottom: 4px; }
    .alert p { margin: 2px 0; font-size: 0.875rem; }

    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Email preview modal ── */
    .email-preview-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.48);
      backdrop-filter: blur(3px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 24px;
    }

    .email-preview-modal {
      background: #f8fafc;
      border-radius: 18px;
      width: min(680px, 100%);
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 24px 80px rgba(0,0,0,0.28);
      overflow: hidden;
    }

    .email-preview-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 22px 14px;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      flex-shrink: 0;
    }

    .email-preview-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748B;
      display: block;
      margin-bottom: 8px;
    }

    .email-preview-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .email-meta-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
      font-size: 13px;
    }

    .email-meta-key {
      font-weight: 600;
      color: #374151;
      min-width: 48px;
      flex-shrink: 0;
    }

    .email-meta-val {
      color: #1E293B;
    }

    .email-more {
      display: inline-block;
      margin-left: 6px;
      background: #EEF2FF;
      color: #4338CA;
      font-size: 11px;
      font-weight: 600;
      padding: 1px 8px;
      border-radius: 999px;
    }

    .email-preview-close {
      border: none;
      background: #EEF2FF;
      color: #4338CA;
      width: 34px;
      height: 34px;
      border-radius: 999px;
      font-size: 22px;
      line-height: 1;
      cursor: pointer;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .email-preview-close:hover { background: #E0E7FF; }

    .email-preview-body {
      overflow-y: auto;
      padding: 20px;
      flex: 1;
    }

    .no-email-notice {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px 24px;
      text-align: center;
      color: #64748B;
    }
    .no-email-notice p { margin: 0; font-size: 15px; }
    .no-email-sub { font-size: 13px; color: #94A3B8; }

    .email-preview-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 22px;
      background: #fff;
      border-top: 1px solid #e2e8f0;
      flex-shrink: 0;
    }

    .email-preview-note { font-size: 12px; color: #64748B; }

    .email-nav {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .email-nav-btn {
      width: 30px; height: 30px;
      border: 1.5px solid #E2E8F0;
      border-radius: 8px;
      background: #F8FAFC;
      color: #374151;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    }
    .email-nav-btn:hover:not(:disabled) { background: #EEF2FF; border-color: #A5B4FC; color: #4338CA; }
    .email-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }

    .email-nav-label {
      display: flex; flex-direction: column; align-items: center;
      font-size: 13px; font-weight: 600; color: #1E293B;
      min-width: 160px; text-align: center;
    }

    .email-nav-count {
      font-size: 11px; font-weight: 400; color: #94A3B8; margin-top: 1px;
    }

    @media (max-width: 768px) {
      .bulk-update-bar { flex-direction: column; gap: var(--spacing-md); }
      .bulk-actions { flex-wrap: wrap; width: 100%; }
      .status-select { flex: 1; min-width: 0; }
      .email-preview-overlay { padding: 8px; align-items: flex-end; }
      .email-preview-modal { border-radius: 16px 16px 0 0; max-height: 95vh; }
    }
  `]
})
export class BulkStatusUpdateComponent {
  @Input() selectedCandidates: Candidate[] = [];
  @Input() applications: any[] = [];
  @Output() selectionCleared = new EventEmitter<void>();
  @Output() statusUpdated = new EventEmitter<void>();

  newStatus: CandidateStatus | '' = '';
  sendEmail = true;
  comment = '';
  isProcessing = false;
  result: { success: number; failed: number } | null = null;
  emailsSent = 0;

  showEmailPreview = false;
  previewHtml: SafeHtml | null = null;
  previewIndex = 0;

  constructor(
    private candidateService: CandidateService,
    private matchingService: MatchingService,
    private sanitizer: DomSanitizer
  ) {}

  hasEmailForStatus(): boolean {
    return ['preselectionne', 'offre_acceptee', 'offre_refusee'].includes(this.newStatus as string);
  }

  getStatusLabel(): string {
    const labels: Record<string, string> = {
      nouveau: 'Nouveau',
      preselectionne: 'Présélectionné',
      entretien_programme: 'Entretien programmé',
      offre_acceptee: 'Accepté(e)',
      offre_refusee: 'Refusé(e)',
    };
    return labels[this.newStatus as string] || this.newStatus;
  }

  getEmailSubject(): string {
    if (this.newStatus === 'preselectionne')   return `Votre candidature a été présélectionnée – Stage`;
    if (this.newStatus === 'offre_acceptee')   return `Félicitations ! Votre candidature a été acceptée – Stage`;
    if (this.newStatus === 'offre_refusee')    return `Suite à votre candidature – Stage`;
    return '(Aucun email pour ce statut)';
  }

  openEmailPreview(): void {
    this.previewIndex = 0;
    this.refreshPreviewHtml();
    this.showEmailPreview = true;
  }

  closeEmailPreview(): void {
    this.showEmailPreview = false;
  }

  prevCandidate(): void {
    if (this.previewIndex > 0) {
      this.previewIndex--;
      this.refreshPreviewHtml();
    }
  }

  nextCandidate(): void {
    if (this.previewIndex < this.selectedCandidates.length - 1) {
      this.previewIndex++;
      this.refreshPreviewHtml();
    }
  }

  private refreshPreviewHtml(): void {
    const c = this.selectedCandidates[this.previewIndex] || { firstName: 'Prénom', lastName: 'Nom', id: '' };
    const fn = (c as any).firstName || 'Prénom';
    const ln = (c as any).lastName  || 'Nom';
    const app = this.applications.find(a => a.candidateId === (c as any).id);
    const offerTitle = app?.offer?.title || '';
    const token = (c as any).trackingToken;
    const baseUrl = 'https://rh-management-97bu.vercel.app';
    const trackingUrl = token ? `${baseUrl}/candidat/suivi/${token}` : '';
    this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(this.buildEmailHtml(fn, ln, offerTitle, trackingUrl));
  }

  private buildEmailHtml(firstName: string, lastName: string, offerTitle: string, trackingUrl: string): string {
    const offer = offerTitle || '[Titre de l\'offre]';
    const btnHref = trackingUrl || '#';
    const btnStyle = `padding:11px 26px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;text-decoration:none;`;

    if (this.newStatus === 'preselectionne') {
      return `
        <div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;padding:28px;background:#f9fafb;border-radius:12px">
          <div style="background:#4f46e5;border-radius:8px;padding:18px 22px;margin-bottom:22px">
            <h1 style="color:#fff;margin:0;font-size:19px">${APP_NAME}</h1>
          </div>
          <h2 style="color:#111827;font-size:18px">Bonjour ${firstName} ${lastName},</h2>
          <p style="color:#374151;line-height:1.6">
            Nous avons le plaisir de vous informer que votre candidature pour le poste de
            <strong>${offer}</strong> a été <strong style="color:#4f46e5">présélectionnée</strong>.
          </p>
          <div style="background:#eef2ff;border-left:4px solid #4f46e5;padding:14px 18px;border-radius:6px;margin:18px 0">
            <p style="margin:0;font-weight:700;color:#3730a3">📅 Prochaine étape : Entretien</p>
            <p style="margin:8px 0 0;color:#3730a3;line-height:1.5">
              Notre équipe RH vous contactera prochainement pour vous communiquer les détails de votre entretien.
              Vous serez notifié(e) par email dès la planification.
            </p>
          </div>
          <div style="text-align:center;margin:22px 0">
            <a href="${btnHref}" style="${btnStyle}background:#4f46e5;color:#fff;">
              Accéder à mon espace de suivi
            </a>
          </div>
          <p style="color:#6b7280;font-size:13px">
            En attendant, vous pouvez suivre l'avancement de votre candidature via votre espace personnel.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:22px 0"/>
          <p style="color:#9ca3af;font-size:11px;text-align:center">${APP_NAME} — Institut National d'Études Technologiques</p>
        </div>`;
    }

    if (this.newStatus === 'offre_refusee') {
      return `
        <div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;padding:28px;background:#f9fafb;border-radius:12px">
          <div style="background:#64748b;border-radius:8px;padding:18px 22px;margin-bottom:22px">
            <h1 style="color:#fff;margin:0;font-size:19px">${APP_NAME}</h1>
          </div>
          <h2 style="color:#111827;font-size:18px">Bonjour ${firstName} ${lastName},</h2>
          <p style="color:#374151;line-height:1.6">
            Nous vous remercions de l'intérêt que vous portez à notre établissement et du temps consacré
            à votre candidature pour le poste de <strong>${offer}</strong>.
          </p>
          <p style="color:#374151;line-height:1.6">
            Après examen attentif de votre dossier, nous avons le regret de vous informer que votre candidature
            n'a pas été retenue pour cette offre.
          </p>
          ${this.comment ? `<div style="background:#f1f5f9;border-left:4px solid #94a3b8;padding:14px 18px;border-radius:6px;margin:18px 0">
            <p style="margin:0;color:#374151;font-size:13px;line-height:1.6">${this.comment}</p>
          </div>` : ''}
          <p style="color:#374151;line-height:1.6">
            Nous vous encourageons à candidater à de futures offres qui pourraient correspondre à votre profil.
          </p>
          <p style="color:#374151;line-height:1.6">Nous vous souhaitons pleine réussite dans vos démarches.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:22px 0"/>
          <p style="color:#9ca3af;font-size:11px;text-align:center">${APP_NAME} — Institut National d'Études Technologiques</p>
        </div>`;
    }

    if (this.newStatus === 'offre_acceptee') {
      return `
        <div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;padding:28px;background:#f9fafb;border-radius:12px">
          <div style="background:#059669;border-radius:8px;padding:18px 22px;margin-bottom:22px">
            <h1 style="color:#fff;margin:0;font-size:19px">${APP_NAME}</h1>
          </div>
          <h2 style="color:#111827;font-size:18px">Félicitations, ${firstName} ${lastName} !</h2>
          <p style="color:#374151;line-height:1.6">
            Nous avons le plaisir de vous annoncer que votre candidature pour le poste de
            <strong>${offer}</strong> a été <strong style="color:#059669">acceptée</strong>.
          </p>
          <div style="background:#d1fae5;border-left:4px solid #059669;padding:14px 18px;border-radius:6px;margin:18px 0">
            <p style="margin:0;font-weight:700;color:#065f46">📄 Action requise</p>
            <p style="margin:8px 0 0;color:#065f46">
              Veuillez déposer votre <strong>demande de stage</strong> (formulaire vierge fourni par votre établissement)
              via votre espace de suivi ci-dessous. Le service RH la complétera et vous la renverra signée.
            </p>
          </div>
          <div style="text-align:center;margin:22px 0">
            <a href="${btnHref}" style="${btnStyle}background:#059669;color:#fff;">
              Déposer ma demande de stage
            </a>
          </div>
          <p style="color:#6b7280;font-size:13px">
            Après dépôt, le service RH traitera votre document dans les meilleurs délais.
          </p>
          <div style="background:#5865f2;border-radius:8px;padding:18px 22px;margin:22px 0">
            <p style="margin:0;font-weight:700;color:#fff;font-size:14px">💬 Groupe Discord d'encadrement</p>
            <p style="margin:10px 0;color:#e0e7ff;line-height:1.6;font-size:13px">
              Afin de faciliter la communication durant votre encadrement, nous avons créé un groupe Discord.
              N'hésitez pas à rejoindre ce groupe pour échanger avec votre encadrant.
            </p>
            <div style="text-align:center;margin-top:14px">
              <span style="background:#fff;color:#5865f2;${btnStyle}">Rejoindre le Discord</span>
            </div>
          </div>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:22px 0"/>
          <p style="color:#9ca3af;font-size:11px;text-align:center">${APP_NAME} — Institut National d'Études Technologiques</p>
        </div>`;
    }

    return '';
  }

  updateStatuses(): void {
    if (!this.newStatus || this.selectedCandidates.length === 0) return;

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
      this.emailsSent = typeof result.emailsSent === 'number' ? result.emailsSent : (this.sendEmail ? result.success : 0);
      this.isProcessing = false;
      this.statusUpdated.emit();

      try {
        this.matchingService.getApplications();
        const autoCloseTimeout = setTimeout(() => { this.clearSelection(); }, 5000);
        this.matchingService.applications$.pipe(take(1)).subscribe({
          next: () => { clearTimeout(autoCloseTimeout); this.clearSelection(); },
          error: () => { clearTimeout(autoCloseTimeout); this.clearSelection(); }
        });
      } catch {
        setTimeout(() => this.clearSelection(), 5000);
      }
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
