import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

interface Interview {
  id: string;
  candidateName: string;
  initials: string;
  offerTitle: string;
  department: string;
  date: string;
  time: string;
  notes: string;
  color: string;
  candidateId: string;
}

@Component({
  selector: 'app-interview-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="cal-page">

      <!-- Hero -->
      <div class="cal-hero">
        <div class="hero-mesh"></div>
        <div class="hero-glow g1"></div>
        <div class="hero-glow g2"></div>
        <div class="hero-content">
          <div class="hero-left">
            <div class="hero-icon-wrap">
              <span class="hero-icon">📅</span>
              <div class="icon-ring"></div>
            </div>
            <div>
              <h1 class="hero-title">Calendrier des entretiens</h1>
              <p class="hero-sub">Visualisez et gérez vos entretiens planifiés</p>
            </div>
          </div>
          <div class="hero-stats">
            <div class="hstat" style="--c:#a5b4fc">
              <span class="hstat-val">{{ interviews.length }}</span>
              <span class="hstat-lab">Entretiens</span>
            </div>
            <div class="hstat" style="--c:#6ee7b7">
              <span class="hstat-val">{{ todayCount }}</span>
              <span class="hstat-lab">Aujourd'hui</span>
            </div>
            <div class="hstat" style="--c:#fcd34d">
              <span class="hstat-val">{{ weekCount }}</span>
              <span class="hstat-lab">Cette semaine</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-wrap">
        <div class="loading-dots"><span></span><span></span><span></span></div>
        <p>Chargement des entretiens…</p>
      </div>

      <div *ngIf="!loading" class="cal-body">

        <!-- Toolbar -->
        <div class="cal-toolbar">
          <div class="nav-group">
            <button class="nav-btn" (click)="prevMonth()">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div class="month-pill">
              <span class="month-name">{{ monthName }}</span>
              <span class="month-year">{{ monthYear }}</span>
            </div>
            <button class="nav-btn" (click)="nextMonth()">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
          <button class="today-btn" (click)="goToday()">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
            Aujourd'hui
          </button>
        </div>

        <div class="cal-layout">

          <!-- Calendar grid -->
          <div class="cal-grid-wrap">
            <div class="day-headers">
              <div *ngFor="let d of dayNames; let i = index" class="day-header" [class.weekend]="i >= 5">{{ d }}</div>
            </div>
            <div class="weeks">
              <div *ngFor="let week of calendarWeeks; let wi = index" class="week-row">
                <div *ngFor="let day of week; let di = index"
                     class="day-cell"
                     [class.other-month]="!day.currentMonth"
                     [class.today]="day.isToday"
                     [class.weekend]="di >= 5"
                     [class.has-events]="day.interviews.length > 0"
                     [class.selected]="selectedDay === day.dateStr"
                     [style.animation-delay]="(wi*7+di)*0.018+'s'"
                     (click)="selectDay(day)">

                  <div class="day-num-wrap">
                    <span class="day-num" [class.today-num]="day.isToday">{{ day.day }}</span>
                    <span *ngIf="day.interviews.length > 0" class="event-count-dot">{{ day.interviews.length }}</span>
                  </div>

                  <div class="event-pills">
                    <div *ngFor="let iv of day.interviews.slice(0, 2)"
                         class="event-pill"
                         [style.--pill-color]="iv.color"
                         (click)="openDetail(iv, $event)">
                      <span class="pill-dot"></span>
                      <span class="pill-time">{{ iv.time }}</span>
                      <span class="pill-name">{{ iv.candidateName.split(' ')[0] }}</span>
                    </div>
                    <div *ngIf="day.interviews.length > 2" class="pill-more">+{{ day.interviews.length - 2 }} autres</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="sidebar">

            <!-- Selected day -->
            <div class="sidebar-card" *ngIf="selectedDay">
              <div class="sidebar-head">
                <div class="sidebar-head-icon">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
                </div>
                <span>{{ formatSelectedDay() }}</span>
                <span class="badge-count" *ngIf="selectedDayInterviews.length > 0">{{ selectedDayInterviews.length }}</span>
              </div>
              <div *ngIf="selectedDayInterviews.length === 0" class="empty-day">
                <div class="empty-day-icon">🕐</div>
                <span>Aucun entretien ce jour</span>
              </div>
              <div *ngFor="let iv of selectedDayInterviews; let i = index"
                   class="iv-card" [style.animation-delay]="(i*0.08)+'s'"
                   [style.--c]="iv.color"
                   [routerLink]="['/rh/profil', iv.candidateId]">
                <div class="iv-stripe"></div>
                <div class="iv-body">
                  <div class="iv-avatar" [style.background]="iv.color + '22'" [style.color]="iv.color">{{ iv.initials }}</div>
                  <div class="iv-info">
                    <p class="iv-name">{{ iv.candidateName }}</p>
                    <p class="iv-offer">{{ iv.offerTitle }}</p>
                  </div>
                  <div class="iv-time-badge" [style.color]="iv.color" [style.background]="iv.color + '15'">{{ iv.time }}</div>
                </div>
              </div>
            </div>

            <!-- Upcoming -->
            <div class="sidebar-card">
              <div class="sidebar-head">
                <div class="sidebar-head-icon">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
                </div>
                <span>Prochains entretiens</span>
                <span class="badge-count" *ngIf="upcomingInterviews.length > 0">{{ upcomingInterviews.slice(0,5).length }}</span>
              </div>
              <div *ngIf="upcomingInterviews.length === 0" class="empty-day">
                <div class="empty-day-icon">✨</div>
                <span>Aucun entretien à venir</span>
              </div>
              <div class="timeline">
                <div *ngFor="let iv of upcomingInterviews.slice(0, 5); let i = index; let last = last"
                     class="timeline-row" [class.last]="last"
                     [style.animation-delay]="(i*0.07)+'s'"
                     [routerLink]="['/rh/profil', iv.candidateId]">
                  <div class="tl-left">
                    <div class="tl-dot" [style.background]="iv.color" [style.box-shadow]="'0 0 0 3px '+iv.color+'33'"></div>
                    <div class="tl-line" *ngIf="!last"></div>
                  </div>
                  <div class="tl-body">
                    <p class="tl-name">{{ iv.candidateName }}</p>
                    <p class="tl-when">{{ formatDate(iv.date) }} · {{ iv.time }}</p>
                    <p class="tl-offer">{{ iv.offerTitle }}</p>
                  </div>
                  <div class="tl-badge" [style.color]="iv.color" [style.background]="iv.color + '18'">{{ getDaysDiff(iv.date) }}</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="interviews.length === 0" class="empty-global">
          <div class="empty-icon">🗓️</div>
          <h3>Aucun entretien planifié</h3>
          <p>Les entretiens programmés dans les candidatures apparaîtront ici.</p>
        </div>
      </div>

      <!-- Detail modal -->
      <div class="modal-backdrop" *ngIf="detailInterview" (click)="closeDetail()">
        <div class="detail-modal" (click)="$event.stopPropagation()">
          <div class="detail-header" [style.background]="'linear-gradient(135deg,'+detailInterview.color+' 0%,'+detailInterview.color+'99 100%)'">
            <div class="detail-avatar">{{ detailInterview.initials }}</div>
            <div class="detail-header-info">
              <h3>{{ detailInterview.candidateName }}</h3>
              <p>{{ detailInterview.offerTitle }}</p>
            </div>
            <button class="close-btn" (click)="closeDetail()">✕</button>
          </div>
          <div class="detail-body">
            <div class="detail-row">
              <span class="dr-icon">📅</span><span class="dr-label">Date</span>
              <strong>{{ formatDate(detailInterview.date) }}</strong>
            </div>
            <div class="detail-row">
              <span class="dr-icon">🕐</span><span class="dr-label">Heure</span>
              <strong>{{ detailInterview.time }}</strong>
            </div>
            <div class="detail-row">
              <span class="dr-icon">🏢</span><span class="dr-label">Département</span>
              <strong>{{ detailInterview.department || '—' }}</strong>
            </div>
            <div class="detail-row" *ngIf="detailInterview.notes">
              <span class="dr-icon">💬</span><span class="dr-label">Notes</span>
              <strong>{{ detailInterview.notes }}</strong>
            </div>
            <a [routerLink]="['/rh/profil', detailInterview.candidateId]"
               class="detail-link" (click)="closeDetail()">
              Voir le profil complet
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </a>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ═══ Page ═══ */
    .cal-page { padding: 0; background: #f0f4ff; }

    /* ═══ Hero ═══ */
    .cal-hero {
      position: relative; overflow: hidden;
      background: linear-gradient(135deg, #1e1065 0%, #4338ca 45%, #7c3aed 100%);
      padding: 18px 28px 22px;
    }
    .hero-mesh {
      position: absolute; inset: 0; pointer-events: none;
      background-image: radial-gradient(circle at 20% 50%, rgba(99,102,241,.3) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(167,139,250,.25) 0%, transparent 45%),
                        radial-gradient(circle at 60% 80%, rgba(236,72,153,.15) 0%, transparent 40%);
    }
    .hero-glow {
      position: absolute; border-radius: 50%; pointer-events: none;
      animation: floatOrb 8s ease-in-out infinite;
    }
    .g1 { width:260px;height:260px;top:-100px;right:-40px;background:radial-gradient(circle,rgba(165,180,252,.18),transparent 70%); }
    .g2 { width:160px;height:160px;bottom:-60px;left:25%;background:radial-gradient(circle,rgba(196,181,253,.15),transparent 70%);animation-delay:3s; }
    @keyframes floatOrb {
      0%,100% { transform: translateY(0) rotate(0deg); }
      50%      { transform: translateY(-14px) rotate(8deg); }
    }
    .hero-content { position:relative;display:flex;align-items:center;gap:18px;flex-wrap:wrap; }
    .hero-left { display:flex;align-items:center;gap:16px; }
    .hero-icon-wrap { position:relative;flex-shrink:0; }
    .hero-icon { font-size:32px;display:block;animation:iconBounce 3s ease-in-out infinite;filter:drop-shadow(0 4px 16px rgba(0,0,0,.35)); }
    @keyframes iconBounce { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-6px) rotate(2deg)} }
    .icon-ring {
      position:absolute;inset:-6px;border-radius:50%;
      border:2px solid rgba(255,255,255,.2);
      animation:ringPulse 2.5s ease-in-out infinite;
    }
    @keyframes ringPulse { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(1.15);opacity:.8} }
    .hero-title { color:white;font-size:20px;font-weight:800;margin:0 0 2px;letter-spacing:-.4px; }
    .hero-sub { color:rgba(255,255,255,.65);margin:0;font-size:12.5px; }
    .hero-stats { display:flex;gap:10px;margin-left:auto; }
    .hstat {
      text-align:center;padding:8px 14px;border-radius:14px;
      background:rgba(255,255,255,.08);backdrop-filter:blur(12px);
      border:1px solid rgba(255,255,255,.12);
      transition:transform .2s,background .2s;
    }
    .hstat:hover { transform:translateY(-2px);background:rgba(255,255,255,.14); }
    .hstat-val { display:block;font-size:22px;font-weight:900;color:var(--c,white);line-height:1; }
    .hstat-lab { display:block;font-size:10px;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.8px;margin-top:2px; }

    /* ═══ Loading ═══ */
    .loading-wrap { display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;gap:20px;color:#94a3b8; }
    .loading-dots { display:flex;gap:8px; }
    .loading-dots span {
      width:10px;height:10px;border-radius:50%;background:#4f46e5;
      animation:dotBounce 1.2s ease-in-out infinite;
    }
    .loading-dots span:nth-child(2) { animation-delay:.2s; }
    .loading-dots span:nth-child(3) { animation-delay:.4s; }
    @keyframes dotBounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-10px);opacity:1} }

    /* ═══ Body ═══ */
    .cal-body { padding: 14px 20px 14px; }

    /* ═══ Toolbar ═══ */
    .cal-toolbar { display:flex;align-items:center;justify-content:space-between;margin-bottom:12px; }
    .nav-group { display:flex;align-items:center;gap:8px; }
    .nav-btn {
      width:34px;height:34px;border-radius:10px;border:none;
      background:white;color:#4f46e5;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 8px rgba(79,70,229,.15);
      transition:all .2s;
    }
    .nav-btn:hover { background:#4f46e5;color:white;transform:scale(1.08);box-shadow:0 4px 14px rgba(79,70,229,.35); }
    .month-pill {
      display:flex;align-items:baseline;gap:6px;
      background:white;border-radius:12px;padding:6px 16px;
      box-shadow:0 2px 8px rgba(0,0,0,.07);
    }
    .month-name { font-size:17px;font-weight:800;color:#1e293b;text-transform:capitalize; }
    .month-year { font-size:13px;font-weight:600;color:#94a3b8; }
    .today-btn {
      display:flex;align-items:center;gap:6px;
      padding:7px 16px;border-radius:10px;border:none;
      background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;
      font-size:12.5px;font-weight:700;cursor:pointer;
      box-shadow:0 3px 12px rgba(79,70,229,.3);transition:all .2s;
    }
    .today-btn:hover { transform:translateY(-2px);box-shadow:0 6px 20px rgba(79,70,229,.4); }

    /* ═══ Layout ═══ */
    .cal-layout { display:grid;grid-template-columns:1fr 270px;gap:14px;align-items:start; }

    /* ═══ Grid ═══ */
    .cal-grid-wrap {
      background:white;border-radius:20px;
      box-shadow:0 4px 30px rgba(79,70,229,.08);overflow:hidden;
    }
    .day-headers { display:grid;grid-template-columns:repeat(7,1fr);background:linear-gradient(135deg,#4338ca,#7c3aed); }
    .day-header {
      padding:8px 0;text-align:center;font-size:10.5px;font-weight:700;
      color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:.7px;
    }
    .day-header.weekend { color:rgba(253,186,116,.9); }
    .weeks { display:flex;flex-direction:column; }
    .week-row { display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid #f1f5f9; }
    .week-row:last-child { border-bottom:none; }

    .day-cell {
      min-height:74px;padding:7px 6px 5px;
      border-right:1px solid #f1f5f9;cursor:pointer;
      transition:background .18s,transform .18s;position:relative;
      animation:cellFadeIn .4s ease both;
    }
    @keyframes cellFadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
    .day-cell:last-child { border-right:none; }
    .day-cell:hover { background:linear-gradient(135deg,#f0f4ff,#f5f3ff); }
    .day-cell.weekend { background:#fafafa; }
    .day-cell.other-month { background:#f8fafc; }
    .day-cell.other-month .day-num { color:#d1d5db; }
    .day-cell.today { background:linear-gradient(135deg,#eef2ff 0%,#f5f3ff 100%); }
    .day-cell.selected {
      background:linear-gradient(135deg,#eef2ff,#ede9fe);
      box-shadow:inset 0 0 0 2px #4f46e5;
    }

    /* Day number */
    .day-num-wrap { display:flex;align-items:center;justify-content:space-between;margin-bottom:4px; }
    .day-num {
      font-size:12.5px;font-weight:700;color:#64748b;
      width:26px;height:26px;display:flex;align-items:center;justify-content:center;border-radius:50%;
      transition:all .2s;
    }
    .today-num {
      background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;font-weight:800;
      box-shadow:0 2px 10px rgba(79,70,229,.5);
      animation:todayGlow 2s ease-in-out infinite;
    }
    @keyframes todayGlow {
      0%,100% { box-shadow:0 2px 10px rgba(79,70,229,.4); }
      50%      { box-shadow:0 2px 18px rgba(79,70,229,.8); }
    }
    .event-count-dot {
      font-size:9.5px;font-weight:800;color:#4f46e5;
      background:#eef2ff;border-radius:20px;padding:1px 5px;
    }

    /* Pills */
    .event-pills { display:flex;flex-direction:column;gap:2px; }
    .event-pill {
      border-radius:6px;padding:2px 5px;font-size:10px;
      display:flex;align-items:center;gap:4px;cursor:pointer;
      background:color-mix(in srgb, var(--pill-color) 12%, white);
      border-left:3px solid var(--pill-color);
      transition:all .15s;overflow:hidden;white-space:nowrap;
    }
    .event-pill:hover { transform:translateX(2px);filter:brightness(.97); }
    .pill-dot { width:5px;height:5px;border-radius:50%;background:var(--pill-color);flex-shrink:0; }
    .pill-time { color:#475569;font-weight:800;flex-shrink:0; }
    .pill-name { color:#1e293b;font-weight:600;overflow:hidden;text-overflow:ellipsis; }
    .pill-more { font-size:9.5px;color:#94a3b8;font-weight:700;margin-top:1px;padding-left:2px; }

    /* ═══ Sidebar ═══ */
    .sidebar { display:flex;flex-direction:column;gap:12px; }
    .sidebar-card {
      background:white;border-radius:18px;
      box-shadow:0 4px 24px rgba(79,70,229,.07);overflow:hidden;
    }
    .sidebar-head {
      display:flex;align-items:center;gap:8px;
      padding:11px 15px;font-size:12.5px;font-weight:700;color:#1e293b;
      border-bottom:1px solid #f1f5f9;
      background:linear-gradient(135deg,#f8faff,#f3f0ff);
    }
    .sidebar-head-icon {
      width:24px;height:24px;border-radius:8px;
      background:linear-gradient(135deg,#4f46e5,#7c3aed);
      color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;
    }
    .badge-count {
      margin-left:auto;background:linear-gradient(135deg,#4f46e5,#7c3aed);
      color:white;font-size:10px;font-weight:800;border-radius:20px;padding:2px 7px;
    }
    .empty-day { padding:18px;text-align:center;color:#94a3b8;font-size:12.5px; }
    .empty-day-icon { font-size:24px;margin-bottom:6px; }

    /* IV cards */
    .iv-card {
      display:flex;align-items:stretch;margin:8px 10px;border-radius:12px;
      overflow:hidden;cursor:pointer;
      box-shadow:0 2px 12px rgba(0,0,0,.06);
      transition:all .2s;animation:slideUp .35s ease both;
    }
    @keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .iv-card:hover { transform:translateY(-2px);box-shadow:0 6px 22px rgba(0,0,0,.12); }
    .iv-stripe { width:4px;flex-shrink:0;background:var(--c); }
    .iv-body { padding:10px 12px;display:flex;gap:10px;align-items:center;flex:1; }
    .iv-avatar {
      width:34px;height:34px;border-radius:10px;flex-shrink:0;
      display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:800;
    }
    .iv-info { flex:1;min-width:0; }
    .iv-name { font-size:12.5px;font-weight:700;color:#1e293b;margin:0 0 2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .iv-offer { font-size:11px;color:#64748b;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .iv-time-badge { font-size:10.5px;font-weight:800;border-radius:8px;padding:3px 8px;flex-shrink:0; }

    /* Timeline */
    .timeline { padding:6px 0; }
    .timeline-row {
      display:flex;align-items:flex-start;gap:0;padding:0 12px 0 14px;
      cursor:pointer;transition:background .15s;
      animation:slideUp .3s ease both;
    }
    .timeline-row:hover { background:#f8faff; }
    .tl-left { display:flex;flex-direction:column;align-items:center;padding-right:12px;padding-top:2px; }
    .tl-dot { width:10px;height:10px;border-radius:50%;flex-shrink:0;transition:transform .2s; }
    .timeline-row:hover .tl-dot { transform:scale(1.4); }
    .tl-line { width:2px;flex:1;background:linear-gradient(to bottom,#e2e8f0,transparent);min-height:22px;margin-top:3px; }
    .tl-body { flex:1;min-width:0;padding:6px 0 8px; }
    .tl-name { font-size:12.5px;font-weight:700;color:#1e293b;margin:0 0 2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .tl-when { font-size:11px;font-weight:600;color:#6366f1;margin:0 0 1px; }
    .tl-offer { font-size:10.5px;color:#94a3b8;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .tl-badge { flex-shrink:0;padding:3px 9px;border-radius:20px;font-size:10.5px;font-weight:800;margin-top:6px; }

    /* ═══ Empty state ═══ */
    .empty-global { text-align:center;padding:50px 20px; }
    .empty-icon { font-size:56px;margin-bottom:14px;animation:floatOrb 4s ease-in-out infinite; }
    .empty-global h3 { font-size:18px;font-weight:700;color:#374151;margin:0 0 6px; }
    .empty-global p { color:#94a3b8;font-size:13px; }

    /* ═══ Detail modal ═══ */
    .modal-backdrop {
      position:fixed;inset:0;background:rgba(15,10,40,.55);
      backdrop-filter:blur(8px);z-index:9999;
      display:flex;align-items:center;justify-content:center;
      animation:fadeIn .2s ease;
    }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    .detail-modal {
      background:white;border-radius:26px;width:92%;max-width:420px;
      overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.3);
      animation:modalPop .35s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes modalPop { from{opacity:0;transform:scale(.85) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
    .detail-header { padding:22px 20px;display:flex;align-items:center;gap:14px;position:relative; }
    .detail-avatar {
      width:48px;height:48px;border-radius:14px;flex-shrink:0;
      background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;
      font-size:18px;font-weight:800;color:white;
      box-shadow:0 4px 14px rgba(0,0,0,.2);
    }
    .detail-header-info { flex:1; }
    .detail-header h3 { color:white;margin:0 0 4px;font-size:17px;font-weight:800; }
    .detail-header p { color:rgba(255,255,255,.75);margin:0;font-size:12.5px; }
    .close-btn {
      position:absolute;top:14px;right:14px;
      background:rgba(255,255,255,.18);border:none;color:white;
      width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:13px;
      display:flex;align-items:center;justify-content:center;transition:background .2s;
    }
    .close-btn:hover { background:rgba(255,255,255,.32); }
    .detail-body { padding:16px 20px 20px; }
    .detail-row {
      display:flex;align-items:center;gap:8px;
      padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;
    }
    .detail-row:last-of-type { border-bottom:none; }
    .dr-icon { font-size:15px;flex-shrink:0; }
    .dr-label { color:#64748b;flex:1; }
    .detail-row strong { color:#1e293b; }
    .detail-link {
      display:flex;align-items:center;justify-content:center;gap:8px;
      margin-top:16px;padding:12px;
      background:linear-gradient(135deg,#4f46e5,#7c3aed);
      color:white;border-radius:14px;text-decoration:none;
      font-weight:700;font-size:13.5px;transition:all .2s;
    }
    .detail-link:hover { transform:translateY(-2px);box-shadow:0 8px 24px rgba(79,70,229,.45); }

    @media (max-width:900px) {
      .cal-layout { grid-template-columns:1fr; }
      .hero-stats { display:none; }
      .cal-body { padding:12px; }
    }
  `]
})
export class InterviewCalendarComponent implements OnInit {
  loading = true;
  interviews: Interview[] = [];
  currentDate = new Date();
  selectedDay = '';
  selectedDayInterviews: Interview[] = [];
  detailInterview: Interview | null = null;

  dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  calendarWeeks: { day: number; dateStr: string; currentMonth: boolean; isToday: boolean; interviews: Interview[] }[][] = [];

  private COLORS = ['#4F46E5','#7C3AED','#EC4899','#10B981','#F59E0B','#EF4444','#06B6D4','#8B5CF6'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.loadInterviews(); }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('authToken')}` });
  }

  loadInterviews(): void {
    this.http.get<any>(`${environment.apiUrl}/applications`, { headers: this.authHeaders() }).subscribe({
      next: (res) => {
        const apps = res.data || res || [];
        let colorIdx = 0;
        this.interviews = apps
          .filter((a: any) => a.interviewDate && a.status === 'entretien_programme')
          .map((a: any) => ({
            id: a._id || a.id,
            candidateName: (a.candidate?.firstName || a.candidate?.userId?.firstName)
              ? `${a.candidate.firstName || a.candidate.userId.firstName} ${a.candidate.lastName || a.candidate.userId.lastName}`.trim()
              : (a.candidateName || 'Candidat'),
            initials: this.getInitials(
              a.candidate?.firstName || a.candidate?.userId?.firstName,
              a.candidate?.lastName  || a.candidate?.userId?.lastName
            ),
            offerTitle: a.offer?.title || 'Offre',
            department: a.offer?.department || '',
            date: this.normalizeDate(a.interviewDate),
            time: a.interviewTime || '09:00',
            notes: a.interviewNotes || '',
            color: this.COLORS[colorIdx++ % this.COLORS.length],
            candidateId: a.candidate?._id || a.candidateId || '',
          }));
        this.loading = false;
        this.buildCalendar();
        this.selectToday();
      },
      error: () => { this.loading = false; this.buildCalendar(); }
    });
  }

  private normalizeDate(d: string): string {
    if (!d) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    try { return new Date(d).toISOString().split('T')[0]; } catch { return d; }
  }

  private getInitials(first?: string, last?: string): string {
    return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '??';
  }

  buildCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date().toISOString().split('T')[0];

    let startDow = firstDay.getDay();
    if (startDow === 0) startDow = 7;
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - (startDow - 1));

    const weeks: any[][] = [];
    const cursor = new Date(startDate);

    while (cursor <= lastDay || weeks.length < 5) {
      const week: any[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = cursor.toISOString().split('T')[0];
        week.push({
          day: cursor.getDate(),
          dateStr,
          currentMonth: cursor.getMonth() === month,
          isToday: dateStr === today,
          interviews: this.interviews.filter(iv => iv.date === dateStr)
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
      if (cursor.getMonth() !== month && weeks.length >= 4) break;
    }
    this.calendarWeeks = weeks;
  }

  selectDay(day: any): void {
    this.selectedDay = day.dateStr;
    this.selectedDayInterviews = day.interviews;
  }

  selectToday(): void {
    const today = new Date().toISOString().split('T')[0];
    this.selectedDay = today;
    this.selectedDayInterviews = this.interviews.filter(iv => iv.date === today);
  }

  openDetail(iv: Interview, e: Event): void { e.stopPropagation(); this.detailInterview = iv; }
  closeDetail(): void { this.detailInterview = null; }

  prevMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.buildCalendar();
  }

  goToday(): void { this.currentDate = new Date(); this.buildCalendar(); this.selectToday(); }

  get monthName(): string {
    return this.currentDate.toLocaleDateString('fr-FR', { month: 'long' })
      .replace(/^./, s => s.toUpperCase());
  }

  get monthYear(): string {
    return this.currentDate.getFullYear().toString();
  }

  get todayCount(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.interviews.filter(iv => iv.date === today).length;
  }

  get weekCount(): number {
    const now = new Date();
    const start = new Date(now); start.setDate(now.getDate() - now.getDay() + 1);
    const end = new Date(start); end.setDate(start.getDate() + 6);
    const s = start.toISOString().split('T')[0];
    const e = end.toISOString().split('T')[0];
    return this.interviews.filter(iv => iv.date >= s && iv.date <= e).length;
  }

  get upcomingInterviews(): Interview[] {
    const today = new Date().toISOString().split('T')[0];
    return [...this.interviews].filter(iv => iv.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try { return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); }
    catch { return dateStr; }
  }

  formatSelectedDay(): string {
    if (!this.selectedDay) return '';
    return this.formatDate(this.selectedDay);
  }

  getDaysDiff(dateStr: string): string {
    const today = new Date(); today.setHours(0,0,0,0);
    const d = new Date(dateStr + 'T12:00:00');
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Demain';
    if (diff < 0) return `Il y a ${-diff}j`;
    return `J+${diff}`;
  }
}
