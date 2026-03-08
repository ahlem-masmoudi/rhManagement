import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CandidateService } from '../../../services/candidate.service';
import { DocumentService } from '../../../services/document.service';
import { Candidate, StatusChange, CandidateDocument } from '../../../models';
import { CandidateDocumentsComponent } from '../../documents/candidate-documents.component';

@Component({
  selector: 'app-candidate-tracking',
  standalone: true,
  imports: [CommonModule, CandidateDocumentsComponent],
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

        <!-- Documents -->
        <div class="card documents-card">
          <h2>📎 Documents</h2>
          <app-candidate-documents 
            [candidateId]="candidate.id"
            [isRH]="false"
            [allowUpload]="needsDocuments"
            [allowDelete]="false">
          </app-candidate-documents>
          
          <div *ngIf="needsDocuments" class="upload-reminder">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            <p>Merci de déposer les documents requis pour poursuivre le traitement de votre candidature.</p>
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

    @media (max-width: 768px) {
      .tracking-page {
        padding: var(--spacing-md);
      }

      .timeline {
        padding-left: 32px;
      }

      .timeline-marker {
        left: -32px;
        width: 24px;
        height: 24px;
        font-size: 0.75rem;
      }
    }
  `]
})
export class CandidateTrackingComponent implements OnInit {
  candidate: Candidate | undefined;
  trackingToken: string = '';

  constructor(
    private route: ActivatedRoute,
    private candidateService: CandidateService,
    private documentService: DocumentService
  ) {}

  ngOnInit(): void {
    this.trackingToken = this.route.snapshot.paramMap.get('token') || '';
    if (this.trackingToken) {
      this.candidate = this.candidateService.getCandidateByTrackingToken(this.trackingToken);
    }
  }

  get needsDocuments(): boolean {
    return this.candidate?.status === 'en_attente_documents' || 
           this.candidate?.status === 'preselectionne';
  }

  getStatusHistory(): StatusChange[] {
    return this.candidate?.statusHistory || [];
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'nouveau': 'Nouveau',
      'preselectionne': 'Présélectionné',
      'en_attente_documents': 'En attente de documents',
      'documents_recus': 'Documents reçus',
      'entretien_programme': 'Entretien programmé',
      'entretien_realise': 'Entretien réalisé',
      'test_technique': 'Test technique',
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
      'test_technique': '#8b5cf6',
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
      'preselectionne': 'Félicitations ! Votre profil a retenu notre attention.',
      'en_attente_documents': 'Merci de déposer les documents demandés pour continuer.',
      'documents_recus': 'Vos documents sont en cours de vérification.',
      'entretien_programme': 'Un entretien sera bientôt programmé.',
      'entretien_realise': 'Merci pour votre participation à l\'entretien.',
      'test_technique': 'Vous allez recevoir un test technique.',
      'validation_finale': 'Votre candidature est en validation finale.',
      'offre_envoyee': 'Une offre vous a été envoyée !',
      'offre_acceptee': 'Bienvenue dans l\'équipe !',
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
}
