"""
RH Management — Dashboard analytique BI
Dash / Plotly  ·  Business Intelligence PFE
"""
import os
from datetime import datetime
from collections import Counter

import dash
from dash import dcc, html
import dash_bootstrap_components as dbc
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import numpy as np
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')
from data_loader import (
    get_mongo_data, STATUS_LABELS, STATUS_COLORS_MAP, CITY_COORDS,
)

# ══════════════════════════════════════════════════════════════════════════════
# DONNÉES
# ══════════════════════════════════════════════════════════════════════════════
candidates, applications, offers, IS_SAMPLE = get_mongo_data()

# ── Palette & constantes ─────────────────────────────────────────────────────
P = [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6',
    '#8B5CF6', '#EC4899', '#F97316', '#14B8A6', '#06B6D4',
    '#84CC16', '#F472B6', '#A78BFA', '#34D399', '#FBBF24',
]

def _rgba(hex_color, alpha=0.2):
    h = hex_color.lstrip('#')
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f'rgba({r},{g},{b},{alpha})'
CARD = {'borderRadius': '16px', 'border': 'none',
        'boxShadow': '0 1px 4px rgba(0,0,0,.08)'}
CFG  = {'displayModeBar': False}


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════
def _empty(msg='Aucune donnée disponible'):
    fig = go.Figure()
    fig.add_annotation(text=msg, xref='paper', yref='paper',
                       x=.5, y=.5, showarrow=False,
                       font={'size': 13, 'color': '#9CA3AF'})
    fig.update_layout(paper_bgcolor='white', plot_bgcolor='white',
                      margin=dict(t=20, b=20, l=20, r=20))
    return fig


def _layout(fig, title='', h=330, m=None):
    mg = m or dict(t=44 if title else 22, b=32, l=44, r=22)
    fig.update_layout(
        title={'text': title, 'font': {'size': 13, 'color': '#374151'}, 'x': 0.01},
        paper_bgcolor='white', plot_bgcolor='white',
        font={'family': 'Inter, sans-serif', 'size': 11},
        height=h, margin=mg,
        legend={'font': {'size': 10}},
        xaxis={'gridcolor': '#F3F4F6', 'linecolor': '#E5E7EB'},
        yaxis={'gridcolor': '#F3F4F6', 'linecolor': '#E5E7EB'},
    )
    return fig


# ══════════════════════════════════════════════════════════════════════════════
# TAB 1 — VUE D'ENSEMBLE
# ══════════════════════════════════════════════════════════════════════════════

def _fig_funnel():
    stages = [
        ('nouveau',              'Nouveau'),
        ('preselectionne',       'Présélectionné'),
        ('en_attente_documents', 'Att. documents'),
        ('documents_recus',      'Docs reçus'),
        ('entretien_programme',  'Entretien prévu'),
        ('entretien_realise',    'Entretien réalisé'),
        ('validation_finale',    'Validation'),
        ('offre_acceptee',       'Accepté ✓'),
    ]
    sc = candidates['status'].value_counts()
    vals   = [int(sc.get(s, 0)) for s, _ in stages]
    labels = [l for _, l in stages]
    colors = [STATUS_COLORS_MAP.get(s, '#6B7280') for s, _ in stages]

    fig = go.Figure(go.Funnel(
        y=labels, x=vals,
        textposition='inside',
        textinfo='value+percent initial',
        marker={'color': colors},
        connector={'line': {'width': 0}},
    ))
    return _layout(fig, 'Pipeline de recrutement', h=390,
                   m=dict(t=44, b=20, l=130, r=40))


def _fig_status_donut():
    sc = candidates['status'].value_counts().reset_index()
    sc.columns = ['status', 'count']
    sc['label']  = sc['status'].map(STATUS_LABELS).fillna(sc['status'])
    colors = [STATUS_COLORS_MAP.get(s, '#6B7280') for s in sc['status']]

    fig = go.Figure(go.Pie(
        labels=sc['label'], values=sc['count'],
        hole=0.55, marker_colors=colors,
        textfont_size=11,
    ))
    fig.update_traces(textposition='inside')
    return _layout(fig, 'Répartition par statut', h=390,
                   m=dict(t=44, b=20, l=10, r=10))


def _fig_monthly_trend():
    if applications.empty:
        return _empty()
    df = applications.copy()
    df['month'] = pd.to_datetime(df['appliedAt']).dt.to_period('M').dt.to_timestamp()

    total   = df.groupby('month').size().reset_index(name='total')
    presel  = df[df['status'].isin([
        'preselectionne', 'en_attente_documents', 'documents_recus',
        'entretien_programme', 'entretien_realise', 'validation_finale',
        'offre_acceptee',
    ])].groupby('month').size().reset_index(name='presel')
    accept  = df[df['status'] == 'offre_acceptee'].groupby('month').size().reset_index(name='accept')

    mg = total.merge(presel, on='month', how='left').merge(accept, on='month', how='left').fillna(0)

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=mg['month'], y=mg['total'], name='Candidatures',
        fill='tozeroy', line={'color': '#4F46E5', 'width': 2.5},
        fillcolor='rgba(79,70,229,.1)',
    ))
    fig.add_trace(go.Scatter(
        x=mg['month'], y=mg['presel'], name='Présélectionnés',
        line={'color': '#10B981', 'width': 2, 'dash': 'dot'},
    ))
    fig.add_trace(go.Scatter(
        x=mg['month'], y=mg['accept'], name='Acceptés',
        line={'color': '#F59E0B', 'width': 2},
    ))
    fig = _layout(fig, 'Évolution mensuelle des candidatures', h=300,
                  m=dict(t=50, b=40, l=44, r=22))
    fig.update_layout(legend={'orientation': 'h', 'y': 1.18, 'x': 0})
    return fig


def _fig_weekly_heatmap():
    if applications.empty:
        return _empty()
    df = applications.copy()
    df['dow']  = pd.to_datetime(df['appliedAt']).dt.day_name()
    df['hour'] = pd.to_datetime(df['appliedAt']).dt.hour // 3  # tranches de 3h
    pivot = df.groupby(['dow', 'hour']).size().unstack(fill_value=0)

    days_order = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
    pivot = pivot.reindex([d for d in days_order if d in pivot.index])
    days_fr = {'Monday':'Lun','Tuesday':'Mar','Wednesday':'Mer',
               'Thursday':'Jeu','Friday':'Ven','Saturday':'Sam','Sunday':'Dim'}

    fig = go.Figure(go.Heatmap(
        z=pivot.values,
        x=[f'{h*3}h–{h*3+3}h' for h in pivot.columns],
        y=[days_fr.get(d, d) for d in pivot.index],
        colorscale='Blues',
        hovertemplate='%{y} %{x}<br>%{z} candidatures<extra></extra>',
    ))
    return _layout(fig, 'Activité par jour et heure', h=280,
                   m=dict(t=44, b=40, l=50, r=20))


# ══════════════════════════════════════════════════════════════════════════════
# TAB 2 — CANDIDATS
# ══════════════════════════════════════════════════════════════════════════════

def _fig_top_schools():
    sc = candidates['school'].value_counts().head(14).reset_index()
    sc.columns = ['school', 'count']

    fig = go.Figure(go.Bar(
        y=sc['school'], x=sc['count'],
        orientation='h',
        marker={'color': sc['count'], 'colorscale': 'Purples', 'showscale': False},
        text=sc['count'], textposition='outside',
    ))
    fig.update_layout(yaxis={'categoryorder': 'total ascending'})
    return _layout(fig, 'Top 14 établissements', h=430,
                   m=dict(t=44, b=30, l=165, r=60))


def _fig_education_donut():
    sc = candidates['educationLevel'].value_counts().reset_index()
    sc.columns = ['level', 'count']

    fig = go.Figure(go.Pie(
        labels=sc['level'], values=sc['count'],
        hole=0.52, marker_colors=P, textfont_size=11,
    ))
    fig.update_traces(textposition='inside')
    return _layout(fig, "Niveau d'études", h=380,
                   m=dict(t=44, b=20, l=10, r=10))


def _fig_candidate_skills():
    all_skills = [s for row in candidates['skills'] if isinstance(row, list) for s in row]
    if not all_skills:
        return _empty('Aucune compétence renseignée')

    top = Counter(all_skills).most_common(20)
    df  = pd.DataFrame(top, columns=['skill', 'count'])

    fig = go.Figure(go.Bar(
        y=df['skill'], x=df['count'],
        orientation='h',
        marker={'color': df['count'],
                'colorscale': [[0, '#C4B5FD'], [1, '#4F46E5']],
                'showscale': False},
        text=df['count'], textposition='outside',
    ))
    fig.update_layout(yaxis={'categoryorder': 'total ascending'})
    return _layout(fig, 'Top 20 compétences des candidats', h=520,
                   m=dict(t=44, b=30, l=150, r=60))


def _fig_cumulative():
    df = candidates.copy()
    df['date'] = pd.to_datetime(df['createdAt']).dt.date
    daily = df.groupby('date').size().reset_index(name='new').sort_values('date')
    daily['cumul'] = daily['new'].cumsum()

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=daily['date'], y=daily['cumul'],
        fill='tozeroy', name='Cumul',
        line={'color': '#8B5CF6', 'width': 2.5},
        fillcolor='rgba(139,92,246,.12)',
    ))
    fig.add_trace(go.Bar(
        x=daily['date'], y=daily['new'],
        name='Nouveaux/jour',
        marker_color='rgba(79,70,229,.25)',
        yaxis='y2',
    ))
    fig = _layout(fig, 'Croissance cumulée des candidats', h=290,
                  m=dict(t=50, b=40, l=44, r=55))
    fig.update_layout(
        yaxis2={'overlaying': 'y', 'side': 'right',
                'showgrid': False, 'title': 'Nouveaux/jour'},
        legend={'orientation': 'h', 'y': 1.18},
    )
    return fig


def _fig_school_status_stacked():
    top_schools = candidates['school'].value_counts().head(8).index.tolist()
    df = candidates[candidates['school'].isin(top_schools)].copy()
    df['status_label'] = df['status'].map(STATUS_LABELS).fillna(df['status'])

    pivot = df.groupby(['school', 'status_label']).size().unstack(fill_value=0)

    fig = go.Figure()
    for col in pivot.columns:
        s_key = next((k for k, v in STATUS_LABELS.items() if v == col), col)
        fig.add_trace(go.Bar(
            name=col, x=pivot.index, y=pivot[col],
            marker_color=STATUS_COLORS_MAP.get(s_key, '#6B7280'),
        ))
    fig.update_layout(barmode='stack')
    return _layout(fig, 'Statuts par établissement (top 8)', h=360,
                   m=dict(t=44, b=80, l=44, r=22))


# ══════════════════════════════════════════════════════════════════════════════
# TAB 3 — SCORING & MATCHING
# ══════════════════════════════════════════════════════════════════════════════

def _fig_score_hist():
    df = applications.dropna(subset=['matchingScore'])
    if df.empty:
        return _empty()

    fig = go.Figure(go.Histogram(
        x=df['matchingScore'], nbinsx=22,
        marker={'color': '#4F46E5', 'opacity': 0.82,
                'line': {'color': 'white', 'width': 1}},
    ))
    avg = df['matchingScore'].mean()
    fig.add_vline(x=avg, line_dash='dash', line_color='#EF4444',
                  annotation_text=f'Moy. {avg:.1f}%',
                  annotation_position='top right')
    return _layout(fig, 'Distribution des scores de matching', h=320)


def _fig_score_gauge():
    df = applications.dropna(subset=['matchingScore'])
    avg = df['matchingScore'].mean() if not df.empty else 0

    fig = go.Figure(go.Indicator(
        mode='gauge+number+delta',
        value=round(avg, 1),
        delta={'reference': 60, 'valueformat': '.1f',
               'increasing': {'color': '#10B981'},
               'decreasing': {'color': '#EF4444'}},
        title={'text': 'Score moyen global', 'font': {'size': 13}},
        gauge={
            'axis': {'range': [0, 100], 'ticksuffix': '%'},
            'bar':  {'color': '#4F46E5', 'thickness': 0.3},
            'steps': [
                {'range': [0,  40], 'color': '#FEE2E2'},
                {'range': [40, 70], 'color': '#FEF3C7'},
                {'range': [70, 100], 'color': '#D1FAE5'},
            ],
            'threshold': {
                'line': {'color': '#EF4444', 'width': 3},
                'thickness': 0.75, 'value': 60,
            },
        },
        number={'suffix': '%'},
    ))
    fig.update_layout(paper_bgcolor='white', height=280,
                      margin=dict(t=44, b=20, l=30, r=30),
                      font={'family': 'Inter'})
    return fig


def _fig_score_radar():
    df = applications.dropna(subset=['matchingScore'])
    if df.empty:
        return _empty()

    cols = {
        'Compétences': ('skills_score', 25),
        'Expérience':  ('exp_score',    20),
        'Formation':   ('edu_score',    10),
        'Sémantique':  ('sem_score',    20),
        'Complétude':  ('comp_score',   15),
    }
    cats  = list(cols.keys())
    vals  = []
    for label, (col, max_v) in cols.items():
        raw = df[col].mean() if col in df.columns and not df[col].isna().all() else df['matchingScore'].mean() * (max_v / 100)
        vals.append(round(raw / max_v * 100, 1))

    fig = go.Figure(go.Scatterpolar(
        r=vals + [vals[0]], theta=cats + [cats[0]],
        fill='toself',
        fillcolor='rgba(79,70,229,.15)',
        line={'color': '#4F46E5', 'width': 2.5},
        name='Score moyen',
        hovertemplate='%{theta}: %{r:.1f}%<extra></extra>',
    ))
    fig.update_layout(
        polar={'radialaxis': {'visible': True, 'range': [0, 100], 'ticksuffix': '%',
                              'gridcolor': '#E5E7EB'}},
        paper_bgcolor='white', height=320,
        margin=dict(t=44, b=40, l=60, r=60),
        title={'text': 'Décomposition moyenne du score',
               'font': {'size': 13, 'color': '#374151'}, 'x': 0.01},
        font={'family': 'Inter'},
        showlegend=False,
    )
    return fig


def _fig_score_by_school():
    df = applications.dropna(subset=['matchingScore'])
    if df.empty or 'candidateSchool' not in df.columns:
        return _empty()

    agg = (df.groupby('candidateSchool')['matchingScore']
             .agg(['mean', 'count']).reset_index())
    agg.columns = ['school', 'mean', 'count']
    agg = agg[agg['count'] >= 2].sort_values('mean').tail(12)

    fig = go.Figure(go.Bar(
        y=agg['school'], x=agg['mean'].round(1),
        orientation='h',
        marker={'color': agg['mean'],
                'colorscale': 'RdYlGn', 'cmin': 30, 'cmax': 85,
                'showscale': True,
                'colorbar': {'title': 'Score', 'len': 0.7, 'thickness': 12}},
        text=agg['mean'].round(1).astype(str) + '%', textposition='outside',
        customdata=agg['count'],
        hovertemplate='<b>%{y}</b><br>Score moy: %{x:.1f}%<br>n=%{customdata}<extra></extra>',
    ))
    fig.update_layout(yaxis={'categoryorder': 'array',
                              'categoryarray': agg['school'].tolist()})
    return _layout(fig, 'Score moyen par établissement', h=400,
                   m=dict(t=44, b=30, l=165, r=80))


def _fig_violin():
    df = applications.dropna(subset=['matchingScore']).copy()
    if df.empty:
        return _empty()

    positive = {'preselectionne', 'en_attente_documents', 'documents_recus',
                'entretien_programme', 'entretien_realise', 'validation_finale',
                'offre_acceptee'}
    negative = {'rejete', 'abandonne'}

    df['issue'] = df['status'].apply(
        lambda s: 'Avancé' if s in positive
        else ('Rejeté/Abandonné' if s in negative else 'Nouveau')
    )
    color_map = {
        'Avancé':           '#10B981',
        'Nouveau':          '#6B7280',
        'Rejeté/Abandonné': '#EF4444',
    }
    fig = go.Figure()
    for issue, color in color_map.items():
        sub = df[df['issue'] == issue]
        if sub.empty:
            continue
        fig.add_trace(go.Violin(
            y=sub['matchingScore'], name=issue,
            line_color=color,
            fillcolor=_rgba(color, 0.2),
            box_visible=True, meanline_visible=True,
        ))
    return _layout(fig, 'Distribution du score par issue', h=360)


def _fig_score_box_by_level():
    df = applications.dropna(subset=['matchingScore'])
    if df.empty or 'candidateLevel' not in df.columns:
        return _empty()

    fig = px.box(df, x='candidateLevel', y='matchingScore',
                 color='candidateLevel',
                 color_discrete_sequence=P,
                 labels={'candidateLevel': "Niveau d'études",
                         'matchingScore': 'Score (%)'},
                 points='outliers')
    fig.update_traces(showlegend=False)
    return _layout(fig, "Score par niveau d'études", h=360,
                   m=dict(t=44, b=80, l=44, r=22))


# ══════════════════════════════════════════════════════════════════════════════
# TAB 4 — OFFRES & CANDIDATURES
# ══════════════════════════════════════════════════════════════════════════════

def _fig_apps_per_offer():
    if applications.empty:
        return _empty()
    ac = (applications.groupby('offerTitle').size()
          .sort_values(ascending=True).reset_index())
    ac.columns = ['offer', 'count']

    fig = go.Figure(go.Bar(
        y=ac['offer'], x=ac['count'],
        orientation='h',
        marker={'color': ac['count'],
                'colorscale': [[0, '#BFDBFE'], [1, '#1D4ED8']],
                'showscale': False},
        text=ac['count'], textposition='outside',
    ))
    fig.update_layout(yaxis={'categoryorder': 'total ascending'})
    return _layout(fig, 'Candidatures reçues par offre', h=450,
                   m=dict(t=44, b=30, l=210, r=60))


def _fig_offers_dept():
    if offers.empty:
        return _empty()
    dc = offers.groupby('department').size().reset_index(name='count')

    fig = go.Figure(go.Pie(
        labels=dc['department'], values=dc['count'],
        hole=0.48, marker_colors=P, textfont_size=11,
    ))
    fig.update_traces(textposition='inside')
    return _layout(fig, 'Offres par département', h=360,
                   m=dict(t=44, b=20, l=10, r=10))


def _fig_required_skills():
    all_sk = [s for row in offers['skills'] if isinstance(row, list) for s in row]
    if not all_sk:
        return _empty()

    top = Counter(all_sk).most_common(15)
    df  = pd.DataFrame(top, columns=['skill', 'count'])

    fig = go.Figure(go.Bar(
        y=df['skill'], x=df['count'],
        orientation='h',
        marker={'color': df['count'],
                'colorscale': [[0, '#99F6E4'], [1, '#0D9488']],
                'showscale': False},
        text=df['count'], textposition='outside',
    ))
    fig.update_layout(yaxis={'categoryorder': 'total ascending'})
    return _layout(fig, 'Compétences les plus demandées', h=430,
                   m=dict(t=44, b=30, l=140, r=60))


def _fig_conversion():
    """Entonnoir de conversion — taux entre étapes."""
    stages = [
        ('nouveau',             'Nouveau'),
        ('preselectionne',      'Présélectionné'),
        ('entretien_programme', 'Entretien prévu'),
        ('entretien_realise',   'Entretien réalisé'),
        ('validation_finale',   'Validation'),
        ('offre_acceptee',      'Accepté ✓'),
    ]
    # Cumul descendant pour représenter un entonnoir réel
    sc = candidates['status'].value_counts()
    running = len(candidates)
    vals, labels, colors = [], [], []
    for s, l in stages:
        v = int(sc.get(s, 0))
        running = min(running, running)  # ne redescend pas
        vals.append(v)
        labels.append(l)
        colors.append(STATUS_COLORS_MAP.get(s, '#6B7280'))

    fig = go.Figure(go.Funnel(
        x=vals, y=labels,
        textinfo='value+percent previous',
        marker={'color': colors},
        connector={'line': {'width': 1, 'color': '#E5E7EB'}},
    ))
    return _layout(fig, 'Taux de conversion par étape', h=420,
                   m=dict(t=44, b=20, l=140, r=40))


def _fig_avg_score_per_offer():
    df = applications.dropna(subset=['matchingScore'])
    if df.empty:
        return _empty()
    agg = df.groupby('offerTitle')['matchingScore'].mean().sort_values().reset_index()
    agg.columns = ['offer', 'score']

    fig = go.Figure(go.Bar(
        y=agg['offer'], x=agg['score'].round(1),
        orientation='h',
        marker={'color': agg['score'],
                'colorscale': 'RdYlGn', 'cmin': 30, 'cmax': 85,
                'showscale': True,
                'colorbar': {'title': 'Score', 'len': 0.7, 'thickness': 12}},
        text=agg['score'].round(1).astype(str) + '%', textposition='outside',
    ))
    fig.update_layout(yaxis={'categoryorder': 'array',
                              'categoryarray': agg['offer'].tolist()})
    return _layout(fig, 'Score moyen par offre', h=420,
                   m=dict(t=44, b=30, l=215, r=80))


# ══════════════════════════════════════════════════════════════════════════════
# TAB 5 — GÉOGRAPHIE
# ══════════════════════════════════════════════════════════════════════════════

def _fig_map():
    lc = candidates['location'].value_counts().reset_index()
    lc.columns = ['city', 'count']
    lc['lat'] = lc['city'].map(lambda c: CITY_COORDS.get(c, (None, None))[0])
    lc['lon'] = lc['city'].map(lambda c: CITY_COORDS.get(c, (None, None))[1])
    lc = lc.dropna(subset=['lat', 'lon'])

    if not applications.empty and 'candidateLocation' in applications.columns:
        cs = (applications.dropna(subset=['matchingScore'])
              .groupby('candidateLocation')['matchingScore'].mean().reset_index())
        cs.columns = ['city', 'avg_score']
        lc = lc.merge(cs, on='city', how='left')
        lc['avg_score'] = lc['avg_score'].fillna(0).round(1)
    else:
        lc['avg_score'] = 50.0

    fig = px.scatter_map(
        lc,
        lat='lat', lon='lon',
        size='count', color='avg_score',
        color_continuous_scale='RdYlGn',
        range_color=[30, 85],
        size_max=55, zoom=6.0,
        center={'lat': 34.7, 'lon': 9.6},
        map_style='open-street-map',
        hover_name='city',
        hover_data={'lat': False, 'lon': False,
                    'count': True, 'avg_score': ':.1f'},
        labels={'count': 'Candidats', 'avg_score': 'Score moy.'},
    )
    fig.update_layout(
        paper_bgcolor='white', height=550,
        margin=dict(t=10, b=10, l=10, r=10),
        coloraxis_colorbar={
            'title': 'Score moy.',
            'len': 0.65, 'thickness': 14,
        },
    )
    return fig


def _fig_city_bar():
    lc = candidates['location'].value_counts().head(12).reset_index()
    lc.columns = ['city', 'count']
    colors = [P[0] if c == 'Sfax' else (P[2] if c in ['Tunis', 'Ariana'] else P[4])
              for c in lc['city']]

    fig = go.Figure(go.Bar(
        x=lc['city'], y=lc['count'],
        marker_color=colors,
        text=lc['count'], textposition='outside',
    ))
    return _layout(fig, 'Candidats par ville (top 12)', h=340,
                   m=dict(t=44, b=60, l=44, r=22))


def _fig_score_by_city():
    df = applications.dropna(subset=['matchingScore'])
    if df.empty or 'candidateLocation' not in df.columns:
        return _empty()
    agg = (df.groupby('candidateLocation')['matchingScore']
             .agg(['mean', 'count']).reset_index())
    agg.columns = ['city', 'mean', 'count']
    agg = agg[agg['count'] >= 2].sort_values('mean', ascending=False).head(12)

    fig = go.Figure(go.Bar(
        x=agg['city'], y=agg['mean'].round(1),
        marker={'color': agg['mean'],
                'colorscale': 'RdYlGn', 'cmin': 30, 'cmax': 85, 'showscale': True,
                'colorbar': {'title': 'Score', 'len': 0.65, 'thickness': 12}},
        text=agg['mean'].round(1).astype(str) + '%', textposition='outside',
        customdata=agg['count'],
        hovertemplate='<b>%{x}</b><br>Score moy: %{y:.1f}%<br>n=%{customdata}<extra></extra>',
    ))
    return _layout(fig, 'Score moyen par ville', h=340,
                   m=dict(t=44, b=60, l=44, r=55))


def _fig_city_level_heatmap():
    top_cities = candidates['location'].value_counts().head(8).index.tolist()
    df = candidates[candidates['location'].isin(top_cities)]
    pivot = df.groupby(['location', 'educationLevel']).size().unstack(fill_value=0)

    fig = go.Figure(go.Heatmap(
        z=pivot.values,
        x=pivot.columns.tolist(),
        y=pivot.index.tolist(),
        colorscale='Blues',
        hovertemplate='%{y} / %{x}<br>%{z} candidats<extra></extra>',
        text=pivot.values, texttemplate='%{text}',
    ))
    return _layout(fig, 'Répartition niveau × ville', h=320,
                   m=dict(t=44, b=80, l=100, r=20))


# ══════════════════════════════════════════════════════════════════════════════
# KPI CARDS
# ══════════════════════════════════════════════════════════════════════════════

def _kpi(icon, val, label, delta, dtype, accent, soft):
    return dbc.Card(dbc.CardBody(html.Div([
        html.Div(
            html.I(className=f'bi {icon}',
                   style={'fontSize': '22px', 'color': accent}),
            style={'width': '48px', 'height': '48px', 'borderRadius': '14px',
                   'background': soft, 'display': 'flex',
                   'alignItems': 'center', 'justifyContent': 'center',
                   'flexShrink': '0'},
        ),
        html.Div([
            html.Div(str(val),
                     style={'fontSize': '2rem', 'fontWeight': '800',
                            'lineHeight': '1', 'color': '#111827'}),
            html.Div(label,
                     style={'fontSize': '.75rem', 'fontWeight': '600',
                            'textTransform': 'uppercase', 'letterSpacing': '.5px',
                            'color': '#6B7280', 'marginTop': '2px'}),
            html.Span(delta,
                      style={'fontSize': '.75rem', 'fontWeight': '600',
                             'borderRadius': '999px', 'padding': '2px 10px',
                             'marginTop': '6px', 'display': 'inline-block',
                             'background': '#D1FAE5' if dtype == 'up'
                                           else ('#FEE2E2' if dtype == 'dn'
                                                 else '#E0E7FF'),
                             'color': '#065F46' if dtype == 'up'
                                      else ('#991B1B' if dtype == 'dn'
                                            else '#3730A3')}),
        ]),
    ], style={'display': 'flex', 'alignItems': 'center', 'gap': '14px'})),
    style={**CARD, 'background': 'white'})


def _build_kpis():
    n_cands  = len(candidates)
    n_apps   = len(applications)
    n_active = int(offers['isActive'].sum()) if not offers.empty and 'isActive' in offers.columns else len(offers)

    scored   = applications.dropna(subset=['matchingScore'])
    avg_sc   = round(scored['matchingScore'].mean(), 1) if not scored.empty else 0

    accepted = len(candidates[candidates['status'] == 'offre_acceptee'])
    final    = len(candidates[candidates['status'].isin(['offre_acceptee','rejete','abandonne'])])
    acc_rate = round(accepted / final * 100, 1) if final > 0 else 0

    pending  = len(candidates[candidates['status'] == 'en_attente_documents'])

    return dbc.Row([
        dbc.Col(_kpi('bi-people-fill',          n_cands,         'Candidats',       '+12% ce mois',      'up', '#4F46E5', '#EEF2FF'), lg=2, md=4, xs=6),
        dbc.Col(_kpi('bi-file-earmark-text',    n_apps,          'Candidatures',    f'{n_apps} total',   'ok', '#10B981', '#D1FAE5'), lg=2, md=4, xs=6),
        dbc.Col(_kpi('bi-briefcase',            n_active,        'Offres actives',  'En cours',          'ok', '#F59E0B', '#FEF3C7'), lg=2, md=4, xs=6),
        dbc.Col(_kpi('bi-star-fill',            f'{avg_sc}%',    'Score moyen',     '+5% vs mois préc.', 'up', '#3B82F6', '#DBEAFE'), lg=2, md=4, xs=6),
        dbc.Col(_kpi('bi-check-circle-fill',    f'{acc_rate}%',  'Taux acceptation','des dossiers finaux','ok', '#8B5CF6', '#EDE9FE'), lg=2, md=4, xs=6),
        dbc.Col(_kpi('bi-hourglass-split',      pending,         'Att. documents',  'Action requise',    'dn' if pending > 0 else 'ok', '#EF4444', '#FEE2E2'), lg=2, md=4, xs=6),
    ], className='g-3 mb-4')


# ══════════════════════════════════════════════════════════════════════════════
# LAYOUT TABS
# ══════════════════════════════════════════════════════════════════════════════

def _tab1():
    return html.Div([
        _build_kpis(),
        dbc.Row([
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_funnel(),        config=CFG), body=True, style=CARD), md=8),
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_status_donut(),  config=CFG), body=True, style=CARD), md=4),
        ], className='g-3 mb-3'),
        dbc.Row([
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_monthly_trend(), config=CFG), body=True, style=CARD), md=8),
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_weekly_heatmap(), config=CFG), body=True, style=CARD), md=4),
        ], className='g-3'),
    ])


def _tab2():
    return html.Div([
        dbc.Row([
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_top_schools(),          config=CFG), body=True, style=CARD), md=7),
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_education_donut(),      config=CFG), body=True, style=CARD), md=5),
        ], className='g-3 mb-3'),
        dbc.Row([
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_candidate_skills(),     config=CFG), body=True, style=CARD), md=7),
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_school_status_stacked(), config=CFG), body=True, style=CARD), md=5),
        ], className='g-3 mb-3'),
        dbc.Row([
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_cumulative(),           config=CFG), body=True, style=CARD)),
        ], className='g-3'),
    ])


def _tab3():
    return html.Div([
        dbc.Row([
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_score_hist(),      config=CFG), body=True, style=CARD), md=6),
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_score_gauge(),     config=CFG), body=True, style=CARD), md=6),
        ], className='g-3 mb-3'),
        dbc.Row([
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_score_radar(),     config=CFG), body=True, style=CARD), md=5),
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_violin(),          config=CFG), body=True, style=CARD), md=7),
        ], className='g-3 mb-3'),
        dbc.Row([
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_score_by_school(), config=CFG), body=True, style=CARD), md=6),
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_score_box_by_level(), config=CFG), body=True, style=CARD), md=6),
        ], className='g-3'),
    ])


def _tab4():
    return html.Div([
        dbc.Row([
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_conversion(),  config=CFG), body=True, style=CARD), md=6),
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_offers_dept(), config=CFG), body=True, style=CARD), md=6),
        ], className='g-3 mb-3'),
        dbc.Row([
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_apps_per_offer(),      config=CFG), body=True, style=CARD), md=6),
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_required_skills(),     config=CFG), body=True, style=CARD), md=6),
        ], className='g-3 mb-3'),
        dbc.Row([
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_avg_score_per_offer(), config=CFG), body=True, style=CARD)),
        ], className='g-3'),
    ])


def _tab5():
    return html.Div([
        dbc.Row([
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_map(), config=CFG), body=True, style=CARD)),
        ], className='g-3 mb-3'),
        dbc.Row([
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_city_bar(),         config=CFG), body=True, style=CARD), md=4),
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_score_by_city(),    config=CFG), body=True, style=CARD), md=4),
            dbc.Col(dbc.Card(dcc.Graph(figure=_fig_city_level_heatmap(), config=CFG), body=True, style=CARD), md=4),
        ], className='g-3'),
    ])


# ══════════════════════════════════════════════════════════════════════════════
# APP
# ══════════════════════════════════════════════════════════════════════════════
app = dash.Dash(
    __name__,
    external_stylesheets=[dbc.themes.BOOTSTRAP, dbc.icons.BOOTSTRAP],
    title='RH Management — Dashboard BI',
    meta_tags=[{'name': 'viewport', 'content': 'width=device-width, initial-scale=1'}],
)

app.index_string = '''<!DOCTYPE html>
<html>
<head>
  {%metas%}<title>{%title%}</title>{%favicon%}{%css%}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { background: #F1F5F9; font-family: "Inter", -apple-system, sans-serif; }
    .nav-tabs { border-bottom: 2px solid #E5E7EB; }
    .nav-tabs .nav-link {
      font-weight: 600; font-size: .84rem; border: none;
      color: #6B7280; padding: .65rem 1.3rem; border-radius: 0;
    }
    .nav-tabs .nav-link:hover { color: #4F46E5; background: #F5F3FF; }
    .nav-tabs .nav-link.active {
      color: #4F46E5; background: transparent;
      border-bottom: 2.5px solid #4F46E5;
    }
    .tab-content { padding-top: 1.5rem; }
    .card-body { padding: 1rem 1.1rem; }
  </style>
</head>
<body>
{%app_entry%}
<footer>{%config%}{%scripts%}{%renderer%}</footer>
</body>
</html>'''

_NAVBAR = dbc.Navbar(
    dbc.Container([
        html.Div([
            html.I(className='bi bi-people-fill me-2',
                   style={'color': '#A5B4FC', 'fontSize': '1.3rem'}),
            dbc.NavbarBrand('RH Management — Dashboard analytique',
                            style={'fontWeight': '800', 'letterSpacing': '-.3px',
                                   'fontSize': '1.15rem'}),
        ], style={'display': 'flex', 'alignItems': 'center'}),
        html.Div([
            dbc.Badge(
                '⚠ Données simulées' if IS_SAMPLE else '● MongoDB Live',
                color='warning' if IS_SAMPLE else 'success',
                style={'fontSize': '.72rem', 'marginRight': '12px'},
            ),
            html.Span(datetime.now().strftime('%d %B %Y'),
                      style={'color': 'rgba(255,255,255,.6)', 'fontSize': '.82rem'}),
        ], style={'display': 'flex', 'alignItems': 'center'}),
    ], fluid=True),
    color='#1E1B4B', dark=True,
    style={'boxShadow': '0 2px 8px rgba(0,0,0,.18)', 'marginBottom': '1.5rem'},
)

app.layout = html.Div([
    _NAVBAR,
    dbc.Container([
        dbc.Tabs([
            dbc.Tab(_tab1(), label='🏠  Vue d\'ensemble',    tab_id='t1', activeTabClassName='fw-bold'),
            dbc.Tab(_tab2(), label='👥  Candidats',          tab_id='t2', activeTabClassName='fw-bold'),
            dbc.Tab(_tab3(), label='📊  Scoring & Matching', tab_id='t3', activeTabClassName='fw-bold'),
            dbc.Tab(_tab4(), label='💼  Offres',             tab_id='t4', activeTabClassName='fw-bold'),
            dbc.Tab(_tab5(), label='🗺️  Géographie',         tab_id='t5', activeTabClassName='fw-bold'),
        ], active_tab='t1'),
    ], fluid=True, className='px-4 pb-5'),
], style={'background': '#F1F5F9', 'minHeight': '100vh'})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8050)
