import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

const PIPELINE_ORDER = [
  'nouveau', 'preselectionne', 'en_attente_documents', 'documents_recus',
  'entretien_programme', 'entretien_realise', 'offre_acceptee', 'offre_refusee',
];

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
          <p class="dash-sub">Voici l'état de vos recrutements aujourd'hui</p>
        </div>
        <div class="dash-meta">
          <span class="dash-date">{{ today | date:'EEEE d MMMM yyyy' }}</span>
          <button class="btn-refresh" (click)="load()" [disabled]="loading" title="Actualiser">
            <svg [class.spin]="loading" width="15" height="15" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading / Error -->
      <div *ngIf="error" class="alert-error">
        ⚠ Impossible de charger les données : {{ error }}
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid" *ngIf="kpi">
        <div class="kpi-card" style="--accent:#4F46E5;--soft:#EEF2FF">
          <div class="kpi-icon"><svg width="22" height="22" fill="white" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg></div>
          <div class="kpi-body">
            <div class="kpi-val">{{ kpi.totalCandidates }}</div>
            <div class="kpi-lbl">Candidats</div>
            <span class="kpi-delta up">total inscrit</span>
          </div>
        </div>
        <div class="kpi-card" style="--accent:#10B981;--soft:#D1FAE5">
          <div class="kpi-icon"><svg width="22" height="22" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"/><path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/></svg></div>
          <div class="kpi-body">
            <div class="kpi-val">{{ kpi.activeOffers }}</div>
            <div class="kpi-lbl">Offres actives</div>
            <span class="kpi-delta ok">en cours</span>
          </div>
        </div>
        <div class="kpi-card" style="--accent:#F59E0B;--soft:#FEF3C7">
          <div class="kpi-icon"><svg width="22" height="22" fill="white" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg></div>
          <div class="kpi-body">
            <div class="kpi-val">{{ kpi.totalApplications }}</div>
            <div class="kpi-lbl">Candidatures</div>
            <span class="kpi-delta ok">reçues</span>
          </div>
        </div>
        <div class="kpi-card" style="--accent:#3B82F6;--soft:#DBEAFE">
          <div class="kpi-icon"><svg width="22" height="22" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg></div>
          <div class="kpi-body">
            <div class="kpi-val">{{ kpi.avgScore }}%</div>
            <div class="kpi-lbl">Score moyen</div>
            <span class="kpi-delta up">matching</span>
          </div>
        </div>
        <div class="kpi-card" style="--accent:#8B5CF6;--soft:#EDE9FE">
          <div class="kpi-icon"><svg width="22" height="22" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg></div>
          <div class="kpi-body">
            <div class="kpi-val">{{ kpi.acceptanceRate }}%</div>
            <div class="kpi-lbl">Taux d'acceptation</div>
            <span class="kpi-delta ok">dossiers finaux</span>
          </div>
        </div>
        <div class="kpi-card" style="--accent:#EF4444;--soft:#FEE2E2">
          <div class="kpi-icon"><svg width="22" height="22" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg></div>
          <div class="kpi-body">
            <div class="kpi-val">{{ kpi.pendingDocuments }}</div>
            <div class="kpi-lbl">Att. documents</div>
            <span class="kpi-delta dn">action requise</span>
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

      <!-- Charts grid -->
      <div class="charts-grid" *ngIf="dataReady">

        <!-- Pipeline -->
        <div class="chart-card chart-span-8">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:#4F46E5">
                <svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
              </div>
              <span>Pipeline de recrutement</span>
            </div>
          </div>
          <div id="chart-pipeline" class="chart-body"></div>
        </div>

        <!-- Status donut -->
        <div class="chart-card chart-span-4">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:#8B5CF6">
                <svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>
              </div>
              <span>Répartition statuts</span>
            </div>
          </div>
          <div id="chart-donut" class="chart-body"></div>
        </div>

        <!-- Monthly trend -->
        <div class="chart-card chart-span-8">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:#10B981">
                <svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              </div>
              <span>Évolution mensuelle des candidatures</span>
            </div>
          </div>
          <div id="chart-monthly" class="chart-body"></div>
        </div>

        <!-- Top schools -->
        <div class="chart-card chart-span-4">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:#F59E0B">
                <svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zm5.99 7.176A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/></svg>
              </div>
              <span>Top établissements</span>
            </div>
          </div>
          <div id="chart-schools" class="chart-body"></div>
        </div>

        <!-- Score distribution -->
        <div class="chart-card chart-span-6">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:#3B82F6">
                <svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              </div>
              <span>Distribution des scores de matching</span>
            </div>
          </div>
          <div id="chart-scores" class="chart-body"></div>
        </div>

        <!-- Top skills -->
        <div class="chart-card chart-span-6">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:#06B6D4">
                <svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/></svg>
              </div>
              <span>Top compétences des candidats</span>
            </div>
          </div>
          <div id="chart-skills" class="chart-body"></div>
        </div>

        <!-- Répartition par période -->
        <div class="chart-card chart-span-12">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:#4F46E5">
                <svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
              </div>
              <span>Répartition par période</span>
            </div>
            <div class="period-filter">
              <button class="period-btn" [class.active]="periodMode==='year'"     (click)="setPeriodMode('year')">Par an</button>
              <button class="period-btn" [class.active]="periodMode==='semester'" (click)="setPeriodMode('semester')">Par semestre</button>
              <button class="period-btn" [class.active]="periodMode==='quarter'"  (click)="setPeriodMode('quarter')">Par trimestre</button>
            </div>
          </div>
          <div id="chart-period" class="chart-body"></div>
        </div>

        <!-- Répartition par ville -->
        <div class="chart-card chart-span-6">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:#EC4899">
                <svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>
              </div>
              <span>Répartition par ville</span>
            </div>
          </div>
          <div id="chart-cities" class="chart-body"></div>
        </div>

        <!-- Département avec le plus de candidats -->
        <div class="chart-card chart-span-6">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <div class="chart-icon" style="background:#0EA5E9">
                <svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/></svg>
              </div>
              <span>Candidatures par département</span>
            </div>
          </div>
          <div id="chart-departments" class="chart-body"></div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .dash-page { max-width: 1400px; }

    /* Header */
    .dash-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      flex-wrap: wrap; gap: 12px; margin-bottom: 28px;
    }
    .dash-greeting { font-size: 26px; font-weight: 800; margin: 0 0 4px; color: #111827; }
    .dash-name { color: #4F46E5; }
    .dash-sub { margin: 0; color: #6B7280; font-size: 14px; }
    .dash-meta { display: flex; align-items: center; gap: 10px; }
    .dash-date { font-size: 13px; color: #6B7280; font-weight: 500; }
    .btn-refresh {
      width: 34px; height: 34px; border-radius: 10px;
      background: white; border: 1px solid #E5E7EB;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #6B7280; transition: all .2s;
    }
    .btn-refresh:hover { background: #EEF2FF; color: #4F46E5; }
    .btn-refresh:disabled { opacity: .5; cursor: not-allowed; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin .8s linear infinite; }

    /* Alert */
    .alert-error {
      background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B;
      padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; font-size: 13px;
    }

    /* KPI Cards */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(6, 1fr);
      gap: 16px; margin-bottom: 24px;
    }
    .kpi-card {
      background: white; border-radius: 16px;
      padding: 16px; display: flex; align-items: center; gap: 14px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
      border: 1px solid #F3F4F6;
      transition: transform .2s, box-shadow .2s;
    }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.1); }
    .kpi-icon {
      width: 48px; height: 48px; border-radius: 14px;
      background: var(--accent); display: flex;
      align-items: center; justify-content: center; flex-shrink: 0;
    }
    .kpi-val { font-size: 1.9rem; font-weight: 800; line-height: 1; color: #111827; }
    .kpi-lbl {
      font-size: .72rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: .5px; color: #6B7280; margin: 3px 0;
    }
    .kpi-delta {
      font-size: .72rem; font-weight: 600;
      border-radius: 999px; padding: 2px 9px; display: inline-block;
    }
    .kpi-delta.up  { background: #D1FAE5; color: #065F46; }
    .kpi-delta.ok  { background: #E0E7FF; color: #3730A3; }
    .kpi-delta.dn  { background: #FEE2E2; color: #991B1B; }

    /* Skeleton */
    .skeleton-card { border: 1px solid #F3F4F6; }
    .sk-box { border-radius: 8px; background: linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
    .sk-icon { width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0; }
    .sk-val { height: 28px; margin-bottom: 6px; width: 60%; }
    .sk-lbl { height: 12px; width: 80%; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* Charts grid */
    .charts-grid {
      display: grid; grid-template-columns: repeat(12, 1fr);
      gap: 16px;
    }
    .chart-card {
      background: white; border-radius: 16px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
      border: 1px solid #F3F4F6; overflow: hidden;
    }
    .chart-span-12 { grid-column: span 12; }
    .chart-span-8  { grid-column: span 8; }
    .chart-span-6  { grid-column: span 6; }
    .chart-span-4  { grid-column: span 4; }

    .chart-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 18px 0;
    }
    .chart-title-wrap {
      display: flex; align-items: center; gap: 10px;
      font-size: 13px; font-weight: 600; color: #374151;
    }
    .chart-icon {
      width: 28px; height: 28px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .chart-body { padding: 4px 4px 8px; }

    /* Period filter */
    .period-filter { display: flex; gap: 6px; }
    .period-btn {
      font-size: 11px; font-weight: 600; padding: 4px 12px;
      border-radius: 20px; border: 1px solid #E5E7EB;
      background: white; color: #6B7280; cursor: pointer; transition: all .15s;
    }
    .period-btn:hover { background: #EEF2FF; color: #4F46E5; border-color: #C7D2FE; }
    .period-btn.active { background: #4F46E5; color: white; border-color: #4F46E5; }

    /* Responsive */
    @media (max-width: 1200px) {
      .kpi-grid { grid-template-columns: repeat(3, 1fr); }
      .chart-span-8, .chart-span-4 { grid-column: span 12; }
    }
    @media (max-width: 768px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .chart-span-6 { grid-column: span 12; }
    }
    @media (max-width: 480px) {
      .kpi-grid { grid-template-columns: 1fr; }
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
  periodMode: 'year' | 'semester' | 'quarter' = 'year';

  private analyticsData: any = null;

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    this.firstName = user?.firstName || user?.email?.split('@')[0] || 'RH';
    this.load();
  }

  ngOnDestroy(): void {
    ['pipeline','donut','monthly','schools','scores','skills','period','cities','departments'].forEach(id => {
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

  load(): void {
    this.loading = true;
    this.error   = '';
    const token  = localStorage.getItem('authToken');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<any>(`${environment.apiUrl}/analytics`, { headers }).subscribe({
      next: (res) => {
        this.analyticsData = res.data;
        this.kpi           = res.data.overview;
        this.loading       = false;
        this.dataReady     = true;
        setTimeout(() => this.renderAll(), 80);
      },
      error: (err) => {
        this.loading = false;
        this.error   = err.error?.message || err.message || 'Erreur serveur';
      },
    });
  }

  // ── Chart rendering ─────────────────────────────────────────────────────────

  private renderAll(): void {
    const d = this.analyticsData;
    if (!d || typeof Plotly === 'undefined') return;

    this.renderPipeline(d.pipeline);
    this.renderDonut(d.pipeline);
    this.renderMonthly(d.monthly);
    this.renderSchools(d.schools);
    this.renderScores(d.scores);
    this.renderSkills(d.skills);
    this.renderPeriod(d.monthly);
    this.renderCities(d.locations);
    this.renderDepartments(d.departments);
  }

  setPeriodMode(mode: 'year' | 'semester' | 'quarter'): void {
    this.periodMode = mode;
    this.renderPeriod(this.analyticsData?.monthly);
  }

  private cfg = { displayModeBar: false, responsive: true };

  private baseLayout(extraH = 0): any {
    return {
      paper_bgcolor: 'transparent',
      plot_bgcolor:  'transparent',
      font: { family: 'Inter, -apple-system, sans-serif', size: 11, color: '#374151' },
      margin: { t: 16, b: 40, l: 48, r: 16 },
      height: 280 + extraH,
      xaxis: { gridcolor: '#F3F4F6', linecolor: '#E5E7EB', zerolinecolor: '#E5E7EB' },
      yaxis: { gridcolor: '#F3F4F6', linecolor: '#E5E7EB', zerolinecolor: '#E5E7EB' },
    };
  }

  private renderPipeline(pipeline: any[]): void {
    if (!pipeline?.length) return;
    const ordered = PIPELINE_ORDER
      .map(s => pipeline.find((p: any) => p.status === s))
      .filter(Boolean);

    const labels = ordered.map((p: any) => STATUS_LABELS[p.status] || p.status);
    const values = ordered.map((p: any) => p.count);
    const colors = ordered.map((p: any) => STATUS_COLORS[p.status] || '#6B7280');

    Plotly.newPlot('chart-pipeline', [{
      type: 'bar', x: labels, y: values,
      marker: { color: colors },
      text: values.map(String), textposition: 'outside',
      hovertemplate: '<b>%{x}</b><br>%{y} candidats<extra></extra>',
    }], { ...this.baseLayout(), showlegend: false }, this.cfg);
  }

  private renderDonut(pipeline: any[]): void {
    if (!pipeline?.length) return;
    const filtered = pipeline.filter((p: any) => p.status && STATUS_LABELS[p.status]);
    if (!filtered.length) return;
    const labels = filtered.map((p: any) => STATUS_LABELS[p.status]);
    const values = filtered.map((p: any) => p.count);
    const colors = filtered.map((p: any) => STATUS_COLORS[p.status] || '#6B7280');

    Plotly.newPlot('chart-donut', [{
      type: 'pie', labels, values, hole: 0.55,
      marker: { colors },
      textfont: { size: 10 },
      textposition: 'inside',
      hovertemplate: '<b>%{label}</b><br>%{value} candidats (%{percent})<extra></extra>',
    }], {
      paper_bgcolor: 'transparent',
      font: { family: 'Inter, sans-serif', size: 11 },
      margin: { t: 10, b: 10, l: 10, r: 10 },
      height: 280,
      showlegend: true,
      legend: { font: { size: 10 }, orientation: 'v', x: 1.05 },
    }, this.cfg);
  }

  private renderMonthly(monthly: any[]): void {
    if (!monthly?.length) return;
    const labels   = monthly.map((m: any) => m.label);
    const totals   = monthly.map((m: any) => m.total);
    const accepted = monthly.map((m: any) => m.accepted);

    const layout = {
      ...this.baseLayout(),
      legend: { orientation: 'h', y: 1.15, x: 0, font: { size: 10 } },
    };

    Plotly.newPlot('chart-monthly', [
      {
        type: 'scatter', mode: 'lines+markers', name: 'Candidatures',
        x: labels, y: totals,
        fill: 'tozeroy', fillcolor: 'rgba(79,70,229,.1)',
        line: { color: '#4F46E5', width: 2.5 },
        marker: { color: '#4F46E5', size: 5 },
      },
      {
        type: 'scatter', mode: 'lines+markers', name: 'Acceptés',
        x: labels, y: accepted,
        line: { color: '#10B981', width: 2, dash: 'dot' },
        marker: { color: '#10B981', size: 5 },
      },
    ], layout, this.cfg);
  }

  private renderSchools(schools: any[]): void {
    if (!schools?.length) return;
    const top = schools.slice(0, 10).reverse();

    Plotly.newPlot('chart-schools', [{
      type: 'bar', orientation: 'h',
      y: top.map((s: any) => s.name),
      x: top.map((s: any) => s.count),
      marker: { color: '#8B5CF6', opacity: 0.85 },
      text: top.map((s: any) => s.count.toString()),
      textposition: 'outside',
      hovertemplate: '<b>%{y}</b><br>%{x} candidats<extra></extra>',
    }], {
      ...this.baseLayout(top.length * 8),
      margin: { t: 10, b: 20, l: 140, r: 40 },
      yaxis: { ...this.baseLayout().yaxis, automargin: true },
    }, this.cfg);
  }

  private renderScores(scores: any[]): void {
    if (!scores?.length) return;
    const colorScale = scores.map((_: any, i: number) => {
      const t = i / Math.max(scores.length - 1, 1);
      const r = Math.round(239 + (5 - 239) * t);
      const g = Math.round(68 + (150 - 68) * t);
      const b = Math.round(68 + (136 - 68) * t);
      return `rgb(${r},${g},${b})`;
    });

    Plotly.newPlot('chart-scores', [{
      type: 'bar',
      x: scores.map((s: any) => s.range),
      y: scores.map((s: any) => s.count),
      marker: { color: colorScale },
      text: scores.map((s: any) => s.count.toString()),
      textposition: 'outside',
      hovertemplate: 'Score %{x}<br>%{y} candidatures<extra></extra>',
    }], {
      ...this.baseLayout(),
      xaxis: { ...this.baseLayout().xaxis, title: { text: 'Plage de score', font: { size: 11 } } },
      yaxis: { ...this.baseLayout().yaxis, title: { text: 'Nombre', font: { size: 11 } } },
    }, this.cfg);
  }

  private renderSkills(skills: any[]): void {
    if (!skills?.length) return;
    const top = skills.slice(0, 12).reverse();

    Plotly.newPlot('chart-skills', [{
      type: 'bar', orientation: 'h',
      y: top.map((s: any) => s.name),
      x: top.map((s: any) => s.count),
      marker: {
        color: top.map((_: any, i: number) => {
          const t = i / Math.max(top.length - 1, 1);
          return `rgba(${Math.round(79 + (6 - 79) * t)},${Math.round(70 + (182 - 70) * t)},${Math.round(229 + (212 - 229) * t)},0.85)`;
        }),
      },
      text: top.map((s: any) => s.count.toString()),
      textposition: 'outside',
      hovertemplate: '<b>%{y}</b><br>%{x} candidats<extra></extra>',
    }], {
      ...this.baseLayout(top.length * 6),
      margin: { t: 10, b: 20, l: 120, r: 40 },
    }, this.cfg);
  }

  private renderLocations(locations: any[]): void {
    if (!locations?.length) return;

    Plotly.newPlot('chart-locations', [{
      type: 'bar',
      x: locations.map((l: any) => l.city),
      y: locations.map((l: any) => l.count),
      marker: {
        color: locations.map((l: any) => l.city === 'Sfax' ? '#4F46E5' : '#A5B4FC'),
      },
      text: locations.map((l: any) => l.count.toString()),
      textposition: 'outside',
      hovertemplate: '<b>%{x}</b><br>%{y} candidats<extra></extra>',
    }], {
      ...this.baseLayout(),
      height: 240,
      margin: { t: 10, b: 60, l: 40, r: 16 },
      xaxis: { ...this.baseLayout().xaxis, tickangle: -30 },
    }, this.cfg);
  }

  private aggregateByPeriod(monthly: any[]): { label: string; total: number; accepted: number }[] {
    const map = new Map<string, { total: number; accepted: number }>();

    for (const m of monthly) {
      const parts = m.label.split('/');
      const month = parseInt(parts[0], 10);
      const year  = parseInt(parts[1], 10);
      let key: string;

      if (this.periodMode === 'year') {
        key = `${year}`;
      } else if (this.periodMode === 'semester') {
        key = month <= 6 ? `H1 ${year}` : `H2 ${year}`;
      } else {
        const q = Math.ceil(month / 3);
        key = `T${q} ${year}`;
      }

      const prev = map.get(key) ?? { total: 0, accepted: 0 };
      map.set(key, { total: prev.total + m.total, accepted: prev.accepted + m.accepted });
    }

    return Array.from(map.entries()).map(([label, v]) => ({ label, ...v }));
  }

  private renderPeriod(monthly: any[]): void {
    if (!monthly?.length) return;
    const data = this.aggregateByPeriod(monthly);

    Plotly.newPlot('chart-period', [
      {
        type: 'bar', name: 'Candidatures',
        x: data.map(d => d.label), y: data.map(d => d.total),
        marker: { color: '#4F46E5' },
        text: data.map(d => d.total.toString()), textposition: 'outside',
        hovertemplate: '<b>%{x}</b><br>%{y} candidatures<extra></extra>',
      },
      {
        type: 'bar', name: 'Acceptées',
        x: data.map(d => d.label), y: data.map(d => d.accepted),
        marker: { color: '#10B981' },
        text: data.map(d => d.accepted.toString()), textposition: 'outside',
        hovertemplate: '<b>%{x}</b><br>%{y} acceptées<extra></extra>',
      },
    ], {
      ...this.baseLayout(),
      barmode: 'group',
      height: 260,
      legend: { orientation: 'h', y: 1.15, x: 0, font: { size: 10 } },
      margin: { t: 16, b: 50, l: 40, r: 16 },
    }, this.cfg);
  }

  private renderCities(locations: any[]): void {
    if (!locations?.length) return;
    const top = locations.slice(0, 10).reverse();
    const palette = ['#818CF8','#6366F1','#4F46E5','#4338CA','#3730A3','#312E81','#EC4899','#DB2777','#BE185D','#9D174D'];

    Plotly.newPlot('chart-cities', [{
      type: 'bar', orientation: 'h',
      y: top.map((l: any) => l.city),
      x: top.map((l: any) => l.count),
      marker: { color: palette.slice(0, top.length) },
      text: top.map((l: any) => l.count.toString()),
      textposition: 'outside',
      hovertemplate: '<b>%{y}</b><br>%{x} candidats<extra></extra>',
    }], {
      ...this.baseLayout(top.length * 8),
      margin: { t: 10, b: 20, l: 120, r: 50 },
      yaxis: { ...this.baseLayout().yaxis, automargin: true },
    }, this.cfg);
  }

  private renderDepartments(departments: any[]): void {
    if (!departments?.length) return;
    const top = departments.slice(0, 10).reverse();
    const palette = ['#BAE6FD','#7DD3FC','#38BDF8','#0EA5E9','#0284C7','#0369A1','#075985','#0C4A6E','#082F49','#0369A1'];

    Plotly.newPlot('chart-departments', [{
      type: 'bar', orientation: 'h',
      y: top.map((d: any) => d.name),
      x: top.map((d: any) => d.count),
      marker: { color: palette.slice(0, top.length) },
      text: top.map((d: any) => d.count.toString()),
      textposition: 'outside',
      hovertemplate: '<b>%{y}</b><br>%{x} candidatures<extra></extra>',
    }], {
      ...this.baseLayout(top.length * 8),
      margin: { t: 10, b: 20, l: 140, r: 50 },
      yaxis: { ...this.baseLayout().yaxis, automargin: true },
    }, this.cfg);
  }
}
