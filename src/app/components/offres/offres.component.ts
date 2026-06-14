import { Component, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs/operators';
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
        <div *ngFor="let offer of offers; let i = index" class="card offer-card"
             [attr.id]="'offer-' + offer.id"
             [class.highlighted]="offer.id === highlightedOfferId"
             [style]="'--i:' + i">
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
            <div class="meta-item" *ngIf="offer.positions">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a4 4 0 00-3-3.87M4 18v-1a4 4 0 013-3.87"/>
              </svg>
              {{ offer.positions }} place{{ offer.positions > 1 ? 's' : '' }}
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
              <div class="stat-value">{{ offer.applicationsCount || 0 }}</div>
              <div class="stat-label">Candidatures</div>
            </div>
          </div>

          <div class="offer-actions">
            <button class="btn btn-secondary btn-sm" (click)="openEditModal(offer)">Modifier</button>
            <button class="btn btn-danger btn-sm" (click)="askDelete(offer.id, offer.title)">Supprimer</button>
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
              <label>Nombre de places disponibles</label>
              <input type="number" [(ngModel)]="newOffer.positions" min="2" max="5"
                     style="width:120px" placeholder="2">
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
      <!-- Delete Confirmation Modal -->
      <div class="modal del-modal" *ngIf="showDeleteModal" (click)="cancelDelete()">
        <div class="del-modal-box" (click)="$event.stopPropagation()">
          <div class="del-icon-wrap">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </div>
          <h3 class="del-title">Supprimer cette offre ?</h3>
          <p class="del-msg">Vous êtes sur le point de supprimer <strong>« {{ offerToDeleteTitle }} »</strong>. Cette action est irréversible.</p>
          <div class="del-actions">
            <button class="del-btn-cancel" (click)="cancelDelete()">Annuler</button>
            <button class="del-btn-confirm" (click)="confirmDelete()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6"/>
              </svg>
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Blue Edition — Offres ── */
    @keyframes pageFadeIn { from{opacity:0} to{opacity:1} }
    @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
    @keyframes cardIn     { from{opacity:0;transform:translateY(30px) scale(0.94)} to{opacity:1;transform:none} }
    @keyframes modalPop   { from{opacity:0;transform:scale(0.93) translateY(22px)} to{opacity:1;transform:none} }
    @keyframes shimmer    { 0%{transform:translateX(-130%) skewX(-14deg)} 100%{transform:translateX(270%) skewX(-14deg)} }
    @keyframes orbFloat   { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-18px,14px) scale(1.18)} }
    @keyframes orbFloat2  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(14px,-18px) scale(0.82)} }
    @keyframes statPop    { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }
    @keyframes offerGlow  {
      0%   { box-shadow:0 0 0 3px #2196F3,0 0 40px rgba(33,150,243,0.4); transform:scale(1.03); }
      40%  { box-shadow:0 0 0 2px #2196F3,0 0 18px rgba(33,150,243,0.22); transform:scale(1.01); }
      100% { box-shadow:none; transform:scale(1); }
    }

    .offres-page { max-width:1400px; animation:pageFadeIn 0.45s ease both; }

    /* ── Page Header ── */
    .page-header {
      display:flex; justify-content:space-between; align-items:center;
      margin-bottom:26px; padding:30px 36px;
      background:linear-gradient(135deg,#1e1065 0%,#4338ca 45%,#7c3aed 100%);
      border-radius:22px; position:relative; overflow:hidden;
      box-shadow:0 8px 32px rgba(67,56,202,0.32),0 2px 8px rgba(124,58,237,0.18);
    }
    .page-header::before {
      content:''; position:absolute;
      width:320px; height:320px;
      background:radial-gradient(circle,rgba(255,255,255,0.18) 0%,transparent 65%);
      top:-120px; right:-60px; border-radius:50%;
      animation:orbFloat 9s ease-in-out infinite; pointer-events:none;
    }
    .page-header::after {
      content:''; position:absolute;
      width:180px; height:180px;
      background:radial-gradient(circle,rgba(255,255,255,0.1) 0%,transparent 70%);
      bottom:-70px; left:60px; border-radius:50%;
      animation:orbFloat2 7s ease-in-out infinite; pointer-events:none;
    }
    .page-header h1 { color:#fff; font-size:26px; font-weight:800; margin:0 0 5px; letter-spacing:-0.4px; position:relative; z-index:1; }
    .page-header .text-muted { color:rgba(255,255,255,0.78); font-size:13px; margin:0; position:relative; z-index:1; }

    .btn-primary {
      background:rgba(255,255,255,0.2); color:#fff;
      border:1.5px solid rgba(255,255,255,0.45);
      padding:12px 22px; border-radius:12px;
      font-weight:700; font-size:14px; cursor:pointer;
      display:flex; align-items:center; gap:8px;
      transition:all 0.25s; white-space:nowrap;
      position:relative; z-index:1;
      backdrop-filter:blur(8px); letter-spacing:0.2px;
    }
    .btn-primary:hover {
      background:rgba(255,255,255,0.32); border-color:rgba(255,255,255,0.7);
      transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.15);
    }

    /* ── Filters ── */
    .filters-bar-card {
      background:#fff; border-radius:16px; padding:14px 20px; margin-bottom:24px;
      box-shadow:0 2px 16px rgba(21,101,192,0.08); border:1px solid #BFDBFE;
      display:grid; grid-template-columns:2fr 1fr; gap:12px; align-items:center;
    }
    .filter-search-wrap { position:relative; display:flex; align-items:center; }
    .filter-icon { position:absolute; left:12px; color:#93C5FD; pointer-events:none; }
    .search-input {
      width:100%; padding:10px 14px 10px 36px;
      border:1.5px solid #BFDBFE; border-radius:10px;
      font-size:14px; background:#F0F8FF; color:#111827;
      transition:all 0.2s; outline:none; box-sizing:border-box;
    }
    .search-input::placeholder { color:#9CA3AF; }
    .filters-bar-card select {
      width:100%; padding:10px 14px;
      border:1.5px solid #BFDBFE; border-radius:10px;
      font-size:14px; background:#F0F8FF; color:#111827;
      transition:all 0.2s; outline:none; box-sizing:border-box;
    }
    .search-input:focus, .filters-bar-card select:focus {
      border-color:#1976D2; background:#fff; box-shadow:0 0 0 3px rgba(25,118,210,0.12);
    }

    /* ── Cards Grid ── */
    .grid-3 { display:grid; grid-template-columns:repeat(auto-fill,minmax(268px,1fr)); gap:18px; }

    .empty-card {
      background:#fff; border-radius:20px; padding:70px 24px; text-align:center;
      box-shadow:0 4px 24px rgba(21,101,192,0.06); border:1px solid #BFDBFE;
    }

    /* ── Offer Card ── */
    .offer-card {
      background:#EBF5FD; border-radius:22px; padding:0;
      border:1px solid rgba(21,101,192,0.14);
      box-shadow:0 3px 18px rgba(21,101,192,0.1),0 1px 4px rgba(21,101,192,0.06);
      display:flex; flex-direction:column;
      transition:all 0.38s cubic-bezier(0.34,1.56,0.64,1);
      animation:cardIn 0.55s calc(var(--i,0)*0.08s) both;
      position:relative; overflow:hidden;
    }
    /* top stripe — same blue as the calendar */
    .offer-card::before {
      content:''; position:absolute; top:0; left:0; right:0; height:5px;
      background:linear-gradient(90deg,#4338ca,#7c3aed);
      z-index:2; border-radius:22px 22px 0 0; transition:height 0.3s ease;
    }
    .offer-card:hover::before { height:7px; }

    /* shimmer on hover */
    .offer-card::after {
      content:''; position:absolute; inset:0;
      background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.75) 50%,transparent 65%);
      transform:translateX(-130%) skewX(-14deg); pointer-events:none; z-index:1;
    }
    .offer-card:hover::after { animation:shimmer 0.6s ease forwards; }

    .offer-card:hover {
      transform:translateY(-10px) scale(1.015);
      box-shadow:0 22px 56px rgba(21,101,192,0.2),0 6px 18px rgba(21,101,192,0.1);
      border-color:rgba(21,101,192,0.28); background:#DFF0FB;
    }
    .offer-card.highlighted { animation:offerGlow 3.5s ease forwards; z-index:5; }

    /* Card inner padding */
    .offer-card .offer-header,
    .offer-card .offer-meta,
    .offer-card .dept-badge,
    .offer-card .offer-description,
    .offer-card .desc-toggle,
    .offer-card .offer-stats,
    .offer-card .offer-actions { padding-left:16px; padding-right:16px; }
    .offer-card .offer-header  { padding-top:18px; }
    .offer-card .offer-actions { padding-bottom:16px; }
    .offer-card .offer-stats   { margin-left:16px; margin-right:16px; padding-left:0; padding-right:0; }

    .offer-header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:10px; }
    .offer-title  { font-size:13.5px; font-weight:800; color:#0D47A1; margin:0; flex:1; line-height:1.35; letter-spacing:-0.2px; }

    .offer-meta { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px; }
    .meta-item  { display:flex; align-items:center; gap:4px; font-size:11px; color:#1976D2; font-weight:500; }

    .dept-badge {
      display:flex; align-items:center; justify-content:center; gap:5px;
      padding:6px 10px; background:rgba(255,255,255,0.65);
      color:#1565C0; border-radius:8px; font-size:11px; font-weight:700;
      border:1px solid rgba(21,101,192,0.2); margin-bottom:8px; width:100%; text-align:center;
    }

    .offer-description {
      font-size:11.5px; color:#5D8BB5; line-height:1.55; margin:0 0 4px;
      overflow:hidden; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical;
    }
    .offer-description.expanded { display:block; -webkit-line-clamp:unset; overflow:visible; }
    .desc-toggle {
      background:none; border:none; color:#1976D2; font-size:12px; font-weight:700;
      cursor:pointer; padding:4px 0; margin-bottom:8px; transition:color 0.2s;
    }
    .desc-toggle:hover { color:#0D47A1; }

    .offer-stats {
      display:flex; padding:8px 12px;
      background:linear-gradient(135deg,#EEF1F5,#E2E7EE); border-radius:10px;
      margin-bottom:12px; border:1px solid #C8D0DC;
      box-shadow:inset 0 1px 3px rgba(0,0,0,0.06);
    }
    .stat { display:flex; flex-direction:column; gap:2px; animation:statPop 0.5s 0.3s both; align-items:center; width:100%; text-align:center; }
    .stat-value {
      font-size:22px; font-weight:900; letter-spacing:-1px; line-height:1;
      color:#3D4E63;
      -webkit-text-fill-color:#3D4E63;
    }
    .stat-label { font-size:10px; color:#64748B; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; margin-top:2px; }

    .offer-actions { display:flex; gap:8px; margin-top:auto; }
    .btn-secondary {
      flex:1; padding:10px 14px;
      border:1.5px solid rgba(21,101,192,0.2); border-radius:11px;
      background:rgba(255,255,255,0.75); color:#1565C0;
      font-size:13px; font-weight:700; cursor:pointer;
      transition:all 0.22s; text-align:center;
      display:flex; align-items:center; justify-content:center;
    }
    .btn-secondary:hover { background:#fff; border-color:#1976D2; color:#0D47A1; transform:translateY(-1px); box-shadow:0 4px 12px rgba(21,101,192,0.18); }

    .btn-danger {
      flex:1; padding:10px 14px;
      border:1.5px solid rgba(220,38,38,0.18); border-radius:11px;
      background:rgba(255,255,255,0.75); color:#dc2626;
      font-size:13px; font-weight:700; cursor:pointer;
      transition:all 0.22s; text-align:center;
      display:flex; align-items:center; justify-content:center;
    }
    .btn-danger:hover { background:#fff; border-color:#dc2626; transform:translateY(-1px); }

    /* ── Modal ── */
    .modal {
      position:fixed; top:0; left:0; width:100vw; height:100vh;
      background:rgba(0,0,0,0.38); backdrop-filter:blur(4px);
      display:flex; align-items:center; justify-content:center;
      z-index:9999; padding:20px; animation:fadeIn 0.2s ease both;
      box-sizing:border-box;
    }
    .modal-content {
      background:#fff; border-radius:20px; max-width:800px; width:100%;
      max-height:88vh; overflow:hidden; display:flex; flex-direction:column;
      box-shadow:0 20px 60px rgba(0,0,0,0.22);
      animation:modalPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    .modal-header {
      padding:22px 28px;
      background:linear-gradient(135deg,#1565C0 0%,#1976D2 60%,#42A5F5 100%);
      display:flex; justify-content:space-between; align-items:center;
    }
    .modal-header h2 { margin:0; font-size:18px; color:#fff; font-weight:700; }
    .close-btn {
      background:rgba(255,255,255,0.15); border:none; border-radius:8px;
      cursor:pointer; color:#fff; padding:6px; width:32px; height:32px;
      display:flex; align-items:center; justify-content:center; transition:background 0.2s;
    }
    .close-btn:hover { background:rgba(255,255,255,0.28); }

    .modal-body { padding:24px 28px; overflow-y:auto; flex:1; min-height:0; }
    .form-group { margin-bottom:18px; }
    .form-group label { display:block; font-size:13px; font-weight:600; margin-bottom:6px; color:#374151; }
    .form-group input, .form-group select, .form-group textarea {
      width:100%; padding:10px 14px;
      border:1.5px solid #BFDBFE; border-radius:10px;
      font-size:14px; transition:all 0.2s; outline:none;
      box-sizing:border-box; background:#F0F8FF; color:#111827;
    }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      border-color:#1976D2; background:#fff; box-shadow:0 0 0 3px rgba(25,118,210,0.12);
    }
    .form-group textarea { resize:vertical; min-height:100px; }

    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }

    .modal-footer {
      padding:16px 28px; border-top:1px solid #EFF6FF;
      display:flex; justify-content:flex-end; gap:10px; background:#F8FBFF;
    }
    .modal-footer .btn-secondary { flex:0; padding:10px 22px; background:#fff; border-color:#BFDBFE; color:#1565C0; }
    .modal-footer .btn-primary {
      flex:0; background:linear-gradient(135deg,#1565C0,#1976D2) !important;
      border:none !important; color:#fff !important;
      padding:11px 28px; border-radius:12px; font-weight:700; font-size:14px; cursor:pointer;
      box-shadow:0 4px 16px rgba(21,101,192,0.38); transition:all 0.25s; backdrop-filter:none !important;
    }
    .modal-footer .btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(21,101,192,0.52) !important; }

    .skills-input { display:flex; gap:8px; }
    .skills-input input {
      flex:1; padding:10px 14px; border:1.5px solid #BFDBFE; border-radius:10px;
      font-size:14px; background:#F0F8FF; outline:none; transition:all 0.2s; color:#111827;
    }
    .skills-input input:focus { border-color:#1976D2; background:#fff; box-shadow:0 0 0 3px rgba(25,118,210,0.12); }
    .skills-list { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
    .skill-tag {
      display:inline-flex; align-items:center; gap:6px; padding:5px 12px;
      background:#DBEAFE; color:#1E40AF; border-radius:20px;
      font-size:12px; font-weight:600; border:1px solid #BFDBFE;
    }
    .remove-skill { background:none; border:none; cursor:pointer; color:#1E40AF; font-size:16px; line-height:1; padding:0; opacity:0.7; transition:opacity 0.15s; }
    .remove-skill:hover { opacity:1; }
    .text-sm.text-muted { font-size:12px; color:#93C5FD; margin-top:6px; }

    /* ── Delete Confirmation Modal ── */
    .del-modal { background:rgba(0,0,0,0.42); backdrop-filter:blur(4px); }
    .del-modal-box {
      background:#fff; border-radius:20px; padding:36px 32px 28px;
      max-width:420px; width:100%; text-align:center;
      box-shadow:0 24px 64px rgba(0,0,0,0.18);
      animation:modalPop 0.28s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    .del-icon-wrap {
      width:64px; height:64px; border-radius:50%; margin:0 auto 18px;
      background:linear-gradient(135deg,#FEE2E2,#FECACA);
      display:flex; align-items:center; justify-content:center;
      color:#DC2626;
      box-shadow:0 4px 16px rgba(220,38,38,0.18);
    }
    .del-title { font-size:18px; font-weight:800; color:#111827; margin:0 0 10px; }
    .del-msg { font-size:13.5px; color:#6B7280; line-height:1.6; margin:0 0 26px; }
    .del-msg strong { color:#374151; }
    .del-actions { display:flex; gap:10px; }
    .del-btn-cancel {
      flex:1; padding:11px 0; border-radius:12px;
      border:1.5px solid #E5E7EB; background:#F9FAFB; color:#374151;
      font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s;
    }
    .del-btn-cancel:hover { background:#F3F4F6; border-color:#D1D5DB; }
    .del-btn-confirm {
      flex:1; padding:11px 0; border-radius:12px;
      border:none; background:linear-gradient(135deg,#DC2626,#EF4444); color:#fff;
      font-size:14px; font-weight:700; cursor:pointer; transition:all 0.25s;
      display:flex; align-items:center; justify-content:center; gap:7px;
      box-shadow:0 4px 14px rgba(220,38,38,0.32);
    }
    .del-btn-confirm:hover { background:linear-gradient(135deg,#B91C1C,#DC2626); transform:translateY(-1px); box-shadow:0 7px 20px rgba(220,38,38,0.42); }

    @media (max-width:768px) {
      .filters-bar-card { grid-template-columns:1fr; }
      .page-header { flex-direction:column; gap:16px; padding:20px; }
      .modal-content { max-height:95vh; border-radius:14px; }
      .modal-header, .modal-body, .modal-footer { padding:16px; }
    }
    @media (max-width:600px) {
      .modal { padding:0; align-items:flex-end; }
      .modal-content { border-radius:20px 20px 0 0; max-height:96vh; width:100%; }
      .modal-header, .modal-body, .modal-footer { padding:14px 16px; }
      .modal-footer { flex-direction:column; }
      .modal-footer button { width:100%; justify-content:center; }
      .skills-input { flex-direction:column; }
      .grid-2 { grid-template-columns:1fr; }
      .page-header h1 { font-size:20px; }
      .form-group input[type="number"] { width:100% !important; }
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
  showDeleteModal = false;
  offerToDeleteId: string | null = null;
  offerToDeleteTitle: string = '';
  
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
    positions: 2,
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

  highlightedOfferId: string | null = null;
  private pendingHighlight: string | null = null;

  constructor(private offerService: OfferService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      if (params['highlight']) this.pendingHighlight = params['highlight'];
    });
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
      if (this.pendingHighlight) {
        const id = this.pendingHighlight;
        this.pendingHighlight = null;
        setTimeout(() => this.scrollToAndHighlight(id), 250);
      }
    });
  }

  private scrollToAndHighlight(offerId: string): void {
    // Make sure the offer is visible (clear filters if needed)
    const inFiltered = this.offers.find(o => o.id === offerId);
    if (!inFiltered) {
      this.searchTerm = '';
      this.selectedDepartment = '';
      this.selectedStatus = '';
      this.filterOffers();
    }
    this.highlightedOfferId = offerId;
    setTimeout(() => {
      const el = document.getElementById('offer-' + offerId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { this.highlightedOfferId = null; }, 3500);
    }, 100);
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
      startDate: offer.startDate ? offer.startDate.substring(0, 10) : '',
      positions: offer.positions ?? 2,
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

  askDelete(offerId: string, title: string): void {
    this.offerToDeleteId = offerId;
    this.offerToDeleteTitle = title;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.offerToDeleteId = null;
    this.offerToDeleteTitle = '';
  }

  confirmDelete(): void {
    if (!this.offerToDeleteId) return;
    this.offerService.deleteOffer(this.offerToDeleteId).subscribe({
      next: () => {
        this.cancelDelete();
        this.loadOffers();
      },
      error: (error) => {
        console.error('Error deleting offer:', error);
        this.cancelDelete();
        alert('Erreur lors de la suppression de l\'offre. Veuillez réessayer.');
      }
    });
  }

  deleteOffer(offerId: string): void {
    this.offerService.deleteOffer(offerId).subscribe({
      next: () => this.loadOffers(),
      error: (error) => console.error('Error deleting offer:', error)
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
