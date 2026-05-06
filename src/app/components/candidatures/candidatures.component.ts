import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CandidateService } from '../../services/candidate.service';
import { MatchingService } from '../../services/matching.service';
import { OfferService } from '../../services/offer.service';
import { Candidate, CandidateStatus, Application, Offer } from '../../models';
import { BulkStatusUpdateComponent } from '../bulk-status/bulk-status-update.component';

@Component({
  selector: 'app-candidatures',
  standalone: true,
  imports: [CommonModule, FormsModule, BulkStatusUpdateComponent],
  template: `
    <div class="candidatures-page">
      <div class="page-header">
        <div>
          <h1>Pipeline de candidatures</h1>
          <p class="text-muted">Gérez le parcours de vos candidats</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="showWeightsPanel = !showWeightsPanel">
            ⚖️ Critères de scoring
          </button>
          <button class="btn-secondary" (click)="toggleSelectMode()">
            {{ selectMode ? '✓ Mode sélection' : '☑️ Sélectionner' }}
          </button>
          <span *ngIf="selectedCandidates.size > 0" class="selection-count-badge">
            {{ selectedCandidates.size }} sélectionné(s)
          </span>
        </div>
      </div>

      <!-- Scoring weights panel -->
      <div class="weights-panel card mb-lg" *ngIf="showWeightsPanel">
        <div class="weights-header">
          <div>
            <h3 style="margin:0 0 2px">Critères de scoring</h3>
            <p style="margin:0;font-size:13px;color:var(--gray-500)">Ajustez les poids — les scores se recalculent en temps réel</p>
          </div>
          <div class="weights-total-wrap">
            <button class="btn-secondary btn-sm" (click)="resetWeights()">Réinitialiser</button>
          </div>
        </div>
        <div class="weights-grid">
          <div *ngFor="let c of criteriaList" class="weight-row">
            <span class="weight-label">{{ c.label }}</span>
            <input type="range" min="0" max="100" step="5"
                   [value]="weights[c.key]"
                   (input)="onWeightChange(c.key, $event)"
                   class="weight-slider">
            <span class="weight-value">{{ weights[c.key] }}%</span>
          </div>
        </div>
      </div>

      <!-- Document preview modal -->
      <div *ngIf="previewVisible" class="doc-preview-overlay" (click)="closePreview()">
        <div class="doc-preview" (click)="$event.stopPropagation()">
          <div class="doc-preview-header">
            <h3 style="margin:0">{{ previewData?.name }}</h3>
            <button class="btn-secondary" (click)="closePreview()">Fermer</button>
          </div>

            <div class="doc-preview-body">
              <ng-container *ngIf="previewData && previewData.mime === 'application/pdf'">
                <object [data]="getPreviewDataUrl()" type="application/pdf" width="100%" height="600">Votre navigateur ne peut pas afficher le PDF.</object>
              </ng-container>
              <ng-container *ngIf="previewData && previewData.mime && previewData.mime.indexOf('image/') === 0">
                <img [src]="getPreviewDataUrl()" alt="{{ previewData.name }}" style="max-width:100%; max-height:600px; display:block; margin:auto;" />
              </ng-container>
              <ng-container *ngIf="previewData && previewData.mime === 'text/plain'">
                <pre style="white-space:pre-wrap; max-height:600px; overflow:auto">{{ previewData.content }}</pre>
              </ng-container>
              <ng-container *ngIf="previewData && previewData.mime === 'application/octet-stream'">
                <p>Prévisualisation non disponible pour ce type de fichier. Vous pouvez le télécharger.</p>
              </ng-container>
            </div>

          <div class="doc-preview-footer">
            <button class="btn-primary" (click)="saveContentAsFilePublic(previewData?.name || 'document', previewData?.content || '')">Télécharger</button>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card filters-bar mb-lg">
        <input type="search" placeholder="Rechercher un candidat..." class="search-input" [(ngModel)]="searchTerm">
        <select [(ngModel)]="selectedOffer">
          <option value="">Toutes les offres</option>
          <option *ngFor="let o of offers" [value]="o.id">{{ o.title || ('Offre ' + o.id) }}</option>
        </select>
        <select [(ngModel)]="selectedScoreRange">
          <option value="">Tous les scores</option>
          <option value="80-100">80-100</option>
          <option value="60-79">60-79</option>
          <option value="0-59">0-59</option>
        </select>
        <label class="location-filter" title="Filtrer par ville de l'offre">
          <input type="checkbox" [(ngModel)]="filterByLocation" [disabled]="!selectedOffer">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
          </svg>
          Même ville
        </label>
      </div>

      <!-- Kanban Board -->
      <div class="kanban-board">
        <div class="kanban-column" *ngFor="let column of kanbanColumns">
          <div class="column-header">
            <h3>{{ column.title }}</h3>
            <span class="column-count">{{ getColumnCount(column.status) }}</span>
          </div>

          <div class="column-body">
      <div *ngFor="let application of getPagedApplications(column.status)"
        class="candidate-card"
        [class.selected]="isCandidateSelected(application.candidateId)"
        [class.accepted]="application.status === 'offre_acceptee'"
        (click)="handleCardClick(application.candidateId, $event)">
              
              <!-- Checkbox en mode sélection -->
              <div *ngIf="selectMode" class="selection-checkbox" (click)="$event.stopPropagation()">
                <input type="checkbox" 
                       [checked]="isCandidateSelected(application.candidateId)"
                       (change)="toggleCandidateSelection(application.candidateId)">
              </div>

              <div class="card-header-row">
                <div class="candidate-avatar">{{ getInitials(application.candidateId) }}</div>
                <div class="score-badge" [style.background]="getScoreColor(computeScore(application))">
                  {{ computeScore(application) }}
                </div>
              </div>

              <h4 class="candidate-name">{{ getCandidateName(application.candidateId) }}</h4>
              <p class="candidate-school">{{ getCandidateSchool(application.candidateId) }}</p>

              <!-- Badge for accepted candidates -->
              <div *ngIf="application.status === 'offre_acceptee'" class="accepted-badge">
                Accepté
              </div>

              <div class="candidate-skills">
                <span *ngFor="let skill of getCandidateSkills(application.candidateId).slice(0, 3)" class="skill-tag">
                  {{ skill.name }}
                </span>
              </div>

              <div class="card-footer">
                <div class="candidate-meta">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                  </svg>
                  {{ formatDate(application.appliedAt) }}
                </div>
                <div class="card-actions" (click)="$event.stopPropagation()">
                  <button class="icon-btn" (click)="toggleDropdown(application.id, $event)">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                    </svg>
                  </button>
                  <div class="status-dropdown" *ngIf="activeDropdown === application.id"
                       [style.top.px]="dropdownY" [style.left.px]="dropdownX">
                    <div class="dropdown-item" *ngFor="let opt of statusDropdownOptions"
                         [class.active]="application.status === opt.status"
                         [class.item-accept]="opt.status === 'offre_acceptee'"
                         [class.item-reject]="opt.status === 'rejete'"
                         (click)="changeStatus(application, opt.status)">
                      {{ opt.title }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination controls -->
          <div class="column-pagination" *ngIf="getColumnCount(column.status) > pageSize">
            <button class="pag-btn" [disabled]="getPage(column.status) === 0" (click)="prevPage(column.status)">‹</button>
            <span class="pag-info">{{ getPage(column.status) + 1 }} / {{ getTotalPages(column.status) }}</span>
            <button class="pag-btn" [disabled]="getPage(column.status) >= getTotalPages(column.status) - 1" (click)="nextPage(column.status)">›</button>
          </div>
        </div>
      </div>

      <!-- Composant de mise à jour en masse -->
      <app-bulk-status-update
        [selectedCandidates]="getSelectedCandidates()"
        (selectionCleared)="clearSelection()"
        (statusUpdated)="onStatusUpdated()">
      </app-bulk-status-update>
    </div>
  `,
  styles: [`
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .candidatures-page { max-width: 100%; animation: fadeUp 0.4s ease both; }

    /* ── Page Header ── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 24px 28px;
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 55%, #24243e 100%);
      border-radius: 18px;
      position: relative;
      overflow: hidden;
    }
    .page-header::before {
      content: '';
      position: absolute;
      width: 280px; height: 280px;
      background: radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%);
      top: -100px; right: -60px;
      border-radius: 50%;
      pointer-events: none;
    }
    .page-header h1 { color: white; font-size: 22px; font-weight: 700; margin: 0 0 4px; }
    .page-header .text-muted { color: rgba(255,255,255,0.55); font-size: 13px; margin: 0; }

    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
      position: relative;
      z-index: 1;
    }
    .btn-secondary {
      padding: 9px 16px;
      border: 1.5px solid rgba(255,255,255,0.2);
      border-radius: 10px;
      background: rgba(255,255,255,0.1);
      color: white;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      backdrop-filter: blur(4px);
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.4); }

    .selection-count-badge {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      padding: 7px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(99,102,241,0.4);
    }

    /* ── Filters ── */
    .filters-bar {
      display: flex;
      gap: 10px;
      padding: 14px 18px;
      background: white;
      border-radius: 14px;
      margin-bottom: 20px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      border: 1px solid rgba(99,102,241,0.08);
      align-items: center;
    }
    .search-input {
      flex: 1;
      min-width: 120px;
      padding: 9px 14px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 13px;
      background: #f9fafb;
      outline: none;
      transition: all 0.2s;
    }
    .filters-bar select {
      padding: 9px 14px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 13px;
      background: #f9fafb;
      outline: none;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .search-input:focus, .filters-bar select:focus {
      border-color: #6366f1;
      background: white;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    }

    /* ── Kanban Board ── */
    .kanban-board {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      padding-bottom: 12px;
      scrollbar-width: thin;
      scrollbar-color: rgba(99,102,241,0.2) transparent;
    }
    .kanban-board::-webkit-scrollbar { height: 5px; }
    .kanban-board::-webkit-scrollbar-track { background: transparent; }
    .kanban-board::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.25); border-radius: 999px; }

    .kanban-column {
      flex: 0 0 284px;
      background: #f8f9fc;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(0,0,0,0.06);
    }

    .column-header {
      padding: 14px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid rgba(0,0,0,0.06);
      background: white;
      border-radius: 16px 16px 0 0;
      position: relative;
      overflow: hidden;
    }
    .column-header::before {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      opacity: 0.7;
    }
    .column-header h3 {
      font-size: 13px;
      font-weight: 700;
      color: #374151;
      margin: 0;
    }
    .column-count {
      background: #EEF2FF;
      color: #6366f1;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
    }

    .column-body {
      padding: 12px;
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 580px;
    }

    /* ── Candidate Card ── */
    .candidate-card {
      background: white;
      border-radius: 12px;
      padding: 14px;
      border: 1px solid rgba(0,0,0,0.07);
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      overflow: visible;
    }
    .candidate-card:hover {
      box-shadow: 0 8px 24px rgba(99,102,241,0.12);
      transform: translateY(-3px);
      border-color: rgba(99,102,241,0.2);
    }
    .candidate-card.selected {
      border-color: #6366f1;
      background: #f5f3ff;
      box-shadow: 0 0 0 2.5px #6366f1;
    }
    .candidate-card.accepted {
      border-color: #059669;
      background: linear-gradient(145deg, #f0fdf4, #ecfdf5);
      box-shadow: 0 0 0 2px rgba(5,150,105,0.15);
    }
    .accepted-badge {
      position: absolute;
      top: -10px; right: 12px;
      background: linear-gradient(135deg, #059669, #10b981);
      color: white;
      padding: 4px 10px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 10px;
      box-shadow: 0 3px 8px rgba(5,150,105,0.3);
      z-index: 20;
      letter-spacing: 0.3px;
    }
    .selection-checkbox { position: absolute; top: 8px; left: 8px; z-index: 10; }
    .selection-checkbox input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; accent-color: #6366f1; }

    .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .candidate-avatar {
      width: 38px; height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      box-shadow: 0 3px 10px rgba(99,102,241,0.3);
    }
    .score-badge {
      width: 34px; height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 12px;
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .candidate-name { font-size: 14px; font-weight: 700; color: #111827; margin: 0 0 3px; }
    .candidate-school { font-size: 12px; color: #9CA3AF; margin: 0 0 10px; }
    .candidate-skills { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
    .skill-tag {
      background: #EEF2FF;
      color: #6366f1;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
    }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid #f3f4f6;
    }
    .candidate-meta {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #9CA3AF;
    }
    .card-actions { display: flex; gap: 4px; position: relative; }
    .status-dropdown {
      position: fixed;
      background: white;
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.15);
      z-index: 9999;
      min-width: 200px;
      max-height: 340px;
      overflow-y: auto;
    }
    .dropdown-item {
      padding: 9px 14px;
      font-size: 13px;
      color: #374151;
      cursor: pointer;
      transition: background 0.15s;
    }
    .dropdown-item:hover { background: #f9fafb; }
    .dropdown-item.active { background: #EEF2FF; color: #6366f1; font-weight: 600; }
    .dropdown-item.item-accept { color: #16a34a; font-weight: 600; border-top: 1px solid #f0fdf4; margin-top: 4px; padding-top: 10px; }
    .dropdown-item.item-accept:hover { background: #f0fdf4; }
    .dropdown-item.item-reject { color: #dc2626; }
    .dropdown-item.item-reject:hover { background: #fef2f2; }

    .icon-btn {
      width: 28px; height: 28px;
      border-radius: 8px;
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #D1D5DB;
      transition: all 0.2s;
    }
    .icon-btn:hover { background: #f3f4f6; color: #6366f1; }

    .column-pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      border-top: 1px solid rgba(0,0,0,0.06);
      background: white;
      border-radius: 0 0 16px 16px;
    }
    .pag-btn {
      width: 28px; height: 28px;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      font-size: 15px;
      color: #6B7280;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    .pag-btn:hover:not(:disabled) { background: #EEF2FF; border-color: #6366f1; color: #6366f1; }
    .pag-btn:disabled { opacity: 0.3; cursor: default; }
    .pag-info { font-size: 12px; color: #9CA3AF; min-width: 40px; text-align: center; }

    /* Location filter */
    .location-filter {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; color: #374151; cursor: pointer;
      white-space: nowrap; user-select: none; padding: 9px 12px;
      border: 1.5px solid #e5e7eb; border-radius: 10px;
      background: #f9fafb; transition: all 0.15s;
    }
    .location-filter:has(input:checked) { background: #EEF2FF; border-color: #6366f1; color: #6366f1; font-weight: 600; }
    .location-filter:has(input:disabled) { opacity: 0.45; cursor: not-allowed; }
    .location-filter input { accent-color: #6366f1; cursor: pointer; }
    .location-filter svg { flex-shrink: 0; }

    /* Weights panel */
    .weights-panel {
      padding: 20px 24px;
      background: white;
      border-radius: 14px;
      margin-bottom: 20px;
      border: 1px solid rgba(99,102,241,0.1);
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    }
    .weights-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .weights-header h3 { color: #111827; }
    .weights-total-wrap { display: flex; align-items: center; gap: 12px; }
    .weights-total { font-weight: 700; font-size: 14px; padding: 5px 14px; border-radius: 999px; }
    .weights-ok   { background: #D1FAE5; color: #065F46; }
    .weights-warn { background: #FEE2E2; color: #991B1B; }
    .weights-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px 32px; }
    .weight-row { display: flex; align-items: center; gap: 12px; }
    .weight-label { font-size: 13px; color: #374151; width: 160px; flex-shrink: 0; }
    .weight-slider { flex: 1; accent-color: #6366f1; }
    .weight-value { font-size: 13px; font-weight: 700; color: #6366f1; width: 36px; text-align: right; flex-shrink: 0; }
    .btn-sm {
      padding: 7px 14px;
      font-size: 13px;
      border: 1.5px solid rgba(255,255,255,0.25);
      border-radius: 9px;
      background: rgba(255,255,255,0.12);
      color: white;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 600;
    }
    .btn-sm:hover { background: rgba(255,255,255,0.22); }

    /* Reset button inside white weights panel — override dark-header btn styles */
    .weights-panel .btn-sm {
      border: 1.5px solid #e5e7eb;
      background: white;
      color: #374151;
    }
    .weights-panel .btn-sm:hover { background: #f5f3ff; border-color: #6366f1; color: #6366f1; }

    /* Preview modal */
    .doc-preview-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(5px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .doc-preview {
      background: white;
      border-radius: 18px;
      box-shadow: 0 25px 80px rgba(0,0,0,0.3);
      max-width: 860px; width: 100%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .doc-preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 22px;
      background: linear-gradient(135deg, #0f0c29, #302b63);
    }
    .doc-preview-header h3 { margin: 0; color: white; font-size: 16px; }
    .doc-preview-header .btn-secondary {
      border: 1.5px solid rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.1);
      color: white;
      padding: 7px 16px;
      border-radius: 9px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .doc-preview-header .btn-secondary:hover { background: rgba(255,255,255,0.2); }
    .doc-preview-body { flex: 1; overflow: auto; padding: 0; }
    .doc-preview-footer {
      padding: 14px 20px;
      border-top: 1px solid #f3f4f6;
      display: flex;
      justify-content: flex-end;
    }
    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      padding: 10px 22px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(99,102,241,0.4);
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.5); }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; align-items: flex-start; gap: 16px; padding: 20px; }
      .header-actions { width: 100%; flex-wrap: wrap; }
      .filters-bar { flex-direction: column; gap: 8px; }
      .filters-bar select, .filters-bar .search-input { width: 100%; }
      .kanban-board { scroll-snap-type: x mandatory; gap: 12px; }
      .kanban-column { flex: 0 0 calc(100vw - 80px); min-width: calc(100vw - 80px); scroll-snap-align: start; }
    }
    @media (max-width: 480px) {
      .kanban-column { flex: 0 0 calc(100vw - 48px); min-width: calc(100vw - 48px); }
      .candidate-card { padding: 12px; }
      .candidate-name { font-size: 13px; }
    }
  `]
})
export class CandidaturesComponent implements OnInit {
  applications: Application[] = [];
  candidates: Candidate[] = [];
  offers: Offer[] = [];
  // --- Scoring weights ---
  showWeightsPanel = false;
  weights: Record<string, number> = { skills: 25, experience: 20, education: 10, semantic: 20, title: 5, bonus: 5, completeness: 15 };
  private readonly defaultWeights = { skills: 25, experience: 20, education: 10, semantic: 20, title: 5, bonus: 5, completeness: 15 };
  readonly criteriaList = [
    { key: 'skills',       label: 'Compétences' },
    { key: 'experience',   label: 'Expérience' },
    { key: 'education',    label: 'Diplôme' },
    { key: 'semantic',     label: 'Similarité sémantique' },
    { key: 'title',        label: 'Alignement du poste' },
    { key: 'bonus',        label: 'Signaux bonus' },
    { key: 'completeness', label: 'Structure du CV' },
  ];
  filterByLocation = false;
  private _selectedOffer: string = '';
  private _searchTerm: string = '';
  private _selectedScoreRange: string = '';

  get selectedOffer() { return this._selectedOffer; }
  set selectedOffer(v: string) { this._selectedOffer = v; this.columnPages = {}; if (!v) this.filterByLocation = false; }

  get searchTerm() { return this._searchTerm; }
  set searchTerm(v: string) { this._searchTerm = v; this.columnPages = {}; }

  get selectedScoreRange() { return this._selectedScoreRange; }
  set selectedScoreRange(v: string) { this._selectedScoreRange = v; this.columnPages = {}; }
  selectMode = false;
  selectedCandidates: Set<string> = new Set();
  
  kanbanColumns = [
    { status: 'nouveau' as CandidateStatus, title: 'Nouveau' },
    { status: 'preselectionne' as CandidateStatus, title: 'Présélection' },
    { status: 'en_attente_documents' as CandidateStatus, title: 'En attente de documents' },
    { status: 'documents_recus' as CandidateStatus, title: 'Documents reçus' },
    { status: 'entretien_programme' as CandidateStatus, title: 'Entretien' },
    { status: 'test_technique' as CandidateStatus, title: 'Test technique' },
    { status: 'offre_envoyee' as CandidateStatus, title: 'Offre envoyée' },
    { status: 'rejete' as CandidateStatus, title: 'Rejeté' }
  ];

  statusDropdownOptions = [
    { status: 'nouveau' as CandidateStatus, title: 'Nouveau' },
    { status: 'preselectionne' as CandidateStatus, title: 'Présélection' },
    { status: 'en_attente_documents' as CandidateStatus, title: 'En attente de documents' },
    { status: 'documents_recus' as CandidateStatus, title: 'Documents reçus' },
    { status: 'entretien_programme' as CandidateStatus, title: 'Entretien' },
    { status: 'test_technique' as CandidateStatus, title: 'Test technique' },
    { status: 'offre_envoyee' as CandidateStatus, title: 'Offre envoyée' },
    { status: 'offre_acceptee' as CandidateStatus, title: 'Accepté ✓' },
    { status: 'rejete' as CandidateStatus, title: 'Rejeté' }
  ];

  constructor(
    private candidateService: CandidateService,
    private matchingService: MatchingService,
    private offerService: OfferService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.matchingService.getApplications().subscribe(applications => {
      this.applications = applications;
      console.log('Applications loaded in component:', this.applications);
    });

    // Load candidate objects so getSelectedCandidates() can return the actual Candidate[]
    // (selectedCandidates is a Set of ids; we need the candidate list to map ids -> objects
    // for the bulk component input)
    this.candidateService.getCandidates().subscribe(candidates => {
      this.candidates = candidates;
      // keep a quick log for debugging selection issues
      console.log('Candidates loaded in component:', this.candidates.length);
    });

    // Load offers for the filter dropdown
    this.offerService.getOffers().subscribe(offers => {
      this.offers = offers;
      console.log('Offers loaded in candidatures component:', this.offers.length);
    });
  }

  toggleSelectMode(): void {
    this.selectMode = !this.selectMode;
    if (!this.selectMode) {
      this.selectedCandidates.clear();
    }
  }

  toggleCandidateSelection(candidateId: string): void {
    if (this.selectedCandidates.has(candidateId)) {
      this.selectedCandidates.delete(candidateId);
    } else {
      this.selectedCandidates.add(candidateId);
    }
  }

  isCandidateSelected(candidateId: string): boolean {
    return this.selectedCandidates.has(candidateId);
  }

  handleCardClick(candidateId: string, event: Event): void {
    if (this.selectMode) {
      this.toggleCandidateSelection(candidateId);
    } else {
      // Navigation vers le profil du candidat (relative path since we're inside /rh)
      this.router.navigate(['/rh/profil', candidateId]);
    }
  }

  getSelectedCandidates(): Candidate[] {
    return this.candidates.filter(c => this.selectedCandidates.has(c.id));
  }

  clearSelection(): void {
    this.selectedCandidates.clear();
    this.selectMode = false;
  }

  onStatusUpdated(): void {
    this.ngOnInit();
  }

  // --- Pagination ---
  readonly pageSize = 5;
  private columnPages: Record<string, number> = {};

  getPage(status: string): number {
    return this.columnPages[status] ?? 0;
  }

  getTotalPages(status: CandidateStatus): number {
    return Math.ceil(this.getColumnCount(status) / this.pageSize) || 1;
  }

  getPagedApplications(status: CandidateStatus): Application[] {
    const all = this.getApplicationsByStatus(status);
    const page = this.getPage(status);
    return all.slice(page * this.pageSize, (page + 1) * this.pageSize);
  }

  prevPage(status: string): void {
    this.columnPages[status] = Math.max(0, this.getPage(status) - 1);
  }

  nextPage(status: string): void {
    const max = this.getTotalPages(status as CandidateStatus) - 1;
    this.columnPages[status] = Math.min(max, this.getPage(status) + 1);
  }

  activeDropdown: string | null = null;
  dropdownX = 0;
  dropdownY = 0;

  toggleDropdown(appId: string, event: MouseEvent): void {
    if (this.activeDropdown === appId) {
      this.activeDropdown = null;
      return;
    }
    this.activeDropdown = appId;
    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    const dropdownH = 310; // approx max-height
    const spaceBelow = window.innerHeight - rect.bottom;
    this.dropdownX = Math.max(4, rect.right - 200);
    this.dropdownY = spaceBelow >= dropdownH
      ? rect.bottom + 4
      : rect.top - dropdownH - 4;
  }

  changeStatus(application: any, newStatus: string): void {
    this.activeDropdown = null;
    this.candidateService.bulkUpdateStatus({
      candidateIds: [application.candidateId],
      newStatus: newStatus as any,
      sendEmail: false
    }).subscribe(() => this.onStatusUpdated());
  }

  getApplicationsByStatus(status: CandidateStatus): Application[] {
    return this.applications
      .filter(app => app.status === status)
      .filter(app => !this.selectedOffer || app.offerId === this.selectedOffer)
      .filter(app => {
        // Text search across candidate name, email and skills
        if (!this.searchTerm) return true;
        const term = this.searchTerm.toLowerCase();
        const cand = app.candidate || {} as any;
        const fullName = `${cand.firstName || ''} ${cand.lastName || ''}`.toLowerCase();
        const email = (cand.email || '').toLowerCase();
        const skills = (cand.skills || []).join(' ').toLowerCase();
        return fullName.includes(term) || email.includes(term) || skills.includes(term);
      })
      .filter(app => {
        if (!this.selectedScoreRange) return true;
        const score = this.computeScore(app);
        if (this.selectedScoreRange === '80-100') return score >= 80 && score <= 100;
        if (this.selectedScoreRange === '60-79') return score >= 60 && score <= 79;
        if (this.selectedScoreRange === '0-59') return score >= 0 && score <= 59;
        return true;
      })
      .filter(app => {
        if (!this.filterByLocation || !this.selectedOffer) return true;
        const offer = this.offers.find(o => o.id === this.selectedOffer);
        if (!offer?.location) return true;
        return this.sameLocation(app.candidate?.location, offer.location);
      });
  }

  getColumnCount(status: CandidateStatus): number {
    return this.getApplicationsByStatus(status).length;
  }

  getCandidateName(candidateId: string): string {
    const application = this.applications.find(app => app.candidateId === candidateId);
    if (application && application.candidate) {
      return `${application.candidate.firstName} ${application.candidate.lastName}`;
    }
    return '';
  }

  getInitials(candidateId: string): string {
    const application = this.applications.find(app => app.candidateId === candidateId);
    if (application && application.candidate) {
      const firstInitial = application.candidate.firstName?.[0] || '';
      const lastInitial = application.candidate.lastName?.[0] || '';
      return firstInitial + lastInitial;
    }
    return '?';
  }

  getCandidateSchool(candidateId: string): string {
    const application = this.applications.find(app => app.candidateId === candidateId);
    return application?.candidate?.school || '';
  }

  getCandidateSkills(candidateId: string): any[] {
    const application = this.applications.find(app => app.candidateId === candidateId);
    const skills = application?.candidate?.skills || [];
    // Convert string array to objects with name property for template
    return skills.map((skill: string) => ({ name: skill }));
  }

  private sameLocation(candidateLoc: string | undefined, offerLoc: string): boolean {
    if (!candidateLoc) return false;
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    const c = norm(candidateLoc);
    const o = norm(offerLoc);
    return c.includes(o) || o.includes(c);
  }

  // --- Scoring weight helpers ---
  get weightsTotal(): number {
    return Object.values(this.weights).reduce((s, v) => s + v, 0);
  }

  onWeightChange(key: string, event: Event): void {
    this.weights = { ...this.weights, [key]: Number((event.target as HTMLInputElement).value) };
  }

  resetWeights(): void {
    this.weights = { ...this.defaultWeights };
  }

  computeScore(app: Application): number {
    const bd = app.matchingScore?.breakdown;
    if (!bd || Object.values(bd).every(v => v === null)) {
      return app.matchingScore?.global ?? 0;
    }
    const w = this.weights;
    const total = Object.values(w).reduce((s, v) => s + v, 0);
    if (total <= 0) return 0;
    return Math.round(
      (w['skills']       / total) * (bd.skills_score       ?? 0) +
      (w['experience']   / total) * (bd.experience_score   ?? 0) +
      (w['education']    / total) * (bd.education_score    ?? 0) +
      (w['semantic']     / total) * (bd.semantic_score     ?? 0) +
      (w['title']        / total) * (bd.title_score        ?? 0) +
      (w['bonus']        / total) * (bd.bonus_score        ?? 0) +
      (w['completeness'] / total) * (bd.completeness_score ?? 0)
    );
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
    if (score >= 60) return 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)';
    return 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  // Download a single document for a candidate
  downloadSingleDocument(candidateId: string, docId: string, filename?: string): void {
    this.candidateService.downloadDocument(candidateId, docId).subscribe(resp => {
      const name = resp.name || filename || 'document';
      const content = resp.content || '';
      this.saveContentAsFile(name, content);
    }, err => {
      console.error('Failed to download document', err);
      alert('Erreur lors du téléchargement du document.');
    });
  }

  downloadAllDocuments(app: Application): void {
    if (!app?.candidateId) return;
    // Fetch full candidate record (contains documents)
    this.candidateService.getCandidateFull(app.candidateId).subscribe(candidate => {
      const docs = candidate.documents || [];
      if (!docs || docs.length === 0) {
        alert('Aucun document disponible pour ce candidat.');
        return;
      }

      // Download each document sequentially
      docs.forEach((doc: any) => {
        this.candidateService.downloadDocument(app.candidateId, doc.id).subscribe(resp => {
          const name = resp.name || doc.name || 'document';
          const content = resp.content || doc.content || '';
          this.saveContentAsFile(name, content);
        }, err => {
          console.error('Failed to download document', err);
        });
      });
    }, err => {
      console.error('Failed to load candidate for documents', err);
    });
  }

  private saveContentAsFile(filename: string, content: string) {
    try {
      // Try to treat content as base64
      const byteChars = atob(content);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // Fallback: save as plain text
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  }

  // Public wrapper so template can call download (private method is not accessible from template)
  saveContentAsFilePublic(filename: string, content: string) {
    this.saveContentAsFile(filename, content);
  }

  // --- Document preview modal ---
  previewVisible: boolean = false;
  previewData: { name?: string; content?: string; mime?: string } | null = null;

  openPreview(candidateId: string, docId: string) {
    this.candidateService.downloadDocument(candidateId, docId).subscribe(resp => {
      this.previewData = {
        name: resp.name || 'document',
        content: resp.content || '',
        mime: this.detectMimeType(resp.name || '')
      };
      this.previewVisible = true;
    }, err => {
      console.error('Failed to load document for preview', err);
      alert('Impossible de charger le document pour prévisualisation.');
    });
  }

  closePreview() {
    this.previewVisible = false;
    this.previewData = null;
  }

  private detectMimeType(filename: string): string {
    const lower = (filename || '').toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.txt') || lower.endsWith('.csv')) return 'text/plain';
    return 'application/octet-stream';
  }

  // Return a data URL suitable for embedding in img/object/src
  getPreviewDataUrl(): string {
    if (!this.previewData || !this.previewData.content) return '';
    const mime = this.previewData.mime || 'application/octet-stream';
    // If content looks like base64 (no spaces and contains padding), assume base64
    const isBase64 = /^[A-Za-z0-9+/=\s]+$/.test(this.previewData.content.trim());
    if (isBase64) {
      return `data:${mime};base64,${this.previewData.content}`;
    }
    // otherwise, URI encode the plain text
    return `data:${mime};charset=utf-8,${encodeURIComponent(this.previewData.content)}`;
  }
}
