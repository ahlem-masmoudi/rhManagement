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
    <div class="page-wrap">

      <!-- ── Hero ── -->
      <section class="hero">
        <div class="hero-blobs">
          <div class="blob blob-1"></div>
          <div class="blob blob-2"></div>
          <div class="blob blob-3"></div>
        </div>
        <div class="hero-content">
          <div class="hero-badge">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            Offres recommandées pour vous
          </div>
          <h1 class="hero-title">
            <span *ngIf="!isLoading">{{ filteredOffers.length }}</span>
            <span *ngIf="isLoading" class="hero-count-skeleton"></span>
            opportunité{{ filteredOffers.length !== 1 ? 's' : '' }} compatible{{ filteredOffers.length !== 1 ? 's' : '' }}
          </h1>
          <p class="hero-sub">Sélectionnées selon vos compétences et votre profil</p>

          <!-- Search in hero -->
          <div class="hero-search">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
            </svg>
            <input
              type="search"
              [(ngModel)]="searchQuery"
              (input)="applyFilters()"
              placeholder="Titre, département, ville…">
            <button *ngIf="searchQuery" class="search-clear" (click)="searchQuery=''; applyFilters()">✕</button>
          </div>
        </div>
      </section>

      <!-- ── Filters strip ── -->
      <div class="filters-strip">
        <div class="filters-left">
          <button class="filter-all-btn" [class.active]="!selectedDepartment && !selectedLocation && !selectedDuration" (click)="resetFilters()">
            Tous
          </button>
          <div class="filter-group">
            <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20" class="filter-icon">
              <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4z" clip-rule="evenodd"/>
            </svg>
            <select class="filter-select" [(ngModel)]="selectedDepartment" (change)="applyFilters()">
              <option value="">Département</option>
              <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
            </select>
          </div>
          <div class="filter-group">
            <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20" class="filter-icon">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            <select class="filter-select" [(ngModel)]="selectedLocation" (change)="applyFilters()">
              <option value="">Localisation</option>
              <option *ngFor="let l of locations" [value]="l">{{ l }}</option>
            </select>
          </div>
          <div class="filter-group">
            <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20" class="filter-icon">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
            </svg>
            <select class="filter-select" [(ngModel)]="selectedDuration" (change)="applyFilters()">
              <option value="">Durée</option>
              <option value="3">3 mois</option>
              <option value="4">4 mois</option>
              <option value="6">6 mois</option>
            </select>
          </div>
        </div>
        <div class="filters-right">
          <span class="results-pill">{{ filteredOffers.length }} résultat{{ filteredOffers.length !== 1 ? 's' : '' }}</span>
        </div>
      </div>

      <!-- ── Loading skeletons ── -->
      <div class="offers-grid" *ngIf="isLoading">
        <div class="offer-card skeleton-card" *ngFor="let i of [1,2,3,4,5,6]">
          <div class="sk sk-title"></div>
          <div class="sk sk-sub"></div>
          <div class="sk sk-body"></div>
          <div class="sk sk-body short"></div>
        </div>
      </div>

      <!-- ── Error ── -->
      <div *ngIf="limitError" class="limit-toast">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
        {{ limitError }}
      </div>

      <div *ngIf="errorMessage" class="error-banner">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        {{ errorMessage }}
      </div>

      <!-- ── Empty state ── -->
      <div *ngIf="!isLoading && !errorMessage && filteredOffers.length === 0" class="empty-state">
        <div class="empty-orbit">
          <div class="orbit-ring ring-1"></div>
          <div class="orbit-ring ring-2"></div>
          <div class="orbit-center">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#a5b4fc" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </div>
        <h3>Aucune offre trouvée</h3>
        <p *ngIf="candidateSkillsCount === 0">Complétez votre profil avec des compétences pour recevoir des recommandations.</p>
        <p *ngIf="candidateSkillsCount > 0">Aucune offre ne correspond à vos filtres actuels.</p>
        <button class="btn-reset" (click)="resetFilters()">Réinitialiser les filtres</button>
      </div>

      <!-- ── Offers grid ── -->
      <div class="offers-grid" *ngIf="!isLoading && !errorMessage && filteredOffers.length > 0">
        <div
          *ngFor="let offer of filteredOffers; let i = index"
          class="offer-card"
          [style]="'--i:' + i"
          [class.applied]="hasApplied(offer.id)">

          <!-- Score ring -->
          <div class="score-ring-wrap">
            <svg class="score-ring" viewBox="0 0 72 72" width="72" height="72">
              <circle cx="36" cy="36" r="28" class="ring-bg"/>
              <circle cx="36" cy="36" r="28" class="ring-fg"
                [style]="getRingStyle(offer.compatibilityScore)"
                [attr.stroke]="getRingStroke(offer.compatibilityScore)"/>
            </svg>
            <div class="score-value" [style.color]="getRingStroke(offer.compatibilityScore)">
              {{ offer.compatibilityScore || 0 }}<small>%</small>
            </div>
          </div>

          <!-- Card body -->
          <div class="card-body">
            <div class="card-top">
              <div class="type-chip type-{{ offer.type }}">{{ offer.type }}</div>
              <div class="compat-label" [style.color]="getRingStroke(offer.compatibilityScore)">
                {{ offer.compatibilityLabel || 'Compatible' }}
              </div>
            </div>

            <h3 class="offer-title">{{ offer.title }}</h3>

            <div class="offer-meta">
              <span class="meta-item">
                <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4z" clip-rule="evenodd"/>
                </svg>
                {{ offer.department }}
              </span>
              <span class="meta-dot">·</span>
              <span class="meta-item">
                <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                </svg>
                {{ offer.location }}
              </span>
              <span class="meta-dot">·</span>
              <span class="meta-item">
                <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                </svg>
                {{ offer.duration }}
              </span>
              <span class="meta-item" *ngIf="offer.positions">
                <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a4 4 0 00-3-3.87M4 18v-1a4 4 0 013-3.87"/>
                </svg>
                {{ offer.positions }} place{{ offer.positions > 1 ? 's' : '' }}
              </span>
            </div>

            <p class="offer-desc">{{ offer.description }}</p>

            <!-- Matched skills -->
            <div class="skills-row" *ngIf="offer.matchedSkills?.length">
              <span class="skills-label matched-label">
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                Vos atouts
              </span>
              <div class="chips">
                <span *ngFor="let s of offer.matchedSkills" class="chip chip-match">{{ s }}</span>
              </div>
            </div>

            <!-- Missing skills -->
            <div class="skills-row" *ngIf="offer.missingSkills?.length">
              <span class="skills-label missing-label">À acquérir</span>
              <div class="chips">
                <ng-container *ngFor="let s of offer.missingSkills; let j = index">
                  <span *ngIf="j < 3 || expandedSkills.has(offer.id)" class="chip chip-miss">{{ s }}</span>
                </ng-container>
                <span *ngIf="(offer.missingSkills||[]).length > 3 && !expandedSkills.has(offer.id)"
                      class="chip chip-more" (click)="toggleSkills(offer.id)">
                  +{{ (offer.missingSkills||[]).length - 3 }}
                </span>
              </div>
            </div>

            <!-- Footer -->
            <div class="card-footer">
              <span class="applicants-info">
                <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
                {{ offer.applicationsCount }} candidature{{ offer.applicationsCount !== 1 ? 's' : '' }}
              </span>
              <button
                class="apply-btn"
                [class.applied-btn]="hasApplied(offer.id)"
                [disabled]="hasApplied(offer.id)"
                (click)="applyToOffer(offer)">
                <span *ngIf="!hasApplied(offer.id)">
                  Postuler
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </span>
                <span *ngIf="hasApplied(offer.id)">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  Déjà postulé
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Apply Modal ── -->
      <div class="modal-backdrop" *ngIf="showApplyModal" (click)="closeApplyModal()">
        <div class="apply-modal" (click)="$event.stopPropagation()">

          <div *ngIf="applySuccess" class="apply-success">
            <div class="success-ring">
              <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="#10b981" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h3>Candidature envoyée !</h3>
            <p>Votre candidature pour <strong>{{ applyingToOffer?.title }}</strong> a bien été transmise. L'équipe RH vous contactera par email.</p>
            <button class="apply-btn" style="width:100%;justify-content:center" (click)="closeApplyModal()">Fermer</button>
          </div>

          <ng-container *ngIf="!applySuccess">
            <div class="modal-header">
              <div>
                <div class="type-chip type-{{ applyingToOffer?.type }}" style="margin-bottom:6px">{{ applyingToOffer?.type }}</div>
                <h2>{{ applyingToOffer?.title }}</h2>
                <p class="modal-sub">{{ applyingToOffer?.department }} · {{ applyingToOffer?.location }}</p>
              </div>
              <button class="close-btn" (click)="closeApplyModal()">✕</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="field-label">CV <span class="req">*</span></label>
                <div class="drop-zone"
                     [class.drag-over]="isDraggingOver"
                     [class.has-file]="cvFile"
                     (dragover)="onDragOver($event)"
                     (dragleave)="onDragLeave()"
                     (drop)="onDrop($event)"
                     (click)="fileInput.click()">
                  <input #fileInput type="file" accept=".pdf" style="display:none" (change)="onFileSelect($event)">
                  <ng-container *ngIf="!cvFile">
                    <svg width="34" height="34" fill="none" viewBox="0 0 24 24" stroke="#a5b4fc" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                    <p class="dz-text">Glissez votre CV ici ou <span class="dz-link">parcourir</span></p>
                    <p class="dz-hint">PDF · max 5 Mo</p>
                  </ng-container>
                  <ng-container *ngIf="cvFile">
                    <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="#ef4444" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p class="file-name">{{ cvFile.name }}</p>
                    <p class="dz-hint">{{ formatFileSize(cvFile.size) }}</p>
                    <button class="remove-file" (click)="removeFile($event)">Supprimer</button>
                  </ng-container>
                </div>
              </div>

              <div class="form-group">
                <label class="field-label">Lettre de motivation <span class="opt">(optionnel)</span></label>
                <textarea [(ngModel)]="coverLetter" rows="4" class="textarea"
                  placeholder="Expliquez votre motivation pour ce poste…"></textarea>
              </div>

              <p *ngIf="applyError" class="err-msg">{{ applyError }}</p>
            </div>

            <div class="modal-footer">
              <button class="btn-cancel" (click)="closeApplyModal()" [disabled]="isApplying">Annuler</button>
              <button class="apply-btn" (click)="submitApplication()" [disabled]="isApplying || !cvFile">
                <span *ngIf="!isApplying">Envoyer ma candidature</span>
                <span *ngIf="isApplying" class="spinner"></span>
              </button>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Base ── */
    .page-wrap {
      min-height: 100vh;
      background: #f8f7ff;
      padding-bottom: 60px;
    }

    /* ── Hero ── */
    .hero {
      position: relative;
      background: linear-gradient(135deg, #1e1b4b 0%, #3730a3 40%, #6d28d9 100%);
      padding: 52px 32px 72px;
      overflow: hidden;
      text-align: center;
    }

    .hero::after {
      content: '';
      position: absolute;
      bottom: -2px; left: 0; right: 0;
      height: 48px;
      background: #f8f7ff;
      clip-path: ellipse(55% 100% at 50% 100%);
    }

    .hero-blobs { position: absolute; inset: 0; pointer-events: none; }

    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(72px);
      opacity: 0.2;
      animation: float 10s ease-in-out infinite;
    }
    .blob-1 { width: 380px; height: 380px; background: #818cf8; top: -100px; left: -100px; animation-delay: 0s; }
    .blob-2 { width: 280px; height: 280px; background: #22d3ee; top: -20px; right: -80px; animation-delay: 3s; }
    .blob-3 { width: 220px; height: 220px; background: #e879f9; bottom: -60px; left: 38%; animation-delay: 6s; }

    @keyframes float {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-24px) scale(1.06); }
    }

    .hero-content { position: relative; z-index: 1; max-width: 700px; margin: 0 auto; }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      color: #c7d2fe;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 6px 16px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.15);
      margin-bottom: 18px;
    }

    .hero-title {
      font-size: clamp(30px, 5vw, 52px);
      font-weight: 900;
      color: white;
      margin: 0 0 10px;
      line-height: 1.1;
      letter-spacing: -0.03em;
    }

    .hero-count-skeleton {
      display: inline-block;
      width: 52px;
      height: 50px;
      background: rgba(255,255,255,0.15);
      border-radius: 10px;
      vertical-align: middle;
      animation: pulse 1.4s ease-in-out infinite;
    }

    .hero-sub {
      color: #a5b4fc;
      font-size: 15px;
      margin: 0 0 28px;
      font-weight: 400;
    }

    .hero-search {
      position: relative;
      max-width: 500px;
      margin: 0 auto;
      display: flex;
      align-items: center;
    }

    .hero-search svg {
      position: absolute;
      left: 18px;
      color: #818cf8;
      pointer-events: none;
      z-index: 1;
    }

    .hero-search input {
      width: 100%;
      padding: 15px 48px 15px 48px;
      background: rgba(255,255,255,0.08);
      backdrop-filter: blur(16px);
      border: 1.5px solid rgba(255,255,255,0.18);
      border-radius: 999px;
      color: white;
      font-size: 15px;
      transition: all 0.25s;
      box-sizing: border-box;
    }

    .hero-search input::placeholder { color: #818cf8; }
    .hero-search input:focus {
      outline: none;
      background: rgba(255,255,255,0.14);
      border-color: rgba(255,255,255,0.45);
      box-shadow: 0 0 0 4px rgba(129,140,248,0.15);
    }

    .search-clear {
      position: absolute;
      right: 16px;
      background: rgba(255,255,255,0.15);
      border: none;
      color: white;
      cursor: pointer;
      font-size: 12px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    .search-clear:hover { background: rgba(255,255,255,0.25); }

    /* ── Filters strip ── */
    .filters-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 32px;
      background: white;
      border-bottom: 1px solid #ede9fe;
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: 0 4px 20px rgba(99,102,241,0.07);
    }

    .filters-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .filters-left::-webkit-scrollbar { display: none; }

    .filters-right { flex-shrink: 0; }

    .filter-all-btn {
      white-space: nowrap;
      background: none;
      border: 1.5px solid #e5e7eb;
      border-radius: 999px;
      padding: 7px 18px;
      font-size: 13px;
      font-weight: 700;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.18s;
      flex-shrink: 0;
    }
    .filter-all-btn.active,
    .filter-all-btn:hover {
      border-color: #6366f1;
      color: #6366f1;
      background: #eef2ff;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 0;
      background: #f8f7ff;
      border: 1.5px solid #e5e7eb;
      border-radius: 999px;
      padding: 0 14px 0 12px;
      transition: border-color 0.18s;
      flex-shrink: 0;
    }
    .filter-group:focus-within {
      border-color: #6366f1;
      background: #eef2ff;
    }

    .filter-icon { color: #9ca3af; flex-shrink: 0; }

    .filter-select {
      background: transparent;
      border: none;
      outline: none;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      cursor: pointer;
      padding: 7px 20px 7px 8px;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' fill='%236b7280' viewBox='0 0 20 20'%3E%3Cpath d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0px center;
      min-width: 110px;
    }

    .results-pill {
      font-size: 12px;
      font-weight: 800;
      color: #6366f1;
      background: linear-gradient(135deg, #eef2ff 0%, #ede9fe 100%);
      padding: 6px 14px;
      border-radius: 999px;
      white-space: nowrap;
      border: 1px solid #c7d2fe;
    }

    /* ── Grid ── */
    .offers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
      padding: 28px 32px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* ── Offer Card ── */
    .offer-card {
      background: white;
      border-radius: 20px;
      display: flex;
      gap: 16px;
      padding: 22px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
      border: 1px solid #f1f0fe;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
      animation: slideUp 0.45s ease both;
      animation-delay: calc(var(--i, 0) * 70ms);
      position: relative;
      overflow: hidden;
    }

    .offer-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(99,102,241,0.03) 0%, transparent 60%);
      pointer-events: none;
    }

    .offer-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 30px rgba(99,102,241,0.12), 0 2px 8px rgba(0,0,0,0.06);
    }

    .offer-card.applied {
      border-color: #a7f3d0;
      background: linear-gradient(135deg, #f0fdf4 0%, white 100%);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(28px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Score ring ── */
    .score-ring-wrap {
      position: relative;
      flex-shrink: 0;
      width: 72px;
      height: 72px;
    }

    .score-ring {
      transform: rotate(-90deg);
    }

    .ring-bg {
      fill: none;
      stroke: #f3f4f6;
      stroke-width: 6;
    }

    .ring-fg {
      fill: none;
      stroke-width: 6;
      stroke-linecap: round;
      stroke-dasharray: 175.93;
      transition: stroke-dashoffset 0.8s cubic-bezier(0.34,1.56,0.64,1);
    }

    .score-value {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      font-weight: 800;
      line-height: 1;
    }
    .score-value small { font-size: 10px; font-weight: 600; margin-top: 1px; }

    /* ── Card body ── */
    .card-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }

    .card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }

    .type-chip {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      padding: 3px 10px;
      border-radius: 999px;
    }
    .type-stage    { background: #ede9fe; color: #6d28d9; }
    .type-alternance { background: #dbeafe; color: #1d4ed8; }
    .type-cdd      { background: #fef3c7; color: #92400e; }
    .type-cdi      { background: #d1fae5; color: #065f46; }

    .compat-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .offer-title {
      font-size: 15px;
      font-weight: 700;
      color: #111827;
      margin: 0;
      line-height: 1.35;
    }

    .offer-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
      font-size: 12px;
      color: #9ca3af;
    }

    .meta-item { display: flex; align-items: center; gap: 3px; }
    .meta-dot { color: #d1d5db; }

    .offer-desc {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.55;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* ── Skills ── */
    .skills-row { display: flex; flex-direction: column; gap: 5px; }

    .skills-label {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .matched-label { color: #059669; }
    .missing-label { color: #6366f1; }

    .chips { display: flex; flex-wrap: wrap; gap: 5px; }

    .chip {
      font-size: 11px;
      font-weight: 500;
      padding: 3px 9px;
      border-radius: 999px;
    }
    .chip-match { background: #d1fae5; color: #065f46; }
    .chip-miss  { background: #eef2ff; color: #4338ca; }
    .chip-more  { background: #f3f4f6; color: #6b7280; cursor: pointer; transition: all 0.15s; }
    .chip-more:hover { background: #374151; color: white; }

    /* ── Card footer ── */
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 10px;
      border-top: 1px solid #f3f4f6;
      margin-top: auto;
    }

    .applicants-info {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #9ca3af;
    }

    .apply-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 18px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: white;
      border: none;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      overflow: hidden;
    }

    .apply-btn::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
      transform: translateX(-100%);
      transition: transform 0.4s;
    }

    .apply-btn:not(:disabled):hover::after { transform: translateX(100%); }
    .apply-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.4); }
    .apply-btn:disabled { opacity: 0.75; cursor: not-allowed; }

    .applied-btn {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    }

    /* ── Skeletons ── */
    .skeleton-card { flex-direction: column; gap: 12px; }

    .sk {
      border-radius: 8px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    .sk-title  { height: 20px; width: 70%; }
    .sk-sub    { height: 14px; width: 45%; }
    .sk-body   { height: 14px; width: 90%; }
    .sk-body.short { width: 60%; }

    @keyframes shimmer {
      from { background-position: 200% 0; }
      to   { background-position: -200% 0; }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }

    /* ── Empty state ── */
    .empty-state {
      text-align: center;
      padding: 80px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .empty-orbit {
      position: relative;
      width: 90px;
      height: 90px;
      margin-bottom: 8px;
    }

    .orbit-ring {
      position: absolute;
      border-radius: 50%;
      border: 1.5px dashed #c7d2fe;
      animation: spin 6s linear infinite;
    }
    .ring-1 { inset: 0; animation-duration: 6s; }
    .ring-2 { inset: 14px; animation-duration: 10s; animation-direction: reverse; }

    .orbit-center {
      position: absolute;
      inset: 26px;
      background: #eef2ff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state h3 { font-size: 18px; color: #374151; margin: 0; }
    .empty-state p  { font-size: 14px; color: #9ca3af; margin: 0; max-width: 320px; }

    .btn-reset {
      margin-top: 4px;
      padding: 9px 20px;
      border: 1.5px solid #6366f1;
      border-radius: 999px;
      background: white;
      color: #6366f1;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-reset:hover { background: #eef2ff; }

    /* ── Error ── */
    .limit-toast {
      display: flex; align-items: center; gap: 10px;
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      z-index: 9999;
      padding: 14px 22px;
      background: #fff7ed; border: 1.5px solid #fdba74;
      border-radius: 14px; color: #92400e;
      font-size: 14px; font-weight: 600;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      animation: slideDown 0.3s ease;
      max-width: 480px; width: 90%;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 24px 32px;
      padding: 14px 18px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      color: #991b1b;
      font-size: 14px;
    }

    /* ── Modal ── */
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(15,10,40,0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .apply-modal {
      background: white;
      border-radius: 20px;
      width: 100%;
      max-width: 520px;
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      box-shadow: 0 24px 80px rgba(0,0,0,0.25);
      animation: modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }

    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.92) translateY(20px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px 24px 18px;
      border-bottom: 1px solid #f3f4f6;
    }

    .modal-header h2 { font-size: 18px; font-weight: 700; margin: 0 0 4px; color: #111827; }
    .modal-sub { font-size: 13px; color: #9ca3af; margin: 0; }

    .close-btn {
      background: #f3f4f6;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      cursor: pointer;
      font-size: 14px;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    .close-btn:hover { background: #e5e7eb; color: #374151; }

    .modal-body {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-group { display: flex; flex-direction: column; gap: 7px; }

    .field-label { font-size: 13px; font-weight: 600; color: #374151; }
    .req { color: #ef4444; }
    .opt { font-weight: 400; color: #9ca3af; font-size: 12px; }

    .drop-zone {
      border: 2px dashed #d1d5db;
      border-radius: 14px;
      padding: 28px 16px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      background: #fafafa;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .drop-zone:hover, .drop-zone.drag-over { border-color: #6366f1; background: #eef2ff; }
    .drop-zone.has-file { border-color: #10b981; border-style: solid; background: #f0fdf4; }

    .dz-text { font-size: 13px; color: #6b7280; margin: 0; }
    .dz-link { color: #6366f1; font-weight: 600; }
    .dz-hint { font-size: 11px; color: #9ca3af; margin: 0; }
    .file-name { font-size: 13px; font-weight: 600; color: #374151; margin: 0; }

    .remove-file {
      background: none;
      border: 1px solid #fca5a5;
      color: #ef4444;
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 999px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .remove-file:hover { background: #fef2f2; }

    .textarea {
      width: 100%;
      padding: 11px 13px;
      border: 1.5px solid #e5e7eb;
      border-radius: 12px;
      font-size: 13px;
      resize: vertical;
      font-family: inherit;
      color: #374151;
      transition: border-color 0.15s;
      box-sizing: border-box;
    }
    .textarea:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }

    .err-msg { font-size: 12px; color: #ef4444; margin: 0; }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 24px 20px;
      border-top: 1px solid #f3f4f6;
    }

    .btn-cancel {
      padding: 9px 18px;
      background: white;
      border: 1.5px solid #e5e7eb;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-cancel:hover { border-color: #9ca3af; color: #374151; }

    /* Success */
    .apply-success {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 44px 28px;
      gap: 14px;
    }

    .success-ring {
      width: 76px;
      height: 76px;
      border-radius: 50%;
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
    }

    @keyframes popIn {
      from { transform: scale(0); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }

    .apply-success h3 { font-size: 20px; font-weight: 800; color: #065f46; margin: 0; }
    .apply-success p  { font-size: 14px; color: #6b7280; margin: 0; max-width: 320px; line-height: 1.6; }

    .spinner {
      display: inline-block;
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .hero { padding: 36px 16px 60px; }
      .hero-title { font-size: 28px; }
      .filters-strip { padding: 10px 14px; gap: 8px; }
      .filter-all-btn { padding: 6px 14px; font-size: 12px; }
      .filter-select { font-size: 12px; min-width: 90px; }
      .offers-grid { grid-template-columns: 1fr; padding: 16px 14px; gap: 14px; }
    }

    @media (max-width: 480px) {
      .modal-backdrop { padding: 0; align-items: flex-end; }
      .apply-modal { border-radius: 20px 20px 0 0; max-height: 95vh; }
      .score-ring-wrap { width: 56px; height: 56px; }
      .score-ring { width: 56px; height: 56px; }
    }
  `]
})
export class CandidateOffersComponent implements OnInit {
  offers: Offer[] = [];
  filteredOffers: Offer[] = [];
  appliedOffers: Set<string> = new Set();
  isLoading = true;
  errorMessage = '';
  candidateSkillsCount = -1;

  expandedSkills = new Set<string>();

  showApplyModal = false;
  applyingToOffer: Offer | null = null;
  cvFile: File | null = null;
  coverLetter = '';
  isApplying = false;
  applySuccess = false;
  applyError = '';
  isDraggingOver = false;
  limitError = '';
  private limitTimer: any = null;

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
    const user = this.authService.getCurrentUser();

    if (user?.role === 'candidate') {
      this.offerService.getRecommendedOffers().subscribe({
        next: ({ offers, candidateSkillsCount }) => {
          this.offers = offers;
          this.filteredOffers = offers;
          this.candidateSkillsCount = candidateSkillsCount;
          this.departments = [...new Set(offers.map(o => o.department))];
          this.locations = [...new Set(offers.map(o => o.location))];
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.message || 'Impossible de charger les offres compatibles.';
          this.isLoading = false;
        }
      });

      this.matchingService.getMyApplications().subscribe({
        next: (apps) => apps.forEach(app => this.appliedOffers.add(app.offerId)),
        error: () => {}
      });
      return;
    }

    this.offerService.getOffers().subscribe(offers => {
      this.offers = offers.filter(o => o.status === 'active' || o.status === 'published' || o.status === 'publiee');
      this.filteredOffers = this.offers;
      this.departments = [...new Set(this.offers.map(o => o.department))];
      this.locations = [...new Set(this.offers.map(o => o.location))];
      this.isLoading = false;
    });
  }

  toggleSkills(offerId: string): void {
    this.expandedSkills.has(offerId) ? this.expandedSkills.delete(offerId) : this.expandedSkills.add(offerId);
  }

  applyFilters(): void {
    this.filteredOffers = this.offers.filter(offer => {
      const q = this.searchQuery.toLowerCase();
      const matchesSearch = !q ||
        offer.title.toLowerCase().includes(q) ||
        offer.department.toLowerCase().includes(q) ||
        offer.location.toLowerCase().includes(q);
      const matchesDept     = !this.selectedDepartment || offer.department === this.selectedDepartment;
      const matchesLoc      = !this.selectedLocation   || offer.location === this.selectedLocation;
      const matchesDuration = !this.selectedDuration   || offer.duration.includes(this.selectedDuration);
      return matchesSearch && matchesDept && matchesLoc && matchesDuration;
    });
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedDepartment = '';
    this.selectedLocation = '';
    this.selectedDuration = '';
    this.applyFilters();
  }

  hasApplied(offerId: string): boolean { return this.appliedOffers.has(offerId); }

  applyToOffer(offer: Offer): void {
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 'candidate') return;

    if (this.appliedOffers.size >= 2) {
      this.limitError = 'Vous avez atteint la limite de 2 candidatures. Il n\'est pas possible de postuler à une 3ème offre.';
      clearTimeout(this.limitTimer);
      this.limitTimer = setTimeout(() => { this.limitError = ''; }, 4000);
      return;
    }

    this.applyingToOffer = offer;
    this.cvFile = null;
    this.coverLetter = '';
    this.applySuccess = false;
    this.applyError = '';
    this.isDraggingOver = false;
    this.showApplyModal = true;
  }

  closeApplyModal(): void {
    if (this.isApplying) return;
    this.showApplyModal = false;
    this.applyingToOffer = null;
    this.cvFile = null;
    this.coverLetter = '';
    this.applySuccess = false;
    this.applyError = '';
  }

  onFileSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.setFile(file);
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); this.isDraggingOver = true; }
  onDragLeave(): void { this.isDraggingOver = false; }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  private setFile(file: File): void {
    if (file.type !== 'application/pdf') { this.applyError = 'Seuls les fichiers PDF sont acceptés.'; return; }
    if (file.size > 5 * 1024 * 1024)     { this.applyError = 'Le fichier ne doit pas dépasser 5 Mo.'; return; }
    this.cvFile = file;
    this.applyError = '';
  }

  removeFile(event: Event): void { event.stopPropagation(); this.cvFile = null; }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  submitApplication(): void {
    if (!this.cvFile) { this.applyError = 'Veuillez joindre votre CV.'; return; }
    this.isApplying = true;
    this.applyError = '';
    const reader = new FileReader();
    reader.onload = () => {
      this.offerService.applyToOffer(this.applyingToOffer!.id, {
        cvBase64: reader.result as string,
        cvName: this.cvFile!.name,
        coverLetter: this.coverLetter.trim()
      }).subscribe({
        next: () => {
          this.appliedOffers.add(this.applyingToOffer!.id);
          this.isApplying = false;
          this.applySuccess = true;
        },
        error: (error) => {
          this.isApplying = false;
          if (error.message?.includes('Already applied'))
            this.applyError = 'Vous avez déjà postulé à cette offre.';
          else if (error.message?.includes('profile not found'))
            this.applyError = 'Profil incomplet. Complétez votre profil avant de postuler.';
          else if (error.message?.includes('limite') || error.message?.includes('2 candidatures'))
            this.applyError = '⚠️ Vous avez atteint la limite de 2 candidatures. Il n\'est pas possible de postuler à une 3ème offre.';
          else if (error.message?.includes('not authorized') || error.message?.includes('Forbidden'))
            this.applyError = 'Action non autorisée. Veuillez vous connecter avec votre compte candidat.';
          else
            this.applyError = error.message || 'Erreur lors de l\'envoi. Veuillez réessayer.';
        }
      });
    };
    reader.readAsDataURL(this.cvFile);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'date à définir';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  getRingStroke(score: number | undefined): string {
    const v = score || 0;
    if (v >= 75) return '#10b981';
    if (v >= 55) return '#f59e0b';
    return '#6366f1';
  }

  getRingStyle(score: number | undefined): string {
    const v = score || 0;
    const offset = 175.93 - (v / 100) * 175.93;
    return `stroke-dashoffset: ${offset}`;
  }
}
