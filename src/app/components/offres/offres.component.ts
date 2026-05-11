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
      <div class="filters-bar-card">
        <div class="filter-search-wrap">
          <svg class="filter-icon" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
          </svg>
          <input type="search" placeholder="Rechercher une offre..." class="search-input" [(ngModel)]="searchTerm" (input)="filterOffers()">
        </div>
        <select [(ngModel)]="selectedDepartment" (change)="filterOffers()">
          <option value="">Tous les départements</option>
          <option value="Consulting ERP">Consulting ERP</option>
          <option value="Système management Qualité">Système management Qualité</option>
          <option value="Intelligence artificielle">Intelligence artificielle</option>
          <option value="Data Analytics / Business Intelligence">Data Analytics / Business Intelligence</option>
          <option value="Développement informatique">Développement informatique</option>
          <option value="Marketing & Commercial">Marketing & Commercial</option>
        </select>
      </div>

      <!-- Offers Grid -->
      <div *ngIf="offers.length === 0" class="empty-card">
        <svg width="48" height="48" fill="none" viewBox="0 0 48 48" style="margin:0 auto 16px;display:block">
          <circle cx="24" cy="24" r="24" fill="#EEF2FF"/>
          <path d="M16 14h16v20H16V14z" fill="#C7D2FE" stroke="#6366f1" stroke-width="1.5"/>
          <path d="M20 20h8M20 25h5" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p style="color:#6B7280;font-size:15px">Aucune offre ne correspond à vos critères.</p>
      </div>

      <div class="grid-3">
        <div *ngFor="let offer of offers; let i = index" class="card offer-card" [style]="'--i:' + i">
          <div class="offer-header">
            <h3 class="offer-title">{{ offer.title }}</h3>
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
          
          <div class="dept-badge">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
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
                <input type="text" [(ngModel)]="newOffer.location" placeholder="Tunis, Sfax...">
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
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(22px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pageFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes modalSlideUp {
      from { opacity: 0; transform: translateY(30px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* pageFadeIn instead of fadeUp to avoid creating a stacking context that breaks position:fixed modals */
    .offres-page { max-width: 1400px; animation: pageFadeIn 0.4s ease both; }

    /* ── Page Header ── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 28px 32px;
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 55%, #24243e 100%);
      border-radius: 18px;
      position: relative;
      overflow: hidden;
    }
    .page-header::before {
      content: '';
      position: absolute;
      width: 320px; height: 320px;
      background: radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%);
      top: -120px; right: -80px;
      border-radius: 50%;
      pointer-events: none;
    }
    .page-header h1 { color: white; font-size: 24px; font-weight: 700; margin: 0 0 5px; }
    .page-header .text-muted { color: rgba(255,255,255,0.55); font-size: 13px; margin: 0; }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      padding: 11px 22px;
      border-radius: 11px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.25s;
      box-shadow: 0 4px 18px rgba(99,102,241,0.45);
      white-space: nowrap;
      position: relative;
      z-index: 1;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(99,102,241,0.55); }

    /* ── Filters ── */
    .filters-bar-card {
      background: white;
      border-radius: 14px;
      padding: 14px 18px;
      margin-bottom: 22px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      border: 1px solid rgba(99,102,241,0.09);
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 12px;
      align-items: center;
    }
    .filter-search-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .filter-icon {
      position: absolute;
      left: 12px;
      color: #9CA3AF;
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 10px 14px 10px 36px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      background: #f9fafb;
      color: #374151;
      transition: all 0.2s;
      outline: none;
      box-sizing: border-box;
    }
    .filters-bar-card select {
      width: 100%;
      padding: 10px 14px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      background: #f9fafb;
      color: #374151;
      transition: all 0.2s;
      outline: none;
      box-sizing: border-box;
    }
    .search-input:focus, .filters-bar-card select:focus {
      border-color: #6366f1;
      background: white;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    }

    /* ── Cards Grid ── */
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }

    .empty-card {
      background: white;
      border-radius: 16px;
      padding: 60px 24px;
      text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    }

    .offer-card {
      background: white;
      border-radius: 16px;
      padding: 22px;
      border: 1px solid rgba(0,0,0,0.06);
      box-shadow: 0 2px 14px rgba(0,0,0,0.05);
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      animation: fadeUp 0.5s calc(var(--i, 0) * 0.06s) both;
      position: relative;
      overflow: hidden;
    }
    .offer-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      transform: scaleX(0);
      transition: transform 0.3s ease;
      transform-origin: left;
    }
    .offer-card:hover {
      box-shadow: 0 14px 42px rgba(99,102,241,0.14);
      transform: translateY(-5px);
      border-color: rgba(99,102,241,0.2);
    }
    .offer-card:hover::before { transform: scaleX(1); }

    .offer-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }
    .offer-title {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
      margin: 0;
      flex: 1;
      line-height: 1.4;
    }
    .badge {
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
      letter-spacing: 0.3px;
    }
    .badge-success { background: #D1FAE5; color: #065F46; }
    .badge-gray    { background: #F3F4F6; color: #6B7280; }
    .badge-warning { background: #FEF3C7; color: #92400E; }

    .offer-meta { display: flex; gap: 16px; flex-wrap: wrap; }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #6B7280;
    }
    .dept-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1));
      color: #6366f1;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid rgba(99,102,241,0.15);
    }

    .offer-description {
      font-size: 13px;
      color: #6B7280;
      line-height: 1.6;
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
      color: #6366f1;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      padding: 2px 0;
      transition: color 0.2s;
    }
    .desc-toggle:hover { color: #4338ca; }

    .offer-stats {
      display: flex;
      gap: 24px;
      padding: 14px 0;
      border-top: 1px solid #f3f4f6;
      border-bottom: 1px solid #f3f4f6;
    }
    .stat { display: flex; flex-direction: column; gap: 2px; }
    .stat-value {
      font-size: 22px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.5px;
    }
    .stat-label {
      font-size: 11px;
      color: #9CA3AF;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .offer-actions {
      display: flex;
      gap: 8px;
      margin-top: auto;
    }
    .btn-secondary {
      flex: 1;
      padding: 9px 14px;
      border: 1.5px solid #e5e7eb;
      border-radius: 9px;
      background: white;
      color: #374151;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }
    .btn-secondary:hover { background: #f5f3ff; border-color: #6366f1; color: #6366f1; }

    .btn-danger {
      flex: 1;
      padding: 9px 14px;
      border: 1.5px solid #fee2e2;
      border-radius: 9px;
      background: #fff5f5;
      color: #dc2626;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }
    .btn-danger:hover { background: #fee2e2; border-color: #dc2626; }

    /* ── Modal ── */
    .modal {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      animation: fadeIn 0.2s ease both;
    }
    .modal-content {
      background: white;
      border-radius: 20px;
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 80px rgba(0,0,0,0.3);
      animation: modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    .modal-header {
      padding: 22px 28px;
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 100%);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h2 { margin: 0; font-size: 18px; color: white; font-weight: 700; }
    .close-btn {
      background: rgba(255,255,255,0.12);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      color: white;
      padding: 6px;
      width: 32px; height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .close-btn:hover { background: rgba(255,255,255,0.22); }

    .modal-body { padding: 24px 28px; overflow-y: auto; }
    .form-group { margin-bottom: 18px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #374151; }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 10px 14px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      transition: all 0.2s;
      outline: none;
      box-sizing: border-box;
      background: #f9fafb;
      color: #111827;
    }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      border-color: #6366f1;
      background: white;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    }
    .form-group textarea { resize: vertical; min-height: 100px; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    .modal-footer {
      padding: 16px 28px;
      border-top: 1px solid #f3f4f6;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background: #fafafa;
    }
    .modal-footer .btn-secondary { flex: 0; padding: 10px 22px; }
    .modal-footer .btn-primary   { flex: 0; }

    .skills-input { display: flex; gap: 8px; }
    .skills-input input {
      flex: 1;
      padding: 10px 14px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      background: #f9fafb;
      outline: none;
      transition: all 0.2s;
    }
    .skills-input input:focus {
      border-color: #6366f1;
      background: white;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    }
    .skills-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .skill-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      background: #EEF2FF;
      color: #4338ca;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .remove-skill {
      background: none;
      border: none;
      cursor: pointer;
      color: #4338ca;
      font-size: 16px;
      line-height: 1;
      padding: 0;
      opacity: 0.7;
      transition: opacity 0.15s;
    }
    .remove-skill:hover { opacity: 1; }
    .text-sm.text-muted { font-size: 12px; color: #9CA3AF; margin-top: 6px; }

    @media (max-width: 768px) {
      .filters-bar-card { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: 16px; padding: 20px; }
      .modal-content { max-height: 95vh; border-radius: 14px; }
      .modal-header, .modal-body, .modal-footer { padding: 16px; }
      .offer-stats { flex-wrap: wrap; }
      .offer-actions { flex-wrap: wrap; }
    }
    @media (max-width: 480px) {
      .modal { padding: 0; align-items: flex-end; }
      .modal-content { border-radius: 20px 20px 0 0; max-height: 96vh; width: 100%; }
      .modal-footer { flex-direction: column; }
      .modal-footer button { width: 100%; justify-content: center; }
      .skills-input { flex-direction: column; }
      .grid-2 { grid-template-columns: 1fr; }
      .offer-header { flex-direction: column; align-items: flex-start; }
      .page-header h1 { font-size: 20px; }
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
