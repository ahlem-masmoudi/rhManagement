import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { StatusChangeEmail, CandidateStatus, CandidateDocument } from '../models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private emailQueue: StatusChangeEmail[] = [];

  constructor() {}

  /**
   * Envoie un email de notification de changement de statut
   */
  sendStatusChangeEmail(email: StatusChangeEmail): Observable<boolean> {
    console.log('📧 Envoi d\'email à:', email.to);
    console.log('   Statut:', this.getStatusLabel(email.previousStatus), '→', this.getStatusLabel(email.newStatus));
    
    // Simulation d'envoi - Dans la vraie app, appeler l'API backend
    this.emailQueue.push(email);
    
    // Simuler un délai d'envoi
    return of(true).pipe(delay(500));
  }

  /**
   * Envoie des emails en masse pour plusieurs candidats
   */
  sendBulkStatusChangeEmails(emails: StatusChangeEmail[]): Observable<{ sent: number; failed: number }> {
    console.log(`📧 Envoi en masse de ${emails.length} emails...`);
    
    // Simulation d'envoi en masse sans interface
    // Dans la vraie app, l'API backend gérerait l'envoi en arrière-plan
    let sent = 0;
    let failed = 0;

    emails.forEach(email => {
      try {
        this.emailQueue.push(email);
        sent++;
        console.log(`  ✓ Email envoyé à ${email.candidateName} (${email.to})`);
      } catch (error) {
        failed++;
        console.error(`  ✗ Échec envoi à ${email.candidateName}:`, error);
      }
    });

    return of({ sent, failed }).pipe(delay(1000));
  }

  /**
   * Génère le contenu HTML d'un email de notification
   */
  generateEmailContent(email: StatusChangeEmail): string {
    const statusLabel = this.getStatusLabel(email.newStatus);
    const statusColor = this.getStatusColor(email.newStatus);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-badge { display: inline-block; padding: 8px 16px; background: ${statusColor}; color: white; border-radius: 20px; font-weight: bold; }
          .tracking-button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .documents { background: white; padding: 15px; border-radius: 5px; margin-top: 15px; }
          .document-item { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Mise à jour de votre candidature</h1>
          </div>
          <div class="content">
            <p>Bonjour ${email.candidateName},</p>
            
            <p>Nous vous informons que le statut de votre candidature a été mis à jour.</p>
            
            <p><strong>Nouveau statut :</strong> <span class="status-badge">${statusLabel}</span></p>
            
            ${email.comment ? `<p><strong>Commentaire :</strong><br>${email.comment}</p>` : ''}
            
            ${this.getStatusMessage(email.newStatus)}
            
            ${email.trackingUrl ? `
              <p>
                <a href="${email.trackingUrl}" class="tracking-button">
                  📋 Suivre ma candidature
                </a>
              </p>
            ` : ''}
            
            ${email.documents && email.documents.length > 0 ? `
              <div class="documents">
                <h3>📎 Documents disponibles :</h3>
                ${email.documents.map(doc => `
                  <div class="document-item">
                    <strong>${doc.name}</strong>
                    ${doc.isSigned ? ' <span style="color: green;">✓ Signé</span>' : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Si vous avez des questions, n'hésitez pas à nous contacter.
            </p>
            
            <p style="color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              L'équipe Ressources Humaines
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Retourne le libellé d'un statut
   */
  private getStatusLabel(status: CandidateStatus | null): string {
    if (!status) return 'Nouveau';
    
    const labels: Record<CandidateStatus, string> = {
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

  /**
   * Retourne la couleur d'un statut
   */
  private getStatusColor(status: CandidateStatus): string {
    const colors: Record<CandidateStatus, string> = {
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

  /**
   * Retourne un message personnalisé selon le statut
   */
  private getStatusMessage(status: CandidateStatus): string {
    const messages: Record<CandidateStatus, string> = {
      'nouveau': '<p>Votre candidature a bien été reçue et est en cours d\'examen.</p>',
      'preselectionne': '<p>🎉 Félicitations ! Votre profil a retenu notre attention. Nous vous contacterons prochainement pour la suite du processus.</p>',
      'en_attente_documents': '<p>Pour continuer le traitement de votre candidature, merci de déposer les documents demandés via votre espace candidat.</p>',
      'documents_recus': '<p>Nous avons bien reçu vos documents. Ils sont en cours de vérification.</p>',
      'entretien_programme': '<p>Un entretien a été programmé. Vous recevrez prochainement un email avec les détails (date, heure, lieu).</p>',
      'entretien_realise': '<p>Merci d\'avoir participé à l\'entretien. Nous reviendrons vers vous très prochainement.</p>',
      'test_technique': '<p>Vous allez recevoir un test technique à réaliser. Merci de le compléter dans les délais indiqués.</p>',
      'validation_finale': '<p>Votre candidature est en phase de validation finale auprès de la direction.</p>',
      'offre_envoyee': '<p>🎉 Une offre de stage vous a été envoyée ! Consultez votre espace candidat pour les détails.</p>',
      'offre_acceptee': '<p>🎊 Bienvenue dans l\'équipe ! Vous trouverez les documents signés dans votre espace candidat.</p>',
      'offre_refusee': '<p>Nous prenons note de votre refus. Nous vous souhaitons le meilleur pour la suite de votre parcours.</p>',
      'rejete': '<p>Après étude de votre candidature, nous sommes au regret de vous informer que nous ne pouvons pas donner suite pour le moment.</p>',
      'abandonne': '<p>Nous constatons que vous n\'avez pas donné suite. N\'hésitez pas à nous recontacter si vous êtes toujours intéressé.</p>'
    };
    
    return messages[status] || '<p>Le statut de votre candidature a été mis à jour.</p>';
  }

  /**
   * Récupère la file d'attente des emails (pour debug)
   */
  getEmailQueue(): StatusChangeEmail[] {
    return [...this.emailQueue];
  }

  /**
   * Vide la file d'attente
   */
  clearEmailQueue(): void {
    this.emailQueue = [];
  }
}
