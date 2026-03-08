import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Candidate, CandidateStatus, StatusChange, BulkStatusChange, StatusChangeEmail } from '../models';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class CandidateService {
  private candidatesSubject = new BehaviorSubject<Candidate[]>([]);
  public candidates$: Observable<Candidate[]> = this.candidatesSubject.asObservable();

  constructor(private notificationService: NotificationService) {
    this.loadDemoData();
  }

  getCandidates(): Observable<Candidate[]> {
    return this.candidates$;
  }

  getCandidateById(id: string): Candidate | undefined {
    return this.candidatesSubject.value.find(c => c.id === id);
  }

  updateCandidateStatus(candidateId: string, status: CandidateStatus, comment?: string, changedBy: string = 'RH'): void {
    const candidates = this.candidatesSubject.value;
    const index = candidates.findIndex(c => c.id === candidateId);
    
    if (index !== -1) {
      const candidate = candidates[index];
      const previousStatus = candidate.status;
      
      // Créer l'entrée d'historique
      const statusChange: StatusChange = {
        id: this.generateId(),
        previousStatus,
        newStatus: status,
        changedBy,
        changedAt: new Date(),
        comment,
        emailSent: false
      };

      // Mettre à jour le candidat
      candidates[index] = {
        ...candidate,
        status,
        updatedAt: new Date(),
        statusHistory: [...(candidate.statusHistory || []), statusChange]
      };
      
      this.candidatesSubject.next([...candidates]);

      // Envoyer l'email de notification
      this.sendStatusChangeNotification(candidates[index], statusChange);
    }
  }

  /**
   * Met à jour le statut de plusieurs candidats en masse
   */
  bulkUpdateStatus(bulkChange: BulkStatusChange): Observable<{ success: number; failed: number }> {
    return new Observable(observer => {
      let success = 0;
      let failed = 0;
      const emails: StatusChangeEmail[] = [];

      const candidates = this.candidatesSubject.value;
      const updatedCandidates = [...candidates];

      bulkChange.candidateIds.forEach(candidateId => {
        const index = updatedCandidates.findIndex(c => c.id === candidateId);
        
        if (index !== -1) {
          const candidate = updatedCandidates[index];
          const previousStatus = candidate.status;
          
          // Créer l'entrée d'historique
          const statusChange: StatusChange = {
            id: this.generateId(),
            previousStatus,
            newStatus: bulkChange.newStatus,
            changedBy: 'RH',
            changedAt: new Date(),
            comment: bulkChange.comment,
            emailSent: false
          };

          // Mettre à jour le candidat
          updatedCandidates[index] = {
            ...candidate,
            status: bulkChange.newStatus,
            updatedAt: new Date(),
            statusHistory: [...(candidate.statusHistory || []), statusChange]
          };

          success++;

          // Préparer l'email si demandé
          if (bulkChange.sendEmail) {
            emails.push(this.prepareStatusChangeEmail(updatedCandidates[index], statusChange));
          }
        } else {
          failed++;
        }
      });

      // Mettre à jour tous les candidats
      this.candidatesSubject.next(updatedCandidates);

      // Envoyer les emails en masse
      if (emails.length > 0) {
        this.notificationService.sendBulkStatusChangeEmails(emails).subscribe(result => {
          console.log(`✓ ${result.sent} emails envoyés, ${result.failed} échecs`);
          
          // Marquer les emails comme envoyés dans l'historique
          this.markEmailsAsSent(bulkChange.candidateIds);
        });
      }

      observer.next({ success, failed });
      observer.complete();
    });
  }

  /**
   * Envoie une notification de changement de statut
   */
  private sendStatusChangeNotification(candidate: Candidate, statusChange: StatusChange): void {
    const email = this.prepareStatusChangeEmail(candidate, statusChange);
    
    this.notificationService.sendStatusChangeEmail(email).subscribe(sent => {
      if (sent) {
        // Marquer l'email comme envoyé
        statusChange.emailSent = true;
        statusChange.emailSentAt = new Date();
        console.log(`✓ Email envoyé à ${candidate.firstName} ${candidate.lastName}`);
      }
    });
  }

  /**
   * Prépare un email de notification
   */
  private prepareStatusChangeEmail(candidate: Candidate, statusChange: StatusChange): StatusChangeEmail {
    const trackingUrl = candidate.trackingToken 
      ? `${window.location.origin}/candidat/suivi/${candidate.trackingToken}`
      : undefined;

    return {
      to: candidate.email,
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      previousStatus: statusChange.previousStatus,
      newStatus: statusChange.newStatus,
      trackingUrl,
      comment: statusChange.comment,
      documents: candidate.documents
    };
  }

  /**
   * Marque les emails comme envoyés dans l'historique
   */
  private markEmailsAsSent(candidateIds: string[]): void {
    const candidates = this.candidatesSubject.value;
    const updatedCandidates = candidates.map(candidate => {
      if (candidateIds.includes(candidate.id) && candidate.statusHistory) {
        const history = [...candidate.statusHistory];
        const lastChange = history[history.length - 1];
        if (lastChange && !lastChange.emailSent) {
          lastChange.emailSent = true;
          lastChange.emailSentAt = new Date();
        }
        return { ...candidate, statusHistory: history };
      }
      return candidate;
    });
    
    this.candidatesSubject.next(updatedCandidates);
  }

  /**
   * Génère un token de suivi unique pour un candidat
   */
  generateTrackingToken(candidateId: string): string {
    const candidates = this.candidatesSubject.value;
    const index = candidates.findIndex(c => c.id === candidateId);
    
    if (index !== -1) {
      const token = this.generateUUID();
      candidates[index] = {
        ...candidates[index],
        trackingToken: token
      };
      this.candidatesSubject.next([...candidates]);
      return token;
    }
    
    return '';
  }

  /**
   * Récupère un candidat par son token de suivi
   */
  getCandidateByTrackingToken(token: string): Candidate | undefined {
    return this.candidatesSubject.value.find(c => c.trackingToken === token);
  }

  /**
   * Génère un ID unique
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Génère un UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  addNote(candidateId: string, note: any): void {
    const candidates = this.candidatesSubject.value;
    const index = candidates.findIndex(c => c.id === candidateId);
    
    if (index !== -1) {
      const candidate = candidates[index];
      candidate.notes = [...(candidate.notes || []), note];
      this.candidatesSubject.next([...candidates]);
    }
  }

  private loadDemoData(): void {
    const demoData: Candidate[] = [
      {
        id: '1',
        firstName: 'Sophie',
        lastName: 'Martin',
        email: 'sophie.martin@email.fr',
        phone: '+33 6 12 34 56 78',
        status: 'nouveau',
        school: 'EPITECH Paris',
        level: 'Master 2',
        expectedDegree: 'Expert en Informatique',
        expectedGraduation: 'Septembre 2024',
        location: 'Paris, France',
        availability: 'Juin 2024 - 6 mois',
        skills: [
          { name: 'React', level: 4, years: 2 },
          { name: 'TypeScript', level: 4, years: 2 },
          { name: 'Node.js', level: 3, years: 1 }
        ],
        experiences: [],
        projects: [],
        languages: [
          { name: 'Français', level: 'natif' },
          { name: 'Anglais', level: 'C1' }
        ],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '2',
        firstName: 'Thomas',
        lastName: 'Dubois',
        email: 'thomas.dubois@email.fr',
        phone: '+33 6 23 45 67 89',
        status: 'preselectionne',
        school: 'CentraleSupélec',
        level: 'Master 1',
        expectedDegree: 'Ingénieur Généraliste',
        expectedGraduation: 'Septembre 2025',
        location: 'Lyon, France',
        availability: 'Juillet 2024 - 4 mois',
        skills: [
          { name: 'Python', level: 5, years: 3 },
          { name: 'Django', level: 4, years: 2 },
          { name: 'PostgreSQL', level: 3, years: 1 }
        ],
        experiences: [],
        projects: [],
        languages: [
          { name: 'Français', level: 'natif' },
          { name: 'Anglais', level: 'B2' }
        ],
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-12')
      }
    ];

    this.candidatesSubject.next(demoData);
  }
}
