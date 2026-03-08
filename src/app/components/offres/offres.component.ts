import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfferService } from '../../services/offer.service';
import { Offer } from '../../models';

@Component({
  selector: 'app-offres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="offres-page">
      <div class="page-header">
        <div>
          <h1>Offres de stage</h1>
          <p class="text-muted">Gérez vos offres et suivez leur performance</p>
        </div>
        <button class="btn btn-primary" (click)="openModal()">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
          </svg>
          Créer une offre
        </button>
      </div>

      <!-- Filters -->
      <div class="card mb-lg">
        <div class="filters-grid">
          <input type="search" placeholder="Rechercher une offre..." class="search-input">
          <select>
            <option>Tous les départements</option>
            <option>Engineering</option>
            <option>Data Science</option>
            <option>Marketing</option>
          </select>
          <select>
            <option>Tous les statuts</option>
            <option value="publiee">Publiée</option>
            <option value="brouillon">Brouillon</option>
            <option value="archivee">Archivée</option>
          </select>
        </div>
      </div>

      <!-- Offers Grid -->
      <div class="grid-3">
        <div *ngFor="let offer of offers" class="card offer-card">
          <div class="offer-header">
            <h3 class="offer-title">{{ offer.title }}</h3>
            <span class="badge badge-success" *ngIf="offer.status === 'publiee'">Publiée</span>
            <span class="badge badge-gray" *ngIf="offer.status === 'brouillon'">Brouillon</span>
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
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
              </svg>
              {{ offer.duration }}
            </div>
          </div>

          <p class="offer-description">{{ offer.description }}</p>

          <div class="offer-stats">
            <div class="stat">
              <div class="stat-value">{{ offer.applicationsCount }}</div>
              <div class="stat-label">Candidatures</div>
            </div>
            <div class="stat">
              <div class="stat-value">{{ offer.viewsCount }}</div>
              <div class="stat-label">Vues</div>
            </div>
          </div>

          <div class="offer-actions">
            <button class="btn btn-secondary btn-sm">Modifier</button>
            <button class="btn btn-primary btn-sm">Voir candidats</button>
          </div>
        </div>
      </div>

      <!-- Create Modal -->
      <div class="modal" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Créer une offre de stage</h2>
            <button class="close-btn" (click)="closeModal()">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>Titre du poste *</label>
              <input type="text" [(ngModel)]="newOffer.title" placeholder="Ex: Stage Développeur Full-Stack">
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label>Département *</label>
                <select [(ngModel)]="newOffer.department">
                  <option value="">Sélectionner...</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div class="form-group">
                <label>Localisation *</label>
                <input type="text" [(ngModel)]="newOffer.location" placeholder="Paris, Lyon...">
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label>Durée *</label>
                <input type="text" [(ngModel)]="newOffer.duration" placeholder="6 mois">
              </div>

              <div class="form-group">
                <label>Date de début *</label>
                <input type="date" [(ngModel)]="newOffer.startDate">
              </div>
            </div>

            <div class="form-group">
              <label>Description *</label>
              <textarea [(ngModel)]="newOffer.description" placeholder="Décrivez le poste..."></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Annuler</button>
            <button class="btn btn-primary" (click)="createOffer()">Créer l'offre</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .offres-page {
      max-width: 1400px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-xl);
    }

    .page-header h1 {
      margin-bottom: var(--spacing-xs);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: var(--spacing-md);
    }

    .search-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-md);
    }

    /* Offer Cards */
    .offer-card {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .offer-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--spacing-md);
    }

    .offer-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--gray-900);
      margin: 0;
      flex: 1;
    }

    .offer-meta {
      display: flex;
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
      line-height: 1.5;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }

    .offer-stats {
      display: flex;
      gap: var(--spacing-lg);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--gray-200);
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--gray-900);
    }

    .stat-label {
      font-size: 12px;
      color: var(--gray-500);
      margin-top: 4px;
    }

    .offer-actions {
      display: flex;
      gap: var(--spacing-sm);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--gray-200);
    }

    /* Modal */
    .modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-content {
      background: white;
      border-radius: var(--radius-lg);
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 24px;
      border-bottom: 1px solid var(--gray-200);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 20px;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--gray-400);
      padding: 4px;
    }

    .modal-body {
      padding: 24px;
      overflow-y: auto;
    }

    .modal-footer {
      padding: 24px;
      border-top: 1px solid var(--gray-200);
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
    }

    @media (max-width: 768px) {
      .filters-grid {
        grid-template-columns: 1fr;
      }

      .page-header {
        flex-direction: column;
        gap: var(--spacing-md);
      }
    }
  `]
})
export class OffresComponent implements OnInit {
  offers: Offer[] = [];
  showModal = false;
  newOffer: any = {
    title: '',
    department: '',
    location: '',
    type: 'stage',
    duration: '',
    startDate: '',
    description: '',
    requirements: [],
    benefits: [],
    status: 'publiee',
    matchingCriteria: {
      requiredSkills: [],
      preferredSkills: [],
      experienceYears: 0,
      educationLevel: ['Master 1', 'Master 2'],
      weights: {
        skills: 40,
        experience: 20,
        education: 20,
        projects: 20
      }
    }
  };

  constructor(private offerService: OfferService) {}

  ngOnInit(): void {
    this.offerService.getOffers().subscribe(offers => {
      this.offers = offers;
    });
  }

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  createOffer(): void {
    if (this.newOffer.title && this.newOffer.department && this.newOffer.location) {
      this.offerService.createOffer(this.newOffer);
      this.closeModal();
    }
  }

  resetForm(): void {
    this.newOffer = {
      title: '',
      department: '',
      location: '',
      type: 'stage',
      duration: '',
      startDate: '',
      description: '',
      requirements: [],
      benefits: [],
      status: 'publiee',
      matchingCriteria: {
        requiredSkills: [],
        preferredSkills: [],
        experienceYears: 0,
        educationLevel: ['Master 1', 'Master 2'],
        weights: {
          skills: 40,
          experience: 20,
          education: 20,
          projects: 20
        }
      }
    };
  }
}
