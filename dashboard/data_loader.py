"""
Chargement des données — MongoDB ou données simulées (fallback).
"""
import os
import random
from datetime import datetime, timedelta
from collections import Counter

import numpy as np
import pandas as pd
from pymongo import MongoClient

# ── Référentiels ──────────────────────────────────────────────────────────────

CITY_COORDS = {
    'Sfax':      (34.7406, 10.7603),
    'Tunis':     (36.8065, 10.1815),
    'Sousse':    (35.8245, 10.6346),
    'Monastir':  (35.7643, 10.8113),
    'Nabeul':    (36.4513, 10.7357),
    'Bizerte':   (37.2744,  9.8739),
    'Kairouan':  (35.6781, 10.0963),
    'Gabès':     (33.8814, 10.0982),
    'Ariana':    (36.8625, 10.1956),
    'Ben Arous': (36.7533, 10.2281),
    'Mahdia':    (35.5047, 11.0622),
    'Hammamet':  (36.4000, 10.6167),
    'Gafsa':     (34.4311,  8.7757),
    'Jendouba':  (36.5011,  8.7803),
    'Médenine':  (33.3547, 10.5053),
    'Tataouine': (32.9211, 10.4514),
    'Tozeur':    (33.9197,  8.1335),
    'Béja':      (36.7256,  9.1817),
    'Siliana':   (36.0845,  9.3712),
    'Kélibia':   (36.8469, 11.1025),
}

TUNISIAN_SCHOOLS = [
    'ISGIS Sfax', 'ENIS Sfax', 'FST Sfax', 'ISET Sfax', 'FSEGS Sfax',
    'ISIMS Monastir', 'ESIM Monastir', 'ISM Monastir',
    'INSAT Tunis', 'ESPRIT Tunis', 'ISI Tunis', "SUP'COM Tunis", 'ENIT Tunis',
    'ISET Sousse', 'FST Sousse', 'ISSAT Sousse',
    'ISET Nabeul', 'ISTN Tunis', 'FSS Sfax', 'ISECS Sfax',
]

EDUCATION_LEVELS = [
    'Licence 2', 'Licence 3', 'Master 1', 'Master 2',
    'Ingénierie 4ème année', 'Ingénierie 5ème année',
]

SKILLS_POOL = [
    'Python', 'Java', 'JavaScript', 'React', 'Angular', 'Node.js',
    'Spring Boot', 'Django', 'Flask', 'SQL', 'MongoDB', 'PostgreSQL',
    'Docker', 'Git', 'Linux', 'C++', 'PHP', 'Laravel', 'Vue.js',
    'TypeScript', 'Machine Learning', 'Power BI', 'Tableau',
    'R', 'Spark', 'AWS', 'DevOps', 'UML', 'Agile/Scrum',
    'TensorFlow', 'NLP', 'Data Analysis', 'Pandas', 'NumPy',
    'REST API', 'GraphQL', 'Redis', 'Elasticsearch', 'Keras',
]

STATUSES = [
    'nouveau', 'preselectionne', 'en_attente_documents',
    'documents_recus', 'entretien_programme', 'entretien_realise',
    'validation_finale', 'offre_acceptee', 'rejete', 'abandonne',
]

OFFER_TITLES = [
    'Stage Développement Web Full-Stack',
    'Stage Data Science & Machine Learning',
    'Stage DevOps & Cloud',
    'Stage Développement Mobile',
    'Stage Business Intelligence',
    'Stage Cybersécurité',
    'Stage Backend Java/Spring Boot',
    'Stage Frontend React/Angular',
    'Stage Big Data & Hadoop',
    'Stage Intelligence Artificielle',
    'Stage Python & Data Engineering',
    'Stage Analyse de Données',
    'Stage Réseaux & Systèmes',
    'Stage Base de Données & Administration',
    'Stage UX/UI Design',
]

DEPARTMENTS = ['R&D', 'IT', 'Data & BI', 'Infrastructure', 'Innovation', 'Digital']

STATUS_LABELS = {
    'nouveau':              'Nouveau',
    'preselectionne':       'Présélectionné',
    'en_attente_documents': 'Att. documents',
    'documents_recus':      'Docs reçus',
    'entretien_programme':  'Entretien prévu',
    'entretien_realise':    'Entretien réalisé',
    'test_technique':       'Test technique',
    'validation_finale':    'Validation finale',
    'offre_envoyee':        'Offre envoyée',
    'offre_acceptee':       'Accepté ✓',
    'offre_refusee':        'Offre refusée',
    'rejete':               'Rejeté',
    'abandonne':            'Abandonné',
}

STATUS_COLORS_MAP = {
    'nouveau':              '#6B7280',
    'preselectionne':       '#3B82F6',
    'en_attente_documents': '#F59E0B',
    'documents_recus':      '#8B5CF6',
    'entretien_programme':  '#06B6D4',
    'entretien_realise':    '#0EA5E9',
    'test_technique':       '#8B5CF6',
    'validation_finale':    '#6366F1',
    'offre_envoyee':        '#10B981',
    'offre_acceptee':       '#059669',
    'offre_refusee':        '#EF4444',
    'rejete':               '#DC2626',
    'abandonne':            '#9CA3AF',
}

# ── MongoDB ───────────────────────────────────────────────────────────────────

def get_mongo_data():
    """Charge les données réelles depuis MongoDB, ou génère des données simulées."""
    try:
        uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/rh_management')
        client = MongoClient(uri, serverSelectionTimeoutMS=3000)
        client.server_info()
        db_name = uri.split('/')[-1].split('?')[0]
        db = client[db_name]

        # Candidates + users
        cand_raw = list(db.candidates.aggregate([
            {'$lookup': {'from': 'users', 'localField': 'userId',
                         'foreignField': '_id', 'as': 'user'}},
            {'$unwind': {'path': '$user', 'preserveNullAndEmptyArrays': True}},
        ]))

        # Applications + offers + candidates
        app_raw = list(db.applications.aggregate([
            {'$lookup': {'from': 'offers', 'localField': 'offer',
                         'foreignField': '_id', 'as': 'offerData'}},
            {'$unwind': {'path': '$offerData', 'preserveNullAndEmptyArrays': True}},
            {'$lookup': {'from': 'candidates', 'localField': 'candidate',
                         'foreignField': '_id', 'as': 'candData'}},
            {'$unwind': {'path': '$candData', 'preserveNullAndEmptyArrays': True}},
        ]))

        offers_raw = list(db.offers.find())

        if len(cand_raw) < 5:
            print("Base de données insuffisante — données simulées utilisées.")
            return _generate_sample()

        candidates = pd.DataFrame([{
            'id':             str(c['_id']),
            'school':         c.get('school') or 'Non renseigné',
            'educationLevel': c.get('educationLevel') or 'Non renseigné',
            'location':       c.get('location') or 'Non renseigné',
            'skills':         c.get('skills', []),
            'status':         c.get('status', 'nouveau'),
            'createdAt':      c.get('createdAt', datetime.now()),
        } for c in cand_raw])

        def _bd(a):
            bd = a.get('matchingBreakdown') or {}
            return {
                'skills_score': bd.get('skills'),
                'exp_score':    bd.get('experience'),
                'edu_score':    bd.get('education'),
                'sem_score':    bd.get('semantic'),
                'comp_score':   bd.get('completeness'),
            }

        applications = pd.DataFrame([{
            'id':               str(a['_id']),
            'offerTitle':       a.get('offerData', {}).get('title', 'Inconnue'),
            'offerDepartment':  a.get('offerData', {}).get('department', ''),
            'offerLocation':    a.get('offerData', {}).get('location', ''),
            'candidateSchool':  a.get('candData', {}).get('school', ''),
            'candidateLocation':a.get('candData', {}).get('location', ''),
            'candidateLevel':   a.get('candData', {}).get('educationLevel', ''),
            'status':           a.get('status', 'nouveau'),
            'matchingScore':    a.get('matchingScore'),
            'appliedAt':        a.get('appliedAt', a.get('createdAt', datetime.now())),
            **_bd(a),
        } for a in app_raw])

        offers = pd.DataFrame([{
            'id':         str(o['_id']),
            'title':      o.get('title', ''),
            'department': o.get('department', ''),
            'type':       o.get('type', 'stage'),
            'location':   o.get('location', ''),
            'skills':     o.get('skills', []),
            'isActive':   o.get('isActive', True),
            'createdAt':  o.get('createdAt', datetime.now()),
        } for o in offers_raw])

        return candidates, applications, offers, False

    except Exception as e:
        print(f"Connexion MongoDB échouée ({e}). Données simulées utilisées.")
        return _generate_sample()


# ── Générateur de données simulées ───────────────────────────────────────────

def _generate_sample():
    random.seed(42)
    np.random.seed(42)

    N_CANDS = 190
    N_OFFERS = 15
    N_APPS = 290

    cities = list(CITY_COORDS.keys())
    cw = [0.35, 0.14, 0.09, 0.07, 0.06, 0.05, 0.04, 0.04, 0.03, 0.03,
          0.02, 0.02, 0.02, 0.01, 0.01, 0.01, 0.005, 0.005, 0.005, 0.005]
    cw = [x / sum(cw) for x in cw]

    sw = [0.20, 0.14, 0.10, 0.08, 0.08, 0.06, 0.05, 0.05,
          0.05, 0.04, 0.04, 0.03, 0.03, 0.02, 0.01, 0.005, 0.005, 0.005, 0.005, 0.005]
    sw = [x / sum(sw) for x in sw]

    status_w = [0.10, 0.15, 0.09, 0.09, 0.12, 0.10, 0.08, 0.13, 0.08, 0.06]
    edu_w    = [0.07, 0.22, 0.20, 0.16, 0.19, 0.16]

    # ── Candidats ──
    cands = []
    for i in range(N_CANDS):
        location = random.choices(cities, weights=cw)[0]
        school   = random.choices(TUNISIAN_SCHOOLS, weights=sw)[0]
        level    = random.choices(EDUCATION_LEVELS, weights=edu_w)[0]
        status   = random.choices(STATUSES, weights=status_w)[0]
        skills   = random.sample(SKILLS_POOL, random.randint(2, 8))
        cands.append({
            'id':             f'c{i}',
            'school':         school,
            'educationLevel': level,
            'location':       location,
            'skills':         skills,
            'status':         status,
            'createdAt':      datetime.now() - timedelta(days=random.randint(1, 420)),
        })
    candidates = pd.DataFrame(cands)

    # ── Offres ──
    offers_list = []
    for i in range(N_OFFERS):
        title  = OFFER_TITLES[i % len(OFFER_TITLES)]
        skills = random.sample(SKILLS_POOL, random.randint(3, 7))
        offers_list.append({
            'id':         f'o{i}',
            'title':      title,
            'department': random.choice(DEPARTMENTS),
            'type':       'stage',
            'location':   random.choices(cities[:5], weights=[0.40,0.25,0.15,0.12,0.08])[0],
            'skills':     skills,
            'isActive':   random.random() > 0.25,
            'createdAt':  datetime.now() - timedelta(days=random.randint(30, 360)),
        })
    offers = pd.DataFrame(offers_list)

    # ── Candidatures ──
    apps = []
    for i in range(N_APPS):
        cand  = candidates.sample(1).iloc[0]
        offer = offers.sample(1).iloc[0]

        overlap = len(set(cand['skills']) & set(offer['skills']))
        base    = overlap / max(len(offer['skills']), 1) * 100
        score   = float(np.clip(base + np.random.normal(16, 18), 5, 100))

        apps.append({
            'id':                f'a{i}',
            'offerTitle':        offer['title'],
            'offerDepartment':   offer['department'],
            'offerLocation':     offer['location'],
            'candidateSchool':   cand['school'],
            'candidateLocation': cand['location'],
            'candidateLevel':    cand['educationLevel'],
            'status':            cand['status'],
            'matchingScore':     round(score, 1),
            'skills_score':      round(np.clip(score*0.25*random.uniform(0.6,1.0), 0, 25), 1),
            'exp_score':         round(np.clip(score*0.20*random.uniform(0.4,1.0), 0, 20), 1),
            'edu_score':         round(np.clip(score*0.10*random.uniform(0.5,1.0), 0, 10), 1),
            'sem_score':         round(np.clip(score*0.20*random.uniform(0.5,1.0), 0, 20), 1),
            'comp_score':        round(np.clip(score*0.15*random.uniform(0.6,1.0), 0, 15), 1),
            'appliedAt':         datetime.now() - timedelta(days=random.randint(1, 380)),
        })
    applications = pd.DataFrame(apps)

    return candidates, applications, offers, True
