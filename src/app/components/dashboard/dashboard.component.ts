import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

declare const Plotly: any;

const STATUS_LABELS: Record<string, string> = {
  nouveau:              'Nouveau',
  preselectionne:       'Présélectionné',
  en_attente_documents: 'Att. documents',
  documents_recus:      'Docs reçus',
  entretien_programme:  'Entretien prévu',
  entretien_realise:    'Entretien réalisé',
  offre_acceptee:       'Accepté(e) ✓',
  offre_refusee:        'Refusé(e)',
  rejete:               'Refusé(e)',
  abandonne:            'Refusé(e)',
  validation_finale:    'Accepté(e) ✓',
  offre_envoyee:        'Accepté(e) ✓',
};

const STATUS_COLORS: Record<string, string> = {
  nouveau:              '#6B7280',
  preselectionne:       '#3B82F6',
  en_attente_documents: '#F59E0B',
  documents_recus:      '#8B5CF6',
  entretien_programme:  '#06B6D4',
  entretien_realise:    '#0EA5E9',
  offre_acceptee:       '#059669',
  offre_refusee:        '#DC2626',
  rejete:               '#DC2626',
  abandonne:            '#9CA3AF',
  validation_finale:    '#059669',
  offre_envoyee:        '#059669',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dash-page">

      <!-- Header -->
      <div class="dash-header">
        <div>
          <h1 class="dash-greeting">{{ getGreeting() }}, <span class="dash-name">{{ firstName }}</span> 👋</h1>
          <p class="dash-sub">Tableau de bord RH — {{ today | date:'EEEE d MMMM yyyy' }}</p>
        </div>
        <div class="dash-meta">
          <button class="btn-refresh" (click)="load()" [disabled]="loading" title="Actualiser">
            <svg [class.spin]="loading" width="15" height="15" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      <!-- Loading / Error -->
      <div *ngIf="error" class="alert-error">⚠ Impossible de charger les données : {{ error }}</div>

      <!-- KPI Cards -->
      <div class="kpi-grid" *ngIf="kpi">
        <div class="kpi-card kpi-indigo">
          <div class="kpi-left">
            <div class="kpi-val">{{ kpi.totalCandidates }}</div>
            <div class="kpi-lbl">Total candidats</div>
            <div class="kpi-bar"><div class="kpi-bar-fill" style="width:100%;background:#4F46E5"></div></div>
          </div>
          <div class="kpi-icon-wrap" style="background:rgba(79,70,229,.12)">
            <svg width="24" height="24" fill="#4F46E5" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
          </div>
        </div>
        <div class="kpi-card kpi-emerald">
          <div class="kpi-left">
            <div class="kpi-val">{{ kpi.activeOffers }}</div>
            <div class="kpi-lbl">Offres actives</div>
            <div class="kpi-bar"><div class="kpi-bar-fill" style="width:100%;background:#10B981"></div></div>
          </div>
          <div class="kpi-icon-wrap" style="background:rgba(16,185,129,.12)">
            <svg width="24" height="24" fill="#10B981" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"/><path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/></svg>
          </div>
        </div>
        <div class="kpi-card kpi-amber">
          <div class="kpi-left">
            <div class="kpi-val">{{ kpi.totalApplications }}</div>
            <div class="kpi-lbl">Candidatures reçues</div>
            <div class="kpi-bar"><div class="kpi-bar-fill" style="width:100%;background:#F59E0B"></div></div>
          </div>
          <div class="kpi-icon-wrap" style="background:rgba(245,158,11,.12)">
            <svg width="24" height="24" fill="#F59E0B" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
          </div>
        </div>
        <div class="kpi-card kpi-violet">
          <div class="kpi-left">
            <div class="kpi-val">{{ kpi.acceptanceRate }}<span class="kpi-unit">%</span></div>
            <div class="kpi-lbl">Taux d'acceptation</div>
            <div class="kpi-bar"><div class="kpi-bar-fill" [style.width]="kpi.acceptanceRate+'%'" style="background:#8B5CF6"></div></div>
          </div>
          <div class="kpi-icon-wrap" style="background:rgba(139,92,246,.12)">
            <svg width="24" height="24" fill="#8B5CF6" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          </div>
        </div>
        <div class="kpi-card kpi-blue">
          <div class="kpi-left">
            <div class="kpi-val">{{ kpi.avgScore }}<span class="kpi-unit">%</span></div>
            <div class="kpi-lbl">Score matching moyen</div>
            <div class="kpi-bar"><div class="kpi-bar-fill" [style.width]="kpi.avgScore+'%'" style="background:#3B82F6"></div></div>
          </div>
          <div class="kpi-icon-wrap" style="background:rgba(59,130,246,.12)">
            <svg width="24" height="24" fill="#3B82F6" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          </div>
        </div>
        <div class="kpi-card kpi-red">
          <div class="kpi-left">
            <div class="kpi-val">{{ kpi.pendingDocuments }}</div>
            <div class="kpi-lbl">En attente documents</div>
            <div class="kpi-bar"><div class="kpi-bar-fill" style="width:100%;background:#EF4444"></div></div>
          </div>
          <div class="kpi-icon-wrap" style="background:rgba(239,68,68,.12)">
            <svg width="24" height="24" fill="#EF4444" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
          </div>
        </div>
      </div>

      <!-- Skeleton KPIs -->
      <div class="kpi-grid" *ngIf="!kpi && loading">
        <div *ngFor="let i of [1,2,3,4,5,6]" class="kpi-card skeleton-card">
          <div class="sk-box sk-icon"></div>
          <div style="flex:1"><div class="sk-box sk-val"></div><div class="sk-box sk-lbl"></div></div>
        </div>
      </div>

      <!-- Tab navigation -->
      <div class="tab-nav" *ngIf="dataReady">
        <button class="tab-btn" [class.active]="activeTab==='overview'" (click)="setTab('overview')">
          <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
          Aperçu général
        </button>
        <button class="tab-btn" [class.active]="activeTab==='pipeline'" (click)="setTab('pipeline')">
          <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3z" clip-rule="evenodd"/></svg>
          Pipeline & Conversion
        </button>
        <button class="tab-btn" [class.active]="activeTab==='profiles'" (click)="setTab('profiles')">
          <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
          Profils candidats
        </button>
      </div>

      <!-- ── TAB 1: APERÇU GÉNÉRAL ── -->
      <div class="charts-grid" *ngIf="dataReady && activeTab==='overview'">

        <!-- Donut + Filter panel -->
        <div class="chart-card chart-span-12">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:#8B5CF6"><svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg></div>
              <span>Répartition statuts</span>
            </div>
            <span class="filter-badge" *ngIf="selectedLocations.length || selectedDepartments.length">
              {{ selectedLocations.length + selectedDepartments.length }} filtre(s) actif(s)
            </span>
          </div>
          <div class="chart-with-filters">
            <!-- Filter panel -->
            <div class="filter-panel">
              <div class="filter-panel-head">Filtres</div>

              <div class="filter-section">
                <div class="filter-section-label">Région</div>
                <div class="filter-list">
                  <label class="filter-item" *ngFor="let loc of allLocations">
                    <input type="checkbox" [checked]="selectedLocations.includes(loc.city)" (change)="toggleLocation(loc.city)">
                    <span class="filter-item-text">{{ loc.city }}</span>
                    <span class="filter-count">{{ loc.count }}</span>
                  </label>
                </div>
              </div>

              <div class="filter-section">
                <div class="filter-section-label">Département</div>
                <div class="filter-list">
                  <label class="filter-item" *ngFor="let dept of allDepartments">
                    <input type="checkbox" [checked]="selectedDepartments.includes(dept.name)" (change)="toggleDepartment(dept.name)">
                    <span class="filter-item-text">{{ dept.name }}</span>
                    <span class="filter-count">{{ dept.count }}</span>
                  </label>
                </div>
              </div>

              <button class="filter-reset-btn" *ngIf="selectedLocations.length || selectedDepartments.length" (click)="resetDonutFilters()">
                Réinitialiser
              </button>
            </div>

            <!-- Chart area -->
            <div class="filter-chart-area">
              <div class="filter-loading-overlay" *ngIf="donutFiltering">
                <div class="filter-spinner"></div>
              </div>
              <div id="chart-donut" class="chart-body" style="height:340px"></div>
            </div>
          </div>
        </div>

        <!-- Monthly evolution -->
        <div class="chart-card chart-span-12">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:#10B981"><svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg></div>
              <span>Évolution mensuelle des candidatures</span>
            </div>
          </div>
          <div id="chart-monthly" class="chart-body"></div>
        </div>
      </div>

      <!-- ── TAB 2: PIPELINE & CONVERSION ── -->
      <div *ngIf="dataReady && activeTab==='pipeline'">
        <div class="charts-grid">

          <!-- Offers chart + Filter panel -->
          <div class="chart-card chart-span-8">
            <div class="chart-header">
              <div class="chart-title-wrap">
                <div class="chart-icon" style="background:#F59E0B"><svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clip-rule="evenodd"/></svg></div>
                <span>Performance des offres</span>
              </div>
              <span class="filter-badge" *ngIf="selectedEducation.length || selectedSchools.length">
                {{ selectedEducation.length + selectedSchools.length }} filtre(s) actif(s)
              </span>
            </div>
            <div class="chart-with-filters">
              <!-- Filter panel -->
              <div class="filter-panel">
                <div class="filter-panel-head">Filtres</div>

                <div class="filter-section">
                  <div class="filter-section-label">Niveau d'études</div>
                  <div class="filter-list">
                    <label class="filter-item" *ngFor="let edu of allEducation">
                      <input type="checkbox" [checked]="selectedEducation.includes(edu.name)" (change)="toggleEducation(edu.name)">
                      <span class="filter-item-text">{{ edu.name }}</span>
                      <span class="filter-count">{{ edu.count }}</span>
                    </label>
                  </div>
                </div>

                <div class="filter-section">
                  <div class="filter-section-label">Établissement</div>
                  <div class="filter-list">
                    <label class="filter-item" *ngFor="let s of allSchools">
                      <input type="checkbox" [checked]="selectedSchools.includes(s.name)" (change)="toggleSchool(s.name)">
                      <span class="filter-item-text">{{ s.name }}</span>
                      <span class="filter-count">{{ s.count }}</span>
                    </label>
                  </div>
                </div>

                <button class="filter-reset-btn" *ngIf="selectedEducation.length || selectedSchools.length" (click)="resetOffersFilters()">
                  Réinitialiser
                </button>
              </div>

              <!-- Chart area -->
              <div class="filter-chart-area">
                <div class="filter-loading-overlay" *ngIf="offersFiltering">
                  <div class="filter-spinner"></div>
                </div>
                <div id="chart-offers" class="chart-body"></div>
              </div>
            </div>
          </div>

          <!-- Monthly conversion table -->
          <div class="chart-card chart-span-4">
            <div class="chart-header">
              <div class="chart-title-wrap">
                <div class="chart-icon" style="background:#0EA5E9"><svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clip-rule="evenodd"/></svg></div>
                <span>Conversion par mois</span>
              </div>
            </div>
            <div class="table-wrap">
              <table class="conv-table">
                <thead>
                  <tr><th>Mois</th><th>Total</th><th>Acceptés</th><th>Taux</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let m of monthlyTableData">
                    <td class="td-month">{{ m.label }}</td>
                    <td class="td-num">{{ m.total }}</td>
                    <td class="td-num td-green">{{ m.accepted }}</td>
                    <td class="td-rate">
                      <div class="rate-wrap">
                        <div class="rate-bar"><div class="rate-fill" [style.width]="m.rate+'%'"></div></div>
                        <span>{{ m.rate }}%</span>
                      </div>
                    </td>
                  </tr>
                  <tr class="tr-total">
                    <td>Total</td>
                    <td class="td-num">{{ totalMonthly.total }}</td>
                    <td class="td-num td-green">{{ totalMonthly.accepted }}</td>
                    <td class="td-rate"><strong>{{ totalMonthly.rate }}%</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="chart-card chart-span-12">
            <div class="chart-header">
              <div class="chart-title-wrap">
                <div class="chart-icon" style="background:#0EA5E9"><svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/></svg></div>
                <span>Candidatures par département</span>
              </div>
            </div>
            <div id="chart-departments" class="chart-body"></div>
          </div>

          <div class="chart-card chart-span-12">
            <div class="chart-header">
              <div class="chart-title-wrap">
                <div class="chart-icon" style="background:#4F46E5"><svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg></div>
                <span>Répartition par période</span>
              </div>
              <div class="period-filter">
                <button class="period-btn" [class.active]="periodMode==='year'" (click)="setPeriodMode('year')">Par an</button>
                <button class="period-btn" [class.active]="periodMode==='semester'" (click)="setPeriodMode('semester')">Par semestre</button>
                <button class="period-btn" [class.active]="periodMode==='quarter'" (click)="setPeriodMode('quarter')">Par trimestre</button>
              </div>
            </div>
            <div id="chart-period" class="chart-body"></div>
          </div>
        </div>
      </div>

      <!-- ── TAB 3: PROFILS CANDIDATS ── -->
      <div class="charts-grid" *ngIf="dataReady && activeTab==='profiles'">
        <div class="chart-card chart-span-6">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:#F59E0B"><svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zm5.99 7.176A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/></svg></div>
              <span>Top établissements</span>
            </div>
          </div>
          <div id="chart-schools" class="chart-body"></div>
        </div>
        <div class="chart-card chart-span-6">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:#06B6D4"><svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/></svg></div>
              <span>Top compétences</span>
            </div>
          </div>
          <div id="chart-skills" class="chart-body"></div>
        </div>
        <div class="chart-card chart-span-4">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:#8B5CF6"><svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/></svg></div>
              <span>Niveaux d'études</span>
            </div>
          </div>
          <div id="chart-education" class="chart-body"></div>
        </div>
        <div class="chart-card chart-span-4">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:#EC4899"><svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg></div>
              <span>Répartition par ville</span>
            </div>
          </div>
          <div id="chart-cities" class="chart-body"></div>
        </div>
        <div class="chart-card chart-span-4">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:#3B82F6"><svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg></div>
              <span>Distribution scores matching</span>
            </div>
          </div>
          <div id="chart-scores" class="chart-body"></div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .dash-page { max-width: 1400px; }

    /* Header */
    .dash-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
    .dash-greeting { font-size: 24px; font-weight: 800; margin: 0 0 4px; color: #111827; }
    .dash-name { color: #4F46E5; }
    .dash-sub { margin: 0; color: #6B7280; font-size: 13px; }
    .dash-meta { display: flex; align-items: center; gap: 10px; }
    .btn-refresh {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 14px; border-radius: 10px; font-size: 13px; font-weight: 600;
      background: white; border: 1px solid #E5E7EB; cursor: pointer; color: #6B7280; transition: all .2s;
    }
    .btn-refresh:hover { background: #EEF2FF; color: #4F46E5; border-color: #C7D2FE; }
    .btn-refresh:disabled { opacity: .5; cursor: not-allowed; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin .8s linear infinite; }

    /* Alert */
    .alert-error { background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; font-size: 13px; }

    /* KPI Cards */
    .kpi-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; margin-bottom: 20px; }
    .kpi-card {
      background: white; border-radius: 16px; padding: 18px 16px;
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06); border: 1px solid #F3F4F6;
      transition: transform .2s, box-shadow .2s;
    }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.1); }
    .kpi-left { flex: 1; min-width: 0; }
    .kpi-val { font-size: 2rem; font-weight: 900; color: #111827; line-height: 1; }
    .kpi-unit { font-size: 1.1rem; font-weight: 700; color: #6B7280; }
    .kpi-lbl { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: #9CA3AF; margin: 4px 0 8px; }
    .kpi-bar { height: 4px; background: #F3F4F6; border-radius: 4px; overflow: hidden; }
    .kpi-bar-fill { height: 100%; border-radius: 4px; transition: width .6s ease; }
    .kpi-icon-wrap { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

    /* Skeleton */
    .skeleton-card { border: 1px solid #F3F4F6; }
    .sk-box { border-radius: 8px; background: linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
    .sk-icon { width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0; }
    .sk-val { height: 28px; margin-bottom: 6px; width: 60%; }
    .sk-lbl { height: 12px; width: 80%; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* Tab navigation */
    .tab-nav {
      display: flex; gap: 4px; margin-bottom: 16px;
      background: white; border: 1px solid #E5E7EB; border-radius: 14px; padding: 6px;
      width: fit-content;
    }
    .tab-btn {
      display: flex; align-items: center; gap: 7px;
      padding: 9px 18px; border-radius: 10px; font-size: 13px; font-weight: 600;
      border: none; background: transparent; color: #6B7280; cursor: pointer; transition: all .2s;
    }
    .tab-btn:hover { background: #F3F4F6; color: #374151; }
    .tab-btn.active { background: #4F46E5; color: white; }

    /* Charts grid */
    .charts-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 14px; }
    .chart-card { background: white; border-radius: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06); border: 1px solid #F3F4F6; overflow: hidden; }
    .chart-span-12 { grid-column: span 12; }
    .chart-span-8  { grid-column: span 8; }
    .chart-span-6  { grid-column: span 6; }
    .chart-span-4  { grid-column: span 4; }

    .chart-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px 0; }
    .chart-title-wrap { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; color: #374151; }
    .chart-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .chart-body { padding: 4px 4px 8px; }

    /* Period filter */
    .period-filter { display: flex; gap: 6px; }
    .period-btn { font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; border: 1px solid #E5E7EB; background: white; color: #6B7280; cursor: pointer; transition: all .15s; }
    .period-btn:hover { background: #EEF2FF; color: #4F46E5; border-color: #C7D2FE; }
    .period-btn.active { background: #4F46E5; color: white; border-color: #4F46E5; }

    /* Conversion table */
    .table-wrap { overflow-x: auto; padding: 8px 16px 16px; }
    .conv-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .conv-table th { padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #9CA3AF; border-bottom: 2px solid #F3F4F6; }
    .conv-table td { padding: 7px 10px; border-bottom: 1px solid #F9FAFB; color: #374151; }
    .td-month { font-weight: 600; color: #1F2937; }
    .td-num { text-align: center; font-weight: 600; }
    .td-green { color: #059669; }
    .td-rate { min-width: 120px; }
    .rate-wrap { display: flex; align-items: center; gap: 8px; }
    .rate-bar { flex: 1; height: 6px; background: #F3F4F6; border-radius: 4px; overflow: hidden; }
    .rate-fill { height: 100%; background: linear-gradient(90deg, #4F46E5, #8B5CF6); border-radius: 4px; }
    .tr-total { background: #F8F9FF; font-weight: 700; }
    .tr-total td { border-top: 2px solid #E5E7EB; color: #1F2937; }

    /* ── Filter panel ── */
    .filter-badge {
      font-size: 11px; font-weight: 600;
      color: #4F46E5; background: #EEF2FF; border: 1px solid #C7D2FE;
      padding: 2px 10px; border-radius: 20px;
    }

    .chart-with-filters {
      display: flex;
      min-height: 300px;
    }

    .filter-panel {
      width: 196px;
      flex-shrink: 0;
      border-right: 1px solid #F3F4F6;
      padding: 12px 14px 16px;
      overflow-y: auto;
      max-height: 420px;
    }

    .filter-panel-head {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .7px;
      color: #9CA3AF;
      margin-bottom: 12px;
    }

    .filter-section {
      margin-bottom: 14px;
    }

    .filter-section-label {
      font-size: 11px;
      font-weight: 700;
      color: #374151;
      margin-bottom: 7px;
      padding-bottom: 5px;
      border-bottom: 1px solid #F3F4F6;
    }

    .filter-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: 150px;
      overflow-y: auto;
    }

    .filter-list::-webkit-scrollbar { width: 3px; }
    .filter-list::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 2px; }

    .filter-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      color: #374151;
      cursor: pointer;
      padding: 4px 5px;
      border-radius: 6px;
      transition: background .12s;
      line-height: 1.2;
    }

    .filter-item:hover { background: #F3F4F6; }

    .filter-item input[type=checkbox] {
      accent-color: #4F46E5;
      cursor: pointer;
      flex-shrink: 0;
      width: 13px;
      height: 13px;
    }

    .filter-item-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .filter-count {
      font-size: 10px;
      font-weight: 600;
      color: #9CA3AF;
      background: #F3F4F6;
      padding: 1px 5px;
      border-radius: 10px;
      flex-shrink: 0;
    }

    .filter-chart-area {
      flex: 1;
      min-width: 0;
      position: relative;
    }

    .filter-loading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }

    .filter-spinner {
      width: 26px;
      height: 26px;
      border: 3px solid #E5E7EB;
      border-top-color: #4F46E5;
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }

    .filter-reset-btn {
      width: 100%;
      margin-top: 10px;
      padding: 6px 0;
      font-size: 11px;
      font-weight: 600;
      color: #DC2626;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 8px;
      cursor: pointer;
      transition: background .15s;
    }

    .filter-reset-btn:hover { background: #FEE2E2; }

    /* Responsive */
    @media (max-width: 1200px) {
      .kpi-grid { grid-template-columns: repeat(3, 1fr); }
      .chart-span-8 { grid-column: span 12; }
      .chart-span-4 { grid-column: span 6; }
    }
    @media (max-width: 900px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .chart-span-6, .chart-span-4 { grid-column: span 12; }
      .tab-nav { flex-wrap: wrap; width: auto; }
      .filter-panel { width: 160px; }
    }
    @media (max-width: 640px) {
      .chart-with-filters { flex-direction: column; }
      .filter-panel { width: 100%; max-height: none; border-right: none; border-bottom: 1px solid #F3F4F6; }
      .filter-list { max-height: none; flex-direction: row; flex-wrap: wrap; }
    }
    @media (max-width: 480px) {
      .kpi-grid { grid-template-columns: 1fr; }
      .kpi-val { font-size: 1.6rem; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  today      = new Date();
  firstName  = '';
  loading    = false;
  dataReady  = false;
  error      = '';
  kpi: any   = null;
  activeTab: 'overview' | 'pipeline' | 'profiles' = 'overview';
  periodMode: 'year' | 'semester' | 'quarter' = 'year';

  monthlyTableData: { label: string; total: number; accepted: number; rate: number }[] = [];
  totalMonthly = { total: 0, accepted: 0, rate: 0 };

  // Filter state (arrays for Angular change detection)
  selectedLocations:   string[] = [];
  selectedDepartments: string[] = [];
  selectedEducation:   string[] = [];
  selectedSchools:     string[] = [];

  // Available filter options (populated from analytics load)
  allLocations:   { city: string;  count: number }[] = [];
  allDepartments: { name: string;  count: number }[] = [];
  allEducation:   { name: string;  count: number }[] = [];
  allSchools:     { name: string;  count: number }[] = [];

  donutFiltering  = false;
  offersFiltering = false;

  private analyticsData: any = null;

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    this.firstName = user?.firstName || user?.email?.split('@')[0] || 'RH';
    this.load();
  }

  ngOnDestroy(): void {
    ['donut','monthly','schools','scores','skills','period','cities','departments','offers','education'].forEach(id => {
      const el = document.getElementById(`chart-${id}`);
      if (el && (window as any)['Plotly']) Plotly.purge(el);
    });
  }

  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  setTab(tab: 'overview' | 'pipeline' | 'profiles'): void {
    this.activeTab = tab;
    if (this.dataReady) setTimeout(() => this.renderTab(tab), 60);
  }

  load(): void {
    this.loading = true;
    this.error   = '';
    const token  = localStorage.getItem('authToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<any>(`${environment.apiUrl}/analytics`, { headers }).subscribe({
      next: (res) => {
        this.analyticsData  = res.data;
        this.kpi            = res.data.overview;
        this.loading        = false;
        this.dataReady      = true;
        this.allLocations   = res.data.locations   || [];
        this.allDepartments = res.data.departments || [];
        this.allEducation   = res.data.educationLevels || [];
        this.allSchools     = (res.data.schools || []).slice(0, 12);
        this.buildMonthlyTable(res.data.monthly);
        setTimeout(() => this.renderTab(this.activeTab), 80);
      },
      error: (err) => {
        this.loading = false;
        this.error   = err.error?.message || err.message || 'Erreur serveur';
      },
    });
  }

  // ── Filter toggles ──────────────────────────────────────────────

  toggleLocation(city: string): void {
    const i = this.selectedLocations.indexOf(city);
    this.selectedLocations = i === -1
      ? [...this.selectedLocations, city]
      : this.selectedLocations.filter(v => v !== city);
    this.loadFilteredPipeline();
  }

  toggleDepartment(name: string): void {
    const i = this.selectedDepartments.indexOf(name);
    this.selectedDepartments = i === -1
      ? [...this.selectedDepartments, name]
      : this.selectedDepartments.filter(v => v !== name);
    this.loadFilteredPipeline();
  }

  toggleEducation(name: string): void {
    const i = this.selectedEducation.indexOf(name);
    this.selectedEducation = i === -1
      ? [...this.selectedEducation, name]
      : this.selectedEducation.filter(v => v !== name);
    this.loadFilteredOffers();
  }

  toggleSchool(name: string): void {
    const i = this.selectedSchools.indexOf(name);
    this.selectedSchools = i === -1
      ? [...this.selectedSchools, name]
      : this.selectedSchools.filter(v => v !== name);
    this.loadFilteredOffers();
  }

  resetDonutFilters(): void {
    this.selectedLocations   = [];
    this.selectedDepartments = [];
    setTimeout(() => this.renderDonut(this.analyticsData?.pipeline), 0);
  }

  resetOffersFilters(): void {
    this.selectedEducation = [];
    this.selectedSchools   = [];
    setTimeout(() => this.renderOfferStats(this.analyticsData?.offerStats), 0);
  }

  private loadFilteredPipeline(): void {
    if (!this.selectedLocations.length && !this.selectedDepartments.length) {
      setTimeout(() => this.renderDonut(this.analyticsData?.pipeline), 0);
      return;
    }
    this.donutFiltering = true;
    const token   = localStorage.getItem('authToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    let params    = new HttpParams();
    this.selectedLocations.forEach(r   => { params = params.append('regions',     r); });
    this.selectedDepartments.forEach(d => { params = params.append('departments', d); });

    this.http.get<any>(`${environment.apiUrl}/analytics/pipeline`, { headers, params }).subscribe({
      next:  (res) => { this.donutFiltering = false; setTimeout(() => this.renderDonut(res.data.pipeline), 0); },
      error: ()    => { this.donutFiltering = false; },
    });
  }

  private loadFilteredOffers(): void {
    if (!this.selectedEducation.length && !this.selectedSchools.length) {
      setTimeout(() => this.renderOfferStats(this.analyticsData?.offerStats), 0);
      return;
    }
    this.offersFiltering = true;
    const token   = localStorage.getItem('authToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    let params    = new HttpParams();
    this.selectedEducation.forEach(e => { params = params.append('educationLevels', e); });
    this.selectedSchools.forEach(s   => { params = params.append('schools', s); });

    this.http.get<any>(`${environment.apiUrl}/analytics/offers`, { headers, params }).subscribe({
      next:  (res) => { this.offersFiltering = false; setTimeout(() => this.renderOfferStats(res.data.offerStats), 0); },
      error: ()    => { this.offersFiltering = false; },
    });
  }

  // ── Data helpers ─────────────────────────────────────────────────

  private buildMonthlyTable(monthly: any[]): void {
    if (!monthly?.length) return;
    this.monthlyTableData = monthly.map(m => ({
      label: m.label,
      total: m.total,
      accepted: m.accepted,
      rate: m.total > 0 ? Math.round(m.accepted / m.total * 1000) / 10 : 0,
    }));
    const tot = monthly.reduce((s, m) => s + m.total, 0);
    const acc = monthly.reduce((s, m) => s + m.accepted, 0);
    this.totalMonthly = { total: tot, accepted: acc, rate: tot > 0 ? Math.round(acc / tot * 1000) / 10 : 0 };
  }

  private renderTab(tab: string): void {
    const d = this.analyticsData;
    if (!d || typeof Plotly === 'undefined') return;
    if (tab === 'overview') {
      this.renderDonut(d.pipeline);
      this.renderMonthly(d.monthly);
    } else if (tab === 'pipeline') {
      this.renderOfferStats(d.offerStats);
      this.renderDepartments(d.departments);
      this.renderPeriod(d.monthly);
    } else if (tab === 'profiles') {
      this.renderSchools(d.schools);
      this.renderSkills(d.skills);
      this.renderEducation(d.educationLevels);
      this.renderCities(d.locations);
      this.renderScores(d.scores);
    }
  }

  setPeriodMode(mode: 'year' | 'semester' | 'quarter'): void {
    this.periodMode = mode;
    this.renderPeriod(this.analyticsData?.monthly);
  }

  private cfg = { displayModeBar: false, responsive: true };

  private baseLayout(extraH = 0): any {
    return {
      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
      font: { family: 'Inter, -apple-system, sans-serif', size: 11, color: '#374151' },
      margin: { t: 16, b: 40, l: 48, r: 16 },
      height: 280 + extraH,
      xaxis: { gridcolor: '#F3F4F6', linecolor: '#E5E7EB', zerolinecolor: '#E5E7EB' },
      yaxis: { gridcolor: '#F3F4F6', linecolor: '#E5E7EB', zerolinecolor: '#E5E7EB' },
    };
  }

  private renderDonut(pipeline: any[]): void {
    if (!pipeline?.length) return;
    const filtered = pipeline.filter((p: any) => p.status && STATUS_LABELS[p.status]);
    if (!filtered.length) return;
    Plotly.newPlot('chart-donut', [{
      type: 'pie', hole: 0.55,
      labels: filtered.map((p: any) => STATUS_LABELS[p.status]),
      values: filtered.map((p: any) => p.count),
      marker: { colors: filtered.map((p: any) => STATUS_COLORS[p.status] || '#6B7280') },
      textfont: { size: 10 }, textposition: 'inside',
      hovertemplate: '<b>%{label}</b><br>%{value} (%{percent})<extra></extra>',
    }], {
      paper_bgcolor: 'transparent', font: { family: 'Inter, sans-serif', size: 11 },
      margin: { t: 20, b: 20, l: 20, r: 20 }, height: 320,
      showlegend: true, legend: { font: { size: 10 }, orientation: 'v', x: 1.02 },
    }, this.cfg);
  }

  private renderMonthly(monthly: any[]): void {
    if (!monthly?.length) return;
    Plotly.newPlot('chart-monthly', [
      {
        type: 'scatter', mode: 'lines+markers', name: 'Candidatures',
        x: monthly.map((m: any) => m.label), y: monthly.map((m: any) => m.total),
        fill: 'tozeroy', fillcolor: 'rgba(79,70,229,.08)',
        line: { color: '#4F46E5', width: 2.5 }, marker: { color: '#4F46E5', size: 5 },
      },
      {
        type: 'scatter', mode: 'lines+markers', name: 'Acceptés',
        x: monthly.map((m: any) => m.label), y: monthly.map((m: any) => m.accepted),
        fill: 'tozeroy', fillcolor: 'rgba(16,185,129,.06)',
        line: { color: '#10B981', width: 2, dash: 'dot' }, marker: { color: '#10B981', size: 5 },
      },
    ], { ...this.baseLayout(), height: 260, legend: { orientation: 'h', y: 1.12, x: 0, font: { size: 10 } } }, this.cfg);
  }

  private renderOfferStats(offerStats: any[]): void {
    if (!offerStats?.length) return;
    const top = offerStats.slice(0, 8);
    const labels = top.map((o: any) => o.title.length > 30 ? o.title.slice(0, 30) + '…' : o.title);
    Plotly.newPlot('chart-offers', [
      {
        type: 'bar', name: 'Candidatures', orientation: 'h',
        y: labels, x: top.map((o: any) => o.total),
        marker: { color: '#818CF8' },
        text: top.map((o: any) => o.total.toString()), textposition: 'outside',
      },
      {
        type: 'bar', name: 'Acceptés', orientation: 'h',
        y: labels, x: top.map((o: any) => o.accepted),
        marker: { color: '#34D399' },
        text: top.map((o: any) => o.accepted.toString()), textposition: 'outside',
      },
    ], {
      ...this.baseLayout(top.length * 10),
      barmode: 'group', margin: { t: 16, b: 30, l: 180, r: 60 },
      legend: { orientation: 'h', y: 1.12, x: 0, font: { size: 10 } },
      yaxis: { ...this.baseLayout().yaxis, automargin: true },
    }, this.cfg);
  }

  private renderEducation(educationLevels: any[]): void {
    if (!educationLevels?.length) return;
    const palette = ['#4F46E5','#8B5CF6','#EC4899','#06B6D4','#10B981','#F59E0B','#EF4444','#0EA5E9'];
    Plotly.newPlot('chart-education', [{
      type: 'pie', hole: 0.5,
      labels: educationLevels.map((e: any) => e.name),
      values: educationLevels.map((e: any) => e.count),
      marker: { colors: palette.slice(0, educationLevels.length) },
      textposition: 'inside', textfont: { size: 10 },
      hovertemplate: '<b>%{label}</b><br>%{value} candidats (%{percent})<extra></extra>',
    }], {
      paper_bgcolor: 'transparent', font: { family: 'Inter, sans-serif', size: 11 },
      margin: { t: 10, b: 10, l: 10, r: 10 }, height: 280,
      showlegend: true, legend: { font: { size: 10 }, orientation: 'v', x: 1.02 },
    }, this.cfg);
  }

  private renderSchools(schools: any[]): void {
    if (!schools?.length) return;
    const top = schools.slice(0, 10).reverse();
    Plotly.newPlot('chart-schools', [{
      type: 'bar', orientation: 'h',
      y: top.map((s: any) => s.name), x: top.map((s: any) => s.count),
      marker: { color: '#8B5CF6', opacity: 0.85 },
      text: top.map((s: any) => s.count.toString()), textposition: 'outside',
      hovertemplate: '<b>%{y}</b><br>%{x} candidats<extra></extra>',
    }], { ...this.baseLayout(top.length * 8), margin: { t: 10, b: 20, l: 140, r: 40 }, yaxis: { automargin: true } }, this.cfg);
  }

  private renderSkills(skills: any[]): void {
    if (!skills?.length) return;
    const top = skills.slice(0, 12).reverse();
    Plotly.newPlot('chart-skills', [{
      type: 'bar', orientation: 'h',
      y: top.map((s: any) => s.name), x: top.map((s: any) => s.count),
      marker: { color: top.map((_: any, i: number) => {
        const t = i / Math.max(top.length - 1, 1);
        return `rgba(${Math.round(79 + (6 - 79) * t)},${Math.round(70 + (182 - 70) * t)},${Math.round(229 + (212 - 229) * t)},0.85)`;
      })},
      text: top.map((s: any) => s.count.toString()), textposition: 'outside',
      hovertemplate: '<b>%{y}</b><br>%{x} candidats<extra></extra>',
    }], { ...this.baseLayout(top.length * 6), margin: { t: 10, b: 20, l: 120, r: 40 } }, this.cfg);
  }

  private renderScores(scores: any[]): void {
    if (!scores?.length) return;
    const colorScale = scores.map((_: any, i: number) => {
      const t = i / Math.max(scores.length - 1, 1);
      return `rgb(${Math.round(239 + (5 - 239) * t)},${Math.round(68 + (150 - 68) * t)},${Math.round(68 + (136 - 68) * t)})`;
    });
    Plotly.newPlot('chart-scores', [{
      type: 'bar', x: scores.map((s: any) => s.range), y: scores.map((s: any) => s.count),
      marker: { color: colorScale },
      text: scores.map((s: any) => s.count.toString()), textposition: 'outside',
      hovertemplate: 'Score %{x}<br>%{y} candidatures<extra></extra>',
    }], { ...this.baseLayout(), margin: { t: 16, b: 50, l: 40, r: 16 } }, this.cfg);
  }

  private aggregateByPeriod(monthly: any[]): { label: string; total: number; accepted: number }[] {
    const map = new Map<string, { total: number; accepted: number }>();
    for (const m of monthly) {
      const parts = m.label.split('/');
      const month = parseInt(parts[0], 10);
      const year  = parseInt(parts[1], 10);
      let key: string;
      if (this.periodMode === 'year') key = `${year}`;
      else if (this.periodMode === 'semester') key = month <= 6 ? `H1 ${year}` : `H2 ${year}`;
      else { const q = Math.ceil(month / 3); key = `T${q} ${year}`; }
      const prev = map.get(key) ?? { total: 0, accepted: 0 };
      map.set(key, { total: prev.total + m.total, accepted: prev.accepted + m.accepted });
    }
    return Array.from(map.entries()).map(([label, v]) => ({ label, ...v }));
  }

  private renderPeriod(monthly: any[]): void {
    if (!monthly?.length) return;
    const data = this.aggregateByPeriod(monthly);
    Plotly.newPlot('chart-period', [
      { type: 'bar', name: 'Candidatures', x: data.map(d => d.label), y: data.map(d => d.total), marker: { color: '#4F46E5' }, text: data.map(d => d.total.toString()), textposition: 'outside', hovertemplate: '<b>%{x}</b><br>%{y} candidatures<extra></extra>' },
      { type: 'bar', name: 'Acceptées',    x: data.map(d => d.label), y: data.map(d => d.accepted), marker: { color: '#10B981' }, text: data.map(d => d.accepted.toString()), textposition: 'outside', hovertemplate: '<b>%{x}</b><br>%{y} acceptées<extra></extra>' },
    ], { ...this.baseLayout(), barmode: 'group', height: 260, legend: { orientation: 'h', y: 1.15, x: 0, font: { size: 10 } }, margin: { t: 16, b: 50, l: 40, r: 16 } }, this.cfg);
  }

  private renderCities(locations: any[]): void {
    if (!locations?.length) return;
    const top = locations.slice(0, 10).reverse();
    const palette = ['#818CF8','#6366F1','#4F46E5','#4338CA','#3730A3','#312E81','#EC4899','#DB2777','#BE185D','#9D174D'];
    Plotly.newPlot('chart-cities', [{
      type: 'bar', orientation: 'h',
      y: top.map((l: any) => l.city), x: top.map((l: any) => l.count),
      marker: { color: palette.slice(0, top.length) },
      text: top.map((l: any) => l.count.toString()), textposition: 'outside',
      hovertemplate: '<b>%{y}</b><br>%{x} candidats<extra></extra>',
    }], { ...this.baseLayout(top.length * 8), margin: { t: 10, b: 20, l: 120, r: 50 }, yaxis: { automargin: true } }, this.cfg);
  }

  private renderDepartments(departments: any[]): void {
    if (!departments?.length) return;
    const top = departments.slice(0, 10).reverse();
    const palette = ['#BAE6FD','#7DD3FC','#38BDF8','#0EA5E9','#0284C7','#0369A1','#075985','#0C4A6E','#082F49','#0369A1'];
    Plotly.newPlot('chart-departments', [{
      type: 'bar', orientation: 'h',
      y: top.map((d: any) => d.name), x: top.map((d: any) => d.count),
      marker: { color: palette.slice(0, top.length) },
      text: top.map((d: any) => d.count.toString()), textposition: 'outside',
      hovertemplate: '<b>%{y}</b><br>%{x} candidatures<extra></extra>',
    }], { ...this.baseLayout(top.length * 8), margin: { t: 10, b: 20, l: 140, r: 50 }, yaxis: { automargin: true } }, this.cfg);
  }
}
