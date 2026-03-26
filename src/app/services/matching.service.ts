import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Application, MatchingScore, MatchingExplanation } from '../models';
import { CandidateService } from './candidate.service';
import { OfferService } from './offer.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MatchingService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private applicationsSubject = new BehaviorSubject<Application[]>([]);
  public applications$: Observable<Application[]> = this.applicationsSubject.asObservable();

  constructor(
    private candidateService: CandidateService,
    private offerService: OfferService
  ) {
    // Load applications if user is recruiter
    this.loadApplicationsIfRecruiter();
  }

  // Get auth headers with token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Load applications from backend if user is recruiter
  private loadApplicationsIfRecruiter(): void {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (user && user.role === 'recruiter') {
      this.loadApplications();
    }
  }

  // Load all applications from backend
  private loadApplications(): void {
    console.log('Loading applications from backend...');
    this.http.get<{ success: boolean; data: any[] }>(
      `${this.apiUrl}/applications`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        console.log('Applications loaded:', response);
        return response.data;
      }),
      catchError(error => {
        console.error('Error loading applications:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.error);
        return of([]);
      })
    ).subscribe(applications => {
      console.log('Setting applications:', applications);
      this.applicationsSubject.next(applications);
    });
  }

  // Get all applications
  getApplications(): Observable<Application[]> {
    this.loadApplications();
    return this.applications$;
  }

  // Get candidate's own applications
  getMyApplications(): Observable<any[]> {
    return this.http.get<{ success: boolean; data: any[] }>(
      `${this.apiUrl}/applications/my`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error loading my applications:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to load applications'));
      })
    );
  }

  getApplicationsByOffer(offerId: string): Observable<Application[]> {
    return this.applications$.pipe(
      map(apps => apps.filter(a => a.offerId === offerId))
    );
  }

  calculateMatchingScore(candidateId: string, offerId: string): MatchingScore {
    const candidate = this.candidateService.getCandidateById(candidateId);
    const offer = this.offerService.getOfferById(offerId);

    if (!candidate || !offer) {
      return {
        global: 0,
        semantic: 0,
        rules: 0,
        explanations: {
          strengths: [],
          weaknesses: [],
          recommendations: []
        }
      };
    }

    // Calculate skills match
    const candidateSkills = new Set(candidate.skills.map(s => s.name.toLowerCase()));
    const requiredSkills = offer.matchingCriteria.requiredSkills.map(s => s.name.toLowerCase());
    const matchedSkills = requiredSkills.filter(s => candidateSkills.has(s));
    const skillsScore = (matchedSkills.length / requiredSkills.length) * 100;

    // Calculate experience match
    const totalExperienceYears = candidate.experiences.reduce((sum, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return sum + years;
    }, 0);
    const experienceScore = Math.min((totalExperienceYears / offer.matchingCriteria.experienceYears) * 100, 100);

    // Calculate education match
    const educationScore = offer.matchingCriteria.educationLevel.includes(candidate.level) ? 100 : 50;

    // Calculate projects score
    const projectsScore = Math.min((candidate.projects.length / 3) * 100, 100);

    // Apply weights
    const weights = offer.matchingCriteria.weights;
    const rulesScore = (
      (skillsScore * weights.skills / 100) +
      (experienceScore * weights.experience / 100) +
      (educationScore * weights.education / 100) +
      (projectsScore * weights.projects / 100)
    );

    // Simulate semantic score (would use embeddings in production)
    const semanticScore = rulesScore + (Math.random() * 10 - 5);

    const globalScore = (rulesScore * 0.6) + (semanticScore * 0.4);

    const explanations = this.generateExplanations(
      candidate,
      offer,
      matchedSkills,
      requiredSkills,
      totalExperienceYears
    );

    return {
      global: Math.round(globalScore),
      semantic: Math.round(semanticScore),
      rules: Math.round(rulesScore),
      explanations
    };
  }

  private generateExplanations(
    candidate: any,
    offer: any,
    matchedSkills: string[],
    requiredSkills: string[],
    totalExperienceYears: number
  ): MatchingExplanation {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Skills analysis
    if (matchedSkills.length > 0) {
      strengths.push(`Maîtrise de ${matchedSkills.length}/${requiredSkills.length} compétences requises`);
    }
    
    const missingSkills = requiredSkills.filter(s => !matchedSkills.includes(s));
    if (missingSkills.length > 0) {
      weaknesses.push(`Compétences manquantes: ${missingSkills.join(', ')}`);
      recommendations.push(`Développer des compétences en ${missingSkills.slice(0, 2).join(' et ')}`);
    }

    // Experience analysis
    if (totalExperienceYears >= offer.matchingCriteria.experienceYears) {
      strengths.push(`${Math.round(totalExperienceYears)} années d'expérience pertinente`);
    } else {
      weaknesses.push('Expérience professionnelle limitée');
      recommendations.push('Mettre en avant les projets académiques et personnels');
    }

    // Education analysis
    if (offer.matchingCriteria.educationLevel.includes(candidate.level)) {
      strengths.push(`Formation ${candidate.level} en adéquation`);
    }

    // Projects analysis
    if (candidate.projects.length > 0) {
      strengths.push(`${candidate.projects.length} projets techniques réalisés`);
    }

    return { strengths, weaknesses, recommendations };
  }
}
