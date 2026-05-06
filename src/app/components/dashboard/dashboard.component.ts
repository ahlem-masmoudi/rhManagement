import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CandidateService } from '../../services/candidate.service';
import { OfferService } from '../../services/offer.service';
import { Candidate, Offer } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">

      <!-- ═══ HEADER ═══ -->
      <div class="dash-header">
        <div class="dash-header-left">
          <h1 class="dash-greeting">{{ getGreeting() }} <span class="dash-name">{{ firstName }}</span> 👋</h1>
          <p class="dash-sub">Voici l'état de vos recrutements aujourd'hui</p>
        </div>
        <div class="dash-date-chip">
          <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
          </svg>
          <span>{{ today | date:'EEEE d MMMM yyyy':'':'fr' }}</span>
        </div>
      </div>

      <!-- ═══ KPI CARDS ═══ -->
      <div class="kpi-grid">

        <!-- Card 1 — Candidats actifs -->
        <div class="kpi-card" style="--i:0; --accent:#6366f1; --accent-soft:rgba(99,102,241,0.12); --glow:rgba(99,102,241,0.25)">
          <div class="kpi-icon-wrap">
            <svg width="22" height="22" fill="white" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Candidats actifs</span>
            <span class="kpi-value">{{ totalCandidates }}</span>
            <span class="kpi-trend kpi-trend--up">
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd"/>
              </svg>
              +12% ce mois
            </span>
          </div>
        </div>

        <!-- Card 2 — Offres publiées -->
        <div class="kpi-card" style="--i:1; --accent:#10b981; --accent-soft:rgba(16,185,129,0.12); --glow:rgba(16,185,129,0.25)">
          <div class="kpi-icon-wrap">
            <svg width="22" height="22" fill="white" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"/>
              <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
            </svg>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Offres publiées</span>
            <span class="kpi-value">{{ publishedOffers }}</span>
            <span class="kpi-trend kpi-trend--up">
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd"/>
              </svg>
              +3 cette semaine
            </span>
          </div>
        </div>

        <!-- Card 3 — En entretien -->
        <div class="kpi-card" style="--i:2; --accent:#f59e0b; --accent-soft:rgba(245,158,11,0.12); --glow:rgba(245,158,11,0.25)">
          <div class="kpi-icon-wrap">
            <svg width="22" height="22" fill="white" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">En entretien</span>
            <span class="kpi-value">{{ interviewCount }}</span>
            <span class="kpi-trend kpi-trend--neutral">8 planifiés</span>
          </div>
        </div>

        <!-- Card 4 — Taux de matching -->
        <div class="kpi-card" style="--i:3; --accent:#3b82f6; --accent-soft:rgba(59,130,246,0.12); --glow:rgba(59,130,246,0.25)">
          <div class="kpi-icon-wrap">
            <svg width="22" height="22" fill="white" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Taux de matching</span>
            <span class="kpi-value">78%</span>
            <span class="kpi-trend kpi-trend--up">
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd"/>
              </svg>
              +5% vs mois dernier
            </span>
          </div>
        </div>
      </div>

      <!-- ═══ PIPELINE ═══ -->
      <div class="section-card pipeline-card" style="--i:4">
        <div class="section-card-header">
          <div class="section-title-wrap">
            <div class="section-icon section-icon--indigo">
              <svg width="16" height="16" fill="white" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
              </svg>
            </div>
            <h3 class="section-title">Pipeline de recrutement</h3>
          </div>
          <span class="pipeline-total-badge">{{ totalCandidates }} candidats</span>
        </div>
        <div class="pipeline-bar-wrap">
          <div class="pipeline-bar">
            <div class="pipeline-segment seg--nouveau"     style="flex:3"  title="Nouveau">
              <span class="seg-label">Nouveau<br><strong>{{ pipelineData.nouveau }}</strong></span>
            </div>
            <div class="pipeline-segment seg--preselect"  style="flex:2"  title="Présélectionné">
              <span class="seg-label">Présélectionné<br><strong>{{ pipelineData.preselectionne }}</strong></span>
            </div>
            <div class="pipeline-segment seg--entretien"  style="flex:2"  title="Entretien">
              <span class="seg-label">Entretien<br><strong>{{ pipelineData.entretien }}</strong></span>
            </div>
            <div class="pipeline-segment seg--valide"     style="flex:1.5" title="Validé">
              <span class="seg-label">Validé<br><strong>{{ pipelineData.valide }}</strong></span>
            </div>
            <div class="pipeline-segment seg--accepte"    style="flex:1"  title="Accepté">
              <span class="seg-label">Accepté<br><strong>{{ pipelineData.accepte }}</strong></span>
            </div>
            <div class="pipeline-segment seg--rejete"     style="flex:1"  title="Rejeté">
              <span class="seg-label">Rejeté<br><strong>{{ pipelineData.rejete }}</strong></span>
            </div>
          </div>
        </div>
        <div class="pipeline-legend">
          <span class="legend-item"><i class="legend-dot" style="background:#6366f1"></i>Nouveau</span>
          <span class="legend-item"><i class="legend-dot" style="background:#8b5cf6"></i>Présélectionné</span>
          <span class="legend-item"><i class="legend-dot" style="background:#f59e0b"></i>Entretien</span>
          <span class="legend-item"><i class="legend-dot" style="background:#3b82f6"></i>Validé</span>
          <span class="legend-item"><i class="legend-dot" style="background:#10b981"></i>Accepté</span>
          <span class="legend-item"><i class="legend-dot" style="background:#ef4444"></i>Rejeté</span>
        </div>
      </div>

      <!-- ═══ LOWER TWO-COLUMN ═══ -->
      <div class="lower-grid">

        <!-- Col 1 — Alertes & Actions -->
        <div class="section-card" style="--i:5">
          <div class="section-card-header">
            <div class="section-title-wrap">
              <div class="section-icon section-icon--amber">
                <svg width="16" height="16" fill="white" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
              </div>
              <h3 class="section-title">Alertes &amp; Actions</h3>
            </div>
          </div>

          <div class="alerts-list">
            <!-- Alert warning -->
            <div class="alert-card" style="--alert-accent:#f59e0b; --i:0">
              <div class="alert-accent-bar"></div>
              <div class="alert-icon-wrap" style="background:rgba(245,158,11,0.12)">
                <svg width="18" height="18" fill="#f59e0b" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="alert-body">
                <p class="alert-title">3 entretiens à planifier</p>
                <p class="alert-desc">Des candidats attendent votre retour</p>
              </div>
            </div>

            <!-- Alert info -->
            <div class="alert-card" style="--alert-accent:#3b82f6; --i:1">
              <div class="alert-accent-bar"></div>
              <div class="alert-icon-wrap" style="background:rgba(59,130,246,0.12)">
                <svg width="18" height="18" fill="#3b82f6" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="alert-body">
                <p class="alert-title">Nouvelle offre à valider</p>
                <p class="alert-desc">"Stage DevOps" attend validation</p>
              </div>
            </div>

            <!-- Alert success -->
            <div class="alert-card" style="--alert-accent:#10b981; --i:2">
              <div class="alert-accent-bar"></div>
              <div class="alert-icon-wrap" style="background:rgba(16,185,129,0.12)">
                <svg width="18" height="18" fill="#10b981" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="alert-body">
                <p class="alert-title">5 nouveaux candidats matchés</p>
                <p class="alert-desc">Score moyen : 85%</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Col 2 — Activité récente -->
        <div class="section-card" style="--i:6">
          <div class="section-card-header">
            <div class="section-title-wrap">
              <div class="section-icon section-icon--indigo">
                <svg width="16" height="16" fill="white" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                </svg>
              </div>
              <h3 class="section-title">Activité récente</h3>
            </div>
          </div>

          <div class="timeline">
            <!-- Timeline item 1 -->
            <div class="timeline-item" style="--i:0">
              <div class="timeline-track">
                <div class="timeline-dot" style="background:#6366f1; box-shadow:0 0 0 4px rgba(99,102,241,0.18)"></div>
                <div class="timeline-line"></div>
              </div>
              <div class="timeline-body">
                <p class="timeline-text"><strong>Sophie Martin</strong> a postulé à "Stage Full-Stack"</p>
                <span class="timeline-time">Il y a 5 minutes</span>
              </div>
            </div>

            <!-- Timeline item 2 -->
            <div class="timeline-item" style="--i:1">
              <div class="timeline-track">
                <div class="timeline-dot" style="background:#10b981; box-shadow:0 0 0 4px rgba(16,185,129,0.18)"></div>
                <div class="timeline-line"></div>
              </div>
              <div class="timeline-body">
                <p class="timeline-text">Offre <strong>"Stage Data Scientist"</strong> publiée</p>
                <span class="timeline-time">Il y a 2 heures</span>
              </div>
            </div>

            <!-- Timeline item 3 -->
            <div class="timeline-item" style="--i:2">
              <div class="timeline-track">
                <div class="timeline-dot" style="background:#f59e0b; box-shadow:0 0 0 4px rgba(245,158,11,0.18)"></div>
                <div class="timeline-line"></div>
              </div>
              <div class="timeline-body">
                <p class="timeline-text">Entretien planifié avec <strong>Thomas Dubois</strong></p>
                <span class="timeline-time">Il y a 3 heures</span>
              </div>
            </div>

            <!-- Timeline item 4 -->
            <div class="timeline-item" style="--i:3">
              <div class="timeline-track">
                <div class="timeline-dot" style="background:#3b82f6; box-shadow:0 0 0 4px rgba(59,130,246,0.18)"></div>
              </div>
              <div class="timeline-body">
                <p class="timeline-text">Dossier <strong>Amina Benali</strong> accepté</p>
                <span class="timeline-time">Il y a 5 heures</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===================== BASE ===================== */
    :host {
      display: block;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    *, *::before, *::after { box-sizing: border-box; }

    .dashboard {
      max-width: 1400px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* ===================== HEADER ===================== */
    .dash-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      animation: slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .dash-greeting {
      font-size: clamp(22px, 3vw, 30px);
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px;
      letter-spacing: -0.5px;
      line-height: 1.2;
    }

    .dash-name {
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .dash-sub {
      font-size: 14px;
      color: #64748b;
      margin: 0;
      font-weight: 400;
    }

    .dash-date-chip {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 8px 16px;
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 500;
      color: #475569;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      flex-shrink: 0;
      align-self: flex-start;
    }

    /* ===================== KPI GRID ===================== */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    .kpi-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 24px 20px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
      border: 1.5px solid #f1f5f9;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1),
                  box-shadow 0.25s ease;
      animation: slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
      animation-delay: calc(var(--i) * 80ms + 80ms);
      cursor: default;
    }

    .kpi-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px var(--glow), 0 2px 8px rgba(0,0,0,0.06);
      border-color: var(--accent-soft);
    }

    .kpi-icon-wrap {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #000));
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 6px 16px var(--glow);
    }

    .kpi-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .kpi-label {
      font-size: 12.5px;
      font-weight: 500;
      color: #64748b;
      white-space: nowrap;
    }

    .kpi-value {
      font-size: 36px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1;
      letter-spacing: -1px;
    }

    .kpi-trend {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 999px;
    }

    .kpi-trend--up {
      background: rgba(16,185,129,0.1);
      color: #059669;
    }

    .kpi-trend--neutral {
      background: #f1f5f9;
      color: #64748b;
    }

    /* ===================== PIPELINE ===================== */
    .pipeline-card {
      animation: slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
      animation-delay: calc(var(--i) * 80ms + 80ms);
    }

    .pipeline-bar-wrap {
      padding: 4px 0 8px;
    }

    .pipeline-bar {
      display: flex;
      height: 54px;
      border-radius: 14px;
      overflow: hidden;
      gap: 2px;
    }

    .pipeline-segment {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: filter 0.2s ease, flex 0.3s ease;
      min-width: 0;
    }

    .pipeline-segment:hover { filter: brightness(1.08); }

    .seg-label {
      display: none;
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: #0f172a;
      color: white;
      font-size: 11px;
      line-height: 1.4;
      padding: 6px 10px;
      border-radius: 8px;
      white-space: nowrap;
      text-align: center;
      pointer-events: none;
      z-index: 10;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .seg-label::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: #0f172a;
    }

    .pipeline-segment:hover .seg-label { display: block; }

    .seg--nouveau    { background: linear-gradient(135deg, #6366f1, #818cf8); }
    .seg--preselect  { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }
    .seg--entretien  { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
    .seg--valide     { background: linear-gradient(135deg, #3b82f6, #60a5fa); }
    .seg--accepte    { background: linear-gradient(135deg, #10b981, #34d399); }
    .seg--rejete     { background: linear-gradient(135deg, #ef4444, #f87171); }

    .pipeline-total-badge {
      font-size: 12px;
      font-weight: 600;
      color: #6366f1;
      background: rgba(99,102,241,0.1);
      padding: 4px 12px;
      border-radius: 999px;
    }

    .pipeline-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 20px;
      margin-top: 12px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }

    .legend-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* ===================== SECTION CARD ===================== */
    .section-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
      border: 1.5px solid #f1f5f9;
      animation: slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
      animation-delay: calc(var(--i) * 80ms + 80ms);
    }

    .section-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .section-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-icon {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .section-icon--indigo { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
    .section-icon--amber  { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
    .section-icon--emerald{ background: linear-gradient(135deg, #10b981, #34d399); }

    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    /* ===================== LOWER GRID ===================== */
    .lower-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    /* ===================== ALERT CARDS ===================== */
    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .alert-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border-radius: 14px;
      background: #f8fafc;
      border: 1.5px solid #f1f5f9;
      transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
                  box-shadow 0.22s ease;
      animation: slideUp 0.45s cubic-bezier(0.34,1.56,0.64,1) both;
      animation-delay: calc(var(--i) * 80ms + 400ms);
      position: relative;
      overflow: hidden;
    }

    .alert-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.07);
    }

    .alert-accent-bar {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--alert-accent);
      border-radius: 4px 0 0 4px;
    }

    .alert-icon-wrap {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .alert-body { flex: 1; min-width: 0; }

    .alert-title {
      font-size: 13.5px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 3px;
    }

    .alert-desc {
      font-size: 12px;
      color: #64748b;
      margin: 0;
    }

    /* ===================== TIMELINE ===================== */
    .timeline {
      display: flex;
      flex-direction: column;
    }

    .timeline-item {
      display: flex;
      gap: 14px;
      animation: slideUp 0.45s cubic-bezier(0.34,1.56,0.64,1) both;
      animation-delay: calc(var(--i) * 90ms + 400ms);
    }

    .timeline-track {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
      width: 18px;
    }

    .timeline-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 3px;
      transition: transform 0.2s ease;
    }

    .timeline-item:hover .timeline-dot {
      transform: scale(1.25);
    }

    .timeline-line {
      width: 2px;
      flex: 1;
      background: #e2e8f0;
      margin: 6px 0;
      border-radius: 1px;
    }

    .timeline-body {
      padding-bottom: 20px;
      flex: 1;
      min-width: 0;
    }

    .timeline-text {
      font-size: 13.5px;
      color: #334155;
      margin: 0 0 4px;
      line-height: 1.5;
    }

    .timeline-text strong {
      color: #0f172a;
      font-weight: 600;
    }

    .timeline-time {
      font-size: 11.5px;
      color: #94a3b8;
      font-weight: 500;
    }

    /* ===================== RESPONSIVE ===================== */
    @media (max-width: 1200px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 900px) {
      .lower-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 640px) {
      .kpi-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
      .kpi-value { font-size: 28px; }
      .kpi-icon-wrap { width: 44px; height: 44px; border-radius: 13px; }
      .kpi-card { padding: 18px 14px; gap: 12px; }
      .dash-greeting { font-size: 20px; }
      .pipeline-bar { height: 44px; }
      .dashboard { gap: 16px; }
    }

    @media (max-width: 420px) {
      .kpi-grid { grid-template-columns: 1fr; }
      .dash-date-chip { display: none; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  totalCandidates = 0;
  publishedOffers = 0;
  interviewCount = 0;
  priorityCandidates: Candidate[] = [];
  today = new Date();
  firstName = '';

  pipelineData = {
    nouveau: 0,
    preselectionne: 0,
    entretien: 0,
    valide: 0,
    accepte: 0,
    rejete: 0
  };

  constructor(
    private candidateService: CandidateService,
    private offerService: OfferService
  ) {}

  ngOnInit(): void {
    this.candidateService.getCandidates().subscribe(candidates => {
      this.totalCandidates = candidates.length;
      this.priorityCandidates = candidates.slice(0, 5);
      this.interviewCount = candidates.filter(
        c => c.status === 'entretien_programme' || c.status === 'entretien_realise'
      ).length;

      this.pipelineData = {
        nouveau:        candidates.filter(c => c.status === 'nouveau').length,
        preselectionne: candidates.filter(c => c.status === 'preselectionne').length,
        entretien:      candidates.filter(c =>
                          c.status === 'entretien_programme' ||
                          c.status === 'entretien_realise').length,
        valide:         candidates.filter(c => c.status === 'validation_finale' || c.status === 'offre_envoyee').length,
        accepte:        candidates.filter(c => c.status === 'offre_acceptee').length,
        rejete:         candidates.filter(c => c.status === 'rejete').length
      };
    });

    this.offerService.getOffers().subscribe(offers => {
      this.publishedOffers = offers.filter(o => o.status === 'publiee').length;
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
    if (score >= 60) return 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)';
    return 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
  }
}
