import { Component, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
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
          <input type="search" placeholder="Rechercher une offre..." class="search-input" [(ngModel)]="searchTerm" (input)="filterOffers()">
          <select [(ngModel)]="selectedDepartment" (change)="filterOffers()">
            <option value="">Tous les départements</option>
            <option value="Consulting ERP">Consulting ERP</option>
            <option value="Système management Qualité">Système management Qualité</option>
            <option value="Intelligence artificielle">Intelligence artificielle</option>
            <option value="Data Analytics / Business Intelligence">Data Analytics / Business Intelligence</option>
            <option value="Développement informatique">Développement informatique</option>
            <option value="Marketing & Commercial">Marketing & Commercial</option>
          </select>
          <select [(ngModel)]="selectedStatus" (change)="filterOffers()">
            <option value="">Tous les statuts</option>
            <option value="published">Publiée</option>
            <option value="draft">Brouillon</option>
            <option value="closed">Fermée</option>
          </select>
        </div>
      </div>

      <!-- Offers Grid -->
      <div *ngIf="offers.length === 0" class="card">
        <p style="text-align: center; padding: 40px; color: #666;">
          Aucune offre ne correspond à vos critères de recherche.
        </p>
      </div>
      
      <div class="grid-3">
        <div *ngFor="let offer of offers" class="card offer-card">
          <div class="offer-header">
            <h3 class="offer-title">{{ offer.title }}</h3>
            <span class="badge badge-success" *ngIf="offer.status === 'publiee' || offer.status === 'published'">Publiée</span>
            <span class="badge badge-gray" *ngIf="offer.status === 'brouillon' || offer.status === 'draft'">Brouillon</span>
            <span class="badge badge-warning" *ngIf="offer.status === 'archivee' || offer.status === 'closed'">Fermée</span>
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
          
          <div class="meta-item" style="margin-top: 8px; color: #4F46E5; font-weight: 500;">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style="margin-right: 4px;">
              <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
            </svg>
            {{ offer.department }}
          </div>

          <p class="offer-description" [class.expanded]="expandedOffers.has(offer.id)" #descEl>{{ offer.description }}</p>
          <button class="desc-toggle" *ngIf="truncatedOffers.has(offer.id)" (click)="toggleDesc(offer.id)">
            {{ expandedOffers.has(offer.id) ? 'Voir moins ▲' : 'Voir plus ▼' }}
          </button>

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
            <button class="btn btn-secondary btn-sm" (click)="openEditModal(offer)">Modifier</button>
            <button class="btn btn-danger btn-sm" (click)="deleteOffer(offer.id)">Supprimer</button>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div class="modal" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingOffer ? 'Modifier' : 'Créer' }} une offre de stage</h2>
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
                  <option value="Consulting ERP">Consulting ERP</option>
                  <option value="Système management Qualité">Système management Qualité</option>
                  <option value="Intelligence artificielle">Intelligence artificielle</option>
                  <option value="Data Analytics / Business Intelligence">Data Analytics / Business Intelligence</option>
                  <option value="Développement informatique">Développement informatique</option>
                  <option value="Marketing & Commercial">Marketing & Commercial</option>
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

            <div class="form-group">
              <label>Compétences requises</label>
              <div class="skills-input">
                <input
                  type="text"
                  [(ngModel)]="newSkill"
                  name="newSkill"
                  placeholder="Ex: React, Python, Java..."
                  (keyup.enter)="addOfferSkill()">
                <button type="button" class="btn btn-secondary btn-sm" (click)="addOfferSkill()">Ajouter</button>
              </div>
              <div class="skills-list" *ngIf="newOffer.matchingCriteria.requiredSkills.length > 0">
                <span *ngFor="let skill of newOffer.matchingCriteria.requiredSkills; let i = index" class="skill-tag">
                  {{ skill.name }}
                  <button type="button" (click)="removeOfferSkill(i)" class="remove-skill">×</button>
                </span>
              </div>
              <p class="text-sm text-muted" style="margin-top:6px;font-size:12px;color:#6b7280;">Ajoutez les compétences demandées pour cette offre</p>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Annuler</button>
            <button class="btn btn-primary" (click)="saveOffer()">{{ editingOffer ? 'Sauvegarder' : 'Créer' }}</button>
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
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }
    .offer-description.expanded {
      display: block;
      -webkit-line-clamp: unset;
      overflow: visible;
    }
    .desc-toggle {
      background: none;
      border: none;
      color: #4F46E5;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      padding: 2px 0;
      margin-top: 2px;
      transition: color 0.2s;
    }
    .desc-toggle:hover { color: #3730a3; }

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

    .skills-input {
      display: flex;
      gap: 8px;
    }

    .skills-input input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-md);
      font-size: 14px;
    }

    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .skill-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: #eef2ff;
      color: #4338ca;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
    }

    .remove-skill {
      background: none;
      border: none;
      cursor: pointer;
      color: #4338ca;
      font-size: 16px;
      line-height: 1;
      padding: 0;
    }

    @media (max-width: 768px) {
      .filters-grid { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: var(--spacing-md); }
      .modal-content { max-height: 95vh; border-radius: var(--radius-md); }
      .modal-header, .modal-body, .modal-footer { padding: 16px; }
      .offer-stats { flex-wrap: wrap; gap: var(--spacing-md); }
      .offer-actions { flex-wrap: wrap; }
    }

    @media (max-width: 480px) {
      .modal { padding: 8px; }
      .modal-footer { flex-direction: column; }
      .modal-footer button { width: 100%; justify-content: center; }
      .skills-input { flex-direction: column; }
      .skills-input input { width: 100%; }
      .offer-meta { flex-wrap: wrap; gap: 8px; }
    }
  `]
})
export class OffresComponent implements OnInit {
  @ViewChildren('descEl') descEls!: QueryList<ElementRef>;
  offers: Offer[] = [];
  allOffers: Offer[] = [];
  expandedOffers = new Set<string>();
  truncatedOffers = new Set<string>();
  showModal = false;
  editingOffer: Offer | null = null;
  
  // Filtres
  searchTerm: string = '';
  selectedDepartment: string = '';
  selectedStatus: string = '';
  
  newSkill = '';

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
    this.loadOffers();
  }

  loadOffers(): void {
    this.offerService.getOffers().subscribe(offers => {
      console.log('📦 Offres reçues du backend:', offers);
      console.log('📊 Nombre total d\'offres:', offers.length);
      if (offers.length > 0) {
        console.log('🔍 Premier département:', offers[0].department);
        console.log('🔍 Premier statut:', offers[0].status);
      }
      this.allOffers = offers;
      this.offers = offers;
      this.filterOffers();
    });
  }

  toggleDesc(id: string): void {
    if (this.expandedOffers.has(id)) this.expandedOffers.delete(id);
    else this.expandedOffers.add(id);
  }

  private detectTruncation(): void {
    setTimeout(() => {
      this.descEls.forEach((el, i) => {
        const native = el.nativeElement as HTMLElement;
        const id = this.offers[i]?.id;
        if (!id) return;
        // Si déjà étendu, on sait qu'il était tronqué
        if (this.expandedOffers.has(id)) {
          this.truncatedOffers.add(id);
        } else if (native.scrollHeight > native.clientHeight + 1) {
          this.truncatedOffers.add(id);
        }
      });
    }, 50);
  }

  filterOffers(): void {
    let filtered = [...this.allOffers];

    console.log('🔍 Filtrage en cours...');
    console.log('📊 Total offres avant filtre:', filtered.length);
    console.log('🏢 Département sélectionné:', this.selectedDepartment);
    console.log('📋 Statut sélectionné:', this.selectedStatus);
    console.log('🔎 Recherche:', this.searchTerm);

    // Filtre par recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(offer => 
        offer.title.toLowerCase().includes(term) ||
        offer.description.toLowerCase().includes(term) ||
        (offer.department && offer.department.toLowerCase().includes(term))
      );
      console.log('📊 Après filtre recherche:', filtered.length);
    }

    // Filtre par département
    if (this.selectedDepartment) {
      console.log('🏢 Filtrage par département:', this.selectedDepartment);
      filtered = filtered.filter(offer => {
        const match = offer.department === this.selectedDepartment;
        if (!match) {
          console.log(`❌ Rejeté: "${offer.title}" - département: "${offer.department}"`);
        }
        return match;
      });
      console.log('📊 Après filtre département:', filtered.length);
    }

    // Filtre par statut
    if (this.selectedStatus) {
      filtered = filtered.filter(offer => offer.status === this.selectedStatus);
      console.log('📊 Après filtre statut:', filtered.length);
    }

    this.offers = filtered;
    this.truncatedOffers.clear();
    this.detectTruncation();
    console.log('✅ Offres affichées:', this.offers.length);
  }

  openModal(): void {
    this.editingOffer = null;
    this.resetForm();
    this.showModal = true;
  }

  openEditModal(offer: Offer): void {
    this.editingOffer = offer;
    this.newSkill = '';
    this.newOffer = {
      title: offer.title,
      department: offer.department,
      location: offer.location,
      type: offer.type,
      duration: offer.duration,
      startDate: offer.startDate,
      description: offer.description,
      requirements: [...offer.requirements],
      benefits: offer.benefits ? [...offer.benefits] : [],
      status: offer.status,
      matchingCriteria: offer.matchingCriteria ? {
        ...offer.matchingCriteria,
        requiredSkills: [...(offer.matchingCriteria.requiredSkills || [])]
      } : {
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
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingOffer = null;
    this.resetForm();
  }

  saveOffer(): void {
    if (!this.newOffer.title || !this.newOffer.department || !this.newOffer.location) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (this.editingOffer) {
      // Update existing offer
      this.offerService.updateOffer(this.editingOffer.id, this.newOffer).subscribe({
        next: (offer) => {
          console.log('Offer updated successfully:', offer);
          this.closeModal();
          this.loadOffers();
        },
        error: (error) => {
          console.error('Error updating offer:', error);
          alert('Erreur lors de la modification de l\'offre. Veuillez réessayer.');
        }
      });
    } else {
      // Create new offer
      this.offerService.createOffer(this.newOffer).subscribe({
        next: (offer) => {
          console.log('Offer created successfully:', offer);
          this.closeModal();
          this.loadOffers();
        },
        error: (error) => {
          console.error('Error creating offer:', error);
          alert('Erreur lors de la création de l\'offre. Veuillez réessayer.');
        }
      });
    }
  }

  deleteOffer(offerId: string): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      return;
    }

    this.offerService.deleteOffer(offerId).subscribe({
      next: () => {
        console.log('Offer deleted successfully');
        this.loadOffers();
      },
      error: (error) => {
        console.error('Error deleting offer:', error);
        alert('Erreur lors de la suppression de l\'offre. Veuillez réessayer.');
      }
    });
  }

  addOfferSkill(): void {
    const skills = this.newSkill.split(',').map(s => s.trim()).filter(s => s.length > 0);
    skills.forEach(name => {
      const exists = this.newOffer.matchingCriteria.requiredSkills.some((s: any) => s.name === name);
      if (!exists) {
        this.newOffer.matchingCriteria.requiredSkills.push({ name, level: 3 });
      }
    });
    this.newSkill = '';
  }

  removeOfferSkill(index: number): void {
    this.newOffer.matchingCriteria.requiredSkills.splice(index, 1);
  }

  resetForm(): void {
    this.newSkill = '';
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
