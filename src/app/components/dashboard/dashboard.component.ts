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
  offre_acceptee:       'Accepté(e)',
  offre_refusee:        'Refusé(e)',
  rejete:               'Refusé(e)',
  abandonne:            'Abandonné',
  validation_finale:    'Accepté(e)',
  offre_envoyee:        'Accepté(e)',
};

const STATUS_COLORS: Record<string, string> = {
  nouveau:              '#94A3B8',
  preselectionne:       '#6366F1',
  en_attente_documents: '#F59E0B',
  documents_recus:      '#8B5CF6',
  entretien_programme:  '#06B6D4',
  entretien_realise:    '#0EA5E9',
  offre_acceptee:       '#10B981',
  offre_refusee:        '#F43F5E',
  rejete:               '#F43F5E',
  abandonne:            '#CBD5E1',
  validation_finale:    '#10B981',
  offre_envoyee:        '#10B981',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dash-page">

      <!-- ── Header ── -->
      <div class="dash-header">
        <div>
          <h1 class="dash-greeting">{{ getGreeting() }}, <span class="dash-name">{{ firstName }}</span> 👋</h1>
          <p class="dash-sub">Tableau de bord RH — {{ today | date:'EEEE d MMMM yyyy' }}</p>
        </div>
        <button class="btn-refresh" (click)="load()" [disabled]="loading">
          <svg [class.spin]="loading" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
          </svg>
          Actualiser
        </button>
      </div>

      <div *ngIf="error" class="alert-error">⚠ {{ error }}</div>

      <!-- ── KPI Grid ── -->
      <div class="kpi-grid" *ngIf="kpi">
        <div class="kpi-card" style="--kc:#4F46E5;--ks:rgba(79,70,229,.08)">
          <div class="kpi-body">
            <div class="kpi-val">{{ kpi.totalCandidates }}</div>
            <div class="kpi-lbl">Total candidats</div>
            <div class="kpi-progress"><div style="width:100%;background:#4F46E5"></div></div>
          </div>
          <div class="kpi-icon" style="background:rgba(79,70,229,.1);color:#4F46E5">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
          </div>
        </div>
        <div class="kpi-card" style="--kc:#F59E0B;--ks:rgba(245,158,11,.08)">
          <div class="kpi-body">
            <div class="kpi-val">{{ kpi.totalApplications }}</div>
            <div class="kpi-lbl">Candidatures reçues</div>
            <div class="kpi-progress"><div style="width:100%;background:#F59E0B"></div></div>
          </div>
          <div class="kpi-icon" style="background:rgba(245,158,11,.1);color:#F59E0B">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
          </div>
        </div>
        <div class="kpi-card" style="--kc:#8B5CF6;--ks:rgba(139,92,246,.08)">
          <div class="kpi-body">
            <div class="kpi-val">{{ kpi.acceptanceRate }}<span class="kpi-unit">%</span></div>
            <div class="kpi-lbl">Taux d'acceptation</div>
            <div class="kpi-progress"><div [style.width]="kpi.acceptanceRate+'%'" style="background:#8B5CF6"></div></div>
          </div>
          <div class="kpi-icon" style="background:rgba(139,92,246,.1);color:#8B5CF6">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          </div>
        </div>
        <div class="kpi-card" style="--kc:#3B82F6;--ks:rgba(59,130,246,.08)">
          <div class="kpi-body">
            <div class="kpi-val">{{ kpi.avgScore }}<span class="kpi-unit">%</span></div>
            <div class="kpi-lbl">Score matching moyen</div>
            <div class="kpi-progress"><div [style.width]="kpi.avgScore+'%'" style="background:#3B82F6"></div></div>
          </div>
          <div class="kpi-icon" style="background:rgba(59,130,246,.1);color:#3B82F6">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          </div>
        </div>
        <div class="kpi-card" style="--kc:#F43F5E;--ks:rgba(244,63,94,.08)">
          <div class="kpi-body">
            <div class="kpi-val">{{ kpi.pendingDocuments }}</div>
            <div class="kpi-lbl">En attente documents</div>
            <div class="kpi-progress"><div style="width:100%;background:#F43F5E"></div></div>
          </div>
          <div class="kpi-icon" style="background:rgba(244,63,94,.1);color:#F43F5E">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
          </div>
        </div>
      </div>

      <!-- Skeleton -->
      <div class="kpi-grid" *ngIf="!kpi && loading">
        <div *ngFor="let i of [1,2,3,4,5,6]" class="kpi-card sk-card">
          <div style="flex:1"><div class="sk-box" style="height:28px;width:55%;margin-bottom:8px"></div><div class="sk-box" style="height:11px;width:75%"></div></div>
          <div class="sk-box" style="width:44px;height:44px;border-radius:12px;flex-shrink:0"></div>
        </div>
      </div>

      <!-- ── Tab Nav ── -->
      <div class="tab-nav" *ngIf="dataReady">
        <button class="tab-btn" [class.active]="activeTab==='overview'" (click)="setTab('overview')">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
          Aperçu général
        </button>
        <button class="tab-btn" [class.active]="activeTab==='pipeline'" (click)="setTab('pipeline')">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3z" clip-rule="evenodd"/></svg>
          Pipeline & Conversion
        </button>
        <button class="tab-btn" [class.active]="activeTab==='profiles'" (click)="setTab('profiles')">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
          Profils candidats
        </button>
      </div>

      <!-- ════════════════ TAB 1: APERÇU ════════════════ -->
      <div class="charts-grid" *ngIf="dataReady && activeTab==='overview'">

        <!-- Donut + Filters -->
        <div class="chart-card chart-span-12" style="--ca:#8B5CF6">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:linear-gradient(135deg,#8B5CF6,#A78BFA)">
                <svg width="15" height="15" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>
              </div>
              <div>
                <div class="chart-title">Répartition statuts</div>
                <div class="chart-subtitle">Distribution des candidats par étape</div>
              </div>
            </div>
            <span class="filter-badge" *ngIf="selectedLocations.length || selectedDepartments.length">
              <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-4 4A1 1 0 016 19v-7.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd"/></svg>
              {{ selectedLocations.length + selectedDepartments.length }} filtre(s)
            </span>
          </div>
          <div class="chart-with-filters">
            <div class="filter-panel">
              <p class="filter-panel-head">Filtres</p>
              <div class="filter-section">
                <div class="filter-section-label">
                  <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>
                  Région
                </div>
                <div class="filter-list">
                  <label class="filter-item" *ngFor="let loc of allLocations">
                    <input type="checkbox" [checked]="selectedLocations.includes(loc.city)" (change)="toggleLocation(loc.city)">
                    <span class="filter-item-text">{{ loc.city }}</span>
                    <span class="filter-count">{{ loc.count }}</span>
                  </label>
                </div>
              </div>
              <div class="filter-section">
                <div class="filter-section-label">
                  <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/></svg>
                  Département
                </div>
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
            <div class="filter-chart-area">
              <div class="filter-loading-overlay" *ngIf="donutFiltering"><div class="filter-spinner"></div></div>
              <div id="chart-donut" style="height:340px"></div>
            </div>
          </div>
        </div>

        <!-- Monthly -->
        <div class="chart-card chart-span-12" style="--ca:#10B981">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:linear-gradient(135deg,#10B981,#34D399)">
                <svg width="15" height="15" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              </div>
              <div>
                <div class="chart-title">Évolution mensuelle</div>
                <div class="chart-subtitle">Candidatures et acceptations dans le temps</div>
              </div>
            </div>
          </div>
          <div id="chart-monthly" class="chart-body"></div>
        </div>
      </div>

      <!-- ════════════════ TAB 2: PIPELINE ════════════════ -->
      <div *ngIf="dataReady && activeTab==='pipeline'">
        <div class="charts-grid">

          <!-- Offers + Filters -->
          <div class="chart-card chart-span-8" style="--ca:#F59E0B">
            <div class="chart-header">
              <div class="chart-title-wrap">
                <div class="chart-icon" style="background:linear-gradient(135deg,#F59E0B,#FCD34D)">
                  <svg width="15" height="15" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clip-rule="evenodd"/></svg>
                </div>
                <div>
                  <div class="chart-title">Performance des offres</div>
                  <div class="chart-subtitle">Candidatures et acceptations par offre</div>
                </div>
              </div>
              <span class="filter-badge" *ngIf="selectedEducation.length || selectedSchools.length">
                <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-4 4A1 1 0 016 19v-7.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd"/></svg>
                {{ selectedEducation.length + selectedSchools.length }} filtre(s)
              </span>
            </div>
            <div class="chart-with-filters">
              <div class="filter-panel">
                <p class="filter-panel-head">Filtres</p>
                <div class="filter-section">
                  <div class="filter-section-label">
                    <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/></svg>
                    Niveau d'études
                  </div>
                  <div class="filter-list">
                    <label class="filter-item" *ngFor="let edu of allEducation">
                      <input type="checkbox" [checked]="selectedEducation.includes(edu.name)" (change)="toggleEducation(edu.name)">
                      <span class="filter-item-text">{{ edu.name }}</span>
                      <span class="filter-count">{{ edu.count }}</span>
                    </label>
                  </div>
                </div>
                <div class="filter-section">
                  <div class="filter-section-label">
                    <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/></svg>
                    Établissement
                  </div>
                  <div class="filter-list">
                    <label class="filter-item" *ngFor="let s of allSchools">
                      <input type="checkbox" [checked]="selectedSchools.includes(s.name)" (change)="toggleSchool(s.name)">
                      <span class="filter-item-text">{{ s.name }}</span>
                      <span class="filter-count">{{ s.count }}</span>
                    </label>
                  </div>
                </div>
                <button class="filter-reset-btn" *ngIf="selectedEducation.length || selectedSchools.length" (click)="resetOffersFilters()">Réinitialiser</button>
              </div>
              <div class="filter-chart-area">
                <div class="filter-loading-overlay" *ngIf="offersFiltering"><div class="filter-spinner"></div></div>
                <div id="chart-offers" class="chart-body"></div>
              </div>
            </div>
          </div>

          <!-- Conversion table -->
          <div class="chart-card chart-span-4" style="--ca:#6366F1">
            <div class="chart-header">
              <div class="chart-title-wrap">
                <div class="chart-icon" style="background:linear-gradient(135deg,#6366F1,#818CF8)">
                  <svg width="15" height="15" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clip-rule="evenodd"/></svg>
                </div>
                <div>
                  <div class="chart-title">Conversion mensuelle</div>
                  <div class="chart-subtitle">Taux d'acceptation par mois</div>
                </div>
              </div>
            </div>
            <div class="table-wrap">
              <table class="conv-table">
                <thead><tr><th>Mois</th><th>Total</th><th>Acceptés</th><th>Taux</th></tr></thead>
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

          <!-- Departments -->
          <div class="chart-card chart-span-12" style="--ca:#0EA5E9">
            <div class="chart-header">
              <div class="chart-title-wrap">
                <div class="chart-icon" style="background:linear-gradient(135deg,#0EA5E9,#38BDF8)">
                  <svg width="15" height="15" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/></svg>
                </div>
                <div>
                  <div class="chart-title">Candidatures par département</div>
                  <div class="chart-subtitle">Volume de dossiers reçus par département</div>
                </div>
              </div>
            </div>
            <div id="chart-departments" class="chart-body"></div>
          </div>

          <!-- Period -->
          <div class="chart-card chart-span-12" style="--ca:#4F46E5">
            <div class="chart-header">
              <div class="chart-title-wrap">
                <div class="chart-icon" style="background:linear-gradient(135deg,#4F46E5,#6366F1)">
                  <svg width="15" height="15" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
                </div>
                <div>
                  <div class="chart-title">Répartition par période</div>
                  <div class="chart-subtitle">Agrégation temporelle des candidatures</div>
                </div>
              </div>
              <div class="period-filter">
                <button class="period-btn" [class.active]="periodMode==='year'"     (click)="setPeriodMode('year')">Annuel</button>
                <button class="period-btn" [class.active]="periodMode==='semester'" (click)="setPeriodMode('semester')">Semestriel</button>
                <button class="period-btn" [class.active]="periodMode==='quarter'"  (click)="setPeriodMode('quarter')">Trimestriel</button>
              </div>
            </div>
            <div id="chart-period" class="chart-body"></div>
          </div>
        </div>
      </div>

      <!-- ════════════════ TAB 3: PROFILS ════════════════ -->
      <div class="charts-grid" *ngIf="dataReady && activeTab==='profiles'">

        <!-- Schools -->
        <div class="chart-card chart-span-6" style="--ca:#F59E0B">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:linear-gradient(135deg,#F59E0B,#FCD34D)">
                <svg width="15" height="15" fill="white" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zm5.99 7.176A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/></svg>
              </div>
              <div>
                <div class="chart-title">Top établissements</div>
                <div class="chart-subtitle">Origine académique des candidats</div>
              </div>
            </div>
          </div>
          <div id="chart-schools" class="chart-body"></div>
        </div>

        <!-- Skills -->
        <div class="chart-card chart-span-6" style="--ca:#06B6D4">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:linear-gradient(135deg,#06B6D4,#22D3EE)">
                <svg width="15" height="15" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/></svg>
              </div>
              <div>
                <div class="chart-title">Top compétences</div>
                <div class="chart-subtitle">Compétences les plus fréquentes</div>
              </div>
            </div>
          </div>
          <div id="chart-skills" class="chart-body"></div>
        </div>

        <!-- Education + region filter -->
        <div class="chart-card chart-span-6" style="--ca:#8B5CF6">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:linear-gradient(135deg,#8B5CF6,#A78BFA)">
                <svg width="15" height="15" fill="white" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/></svg>
              </div>
              <div>
                <div class="chart-title">Niveaux d'études</div>
                <div class="chart-subtitle">Répartition académique des candidats</div>
              </div>
            </div>
            <span class="filter-badge" *ngIf="selectedEducationRegions.length">
              <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-4 4A1 1 0 016 19v-7.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd"/></svg>
              {{ selectedEducationRegions.length }} filtre(s)
            </span>
          </div>
          <div class="chart-with-filters">
            <div class="filter-panel">
              <p class="filter-panel-head">Filtres</p>
              <div class="filter-section">
                <div class="filter-section-label">
                  <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>
                  Région
                </div>
                <div class="filter-list">
                  <label class="filter-item" *ngFor="let loc of allLocations">
                    <input type="checkbox" [checked]="selectedEducationRegions.includes(loc.city)" (change)="toggleEducationRegion(loc.city)">
                    <span class="filter-item-text">{{ loc.city }}</span>
                    <span class="filter-count">{{ loc.count }}</span>
                  </label>
                </div>
              </div>
              <button class="filter-reset-btn" *ngIf="selectedEducationRegions.length" (click)="resetEducationFilters()">Réinitialiser</button>
            </div>
            <div class="filter-chart-area">
              <div class="filter-loading-overlay" *ngIf="educationFiltering"><div class="filter-spinner"></div></div>
              <div id="chart-education" style="height:300px"></div>
            </div>
          </div>
        </div>

        <!-- Scores + department filter -->
        <div class="chart-card chart-span-6" style="--ca:#3B82F6">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:linear-gradient(135deg,#3B82F6,#60A5FA)">
                <svg width="15" height="15" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              </div>
              <div>
                <div class="chart-title">Scores de matching</div>
                <div class="chart-subtitle">Distribution des scores de compatibilité</div>
              </div>
            </div>
            <span class="filter-badge" *ngIf="selectedScoresDepartments.length">
              <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-4 4A1 1 0 016 19v-7.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd"/></svg>
              {{ selectedScoresDepartments.length }} filtre(s)
            </span>
          </div>
          <div class="chart-with-filters">
            <div class="filter-panel">
              <p class="filter-panel-head">Filtres</p>
              <div class="filter-section">
                <div class="filter-section-label">
                  <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/></svg>
                  Département
                </div>
                <div class="filter-list">
                  <label class="filter-item" *ngFor="let dept of allDepartments">
                    <input type="checkbox" [checked]="selectedScoresDepartments.includes(dept.name)" (change)="toggleScoresDepartment(dept.name)">
                    <span class="filter-item-text">{{ dept.name }}</span>
                    <span class="filter-count">{{ dept.count }}</span>
                  </label>
                </div>
              </div>
              <button class="filter-reset-btn" *ngIf="selectedScoresDepartments.length" (click)="resetScoresFilters()">Réinitialiser</button>
            </div>
            <div class="filter-chart-area">
              <div class="filter-loading-overlay" *ngIf="scoresFiltering"><div class="filter-spinner"></div></div>
              <div id="chart-scores" class="chart-body"></div>
            </div>
          </div>
        </div>

        <!-- Geographic map full-width -->
        <div class="chart-card chart-span-12" style="--ca:#EC4899">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:linear-gradient(135deg,#EC4899,#F472B6)">
                <svg width="15" height="15" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clip-rule="evenodd"/></svg>
              </div>
              <div>
                <div class="chart-title">Distribution géographique</div>
                <div class="chart-subtitle">Répartition des candidats par ville</div>
              </div>
            </div>
          </div>
          <div id="chart-cities" style="min-height:400px"></div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
    .dash-page { max-width: 1440px; }

    /* ── Header ── */
    .dash-header {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 12px; margin-bottom: 28px;
    }
    .dash-greeting { font-size: 22px; font-weight: 800; margin: 0 0 3px; color: #0F172A; letter-spacing: -.3px; }
    .dash-name { color: #4F46E5; }
    .dash-sub { margin: 0; color: #94A3B8; font-size: 13px; }
    .btn-refresh {
      display: flex; align-items: center; gap: 7px;
      padding: 9px 16px; border-radius: 12px; font-size: 13px; font-weight: 600;
      background: white; border: 1px solid #E2E8F0; cursor: pointer; color: #64748B;
      box-shadow: 0 1px 4px rgba(0,0,0,.05); transition: all .18s;
    }
    .btn-refresh:hover { background: #EEF2FF; color: #4F46E5; border-color: #C7D2FE; }
    .btn-refresh:disabled { opacity: .5; cursor: not-allowed; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin .75s linear infinite; }

    .alert-error { background: #FFF1F2; border: 1px solid #FECDD3; color: #BE123C; padding: 12px 16px; border-radius: 14px; margin-bottom: 22px; font-size: 13px; }

    /* ── KPI Cards ── */
    .kpi-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 14px; margin-bottom: 24px; }
    .kpi-card {
      background: white;
      border-radius: 20px;
      padding: 18px 16px 16px;
      display: flex; align-items: center; gap: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 18px rgba(0,0,0,.06);
      border-top: 3px solid var(--kc, #4F46E5);
      transition: transform .18s, box-shadow .18s;
    }
    .kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,.1); }
    .kpi-body { flex: 1; min-width: 0; }
    .kpi-val { font-size: 2.1rem; font-weight: 900; color: #0F172A; line-height: 1; letter-spacing: -.5px; }
    .kpi-unit { font-size: 1.1rem; font-weight: 700; color: #94A3B8; }
    .kpi-lbl { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #94A3B8; margin: 5px 0 9px; }
    .kpi-progress { height: 3px; background: #F1F5F9; border-radius: 3px; overflow: hidden; }
    .kpi-progress div { height: 100%; border-radius: 3px; transition: width .6s ease; }
    .kpi-icon {
      width: 44px; height: 44px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .sk-card { border: 1px solid #F1F5F9; }
    .sk-box { border-radius: 8px; background: linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }

    /* ── Tab Nav ── */
    .tab-nav {
      display: flex; gap: 4px; margin-bottom: 18px;
      background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 5px;
      width: fit-content; box-shadow: 0 1px 4px rgba(0,0,0,.05);
    }
    .tab-btn {
      display: flex; align-items: center; gap: 7px; padding: 9px 20px;
      border-radius: 12px; font-size: 13px; font-weight: 600;
      border: none; background: transparent; color: #64748B; cursor: pointer; transition: all .18s;
    }
    .tab-btn:hover { background: #F8FAFC; color: #334155; }
    .tab-btn.active { background: linear-gradient(135deg,#4F46E5,#6366F1); color: white; box-shadow: 0 4px 14px rgba(79,70,229,.3); }

    /* ── Charts Grid ── */
    .charts-grid { display: grid; grid-template-columns: repeat(12,1fr); gap: 16px; }
    .chart-span-12 { grid-column: span 12; }
    .chart-span-8  { grid-column: span 8; }
    .chart-span-6  { grid-column: span 6; }
    .chart-span-4  { grid-column: span 4; }

    /* ── Chart Card ── */
    .chart-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 6px 24px rgba(0,0,0,.07);
      border-top: 3px solid var(--ca, #4F46E5);
      overflow: hidden;
    }

    .chart-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 20px 14px;
      border-bottom: 1px solid #F8FAFC;
    }
    .chart-title-wrap { display: flex; align-items: center; gap: 12px; }
    .chart-icon {
      width: 36px; height: 36px; border-radius: 11px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0,0,0,.12);
    }
    .chart-title { font-size: 14px; font-weight: 700; color: #0F172A; line-height: 1.2; }
    .chart-subtitle { font-size: 11px; color: #94A3B8; margin-top: 1px; }
    .chart-body { padding: 6px 6px 10px; }

    /* ── Filter badge ── */
    .filter-badge {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 11px; font-weight: 700;
      color: #4F46E5; background: #EEF2FF; border: 1px solid #C7D2FE;
      padding: 4px 10px; border-radius: 20px;
    }

    /* ── Filter Panel ── */
    .chart-with-filters { display: flex; min-height: 280px; }

    .filter-panel {
      width: 190px; flex-shrink: 0;
      border-right: 1px solid #F1F5F9;
      background: #FAFBFF;
      padding: 14px 13px 16px;
      overflow-y: auto; max-height: 440px;
    }
    .filter-panel::-webkit-scrollbar { width: 3px; }
    .filter-panel::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 2px; }

    .filter-panel-head {
      font-size: 10px; font-weight: 800; text-transform: uppercase;
      letter-spacing: .8px; color: #94A3B8; margin: 0 0 13px;
    }
    .filter-section { margin-bottom: 14px; }
    .filter-section-label {
      display: flex; align-items: center; gap: 5px;
      font-size: 11px; font-weight: 700; color: #475569;
      margin-bottom: 8px; padding-bottom: 5px;
      border-bottom: 1px solid #E2E8F0;
    }
    .filter-list {
      display: flex; flex-direction: column; gap: 1px;
      max-height: 160px; overflow-y: auto;
    }
    .filter-list::-webkit-scrollbar { width: 3px; }
    .filter-list::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 2px; }

    .filter-item {
      display: flex; align-items: center; gap: 7px;
      font-size: 11.5px; color: #475569; cursor: pointer;
      padding: 4px 6px; border-radius: 7px; transition: background .12s;
    }
    .filter-item:hover { background: #EEF2FF; }
    .filter-item input[type=checkbox] {
      accent-color: #4F46E5; cursor: pointer; flex-shrink: 0; width: 13px; height: 13px;
    }
    .filter-item-text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .filter-count {
      font-size: 10px; font-weight: 700; color: #94A3B8;
      background: #F1F5F9; padding: 1px 6px; border-radius: 10px; flex-shrink: 0;
    }
    .filter-chart-area { flex: 1; min-width: 0; position: relative; }
    .filter-loading-overlay {
      position: absolute; inset: 0;
      background: rgba(255,255,255,.8); display: flex; align-items: center; justify-content: center; z-index: 10;
    }
    .filter-spinner {
      width: 28px; height: 28px;
      border: 3px solid #E2E8F0; border-top-color: #4F46E5;
      border-radius: 50%; animation: spin .7s linear infinite;
    }
    .filter-reset-btn {
      width: 100%; margin-top: 10px; padding: 7px 0;
      font-size: 11px; font-weight: 700; color: #DC2626;
      background: #FEF2F2; border: 1px solid #FECACA;
      border-radius: 10px; cursor: pointer; transition: background .15s;
    }
    .filter-reset-btn:hover { background: #FEE2E2; }

    /* ── Period filter ── */
    .period-filter { display: flex; gap: 5px; }
    .period-btn {
      font-size: 11px; font-weight: 600; padding: 5px 13px;
      border-radius: 20px; border: 1px solid #E2E8F0;
      background: white; color: #64748B; cursor: pointer; transition: all .15s;
    }
    .period-btn:hover { background: #EEF2FF; color: #4F46E5; border-color: #C7D2FE; }
    .period-btn.active { background: linear-gradient(135deg,#4F46E5,#6366F1); color: white; border-color: transparent; box-shadow: 0 2px 8px rgba(79,70,229,.3); }

    /* ── Conversion table ── */
    .table-wrap { overflow-x: auto; padding: 10px 18px 18px; }
    .conv-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .conv-table th {
      padding: 8px 10px; text-align: left;
      font-size: 10.5px; font-weight: 800; text-transform: uppercase;
      letter-spacing: .5px; color: #94A3B8; border-bottom: 2px solid #F1F5F9;
    }
    .conv-table td { padding: 8px 10px; border-bottom: 1px solid #F8FAFC; color: #475569; }
    .td-month { font-weight: 700; color: #0F172A; }
    .td-num { text-align: center; font-weight: 700; }
    .td-green { color: #10B981; }
    .td-rate { min-width: 110px; }
    .rate-wrap { display: flex; align-items: center; gap: 8px; }
    .rate-bar { flex: 1; height: 5px; background: #F1F5F9; border-radius: 4px; overflow: hidden; }
    .rate-fill { height: 100%; background: linear-gradient(90deg,#4F46E5,#8B5CF6); border-radius: 4px; transition: width .4s; }
    .tr-total { background: #F8F9FF; }
    .tr-total td { border-top: 2px solid #E2E8F0; color: #0F172A; font-weight: 700; }

    /* ── Responsive ── */
    @media (max-width:1200px) {
      .kpi-grid { grid-template-columns: repeat(3,1fr); }
      .chart-span-8 { grid-column: span 12; }
      .chart-span-4 { grid-column: span 6; }
    }
    @media (max-width:860px) {
      .kpi-grid { grid-template-columns: repeat(3,1fr); }
    }
    @media (max-width:900px) {
      .kpi-grid { grid-template-columns: repeat(2,1fr); }
      .chart-span-6, .chart-span-4 { grid-column: span 12; }
      .tab-nav { flex-wrap: wrap; width: auto; }
      .filter-panel { width: 160px; }
    }
    @media (max-width:640px) {
      .chart-with-filters { flex-direction: column; }
      .filter-panel { width: 100%; max-height: none; border-right: none; border-bottom: 1px solid #F1F5F9; }
    }
    @media (max-width:480px) {
      .kpi-grid { grid-template-columns: 1fr; }
      .kpi-val { font-size: 1.7rem; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  today     = new Date();
  firstName = '';
  loading   = false;
  dataReady = false;
  error     = '';
  kpi: any  = null;
  activeTab: 'overview' | 'pipeline' | 'profiles' = 'overview';
  periodMode: 'year' | 'semester' | 'quarter' = 'year';

  monthlyTableData: { label: string; total: number; accepted: number; rate: number }[] = [];
  totalMonthly = { total: 0, accepted: 0, rate: 0 };

  // Filter state — Tab 1 donut
  selectedLocations:   string[] = [];
  selectedDepartments: string[] = [];
  donutFiltering = false;

  // Filter state — Tab 2 offers
  selectedEducation: string[] = [];
  selectedSchools:   string[] = [];
  offersFiltering = false;

  // Filter state — Tab 3 education
  selectedEducationRegions: string[] = [];
  educationFiltering = false;

  // Filter state — Tab 3 scores
  selectedScoresDepartments: string[] = [];
  scoresFiltering = false;

  // Available options (loaded once)
  allLocations:   { city: string; count: number }[] = [];
  allDepartments: { name: string; count: number }[] = [];
  allEducation:   { name: string; count: number }[] = [];
  allSchools:     { name: string; count: number }[] = [];

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
    return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
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
        this.allLocations   = res.data.locations     || [];
        this.allDepartments = res.data.departments   || [];
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

  // ── Toggle helpers ─────────────────────────────────────────────

  private toggle(arr: string[], val: string): string[] {
    const i = arr.indexOf(val);
    return i === -1 ? [...arr, val] : arr.filter(v => v !== val);
  }

  toggleLocation(city: string)          { this.selectedLocations   = this.toggle(this.selectedLocations,   city); this.loadFilteredPipeline(); }
  toggleDepartment(name: string)         { this.selectedDepartments = this.toggle(this.selectedDepartments, name); this.loadFilteredPipeline(); }
  toggleEducation(name: string)          { this.selectedEducation   = this.toggle(this.selectedEducation,   name); this.loadFilteredOffers(); }
  toggleSchool(name: string)             { this.selectedSchools     = this.toggle(this.selectedSchools,     name); this.loadFilteredOffers(); }
  toggleEducationRegion(city: string)   { this.selectedEducationRegions   = this.toggle(this.selectedEducationRegions,   city); this.loadFilteredEducation(); }
  toggleScoresDepartment(name: string)  { this.selectedScoresDepartments  = this.toggle(this.selectedScoresDepartments,  name); this.loadFilteredScores(); }

  resetDonutFilters()    { this.selectedLocations = []; this.selectedDepartments = []; setTimeout(() => this.renderDonut(this.analyticsData?.pipeline), 0); }
  resetOffersFilters()   { this.selectedEducation = []; this.selectedSchools = [];     setTimeout(() => this.renderOfferStats(this.analyticsData?.offerStats), 0); }
  resetEducationFilters(){ this.selectedEducationRegions = [];                         setTimeout(() => this.renderEducation(this.analyticsData?.educationLevels), 0); }
  resetScoresFilters()   { this.selectedScoresDepartments = [];                        setTimeout(() => this.renderScores(this.analyticsData?.scores), 0); }

  // ── Filtered API calls ────────────────────────────────────────

  private authHeaders() {
    return new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('authToken')}` });
  }

  private buildParams(pairs: { key: string; vals: string[] }[]): HttpParams {
    let p = new HttpParams();
    pairs.forEach(({ key, vals }) => vals.forEach(v => { p = p.append(key, v); }));
    return p;
  }

  private loadFilteredPipeline(): void {
    if (!this.selectedLocations.length && !this.selectedDepartments.length) {
      setTimeout(() => this.renderDonut(this.analyticsData?.pipeline), 0); return;
    }
    this.donutFiltering = true;
    const params = this.buildParams([{ key: 'regions', vals: this.selectedLocations }, { key: 'departments', vals: this.selectedDepartments }]);
    this.http.get<any>(`${environment.apiUrl}/analytics/pipeline`, { headers: this.authHeaders(), params }).subscribe({
      next:  r => { this.donutFiltering = false; setTimeout(() => this.renderDonut(r.data.pipeline), 0); },
      error: () => { this.donutFiltering = false; },
    });
  }

  private loadFilteredOffers(): void {
    if (!this.selectedEducation.length && !this.selectedSchools.length) {
      setTimeout(() => this.renderOfferStats(this.analyticsData?.offerStats), 0); return;
    }
    this.offersFiltering = true;
    const params = this.buildParams([{ key: 'educationLevels', vals: this.selectedEducation }, { key: 'schools', vals: this.selectedSchools }]);
    this.http.get<any>(`${environment.apiUrl}/analytics/offers`, { headers: this.authHeaders(), params }).subscribe({
      next:  r => { this.offersFiltering = false; setTimeout(() => this.renderOfferStats(r.data.offerStats), 0); },
      error: () => { this.offersFiltering = false; },
    });
  }

  private loadFilteredEducation(): void {
    if (!this.selectedEducationRegions.length) {
      setTimeout(() => this.renderEducation(this.analyticsData?.educationLevels), 0); return;
    }
    this.educationFiltering = true;
    const params = this.buildParams([{ key: 'regions', vals: this.selectedEducationRegions }]);
    this.http.get<any>(`${environment.apiUrl}/analytics/education`, { headers: this.authHeaders(), params }).subscribe({
      next:  r => { this.educationFiltering = false; setTimeout(() => this.renderEducation(r.data.educationLevels), 0); },
      error: () => { this.educationFiltering = false; },
    });
  }

  private loadFilteredScores(): void {
    if (!this.selectedScoresDepartments.length) {
      setTimeout(() => this.renderScores(this.analyticsData?.scores), 0); return;
    }
    this.scoresFiltering = true;
    const params = this.buildParams([{ key: 'departments', vals: this.selectedScoresDepartments }]);
    this.http.get<any>(`${environment.apiUrl}/analytics/scores`, { headers: this.authHeaders(), params }).subscribe({
      next:  r => { this.scoresFiltering = false; setTimeout(() => this.renderScores(r.data.scores), 0); },
      error: () => { this.scoresFiltering = false; },
    });
  }

  // ── Monthly table ─────────────────────────────────────────────

  private buildMonthlyTable(monthly: any[]): void {
    if (!monthly?.length) return;
    this.monthlyTableData = monthly.map(m => ({
      label: m.label, total: m.total, accepted: m.accepted,
      rate: m.total > 0 ? Math.round(m.accepted / m.total * 1000) / 10 : 0,
    }));
    const tot = monthly.reduce((s, m) => s + m.total, 0);
    const acc = monthly.reduce((s, m) => s + m.accepted, 0);
    this.totalMonthly = { total: tot, accepted: acc, rate: tot > 0 ? Math.round(acc / tot * 1000) / 10 : 0 };
  }

  // ── Tab rendering ─────────────────────────────────────────────

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
    } else {
      this.renderSchools(d.schools);
      this.renderSkills(d.skills);
      this.renderEducation(d.educationLevels);
      this.renderScores(d.scores);
      this.renderMap(d.locations);
    }
  }

  setPeriodMode(mode: 'year' | 'semester' | 'quarter'): void {
    this.periodMode = mode;
    this.renderPeriod(this.analyticsData?.monthly);
  }

  // ── Plotly helpers ────────────────────────────────────────────

  private cfg = { displayModeBar: false, responsive: true };

  private hl = {   // hover label style
    bgcolor: '#1E293B', bordercolor: '#1E293B', borderwidth: 0,
    font: { family: 'Inter, sans-serif', size: 12, color: '#F8FAFC' },
  };

  private ax(extra: any = {}): any {
    return {
      gridcolor: 'rgba(148,163,184,.12)', linecolor: 'transparent',
      zerolinecolor: 'rgba(148,163,184,.2)', zeroline: false,
      tickfont: { size: 10, color: '#94A3B8' }, ticklen: 0, ...extra,
    };
  }

  private base(extraH = 0): any {
    return {
      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
      font: { family: 'Inter, -apple-system, sans-serif', size: 11, color: '#475569' },
      margin: { t: 20, b: 44, l: 52, r: 20 },
      height: 280 + extraH,
      xaxis: this.ax(), yaxis: this.ax(),
      hoverlabel: this.hl,
    };
  }

  // ── Individual renderers ──────────────────────────────────────

  private renderDonut(pipeline: any[]): void {
    if (!pipeline?.length) return;
    const items = pipeline.filter(p => p.status && STATUS_LABELS[p.status]);
    if (!items.length) return;
    const total = items.reduce((s, p) => s + p.count, 0);
    Plotly.newPlot('chart-donut', [{
      type: 'pie', hole: 0.62,
      labels: items.map(p => STATUS_LABELS[p.status]),
      values: items.map(p => p.count),
      marker: { colors: items.map(p => STATUS_COLORS[p.status] || '#94A3B8'), line: { width: 2, color: '#fff' } },
      textinfo: 'none',
      hovertemplate: '<b>%{label}</b><br>%{value} candidats · %{percent}<extra></extra>',
    }], {
      paper_bgcolor: 'transparent',
      font: { family: 'Inter, sans-serif', size: 11 },
      margin: { t: 16, b: 16, l: 16, r: 16 }, height: 310,
      showlegend: true,
      legend: { font: { size: 10.5, color: '#475569' }, orientation: 'v', x: 1.02, y: 0.5, yanchor: 'middle' },
      hoverlabel: this.hl,
      annotations: [{
        text: `<b>${total}</b><br><span style="color:#94A3B8;font-size:10px">candidats</span>`,
        font: { size: 20, family: 'Inter, sans-serif', color: '#0F172A' },
        showarrow: false, x: 0.5, y: 0.5, xref: 'paper', yref: 'paper',
      }],
    }, this.cfg);
  }

  private renderMonthly(monthly: any[]): void {
    if (!monthly?.length) return;
    Plotly.newPlot('chart-monthly', [
      {
        type: 'scatter', mode: 'lines+markers', name: 'Candidatures',
        x: monthly.map(m => m.label), y: monthly.map(m => m.total),
        fill: 'tozeroy', fillcolor: 'rgba(99,102,241,.07)',
        line: { color: '#6366F1', width: 2.5, shape: 'spline' },
        marker: { color: '#4F46E5', size: 6, line: { color: '#fff', width: 2 } },
        hovertemplate: '<b>%{x}</b><br>%{y} candidatures<extra></extra>',
      },
      {
        type: 'scatter', mode: 'lines+markers', name: 'Acceptés',
        x: monthly.map(m => m.label), y: monthly.map(m => m.accepted),
        fill: 'tozeroy', fillcolor: 'rgba(16,185,129,.07)',
        line: { color: '#10B981', width: 2, shape: 'spline', dash: 'dot' },
        marker: { color: '#10B981', size: 6, line: { color: '#fff', width: 2 } },
        hovertemplate: '<b>%{x}</b><br>%{y} acceptés<extra></extra>',
      },
    ], {
      ...this.base(), height: 268,
      legend: { orientation: 'h', y: 1.14, x: 0, font: { size: 11 }, bgcolor: 'transparent' },
      xaxis: this.ax(), yaxis: this.ax({ showgrid: true }),
    }, this.cfg);
  }

  private renderOfferStats(offerStats: any[]): void {
    if (!offerStats?.length) return;
    const top = offerStats.slice(0, 8);
    const labels = top.map(o => o.title.length > 28 ? o.title.slice(0, 28) + '…' : o.title);
    Plotly.newPlot('chart-offers', [
      { type: 'bar', name: 'Candidatures', orientation: 'h', y: labels, x: top.map(o => o.total),
        marker: { color: '#818CF8' }, text: top.map(o => String(o.total)), textposition: 'outside',
        hovertemplate: '<b>%{y}</b><br>%{x} candidatures<extra></extra>' },
      { type: 'bar', name: 'Acceptés', orientation: 'h', y: labels, x: top.map(o => o.accepted),
        marker: { color: '#34D399' }, text: top.map(o => String(o.accepted)), textposition: 'outside',
        hovertemplate: '<b>%{y}</b><br>%{x} acceptés<extra></extra>' },
    ], {
      ...this.base(top.length * 10), barmode: 'group',
      margin: { t: 20, b: 30, l: 180, r: 70 },
      legend: { orientation: 'h', y: 1.14, x: 0, font: { size: 11 }, bgcolor: 'transparent' },
      bargap: 0.3, bargroupgap: 0.1,
      xaxis: this.ax({ showgrid: true }), yaxis: this.ax({ automargin: true, showgrid: false }),
      hoverlabel: this.hl,
    }, this.cfg);
  }

  private renderEducation(levels: any[]): void {
    if (!levels?.length) return;
    const palette = ['#4F46E5','#7C3AED','#EC4899','#06B6D4','#10B981','#F59E0B','#F43F5E','#0EA5E9'];
    const total = levels.reduce((s, e) => s + e.count, 0);
    Plotly.newPlot('chart-education', [{
      type: 'pie', hole: 0.62,
      labels: levels.map(e => e.name), values: levels.map(e => e.count),
      marker: { colors: palette.slice(0, levels.length), line: { width: 2, color: '#fff' } },
      textinfo: 'none',
      hovertemplate: '<b>%{label}</b><br>%{value} candidats · %{percent}<extra></extra>',
    }], {
      paper_bgcolor: 'transparent', font: { family: 'Inter, sans-serif', size: 11 },
      margin: { t: 14, b: 14, l: 14, r: 14 }, height: 272,
      showlegend: true,
      legend: { font: { size: 10, color: '#475569' }, orientation: 'v', x: 1.02, y: 0.5, yanchor: 'middle' },
      hoverlabel: this.hl,
      annotations: [{
        text: `<b>${total}</b><br><span style="color:#94A3B8;font-size:9px">total</span>`,
        font: { size: 18, family: 'Inter, sans-serif', color: '#0F172A' },
        showarrow: false, x: 0.5, y: 0.5, xref: 'paper', yref: 'paper',
      }],
    }, this.cfg);
  }

  private renderSchools(schools: any[]): void {
    if (!schools?.length) return;
    const top = schools.slice(0, 10).reverse();
    const maxV = Math.max(...top.map(s => s.count));
    Plotly.newPlot('chart-schools', [{
      type: 'bar', orientation: 'h',
      y: top.map(s => s.name), x: top.map(s => s.count),
      marker: { color: top.map(s => {
        const t = s.count / maxV;
        return `rgba(${Math.round(139 + (79-139)*t)},${Math.round(92 + (70-92)*t)},${Math.round(246 + (229-246)*t)},0.88)`;
      })},
      text: top.map(s => String(s.count)), textposition: 'outside',
      hovertemplate: '<b>%{y}</b><br>%{x} candidats<extra></extra>',
    }], {
      ...this.base(top.length * 8), margin: { t: 16, b: 24, l: 150, r: 52 },
      xaxis: this.ax({ showgrid: true }), yaxis: this.ax({ automargin: true, showgrid: false }),
    }, this.cfg);
  }

  private renderSkills(skills: any[]): void {
    if (!skills?.length) return;
    const top = skills.slice(0, 12).reverse();
    const maxV = Math.max(...top.map(s => s.count));
    Plotly.newPlot('chart-skills', [{
      type: 'bar', orientation: 'h',
      y: top.map(s => s.name), x: top.map(s => s.count),
      marker: { color: top.map(s => {
        const t = s.count / maxV;
        return `rgba(${Math.round(6 + (4-6)*t)},${Math.round(182 + (158-182)*t)},${Math.round(212 + (11-212)*t)},0.88)`;
      })},
      text: top.map(s => String(s.count)), textposition: 'outside',
      hovertemplate: '<b>%{y}</b><br>%{x} candidats<extra></extra>',
    }], {
      ...this.base(top.length * 6), margin: { t: 16, b: 24, l: 130, r: 48 },
      xaxis: this.ax({ showgrid: true }), yaxis: this.ax({ automargin: true, showgrid: false }),
    }, this.cfg);
  }

  private renderScores(scores: any[]): void {
    if (!scores?.length) return;
    const palette = ['#F43F5E','#FB923C','#FBBF24','#4ADE80','#34D399','#22D3EE','#60A5FA','#818CF8','#A78BFA','#E879F9'];
    Plotly.newPlot('chart-scores', [{
      type: 'bar',
      x: scores.map(s => s.range), y: scores.map(s => s.count),
      marker: { color: scores.map((_, i) => palette[i] || '#6366F1') },
      text: scores.map(s => String(s.count)), textposition: 'outside',
      hovertemplate: 'Plage %{x}<br><b>%{y}</b> candidatures<extra></extra>',
    }], {
      ...this.base(), margin: { t: 20, b: 52, l: 44, r: 20 },
      xaxis: this.ax({ showgrid: false }),
      yaxis: this.ax({ showgrid: true }),
      bargap: 0.32,
    }, this.cfg);
  }

  private readonly CITY_COORDS: Record<string, [number, number]> = {
    'Tunis': [36.8065, 10.1815], 'Sfax': [34.7406, 10.7603],
    'Sousse': [35.8254, 10.6360], 'Kairouan': [35.6773, 10.0962],
    'Bizerte': [37.2744, 9.8739], 'Gabes': [33.8815, 10.0983],
    'Gabès': [33.8815, 10.0983], 'Ariana': [36.8625, 10.1956],
    'Gafsa': [34.4250, 8.7842], 'Monastir': [35.7780, 10.8311],
    'Ben Arous': [36.7531, 10.2282], 'Nabeul': [36.4561, 10.7376],
    'Kasserine': [35.1676, 8.8365], 'Medenine': [33.3550, 10.5055],
    'Médenine': [33.3550, 10.5055], 'Beja': [36.7339, 9.1817],
    'Béja': [36.7339, 9.1817], 'Jendouba': [36.5012, 8.7745],
    'Mahdia': [35.5047, 11.0622], 'Sidi Bouzid': [35.0382, 9.4858],
    'Tozeur': [33.9197, 8.1335], 'Siliana': [36.0847, 9.3708],
    'Zaghouan': [36.4026, 10.1436], 'Manouba': [36.8093, 10.0993],
    'La Marsa': [36.8776, 10.3248], 'Hammamet': [36.3997, 10.6211],
    'Djerba': [33.8076, 10.8451], 'Jerba': [33.8076, 10.8451],
    'Kebili': [33.7052, 8.9650], 'Kébili': [33.7052, 8.9650],
    'Tataouine': [32.9290, 10.4508], 'El Kef': [36.1820, 8.7095],
    'Msaken': [35.7296, 10.5813], 'Zarzis': [33.5026, 11.1122],
    'Ettadhamen': [36.8367, 10.1033], 'Moknine': [35.6424, 10.8957],
    'Menzel Bourguiba': [37.1525, 9.7870], 'Mateur': [37.0476, 9.6641],
    'Ksar Hellal': [35.6430, 10.8903], 'Korba': [36.5740, 10.8609],
  };

  private renderMap(locations: any[]): void {
    if (!locations?.length) return;

    const top = locations.slice(0, 15);
    const mapped = top
      .map(l => ({ city: l.city, count: l.count, coord: this.CITY_COORDS[l.city] }))
      .filter(l => l.coord);

    // Fall back to horizontal bar chart if we can't map the cities
    if (mapped.length < 2) {
      const rev = top.reverse();
      const maxV = Math.max(...rev.map(l => l.count));
      Plotly.newPlot('chart-cities', [{
        type: 'bar', orientation: 'h',
        y: rev.map(l => l.city), x: rev.map(l => l.count),
        marker: { color: rev.map(l => {
          const t = l.count / maxV;
          return `rgba(${Math.round(236+(16-236)*t)},${Math.round(72+(185-72)*t)},${Math.round(153+(129-153)*t)},0.88)`;
        })},
        text: rev.map(l => String(l.count)), textposition: 'outside',
        hovertemplate: '<b>%{y}</b><br>%{x} candidats<extra></extra>',
      }], { ...this.base(rev.length * 4), margin: { t:16,b:24,l:130,r:52 }, yaxis: this.ax({ automargin:true, showgrid:false }) }, this.cfg);
      return;
    }

    const maxCount = Math.max(...mapped.map(l => l.count));

    Plotly.newPlot('chart-cities', [{
      type: 'scattergeo',
      mode: 'markers',
      lat: mapped.map(l => l.coord![0]),
      lon: mapped.map(l => l.coord![1]),
      customdata: mapped.map(l => [l.city, l.count]),
      marker: {
        size: mapped.map(l => Math.max(14, Math.min(54, 14 + (l.count / maxCount) * 40))),
        color: mapped.map(l => l.count),
        colorscale: [[0,'#C7D2FE'],[0.35,'#818CF8'],[0.7,'#4F46E5'],[1,'#3730A3']],
        showscale: true,
        colorbar: {
          thickness: 12, len: 0.55, x: 1.01,
          title: { text: 'Candidats', font: { size: 11, color: '#64748B' } },
          tickfont: { size: 9.5, color: '#94A3B8' },
          outlinewidth: 0,
        },
        line: { color: 'white', width: 2.5 },
        opacity: 0.88,
        sizemode: 'diameter',
      },
      hovertemplate: '<b>%{customdata[0]}</b><br>%{customdata[1]} candidats<extra></extra>',
      hoverlabel: this.hl,
    }], {
      paper_bgcolor: 'transparent',
      font: { family: 'Inter, sans-serif', size: 10, color: '#475569' },
      margin: { t: 8, b: 8, l: 0, r: 60 },
      height: 430,
      hoverlabel: this.hl,
      geo: {
        scope: 'world',
        resolution: 50,
        center: { lat: 34.5, lon: 9.5 },
        lonaxis: { range: [7.5, 12.2] },
        lataxis: { range: [30.5, 38.0] },
        showland: true,     landcolor: '#F1F5F9',
        showcoastlines: true, coastlinecolor: '#CBD5E1', coastlinewidth: 1,
        showocean: true,    oceancolor: '#DBEAFE',
        showcountries: true, countrycolor: '#E2E8F0', countrywidth: 1,
        showsubunits: true, subunitcolor: '#E5E7EB',
        showframe: false,   bgcolor: 'transparent',
        showlakes: false,   showrivers: false,
      },
    }, this.cfg);
  }

  private renderDepartments(departments: any[]): void {
    if (!departments?.length) return;
    const top = departments.slice(0, 10).reverse();
    const maxV = Math.max(...top.map(d => d.count));
    Plotly.newPlot('chart-departments', [{
      type: 'bar', orientation: 'h',
      y: top.map(d => d.name), x: top.map(d => d.count),
      marker: { color: top.map(d => {
        const t = d.count / maxV;
        return `rgba(${Math.round(14 + (3-14)*t)},${Math.round(165 + (105-165)*t)},${Math.round(233 + (229-233)*t)},0.88)`;
      })},
      text: top.map(d => String(d.count)), textposition: 'outside',
      hovertemplate: '<b>%{y}</b><br>%{x} candidatures<extra></extra>',
    }], {
      ...this.base(top.length * 8), margin: { t: 16, b: 24, l: 155, r: 52 },
      xaxis: this.ax({ showgrid: true }), yaxis: this.ax({ automargin: true, showgrid: false }),
    }, this.cfg);
  }

  private aggregateByPeriod(monthly: any[]): { label: string; total: number; accepted: number }[] {
    const map = new Map<string, { total: number; accepted: number }>();
    for (const m of monthly) {
      const [mo, yr] = m.label.split('/').map(Number);
      let key = this.periodMode === 'year' ? `${yr}`
              : this.periodMode === 'semester' ? (mo <= 6 ? `H1 ${yr}` : `H2 ${yr}`)
              : `T${Math.ceil(mo / 3)} ${yr}`;
      const prev = map.get(key) ?? { total: 0, accepted: 0 };
      map.set(key, { total: prev.total + m.total, accepted: prev.accepted + m.accepted });
    }
    return Array.from(map.entries()).map(([label, v]) => ({ label, ...v }));
  }

  private renderPeriod(monthly: any[]): void {
    if (!monthly?.length) return;
    const data = this.aggregateByPeriod(monthly);
    Plotly.newPlot('chart-period', [
      { type: 'bar', name: 'Candidatures', x: data.map(d => d.label), y: data.map(d => d.total),
        marker: { color: '#6366F1' }, text: data.map(d => String(d.total)), textposition: 'outside',
        hovertemplate: '<b>%{x}</b><br>%{y} candidatures<extra></extra>' },
      { type: 'bar', name: 'Acceptées', x: data.map(d => d.label), y: data.map(d => d.accepted),
        marker: { color: '#34D399' }, text: data.map(d => String(d.accepted)), textposition: 'outside',
        hovertemplate: '<b>%{x}</b><br>%{y} acceptées<extra></extra>' },
    ], {
      ...this.base(), barmode: 'group', height: 268, bargap: 0.3, bargroupgap: 0.08,
      legend: { orientation: 'h', y: 1.14, x: 0, font: { size: 11 }, bgcolor: 'transparent' },
      margin: { t: 20, b: 52, l: 44, r: 20 },
      xaxis: this.ax({ showgrid: false }), yaxis: this.ax({ showgrid: true }),
    }, this.cfg);
  }
}
