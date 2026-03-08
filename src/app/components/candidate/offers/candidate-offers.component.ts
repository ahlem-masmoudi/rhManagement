import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfferService } from '../../../services/offer.service';
import { MatchingService } from '../../../services/matching.service';
import { AuthService } from '../../../services/auth.service';
import { Offer } from '../../../models';

@Component({
  selector: 'app-candidate-offers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="candidate-offers-page">
      <div class="page-header">
        <div>
          <h1>Offres de stage disponibles</h1>
          <p class="text-muted">Trouvez le stage qui correspond à votre profil</p>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="card filters-section mb-lg">
        <div class="search-row">
          <div class="search-box">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
            </svg>
            <input 
              type="search" 
              [(ngModel)]="searchQuery" 
              (input)="applyFilters()"
              placeholder="Rechercher par titre, département, localisation...">
          </div>
        </div>

        <div class="filters-row">
          <div class="filter-group">
            <label>Département</label>
            <select [(ngModel)]="selectedDepartment" (change)="applyFilters()">
              <option value="">Tous</option>
              <option *ngFor="let dept of departments" [value]="dept">{{ dept }}</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Localisation</label>
            <select [(ngModel)]="selectedLocation" (change)="applyFilters()">
              <option value="">Toutes</option>
              <option *ngFor="let loc of locations" [value]="loc">{{ loc }}</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Durée</label>
            <select [(ngModel)]="selectedDuration" (change)="applyFilters()">
              <option value="">Toutes</option>
              <option value="3">3 mois</option>
              <option value="4">4 mois</option>
              <option value="6">6 mois</option>
            </select>
          </div>

          <button class="btn btn-secondary" (click)="resetFilters()">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
            </svg>
            Réinitialiser
          </button>
        </div>
      </div>

      <!-- Results Count -->
      <div class="results-header">
        <p class="results-count">{{ filteredOffers.length }} offre(s) trouvée(s)</p>
      </div>

      <!-- Offers List -->
      <div class="offers-grid">
        <div *ngFor="let offer of filteredOffers" class="offer-card card">
          <div class="offer-header">
            <h3>{{ offer.title }}</h3>
            <span class="badge badge-success">Nouveau</span>
          </div>

          <div class="offer-company">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/>
            </svg>
            <span>{{ offer.department }}</span>
          </div>

          <div class="offer-meta">
            <div class="meta-item">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
              </svg>
              {{ offer.location }}
            </div>
            <div class="meta-item">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
              </svg>
              {{ offer.duration }}
            </div>
            <div class="meta-item">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
              </svg>
              Dès le {{ formatDate(offer.startDate) }}
            </div>
          </div>

          <p class="offer-description">{{ offer.description }}</p>

          <div class="offer-skills">
            <span *ngFor="let req of offer.requirements.slice(0, 4)" class="skill-tag">
              {{ req }}
            </span>
            <span *ngIf="offer.requirements.length > 4" class="more-skills">
              +{{ offer.requirements.length - 4 }}
            </span>
          </div>

          <div class="offer-footer">
            <div class="offer-stats">
              <span class="stat-item">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
                {{ offer.applicationsCount }} candidatures
              </span>
            </div>
            <button 
              class="btn btn-primary btn-sm"
              (click)="applyToOffer(offer)"
              [disabled]="hasApplied(offer.id)">
              {{ hasApplied(offer.id) ? 'Déjà postulé' : 'Postuler' }}
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredOffers.length === 0" class="empty-state">
          <svg width="64" height="64" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
          </svg>
          <h3>Aucune offre trouvée</h3>
          <p>Essayez de modifier vos critères de recherche</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .candidate-offers-page {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: var(--spacing-xl);
    }

    .page-header h1 {
      margin-bottom: var(--spacing-xs);
    }

    /* Filters */
    .filters-section {
      padding: var(--spacing-lg);
    }

    .search-row {
      margin-bottom: var(--spacing-md);
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-box svg {
      position: absolute;
      left: 16px;
      color: var(--gray-400);
      pointer-events: none;
    }

    .search-box input {
      width: 100%;
      padding: 12px 16px 12px 48px;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-md);
      font-size: 15px;
    }

    .filters-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--spacing-md);
      align-items: end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .filter-group label {
      font-size: 13px;
      font-weight: 600;
      color: var(--gray-700);
    }

    .filter-group select {
      padding: 10px 12px;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-md);
      font-size: 14px;
    }

    /* Results */
    .results-header {
      margin-bottom: var(--spacing-md);
    }

    .results-count {
      font-size: 14px;
      color: var(--gray-600);
      margin: 0;
    }

    /* Offers Grid */
    .offers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: var(--spacing-lg);
    }

    .offer-card {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      transition: all 0.2s;
      cursor: pointer;
    }

    .offer-card:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }

    .offer-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--spacing-md);
    }

    .offer-header h3 {
      font-size: 16px;
      margin: 0;
      flex: 1;
      line-height: 1.4;
    }

    .offer-company {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: var(--gray-700);
      padding: 8px 12px;
      background: var(--gray-50);
      border-radius: var(--radius-md);
    }

    .offer-meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-md);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--gray-500);
    }

    .offer-description {
      font-size: 14px;
      color: var(--gray-600);
      line-height: 1.6;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }

    .offer-skills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .skill-tag {
      background: #EEF2FF;
      color: var(--primary-color);
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 500;
    }

    .more-skills {
      background: var(--gray-100);
      color: var(--gray-600);
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 500;
    }

    .offer-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--gray-200);
      margin-top: auto;
    }

    .offer-stats {
      display: flex;
      gap: var(--spacing-md);
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--gray-500);
    }

    /* Empty State */
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: var(--spacing-xl) 0;
    }

    .empty-state svg {
      color: var(--gray-300);
      margin-bottom: var(--spacing-md);
    }

    .empty-state h3 {
      color: var(--gray-900);
      margin-bottom: var(--spacing-sm);
    }

    .empty-state p {
      color: var(--gray-500);
      margin: 0;
    }

    @media (max-width: 768px) {
      .offers-grid {
        grid-template-columns: 1fr;
      }

      .filters-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CandidateOffersComponent implements OnInit {
  offers: Offer[] = [];
  filteredOffers: Offer[] = [];
  appliedOffers: Set<string> = new Set();
  
  searchQuery = '';
  selectedDepartment = '';
  selectedLocation = '';
  selectedDuration = '';

  departments: string[] = [];
  locations: string[] = [];

  constructor(
    private offerService: OfferService,
    private matchingService: MatchingService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.offerService.getOffers().subscribe(offers => {
      this.offers = offers.filter(o => o.status === 'publiee');
      this.filteredOffers = this.offers;
      
      // Extract unique departments and locations
      this.departments = [...new Set(offers.map(o => o.department))];
      this.locations = [...new Set(offers.map(o => o.location))];
    });

    // Load user's applications
    const user = this.authService.getCurrentUser();
    if (user) {
      this.matchingService.getApplications().subscribe(apps => {
        apps.forEach(app => {
          if (app.candidateId === user.id) {
            this.appliedOffers.add(app.offerId);
          }
        });
      });
    }
  }

  applyFilters(): void {
    this.filteredOffers = this.offers.filter(offer => {
      const matchesSearch = !this.searchQuery || 
        offer.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        offer.department.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        offer.location.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesDepartment = !this.selectedDepartment || 
        offer.department === this.selectedDepartment;

      const matchesLocation = !this.selectedLocation || 
        offer.location === this.selectedLocation;

      const matchesDuration = !this.selectedDuration || 
        offer.duration.includes(this.selectedDuration);

      return matchesSearch && matchesDepartment && matchesLocation && matchesDuration;
    });
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedDepartment = '';
    this.selectedLocation = '';
    this.selectedDuration = '';
    this.applyFilters();
  }

  hasApplied(offerId: string): boolean {
    return this.appliedOffers.has(offerId);
  }

  applyToOffer(offer: Offer): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    // Create application
    const application = {
      id: Date.now().toString(),
      candidateId: user.id,
      offerId: offer.id,
      status: 'nouveau' as const,
      appliedAt: new Date()
    };

    this.appliedOffers.add(offer.id);
    
    // Show success message (you could add a notification service)
    alert(`Votre candidature pour "${offer.title}" a été envoyée avec succès !`);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }
}
