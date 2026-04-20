import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Offer, OfferStatus } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OfferService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private offersSubject = new BehaviorSubject<Offer[]>([]);
  public offers$: Observable<Offer[]> = this.offersSubject.asObservable();

  constructor() {
    this.loadOffers();
  }

  // Get auth headers with token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Load offers from backend
  private loadOffers(): void {
    this.http.get<{ success: boolean; data: any[] }>(
      `${this.apiUrl}/offers`
    ).pipe(
      map(response => this.mapOffersFromBackend(response.data)),
      catchError(error => {
        console.error('Error loading offers:', error);
        return [];
      })
    ).subscribe(offers => {
      this.offersSubject.next(offers);
    });
  }

  // Map backend offer data to frontend format
  private mapOffersFromBackend(offers: any[]): any[] {
    return offers.map(offer => ({
      ...offer,
      id: offer._id || offer.id,
      department: offer.department,  // ✅ CORRIGÉ !
      status: this.mapBackendStatus(offer.status),
      applicationsCount: offer.applicationsCount || 0,
      viewsCount: offer.viewsCount || 0,
      matchingCriteria: {
        requiredSkills: offer.skills?.map((name: string) => ({ name, level: 3 })) || [],
        preferredSkills: [],
        experienceYears: 0,
        educationLevel: ['Master 1', 'Master 2'],
        weights: { skills: 40, experience: 20, education: 20, projects: 20 }
      }
    }));
  }

  // Map backend status to frontend status
  private mapBackendStatus(status: string): string {
    const statusMap: any = {
      'active': 'publiee',
      'draft': 'brouillon',
      'closed': 'archivee'
    };
    return statusMap[status] || status;
  }

  // Map frontend status to backend status
  private mapFrontendStatus(status: string): string {
    const statusMap: any = {
      'publiee': 'active',
      'brouillon': 'draft',
      'archivee': 'closed'
    };
    return statusMap[status] || status;
  }

  getOffers(): Observable<Offer[]> {
    // Refresh from backend
    this.loadOffers();
    return this.offers$;
  }

  getRecommendedOffers(): Observable<{ offers: Offer[]; candidateSkillsCount: number }> {
    return this.http.get<{ success: boolean; data: any[]; candidateSkills: string[] }>(
      `${this.apiUrl}/offers/recommended`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => ({
        offers: this.mapOffersFromBackend(response.data),
        candidateSkillsCount: (response.candidateSkills || []).length
      })),
      catchError(error => {
        console.error('Error loading recommended offers:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to load recommended offers'));
      })
    );
  }

  getOfferById(id: string): Offer | undefined {
    return this.offersSubject.value.find(o => o.id === id);
  }

  createOffer(offer: any): Observable<Offer> {
    // Map frontend fields to backend schema
    const offerData = {
      title: offer.title,
      department: offer.department,  // ✅ CORRIGÉ !
      company: 'INET',  // Entreprise fixe
      location: offer.location,
      type: offer.type,
      duration: offer.duration,
      description: offer.description,
      requirements: offer.requirements || [],
      skills: offer.matchingCriteria?.requiredSkills?.map((s: any) => s.name) || [],
      status: this.mapFrontendStatus(offer.status)
    };

    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/offers`,
      offerData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => this.mapOffersFromBackend([response.data])[0]),
      tap(newOffer => {
        this.offersSubject.next([...this.offersSubject.value, newOffer]);
      }),
      catchError(error => {
        console.error('Error creating offer:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to create offer'));
      })
    );
  }

  updateOffer(id: string, updates: any): Observable<Offer> {
    // Map frontend fields to backend schema
    const offerData: any = {};
    if (updates.title) offerData.title = updates.title;
    if (updates.department) offerData.department = updates.department;  // ✅ CORRIGÉ !
    if (updates.location) offerData.location = updates.location;
    if (updates.type) offerData.type = updates.type;
    if (updates.duration) offerData.duration = updates.duration;
    if (updates.description) offerData.description = updates.description;
    if (updates.requirements) offerData.requirements = updates.requirements;
    if (updates.status) offerData.status = this.mapFrontendStatus(updates.status);
    if (updates.matchingCriteria?.requiredSkills) {
      offerData.skills = updates.matchingCriteria.requiredSkills.map((s: any) => s.name);
    }

    return this.http.put<{ success: boolean; data: any }>(
      `${this.apiUrl}/offers/${id}`,
      offerData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => this.mapOffersFromBackend([response.data])[0]),
      tap(updatedOffer => {
        const offers = this.offersSubject.value;
        const index = offers.findIndex(o => o.id === id);
        if (index !== -1) {
          offers[index] = updatedOffer;
          this.offersSubject.next([...offers]);
        }
      }),
      catchError(error => {
        console.error('Error updating offer:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to update offer'));
      })
    );
  }

  deleteOffer(id: string): Observable<void> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/offers/${id}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(() => {
        const offers = this.offersSubject.value.filter(o => o.id !== id);
        this.offersSubject.next(offers);
      }),
      map(() => void 0),
      catchError(error => {
        console.error('Error deleting offer:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to delete offer'));
      })
    );
  }

  applyToOffer(offerId: string, payload: { cvBase64?: string; cvName?: string; coverLetter?: string } = {}): Observable<any> {
    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/offers/${offerId}/apply`,
      payload,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error applying to offer:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to apply to offer'));
      })
    );
  }
}
