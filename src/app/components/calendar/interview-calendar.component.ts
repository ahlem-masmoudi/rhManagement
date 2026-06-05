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
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
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

      <!-- Header -->
      <div class="cal-hero">
        <div class="hero-bg">
          <div class="hero-orb orb1"></div>
          <div class="hero-orb orb2"></div>
          <div class="hero-orb orb3"></div>
        </div>
        <div class="hero-content">
          <div class="hero-icon">📅</div>
          <div>
            <h1>Calendrier des entretiens</h1>
            <p class="hero-sub">Visualisez et gérez vos entretiens planifiés</p>
          </div>
          <div class="hero-stats">
            <div class="hstat">
              <span class="hstat-val">{{ interviews.length }}</span>
              <span class="hstat-lab">Entretiens</span>
            </div>
            <div class="hstat">
              <span class="hstat-val">{{ todayCount }}</span>
              <span class="hstat-lab">Aujourd'hui</span>
            </div>
            <div class="hstat">
              <span class="hstat-val">{{ weekCount }}</span>
              <span class="hstat-lab">Cette semaine</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-wrap">
        <div class="loading-ring"></div>
        <p>Chargement des entretiens...</p>
      </div>

      <div *ngIf="!loading" class="cal-body">

        <!-- Nav + View toggle -->
        <div class="cal-toolbar">
          <div class="nav-arrows">
            <button class="nav-btn" (click)="prevMonth()">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <h2 class="month-label">{{ monthLabel }}</h2>
            <button class="nav-btn" (click)="nextMonth()">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
          <button class="today-btn" (click)="goToday()">Aujourd'hui</button>
        </div>

        <div class="cal-layout">

          <!-- Calendar grid -->
          <div class="cal-grid-wrap">
            <!-- Day headers -->
            <div class="day-headers">
              <div *ngFor="let d of dayNames" class="day-header">{{ d }}</div>
            </div>

            <!-- Weeks -->
            <div class="weeks">
              <div *ngFor="let week of calendarWeeks" class="week-row">
                <div *ngFor="let day of week"
                     class="day-cell"
                     [class.other-month]="!day.currentMonth"
                     [class.today]="day.isToday"
                     [class.has-events]="day.interviews.length > 0"
                     [class.selected]="selectedDay === day.dateStr"
                     (click)="selectDay(day)">

                  <div class="day-num" [class.today-num]="day.isToday">{{ day.day }}</div>

                  <div class="event-pills">
                    <div *ngFor="let iv of day.interviews.slice(0, 2)"
                         class="event-pill"
                         [style.background]="iv.color + '22'"
                         [style.border-left]="'3px solid ' + iv.color"
                         (click)="openDetail(iv, $event)">
                      <span class="pill-time">{{ iv.time }}</span>
                      <span class="pill-name">{{ iv.candidateName.split(' ')[0] }}</span>
                    </div>
                    <div *ngIf="day.interviews.length > 2" class="pill-more">+{{ day.interviews.length - 2 }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="sidebar">

            <!-- Selected day panel -->
            <div class="sidebar-card" *ngIf="selectedDay">
              <div class="sidebar-head">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
                {{ formatSelectedDay() }}
              </div>
              <div *ngIf="selectedDayInterviews.length === 0" class="empty-day">
                <span>Aucun entretien ce jour</span>
              </div>
              <div *ngFor="let iv of selectedDayInterviews; let i = index"
                   class="iv-card" [style.animation-delay]="(i*0.07)+'s'"
                   [routerLink]="['/rh/profil', iv.candidateId]">
                <div class="iv-color-bar" [style.background]="iv.color"></div>
                <div class="iv-body">
                  <div class="iv-time">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
                    {{ iv.time }}
                  </div>
                  <div class="iv-avatar" [style.background]="iv.color">{{ iv.initials }}</div>
                  <div class="iv-info">
                    <p class="iv-name">{{ iv.candidateName }}</p>
                    <p class="iv-offer">{{ iv.offerTitle }}</p>
                    <p class="iv-dept" *ngIf="iv.notes">💬 {{ iv.notes }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Upcoming interviews -->
            <div class="sidebar-card">
              <div class="sidebar-head">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
                Prochains entretiens
              </div>
              <div *ngIf="upcomingInterviews.length === 0" class="empty-day">Aucun entretien à venir</div>
              <div *ngFor="let iv of upcomingInterviews.slice(0, 5); let i = index"
                   class="upcoming-row" [style.animation-delay]="(i*0.06)+'s'"
                   [routerLink]="['/rh/profil', iv.candidateId]">
                <div class="up-dot" [style.background]="iv.color"></div>
                <div class="up-body">
                  <p class="up-name">{{ iv.candidateName }}</p>
                  <p class="up-when">{{ formatDate(iv.date) }} — {{ iv.time }}</p>
                  <p class="up-offer">{{ iv.offerTitle }}</p>
                </div>
                <div class="up-badge" [style.background]="iv.color + '22'" [style.color]="iv.color">
                  {{ getDaysDiff(iv.date) }}
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
          <div class="detail-header" [style.background]="'linear-gradient(135deg,' + detailInterview.color + ', ' + detailInterview.color + 'cc)'">
            <div class="detail-avatar">{{ detailInterview.initials }}</div>
            <div>
              <h3>{{ detailInterview.candidateName }}</h3>
              <p>{{ detailInterview.offerTitle }}</p>
            </div>
            <button class="close-btn" (click)="closeDetail()">✕</button>
          </div>
          <div class="detail-body">
            <div class="detail-row">
              <span>📅 Date</span><strong>{{ formatDate(detailInterview.date) }}</strong>
            </div>
            <div class="detail-row">
              <span>🕐 Heure</span><strong>{{ detailInterview.time }}</strong>
            </div>
            <div class="detail-row">
              <span>🏢 Département</span><strong>{{ detailInterview.department }}</strong>
            </div>
            <div class="detail-row" *ngIf="detailInterview.notes">
              <span>💬 Notes</span><strong>{{ detailInterview.notes }}</strong>
            </div>
            <a [routerLink]="['/rh/profil', detailInterview.candidateId]"
               class="detail-link" (click)="closeDetail()">
              Voir le profil complet →
            </a>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ── Hero ── */
    .cal-page { padding: 0; background: #f1f5f9; }

    .cal-hero {
      position: relative; overflow: hidden;
      background: linear-gradient(135deg, #3b1f6b 0%, #4F46E5 50%, #7C3AED 100%);
      padding: 20px 32px 24px; margin-bottom: -12px;
    }
    .hero-bg { position: absolute; inset: 0; pointer-events: none; }
    .hero-orb {
      position: absolute; border-radius: 50%;
      background: rgba(255,255,255,0.06);
      animation: float 6s ease-in-out infinite;
    }
    .orb1 { width:320px;height:320px;top:-80px;right:-60px;animation-delay:0s; }
    .orb2 { width:180px;height:180px;bottom:-40px;left:30%;animation-delay:2s; }
    .orb3 { width:100px;height:100px;top:20px;left:20%;animation-delay:4s; }
    @keyframes float {
      0%,100% { transform: translateY(0) scale(1); }
      50%      { transform: translateY(-12px) scale(1.04); }
    }
    .hero-content { position:relative;display:flex;align-items:center;gap:20px;flex-wrap:wrap; }
    .hero-icon { font-size:36px;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.3));animation:pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
    .hero-content h1 { color:white;font-size:22px;font-weight:800;margin:0 0 2px;letter-spacing:-.5px; }
    .hero-sub { color:rgba(255,255,255,0.7);margin:0;font-size:13px; }
    .hero-stats { display:flex;gap:14px;margin-left:auto; }
    .hstat { text-align:center;background:rgba(255,255,255,0.12);border-radius:12px;padding:8px 16px;backdrop-filter:blur(8px); }
    .hstat-val { display:block;font-size:22px;font-weight:900;color:white;line-height:1; }
    .hstat-lab { display:block;font-size:10px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:.8px;margin-top:3px; }

    /* ── Loading ── */
    .loading-wrap { display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;gap:16px;color:#94a3b8; }
    .loading-ring { width:48px;height:48px;border:4px solid #e2e8f0;border-top-color:#4F46E5;border-radius:50%;animation:spin 0.8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* ── Body ── */
    .cal-body { padding: 16px 24px 16px; }

    /* ── Toolbar ── */
    .cal-toolbar { display:flex;align-items:center;justify-content:space-between;margin-bottom:12px; }
    .nav-arrows { display:flex;align-items:center;gap:12px; }
    .nav-btn {
      width:38px;height:38px;border-radius:10px;border:1.5px solid #e2e8f0;
      background:white;color:#4F46E5;cursor:pointer;display:flex;align-items:center;justify-content:center;
      transition:all .2s;box-shadow:0 1px 4px rgba(0,0,0,.06);
    }
    .nav-btn:hover { background:#4F46E5;color:white;border-color:#4F46E5;transform:scale(1.05); }
    .month-label { font-size:20px;font-weight:800;color:#1e293b;margin:0;min-width:200px;text-align:center; }
    .today-btn {
      padding:9px 20px;border-radius:10px;border:1.5px solid #4F46E5;background:white;
      color:#4F46E5;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;
    }
    .today-btn:hover { background:#4F46E5;color:white; }

    /* ── Layout ── */
    .cal-layout { display:grid;grid-template-columns:1fr 280px;gap:16px;align-items:start; }

    /* ── Grid ── */
    .cal-grid-wrap { background:white;border-radius:20px;box-shadow:0 4px 24px rgba(0,0,0,.07);overflow:hidden; }
    .day-headers { display:grid;grid-template-columns:repeat(7,1fr);background:linear-gradient(135deg,#4F46E5,#7C3AED); }
    .day-header { padding:8px 0;text-align:center;font-size:11px;font-weight:700;color:rgba(255,255,255,.85);text-transform:uppercase;letter-spacing:.6px; }
    .weeks { display:flex;flex-direction:column; }
    .week-row { display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid #f1f5f9; }
    .week-row:last-child { border-bottom:none; }

    .day-cell {
      min-height:78px;padding:6px;border-right:1px solid #f1f5f9;cursor:pointer;
      transition:background .15s;position:relative;overflow:hidden;
    }
    .day-cell:last-child { border-right:none; }
    .day-cell:hover { background:#f8fafc; }
    .day-cell.other-month { background:#fafafa; }
    .day-cell.other-month .day-num { color:#cbd5e1; }
    .day-cell.today { background:linear-gradient(135deg,#EEF2FF,#F5F3FF); }
    .day-cell.selected { background:#EEF2FF;box-shadow:inset 0 0 0 2px #4F46E5; }
    .day-cell.has-events::after {
      content:'';position:absolute;bottom:5px;right:5px;
      width:6px;height:6px;border-radius:50%;background:#4F46E5;opacity:.4;
    }

    .day-num { font-size:13px;font-weight:600;color:#475569;margin-bottom:6px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%; }
    .today-num { background:linear-gradient(135deg,#4F46E5,#7C3AED);color:white;font-weight:800; }

    .event-pills { display:flex;flex-direction:column;gap:3px; }
    .event-pill {
      border-radius:5px;padding:2px 6px;font-size:10.5px;
      display:flex;gap:4px;align-items:center;cursor:pointer;
      transition:transform .15s;overflow:hidden;white-space:nowrap;
    }
    .event-pill:hover { transform:translateX(2px); }
    .pill-time { color:#475569;font-weight:700;flex-shrink:0; }
    .pill-name { color:#1e293b;font-weight:600;overflow:hidden;text-overflow:ellipsis; }
    .pill-more { font-size:10px;color:#94a3b8;font-weight:700;margin-top:1px; }

    /* ── Sidebar ── */
    .sidebar { display:flex;flex-direction:column;gap:16px; }
    .sidebar-card {
      background:white;border-radius:18px;box-shadow:0 4px 20px rgba(0,0,0,.07);
      overflow:hidden;
    }
    .sidebar-head {
      display:flex;align-items:center;gap:8px;
      padding:14px 18px;font-size:13px;font-weight:700;color:#1e293b;
      border-bottom:1px solid #f1f5f9;
      background:linear-gradient(135deg,#f8fafc,#f1f5f9);
    }
    .empty-day { padding:20px 18px;text-align:center;color:#94a3b8;font-size:13px; }

    /* Interview cards in sidebar */
    .iv-card {
      display:flex;align-items:stretch;margin:10px 14px;border-radius:12px;
      box-shadow:0 2px 10px rgba(0,0,0,.06);overflow:hidden;cursor:pointer;
      transition:transform .2s,box-shadow .2s;
      animation:slideUp .3s ease both;
    }
    .iv-card:hover { transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.12); }
    @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    .iv-color-bar { width:5px;flex-shrink:0; }
    .iv-body { padding:12px;display:flex;gap:10px;align-items:center;flex:1; }
    .iv-time { font-size:11px;font-weight:700;color:#64748b;display:flex;align-items:center;gap:3px;flex-shrink:0; }
    .iv-avatar { width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:white;flex-shrink:0; }
    .iv-info { min-width:0; }
    .iv-name { font-size:13px;font-weight:700;color:#1e293b;margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .iv-offer { font-size:11.5px;color:#64748b;margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .iv-dept { font-size:11px;color:#94a3b8;margin:0; }

    /* Upcoming rows */
    .upcoming-row {
      display:flex;align-items:center;gap:12px;padding:12px 18px;
      border-bottom:1px solid #f8fafc;cursor:pointer;transition:background .15s;
      animation:slideUp .3s ease both;
    }
    .upcoming-row:last-child { border-bottom:none; }
    .upcoming-row:hover { background:#f8fafc; }
    .up-dot { width:10px;height:10px;border-radius:50%;flex-shrink:0; }
    .up-body { flex:1;min-width:0; }
    .up-name { font-size:13px;font-weight:700;color:#1e293b;margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .up-when { font-size:11.5px;color:#6366f1;font-weight:600;margin:0 0 1px; }
    .up-offer { font-size:11px;color:#94a3b8;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .up-badge { padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;flex-shrink:0; }

    /* ── Empty global ── */
    .empty-global { text-align:center;padding:60px 20px; }
    .empty-icon { font-size:64px;margin-bottom:16px;animation:float 4s ease-in-out infinite; }
    .empty-global h3 { font-size:20px;font-weight:700;color:#374151;margin:0 0 8px; }
    .empty-global p { color:#94a3b8;font-size:14px; }

    /* ── Detail modal ── */
    .modal-backdrop { position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease; }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    .detail-modal { background:white;border-radius:24px;width:90%;max-width:440px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.25);animation:modalPop .3s cubic-bezier(.34,1.56,.64,1); }
    @keyframes modalPop { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
    .detail-header { padding:24px;display:flex;align-items:center;gap:16px;position:relative; }
    .detail-avatar { width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:white;flex-shrink:0; }
    .detail-header h3 { color:white;margin:0 0 4px;font-size:18px;font-weight:800; }
    .detail-header p { color:rgba(255,255,255,.8);margin:0;font-size:13px; }
    .close-btn { position:absolute;top:14px;right:14px;background:rgba(255,255,255,.2);border:none;color:white;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:background .2s; }
    .close-btn:hover { background:rgba(255,255,255,.35); }
    .detail-body { padding:20px 24px; }
    .detail-row { display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13.5px; }
    .detail-row span { color:#64748b; }
    .detail-row strong { color:#1e293b; }
    .detail-link { display:block;margin-top:20px;text-align:center;padding:12px;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:white;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;transition:transform .2s,box-shadow .2s; }
    .detail-link:hover { transform:translateY(-2px);box-shadow:0 6px 20px rgba(79,70,229,.4); }

    @media (max-width:900px) {
      .cal-layout { grid-template-columns:1fr; }
      .hero-stats { display:none; }
      .cal-body { padding:16px; }
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

  ngOnInit(): void {
    this.loadInterviews();
  }

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
            candidateName: a.candidate?.userId
              ? `${a.candidate.userId.firstName} ${a.candidate.userId.lastName}`.trim()
              : (a.candidateName || 'Candidat'),
            initials: this.getInitials(a.candidate?.userId?.firstName, a.candidate?.userId?.lastName),
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

    // Start from Monday
    let startDow = firstDay.getDay(); // 0=Sun
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

  openDetail(iv: Interview, e: Event): void {
    e.stopPropagation();
    this.detailInterview = iv;
  }

  closeDetail(): void { this.detailInterview = null; }

  prevMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.buildCalendar();
  }

  goToday(): void {
    this.currentDate = new Date();
    this.buildCalendar();
    this.selectToday();
  }

  get monthLabel(): string {
    return this.currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      .replace(/^./, s => s.toUpperCase());
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
