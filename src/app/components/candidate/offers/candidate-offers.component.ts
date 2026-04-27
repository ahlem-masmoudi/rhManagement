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
          <h1>Offres recommandees</h1>
          <p class="text-muted">Nous affichons uniquement les offres compatibles avec votre profil et vos competences.</p>
        </div>
      </div>

      <div *ngIf="errorMessage" class="card feedback-card error-card">
        <strong>Impossible de charger les offres compatibles.</strong>
        <p>{{ errorMessage }}</p>
      </div>

      <div *ngIf="!errorMessage" class="card filters-section mb-lg">
        <div class="search-row">
          <div class="search-box">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
            </svg>
            <input
              type="search"
              [(ngModel)]="searchQuery"
              (input)="applyFilters()"
              placeholder="Rechercher par titre, departement, localisation...">
          </div>
        </div>

        <div class="filters-row">
          <div class="filter-group">
            <label>Departement</label>
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
            <label>Duree</label>
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
            Reinitialiser
          </button>
        </div>
      </div>

      <div *ngIf="isLoading" class="card feedback-card">
        <p>Analyse de votre profil et recherche des offres compatibles...</p>
      </div>

      <ng-container *ngIf="!isLoading && !errorMessage">
        <div class="results-header">
          <p class="results-count">{{ filteredOffers.length }} offre(s) compatible(s)</p>
        </div>

        <div class="offers-grid" *ngIf="filteredOffers.length > 0; else emptyState">
          <div *ngFor="let offer of filteredOffers" class="offer-card card">
            <div class="offer-header">
              <div class="offer-title-block">
                <h3>{{ offer.title }}</h3>
                <span class="compatibility-label">{{ offer.compatibilityLabel || 'Compatible' }}</span>
              </div>
              <div class="score-badge" [style.background]="getScoreColor(offer.compatibilityScore)">
                {{ offer.compatibilityScore || 0 }}%
              </div>
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
                Des le {{ formatDate(offer.startDate) }}
              </div>
            </div>

            <p class="offer-description">{{ offer.description }}</p>

            <div class="match-section" *ngIf="offer.matchedSkills?.length">
              <div class="match-title">Competences compatibles</div>
              <div class="offer-skills">
                <span *ngFor="let skill of offer.matchedSkills" class="skill-tag matched-tag">
                  {{ skill }}
                </span>
              </div>
            </div>

            <div class="match-section" *ngIf="offer.missingSkills?.length">
              <div class="match-title">Competences demandees</div>
              <div class="offer-skills">
                <ng-container *ngFor="let req of offer.missingSkills; let i = index">
                  <span
                    *ngIf="i < 4 || expandedSkills.has(offer.id)"
                    class="skill-tag missing-tag">
                    {{ req }}
                  </span>
                </ng-container>
                <span
                  *ngIf="(offer.missingSkills || []).length > 4 && !expandedSkills.has(offer.id)"
                  class="more-skills clickable"
                  (click)="toggleSkills(offer.id)">
                  +{{ (offer.missingSkills || []).length - 4 }} voir tout
                </span>
                <span
                  *ngIf="(offer.missingSkills || []).length > 4 && expandedSkills.has(offer.id)"
                  class="more-skills clickable"
                  (click)="toggleSkills(offer.id)">
                  Reduire
                </span>
              </div>
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
                {{ hasApplied(offer.id) ? 'Deja postule' : 'Postuler' }}
              </button>
            </div>
          </div>
        </div>
      </ng-container>

      <ng-template #emptyState>
        <div class="empty-state">
          <svg width="64" height="64" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
          </svg>
          <h3>Aucune offre disponible pour le moment</h3>
          <p *ngIf="candidateSkillsCount === 0">
            Votre profil ne contient pas encore de competences. Completez votre profil pour recevoir des recommandations.
          </p>
          <p *ngIf="candidateSkillsCount > 0">
            Aucune offre active n'a ete trouvee dans le systeme. Revenez plus tard ou contactez l'equipe RH.
          </p>
          <p *ngIf="candidateSkillsCount < 0">
            Verifiez que le serveur backend est demarré et que des offres ont ete creees.
          </p>
        </div>
      </ng-template>

      <!-- Apply Modal -->
      <div class="modal-backdrop" *ngIf="showApplyModal" (click)="closeApplyModal()">
        <div class="apply-modal" (click)="$event.stopPropagation()">

          <!-- Success state -->
          <div *ngIf="applySuccess" class="apply-success">
            <div class="success-icon">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#10b981" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3>Candidature envoyee avec succes !</h3>
            <p>Votre candidature pour <strong>{{ applyingToOffer?.title }}</strong> a bien ete transmise. L'equipe RH vous contactera prochainement.</p>
            <button class="btn btn-primary" (click)="closeApplyModal()">Fermer</button>
          </div>

          <!-- Form state -->
          <ng-container *ngIf="!applySuccess">
            <div class="apply-modal-header">
              <div>
                <h2>Postuler a l'offre</h2>
                <p class="text-muted">{{ applyingToOffer?.title }} — {{ applyingToOffer?.department }}</p>
              </div>
              <button class="close-btn" (click)="closeApplyModal()">
                <svg width="22" height="22" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>
            </div>

            <div class="apply-modal-body">
              <!-- CV Upload -->
              <div class="form-group">
                <label class="field-label">CV <span class="required">*</span></label>
                <div
                  class="drop-zone"
                  [class.drag-over]="isDraggingOver"
                  [class.has-file]="cvFile"
                  (dragover)="onDragOver($event)"
                  (dragleave)="onDragLeave()"
                  (drop)="onDrop($event)"
                  (click)="fileInput.click()">
                  <input #fileInput type="file" accept=".pdf" style="display:none" (change)="onFileSelect($event)">
                  <ng-container *ngIf="!cvFile">
                    <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                    <p class="drop-zone-text">Glissez votre CV ici ou <span class="link-text">cliquez pour parcourir</span></p>
                    <p class="drop-zone-hint">PDF uniquement — max 5 Mo</p>
                  </ng-container>
                  <ng-container *ngIf="cvFile">
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#ef4444" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p class="file-name">{{ cvFile.name }}</p>
                    <p class="file-size">{{ formatFileSize(cvFile.size) }}</p>
                    <button type="button" class="remove-file" (click)="removeFile($event)">Supprimer</button>
                  </ng-container>
                </div>
                <p *ngIf="applyError && !cvFile" class="field-error-msg">Veuillez joindre votre CV.</p>
              </div>

              <!-- Cover Letter -->
              <div class="form-group">
                <label class="field-label">Lettre de motivation <span class="optional">(optionnel)</span></label>
                <textarea
                  [(ngModel)]="coverLetter"
                  placeholder="Expliquez pourquoi vous etes interesse par ce poste, vos motivations..."
                  rows="5"
                  class="cover-letter-input"></textarea>
              </div>

              <p *ngIf="applyError" class="submit-error">{{ applyError }}</p>
            </div>

            <div class="apply-modal-footer">
              <button class="btn btn-secondary" (click)="closeApplyModal()" [disabled]="isApplying">Annuler</button>
              <button class="btn btn-primary" (click)="submitApplication()" [disabled]="isApplying || !cvFile">
                <span *ngIf="!isApplying">Envoyer ma candidature</span>
                <span *ngIf="isApplying">Envoi en cours...</span>
              </button>
            </div>
          </ng-container>
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

    .filters-section,
    .feedback-card {
      padding: var(--spacing-lg);
    }

    .error-card {
      border: 1px solid #fecaca;
      background: #fef2f2;
      color: #991b1b;
    }

    .error-card p,
    .feedback-card p {
      margin: 8px 0 0;
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

    .results-header {
      margin-bottom: var(--spacing-md);
    }

    .results-count {
      font-size: 14px;
      color: var(--gray-600);
      margin: 0;
    }

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

    .offer-title-block {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    .offer-header h3 {
      font-size: 16px;
      margin: 0;
      line-height: 1.4;
    }

    .compatibility-label {
      font-size: 12px;
      font-weight: 700;
      color: #4338ca;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .score-badge {
      min-width: 68px;
      height: 68px;
      border-radius: 18px;
      display: grid;
      place-items: center;
      color: white;
      font-size: 20px;
      font-weight: 800;
      box-shadow: 0 18px 30px rgba(79, 70, 229, 0.18);
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

    .match-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .match-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--gray-700);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .offer-skills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .skill-tag {
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 500;
    }

    .matched-tag {
      background: #dcfce7;
      color: #166534;
    }

    .missing-tag {
      background: #eef2ff;
      color: #4338ca;
    }

    .more-skills {
      background: var(--gray-100);
      color: var(--gray-600);
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 500;
    }

    .more-skills.clickable {
      cursor: pointer;
      user-select: none;
      transition: background 0.15s, color 0.15s;
    }

    .more-skills.clickable:hover {
      background: #e0e7ff;
      color: #4338ca;
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

    .empty-state {
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

      .offer-header,
      .offer-footer {
        flex-direction: column;
        align-items: stretch;
      }

      .score-badge {
        width: 68px;
      }
    }

    /* ── Apply Modal ── */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .apply-modal {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 560px;
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    }

    .apply-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 28px 28px 20px;
      border-bottom: 1px solid #f0f0f0;
    }

    .apply-modal-header h2 {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 4px;
    }

    .apply-modal-header .text-muted {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #9ca3af;
      padding: 4px;
      border-radius: 8px;
      transition: background 0.15s;
      flex-shrink: 0;
    }

    .close-btn:hover { background: #f3f4f6; color: #374151; }

    .apply-modal-body {
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group { display: flex; flex-direction: column; gap: 8px; }

    .field-label {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .required { color: #ef4444; }
    .optional { font-weight: 400; color: #9ca3af; font-size: 13px; }

    .drop-zone {
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      padding: 32px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      background: #fafafa;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .drop-zone:hover, .drop-zone.drag-over {
      border-color: #6366f1;
      background: #eef2ff;
    }

    .drop-zone.has-file {
      border-color: #10b981;
      background: #f0fdf4;
      border-style: solid;
    }

    .drop-zone-text {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }

    .link-text { color: #6366f1; font-weight: 600; }

    .drop-zone-hint {
      font-size: 12px;
      color: #9ca3af;
      margin: 0;
    }

    .file-name {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin: 0;
    }

    .file-size { font-size: 12px; color: #9ca3af; margin: 0; }

    .remove-file {
      background: none;
      border: 1px solid #fca5a5;
      color: #ef4444;
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 20px;
      cursor: pointer;
      margin-top: 4px;
      transition: all 0.15s;
    }

    .remove-file:hover { background: #fef2f2; }

    .cover-letter-input {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      resize: vertical;
      font-family: inherit;
      color: #374151;
      transition: border-color 0.15s;
      box-sizing: border-box;
    }

    .cover-letter-input:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    }

    .field-error-msg, .submit-error {
      font-size: 13px;
      color: #ef4444;
      margin: 0;
    }

    .apply-modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 28px 24px;
      border-top: 1px solid #f0f0f0;
    }

    /* Success state */
    .apply-success {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 48px 32px;
      gap: 16px;
    }

    .success-icon {
      width: 80px;
      height: 80px;
      background: #dcfce7;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .apply-success h3 {
      font-size: 20px;
      font-weight: 700;
      color: #166534;
      margin: 0;
    }

    .apply-success p {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
      max-width: 360px;
      line-height: 1.6;
    }

    @media (max-width: 480px) {
      .modal-backdrop { padding: 0; align-items: flex-end; }
      .apply-modal { border-radius: 16px 16px 0 0; max-height: 95vh; }
      .apply-modal-body { padding: 16px; }
      .apply-modal-header { padding: 16px; }
      .apply-modal-footer { padding: 12px 16px; flex-direction: column; }
      .apply-modal-footer button { width: 100%; justify-content: center; }
      .score-badge { width: 52px !important; height: 52px; font-size: 16px; }
    }
  `]
})
export class CandidateOffersComponent implements OnInit {
  offers: Offer[] = [];
  filteredOffers: Offer[] = [];
  appliedOffers: Set<string> = new Set();
  isLoading = true;
  errorMessage = '';
  candidateSkillsCount = -1; // -1 = unknown, 0 = no skills, >0 = has skills

  // Expanded skills state per offer
  expandedSkills = new Set<string>();

  toggleSkills(offerId: string): void {
    if (this.expandedSkills.has(offerId)) {
      this.expandedSkills.delete(offerId);
    } else {
      this.expandedSkills.add(offerId);
    }
  }

  // Apply modal state
  showApplyModal = false;
  applyingToOffer: Offer | null = null;
  cvFile: File | null = null;
  coverLetter = '';
  isApplying = false;
  applySuccess = false;
  applyError = '';
  isDraggingOver = false;

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
        next: (apps) => {
          apps.forEach(app => {
            this.appliedOffers.add(app.offerId);
          });
        },
        error: (error) => {
          console.error('Error loading applications:', error);
        }
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

  applyFilters(): void {
    this.filteredOffers = this.offers.filter(offer => {
      const matchesSearch =
        !this.searchQuery ||
        offer.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        offer.department.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        offer.location.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesDepartment = !this.selectedDepartment || offer.department === this.selectedDepartment;
      const matchesLocation = !this.selectedLocation || offer.location === this.selectedLocation;
      const matchesDuration = !this.selectedDuration || offer.duration.includes(this.selectedDuration);

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
    if (user.role !== 'candidate') return;
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
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.setFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver = true;
  }

  onDragLeave(): void {
    this.isDraggingOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  private setFile(file: File): void {
    if (file.type !== 'application/pdf') {
      this.applyError = 'Seuls les fichiers PDF sont acceptes.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.applyError = 'Le fichier ne doit pas depasser 5 Mo.';
      return;
    }
    this.cvFile = file;
    this.applyError = '';
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.cvFile = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  submitApplication(): void {
    if (!this.cvFile) {
      this.applyError = 'Veuillez joindre votre CV.';
      return;
    }
    this.isApplying = true;
    this.applyError = '';

    const reader = new FileReader();
    reader.onload = () => {
      const cvBase64 = reader.result as string;
      this.offerService.applyToOffer(this.applyingToOffer!.id, {
        cvBase64,
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
          if (error.message?.includes('Already applied')) {
            this.applyError = 'Vous avez deja postule a cette offre.';
          } else if (error.message?.includes('profile not found')) {
            this.applyError = 'Profil incomplet. Veuillez completer votre profil avant de postuler.';
          } else {
            this.applyError = error.message || 'Erreur lors de l\'envoi. Veuillez reessayer.';
          }
        }
      });
    };
    reader.readAsDataURL(this.cvFile);
  }

  formatDate(dateString: string): string {
    if (!dateString) {
      return 'date a definir';
    }

    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  getScoreColor(score: number | undefined): string {
    const value = score || 0;
    if (value >= 75) return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    if (value >= 55) return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
  }
}
