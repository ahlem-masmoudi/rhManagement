import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Candidate, CandidateStatus, StatusChange, BulkStatusChange, StatusChangeEmail } from '../models';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CandidateService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private candidatesSubject = new BehaviorSubject<Candidate[]>([]);
  public candidates$: Observable<Candidate[]> = this.candidatesSubject.asObservable();

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    // Only recruiters/admins should eagerly load the full candidates list.
    const token = localStorage.getItem('authToken');
    const user = this.authService.getCurrentUser();
    const rhRoles = ['recruiter', 'admin', 'rh_offres', 'rh_candidatures'];
    if (token && user?.role && rhRoles.includes(user.role)) {
      this.loadCandidates();
    } else {
      this.candidatesSubject.next([]);
    }
  }

  // Get auth headers with token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Load candidates from backend
  private loadCandidates(): void {
    this.http.get<{ success: boolean; data: any[] }>(
      `${this.apiUrl}/candidates`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        // Transform backend data to frontend format
        return response.data.map((candidate: any) => ({
          id: candidate._id,
          firstName: candidate.userId?.firstName || '',
          lastName: candidate.userId?.lastName || '',
          email: candidate.userId?.email || '',
          phone: candidate.phone || '',
          avatar: undefined,
          status: 'nouveau' as CandidateStatus,
          school: candidate.school || '',
          level: candidate.educationLevel || '',
          expectedDegree: candidate.expectedDegree || '',
          expectedGraduation: candidate.expectedGraduation || '',
          location: candidate.location || '',
          availability: candidate.availability || '',
          skills: (candidate.skills || []).map((skill: string) => ({ 
            name: skill, 
            level: 'intermediate'  
          })),
          experiences: [],
          projects: [],
          languages: [],
          createdAt: candidate.createdAt,
          updatedAt: candidate.updatedAt
        }));
      }),
      catchError(error => {
        console.error('Error loading candidates:', error);
        return of([]);
      })
    ).subscribe(candidates => {
      console.log('Candidates loaded:', candidates);
      this.candidatesSubject.next(candidates);
    });
  }

  getCandidates(): Observable<Candidate[]> {
    return this.candidates$;
  }

  // Get current candidate profile
  getProfile(): Observable<any> {
    return this.http.get<{ success: boolean; data: any }>(
      `${this.apiUrl}/candidates/profile`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error loading profile:', error);
        throw error;
      })
    );
  }

  // Update candidate profile
  updateProfile(profileData: any): Observable<any> {
    return this.http.put<{ success: boolean; data: any }>(
      `${this.apiUrl}/candidates/profile`,
      profileData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error updating profile:', error);
        throw error;
      })
    );
  }

  getCandidateById(id: string): Candidate | undefined {
    return this.candidatesSubject.value.find(c => c.id === id);
  }

  // Fetch full candidate record from backend (includes documents)
  getCandidateFull(id: string) {
    return this.http.get<{ success: boolean; data: any }>(
      `${this.apiUrl}/candidates/${id}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error loading candidate full:', error);
        throw error;
      })
    );
  }

  getTrackingCandidate(token: string) {
    return this.http.get<{ success: boolean; data: any }>(
      `${this.apiUrl}/candidates/tracking/${token}`
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error loading tracking candidate:', error);
        throw error;
      })
    );
  }

  // Download a specific document for a candidate
  downloadDocument(candidateId: string, docId: string) {
    return this.http.get<{ success: boolean; data: any }>(
      `${this.apiUrl}/candidates/${candidateId}/documents/${docId}/download`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error downloading document:', error);
        throw error;
      })
    );
  }

  deleteDocument(candidateId: string, docId: string) {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/candidates/${candidateId}/documents/${docId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Get CV from the candidate's latest application (fallback when not in candidate.documents)
  getCandidateResume(candidateId: string) {
    return this.http.get<{ success: boolean; data: { name: string; content: string } }>(
      `${this.apiUrl}/candidates/${candidateId}/resume`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching candidate resume:', error);
        throw error;
      })
    );
  }

  uploadTrackingDocument(token: string, payload: { name: string; content: string; type: string }) {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/candidates/tracking/${token}/documents`,
      payload
    ).pipe(
      catchError(error => { throw error.error?.message || 'Erreur lors du dépôt'; })
    );
  }

  downloadTrackingDocument(token: string, docId: string) {
    return this.http.get<{ success: boolean; data: any }>(
      `${this.apiUrl}/candidates/tracking/${token}/documents/${docId}/download`
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error downloading tracking document:', error);
        throw error;
      })
    );
  }

  uploadCandidateDocument(candidateId: string, payload: any) {
    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/candidates/${candidateId}/documents`,
      payload,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error uploading candidate document:', error);
        throw error;
      })
    );
  }

  generateSignedInternshipRequest(candidateId: string, docId: string, payload: any) {
    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/candidates/${candidateId}/documents/${docId}/sign-request`,
      payload,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error generating signed internship request:', error);
        throw error;
      })
    );
  }

  generateAssignmentLetter(candidateId: string, payload: any) {
    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/candidates/${candidateId}/documents/generate-assignment-letter`,
      payload,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error generating assignment letter:', error);
        throw error;
      })
    );
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
  bulkUpdateStatus(bulkChange: BulkStatusChange): Observable<{ success: number; failed: number; emailsSent?: number }> {
    // Call backend API to perform bulk update (persistence + email sending)
    const payload: any = {
      candidateIds: bulkChange.candidateIds,
      newStatus: bulkChange.newStatus,
      comment: bulkChange.comment,
      sendEmail: bulkChange.sendEmail
    };

    return this.http.post<{ success: boolean; data: { success: number; failed: number; emailsSent?: number } }>(
      `${this.apiUrl}/candidates/bulk-status`,
      payload,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        // Refresh candidates from backend
        this.loadCandidates();
        // Include emailsSent if backend provides it
        return { success: response.data.success, failed: response.data.failed, emailsSent: response.data.emailsSent || 0 };
      }),
      catchError(error => {
        console.error('Error performing bulk status update:', error);
        return of({ success: 0, failed: bulkChange.candidateIds.length, emailsSent: 0 });
      })
    );
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

  generateTrackingLink(candidateId: string): Observable<string> {
    return this.http.post<{ success: boolean; data: { token: string } }>(
      `${this.apiUrl}/candidates/${candidateId}/generate-tracking`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(r => r.data.token),
      catchError(error => { throw error; })
    );
  }

  updateSingleStatus(candidateId: string, newStatus: CandidateStatus, comment?: string): Observable<any> {
    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/candidates/bulk-status`,
      { candidateIds: [candidateId], newStatus, comment, sendEmail: false },
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(error => { throw error; })
    );
  }

  saveRecruiterNotes(candidateId: string, notes: string): Observable<any> {
    return this.http.put<{ success: boolean; data: any }>(
      `${this.apiUrl}/candidates/${candidateId}/notes`,
      { notes },
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(error => { throw error; })
    );
  }

  // ── Interview scheduling ────────────────────────────────────────────────────
  getBookedSlots(): Observable<{ date: string; time: string }[]> {
    return this.http.get<{ success: boolean; data: any[] }>(
      `${this.apiUrl}/applications/booked-slots`,
      { headers: this.getAuthHeaders() }
    ).pipe(map(r => r.data || []), catchError(err => { throw err; }));
  }

  scheduleInterview(applicationId: string, payload: { interviewDate: string; interviewTime: string; interviewNotes?: string }): Observable<any> {
    return this.http.patch<{ success: boolean; data: any }>(
      `${this.apiUrl}/applications/${applicationId}/interview`,
      payload,
      { headers: this.getAuthHeaders() }
    ).pipe(map(r => r.data), catchError(err => { throw err; }));
  }

  // ── Post-internship evaluation ──────────────────────────────────────────────
  evaluateApplication(applicationId: string, payload: { rating: string; outcome: string; comment: string }): Observable<any> {
    return this.http.patch<{ success: boolean; data: any }>(
      `${this.apiUrl}/applications/${applicationId}/evaluate`,
      payload,
      { headers: this.getAuthHeaders() }
    ).pipe(map(r => r.data), catchError(err => { throw err; }));
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

}
