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
    @keyframes pageFadeIn { from{opacity:0} to{opacity:1} }
    @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
    @keyframes modalSlideUp {
      from { opacity:0; transform:translateY(40px) scale(0.94); }
      to   { opacity:1; transform:translateY(0)    scale(1);    }
    }
    @keyframes cardIn {
      from { opacity:0; transform:translateY(40px) scale(0.93); }
      to   { opacity:1; transform:translateY(0)    scale(1);    }
    }
    @keyframes shimmer {
      0%   { transform:translateX(-120%) skewX(-15deg); }
      100% { transform:translateX(260%)  skewX(-15deg); }
    }
    @keyframes orbitA {
      0%,100% { transform:translate(0,0)       scale(1);   }
      50%     { transform:translate(-25px,18px) scale(1.3); }
    }
    @keyframes orbitB {
      0%,100% { transform:translate(0,0)      scale(1);   }
      50%     { transform:translate(18px,-22px) scale(0.7); }
    }
    @keyframes statPop {
      from { transform:scale(0.3); opacity:0; }
      to   { transform:scale(1);   opacity:1; }
    }
    @keyframes borderPulse {
      0%,100% { opacity:0.4; }
      50%     { opacity:1;   }
    }

    .offres-page { max-width: 1400px; animation: pageFadeIn 0.4s ease both; }

    /* ── Page Header ── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
      padding: 32px 36px;
      background: linear-gradient(135deg, #3b1f6b 0%, #663399 50%, #9b44cc 100%);
      border-radius: 22px;
      position: relative;
      overflow: hidden;
    }
    .page-header::before {
      content: '';
      position: absolute;
      width: 340px; height: 340px;
      background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 65%);
      top: -130px; right: -90px;
      border-radius: 50%;
      animation: orbitA 8s ease-in-out infinite;
      pointer-events: none;
    }
    .page-header::after {
      content: '';
      position: absolute;
      width: 200px; height: 200px;
      background: radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%);
      bottom: -80px; left: 60px;
      border-radius: 50%;
      animation: orbitB 6s ease-in-out infinite;
      pointer-events: none;
    }
    .page-header h1 { color: white; font-size: 26px; font-weight: 800; margin: 0 0 6px; letter-spacing: -0.3px; position: relative; z-index: 1; }
    .page-header .text-muted { color: rgba(255,255,255,0.65); font-size: 13px; margin: 0; position: relative; z-index: 1; }

    .btn-primary {
      background: rgba(255,255,255,0.18);
      color: white;
      border: 1.5px solid rgba(255,255,255,0.35);
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.25s;
      backdrop-filter: blur(8px);
      white-space: nowrap;
      position: relative;
      z-index: 1;
      letter-spacing: 0.2px;
    }
    .btn-primary:hover {
      background: rgba(255,255,255,0.28);
      border-color: rgba(255,255,255,0.6);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    }

    /* ── Filters ── */
    .filters-bar-card {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border-radius: 16px;
      padding: 16px 20px;
      margin-bottom: 26px;
      box-shadow: 0 4px 24px rgba(102,51,153,0.08), 0 1px 3px rgba(0,0,0,0.04);
      border: 1px solid rgba(102,51,153,0.1);
      display: grid;
      grid-template-columns: 2fr 1fr;
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
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 14px;
    }

    .empty-card {
      background: white;
      border-radius: 20px;
      padding: 70px 24px;
      text-align: center;
      box-shadow: 0 4px 24px rgba(102,51,153,0.06);
      border: 1px solid rgba(102,51,153,0.08);
    }

    /* ── Offer Card ── */
    .offer-card {
      background: white;
      border-radius: 22px;
      padding: 0;
      border: 1px solid rgba(102,51,153,0.09);
      box-shadow: 0 4px 24px rgba(102,51,153,0.07), 0 1px 3px rgba(0,0,0,0.04);
      display: flex;
      flex-direction: column;
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      animation: cardIn 0.6s calc(var(--i, 0) * 0.09s) both;
      position: relative;
      overflow: hidden;
    }

    /* Animated top gradient band */
    .offer-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: linear-gradient(90deg, #3b1f6b, #663399, #9b44cc, #c084fc);
      background-size: 200% 100%;
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
      z-index: 2;
    }
    .offer-card:hover::before { transform: scaleX(1); }

    /* Shimmer overlay on hover */
    .offer-card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.65) 50%, transparent 65%);
      transform: translateX(-120%) skewX(-15deg);
      pointer-events: none;
      z-index: 1;
    }
    .offer-card:hover::after { animation: shimmer 0.65s ease forwards; }

    .offer-card:hover {
      transform: translateY(-10px) scale(1.015);
      box-shadow: 0 24px 64px rgba(102,51,153,0.18), 0 8px 20px rgba(0,0,0,0.08);
      border-color: rgba(102,51,153,0.22);
    }
    .offer-card.highlighted {
      animation: offerSpotlight 3.5s ease forwards;
      z-index: 5;
      position: relative;
    }
    @keyframes offerSpotlight {
      0%   { box-shadow: 0 0 0 3px #6366f1, 0 0 50px rgba(99,102,241,0.5); transform: scale(1.04); border-color: #6366f1; }
      30%  { box-shadow: 0 0 0 3px #6366f1, 0 0 28px rgba(99,102,241,0.35); transform: scale(1.02); }
      70%  { box-shadow: 0 0 0 2px rgba(99,102,241,0.4), 0 0 12px rgba(99,102,241,0.15); transform: scale(1.01); }
      100% { box-shadow: none; transform: scale(1); border-color: transparent; }
    }

    /* Card inner padding wrapper */
    .offer-card .offer-header,
    .offer-card .offer-meta,
    .offer-card .dept-badge,
    .offer-card .offer-description,
    .offer-card .desc-toggle,
    .offer-card .offer-stats,
    .offer-card .offer-actions {
      padding-left: 14px;
      padding-right: 14px;
    }
    .offer-card .offer-header  { padding-top: 14px; }
    .offer-card .offer-actions { padding-bottom: 14px; }
    .offer-card .offer-stats   { margin-left: 14px; margin-right: 14px; padding-left: 0; padding-right: 0; }

    .offer-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }
    .offer-title {
      font-size: 13px;
      font-weight: 800;
      color: #1a0533;
      margin: 0;
      flex: 1;
      line-height: 1.35;
      letter-spacing: -0.2px;
    }

    .offer-meta { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #7c5aa0;
      font-weight: 500;
    }

    .dept-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      background: linear-gradient(135deg, rgba(102,51,153,0.08), rgba(155,68,204,0.08));
      color: #663399;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      border: 1px solid rgba(102,51,153,0.14);
      margin-bottom: 8px;
      width: fit-content;
    }

    .offer-description {
      font-size: 11.5px;
      color: #6B7280;
      line-height: 1.55;
      margin: 0 0 4px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }
    .offer-description.expanded { display: block; -webkit-line-clamp: unset; overflow: visible; }
    .desc-toggle {
      background: none; border: none;
      color: #663399; font-size: 12px; font-weight: 700;
      cursor: pointer; padding: 4px 0; margin-bottom: 8px;
      transition: color 0.2s; letter-spacing: 0.2px;
    }
    .desc-toggle:hover { color: #3b1f6b; }

    .offer-stats {
      display: flex;
      gap: 0;
      padding: 8px 12px;
      background: linear-gradient(135deg, rgba(102,51,153,0.04), rgba(155,68,204,0.04));
      border-radius: 10px;
      margin-bottom: 10px;
      border: 1px solid rgba(102,51,153,0.07);
    }
    .stat { display: flex; flex-direction: column; gap: 2px; animation: statPop 0.5s 0.3s both; }
    .stat-value {
      font-size: 20px;
      font-weight: 900;
      background: linear-gradient(135deg, #3b1f6b, #9b44cc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -1px;
      line-height: 1;
    }
    .stat-label {
      font-size: 10px;
      color: #9b44cc;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-top: 2px;
    }

    .offer-actions {
      display: flex;
      gap: 8px;
      margin-top: auto;
    }
    .btn-secondary {
      flex: 1;
      padding: 10px 14px;
      border: 1.5px solid rgba(102,51,153,0.15);
      border-radius: 11px;
      background: white;
      color: #663399;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.25s;
      text-align: center;
      letter-spacing: 0.1px;
    }
    .btn-secondary:hover {
      background: linear-gradient(135deg, rgba(102,51,153,0.08), rgba(155,68,204,0.08));
      border-color: #663399;
      transform: translateY(-1px);
    }

    .btn-danger {
      flex: 1;
      padding: 10px 14px;
      border: 1.5px solid rgba(220,38,38,0.15);
      border-radius: 11px;
      background: white;
      color: #dc2626;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.25s;
      text-align: center;
    }
    .btn-danger:hover { background: #fef2f2; border-color: #dc2626; transform: translateY(-1px); }

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
      background: linear-gradient(135deg, #3b1f6b 0%, #9b44cc 100%);
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
    .modal-footer .btn-primary {
      flex: 0;
      background: linear-gradient(135deg, #3b1f6b, #663399, #9b44cc) !important;
      border: none !important;
      color: white !important;
      padding: 11px 28px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(102,51,153,0.4);
      transition: all 0.25s;
      backdrop-filter: none !important;
    }
    .modal-footer .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(102,51,153,0.5) !important;
    }

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
