from __future__ import annotations

import json
import math
import os
import re
import tempfile
import time
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd

APP_DIR = Path(__file__).resolve().parent
DEFAULT_SKILLS_FILE = APP_DIR / "data" / "custom_skills.csv"
DEFAULT_SYNONYMS_FILE = APP_DIR / "data" / "skill_synonyms.json"


# ---------------------------
# Utility helpers
# ---------------------------

def load_json(path: Path, default: dict[str, Any]) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


SKILL_SYNONYMS = load_json(
    DEFAULT_SYNONYMS_FILE,
    {
        "js": "javascript",
        "ts": "typescript",
        "node.js": "node",
        "nodejs": "node",
        "postgres": "postgresql",
        "postgre": "postgresql",
        "py": "python",
        "ml": "machine learning",
        "dl": "deep learning",
        "nlp": "natural language processing",
        "cv": "computer vision",
        "rest": "rest api",
        "restful api": "rest api",
        "scikit learn": "scikit-learn",
        "sklearn": "scikit-learn",
        "gestion de projet": "project management",
        "bi": "business intelligence",
        "vba": "excel",
        "power bi": "power bi",
        "uniges": "erp",
        "sage": "erp",
        "odoo": "erp",
    },
)


DEGREE_PATTERNS = {
    "phd": [r"\bphd\b", r"doctorate", r"doctoral", r"doctorat"],
    "master": [
        r"\bmaster\b",
        r"\bm\.sc\b",
        r"msc",
        r"\bm2\b",
        r"mastère",
        r"mastere",
        r"\bmaster\s*1\b",
        r"\bmaster\s*2\b",
        r"\bm\s*1\b",
        r"\bm\s*2\b",
    ],
    "bachelor": [
        r"\bbachelor\b",
        r"\bb\.sc\b",
        r"\bengineer\b",
        r"ingenieur",
        r"ing[eé]nieur",
        r"\bing\b",
        r"licence",
        r"license",
        r"\biset\b",
        r"\bisgi\b",
        r"\bisg\b",
        r"\bispits\b",
        r"\besb\b",
        r"\bfss\b",
        r"\bfseg\b",
        r"\bfsg\b",
        r"\bisims\b",
        r"\besprit\b",
        r"licence\s+nationale",
        r"licence\s+appliqu[eé]e",
        r"licence\s+fondamentale",
    ],
}

DEGREE_RANK = {None: 0, "other": 1, "bachelor": 2, "master": 3, "phd": 4}

KNOWN_SKILLS = {
    "python", "java", "javascript", "typescript", "c", "c++", "c#", "php",
    "angular", "react", "vue", "next.js", "html", "css", "tailwind",
    "bootstrap", "sass",
    "node", "express", "spring boot", "fastapi", "flask", "django",
    "laravel", "asp.net",
    "sql", "mysql", "postgresql", "mongodb", "redis", "sql server",
    "oracle", "firebase",
    "docker", "kubernetes", "git", "linux", "aws", "azure", "gcp",
    "github", "gitlab", "ci/cd",
    "tensorflow", "pytorch", "scikit-learn", "machine learning",
    "deep learning", "computer vision", "natural language processing",
    "llm", "rag", "langchain", "opencv", "pandas", "numpy",
    "power bi", "excel", "tableau", "looker", "data analysis",
    "business intelligence", "etl", "datawarehouse",
    "erp", "sap", "odoo", "uniges", "sage", "gestion de projet",
    "merise", "uml", "agile", "scrum",
    "flutter", "react native", "swift", "kotlin",
    "figma", "adobe xd", "canva",
    "word", "powerpoint", "access",
    "comptabilité", "gestion", "ressources humaines", "recrutement",
    "paie", "finance", "audit", "fiscalité", "marketing",
    "communication", "rédaction", "analyse de données",
}


@dataclass
class ParsedJob:
    title: str | None
    required_skills: list[str]
    preferred_skills: list[str]
    required_experience: float
    required_degree: str | None


# ---------------------------
# Text extraction
# ---------------------------

def extract_text_fallback(file_path: str) -> str:
    suffix = Path(file_path).suffix.lower()

    if suffix == ".pdf":
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(file_path)
            text = "\n".join(page.get_text("text") for page in doc)
            doc.close()
            return text.strip()
        except Exception:
            return ""

    if suffix == ".docx":
        try:
            import docx2txt
            return (docx2txt.process(file_path) or "").strip()
        except Exception:
            return ""

    return ""


# ---------------------------
# Resume parsing
# ---------------------------

def parse_with_pyresparser(file_path: str, skills_file: str | None = None) -> tuple[dict[str, Any], str | None]:
    try:
        from pyresparser import ResumeParser
        if skills_file:
            parsed = ResumeParser(file_path, skills_file=skills_file).get_extracted_data()
        else:
            parsed = ResumeParser(file_path).get_extracted_data()
        parsed = parsed or {}
        parsed["_parser_missing"] = False
        return parsed, None
    except ModuleNotFoundError:
        return {"_parser_missing": True}, None
    except Exception as exc:
        return {}, str(exc)


def enrich_from_raw_text(parsed: dict[str, Any], raw_text: str) -> dict[str, Any]:
    parsed = dict(parsed or {})
    lower = raw_text.lower()

    if not parsed.get("skills"):
        inventory = []
        try:
            inventory = [
                line.strip()
                for line in DEFAULT_SKILLS_FILE.read_text(encoding="utf-8").splitlines()
                if line.strip()
            ]
        except Exception:
            inventory = sorted(KNOWN_SKILLS)
        section_skills = extract_skills_from_section(raw_text, inventory)
        if section_skills is not None:
            parsed["skills"] = section_skills
        else:
            found = []
            for skill in inventory:
                pattern = rf"(?<!\w){re.escape(skill.lower())}(?!\w)"
                if re.search(pattern, lower):
                    found.append(skill)
            parsed["skills"] = sorted(set(found))

    if parsed.get("total_experience") in (None, ""):
        date_exp = extract_experience_from_date_ranges(raw_text)
        if date_exp > 0:
            parsed["total_experience"] = date_exp
        else:
            parsed["total_experience"] = extract_years_of_experience(raw_text)

    if not parsed.get("degree"):
        inferred = infer_degree_level_from_text(raw_text)
        parsed["degree"] = [inferred] if inferred else []

    return parsed


def parse_resume(file_path: str, skills_file: str | None = None) -> tuple[dict[str, Any], str, str | None]:
    parsed, error = parse_with_pyresparser(file_path, skills_file)
    raw_text = extract_text_fallback(file_path)
    parsed = enrich_from_raw_text(parsed, raw_text)
    return parsed, raw_text, error


# ---------------------------
# Normalization
# ---------------------------

def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = text.replace("’", "'")
    text = text.replace("é", "e").replace("è", "e").replace("ê", "e")
    text = text.replace("à", "a").replace("â", "a")
    text = text.replace("ô", "o").replace("û", "u")
    text = text.replace("î", "i").replace("ï", "i")
    text = text.replace("ç", "c")
    text = re.sub(r"[\s/|]+", " ", text)
    return text


def normalize_skill(skill: str) -> str:
    s = normalize_text(skill)
    return SKILL_SYNONYMS.get(s, s)


def normalize_skills(skills: list[str] | None) -> set[str]:
    if not skills:
        return set()
    normalized = set()
    for skill in skills:
        if not skill:
            continue
        normalized.add(normalize_skill(skill))
    return normalized


# ---------------------------
# Section detection helpers
# ---------------------------

_SKILL_SECTION_NAMES = ['skills', 'compétences', 'competences', 'technical skills', 'compétences techniques']
_EXP_SECTION_NAMES  = ['experience', 'expérience', 'work experience', 'professional experience', 'expérience professionnelle']
_EDU_SECTION_NAMES  = ['education', 'formation', 'études', 'diplôme']
_PROJ_SECTION_NAMES = ['projects', 'projets', 'réalisations', 'travaux']
_ALL_SECTION_NAMES  = _SKILL_SECTION_NAMES + _EXP_SECTION_NAMES + _EDU_SECTION_NAMES + _PROJ_SECTION_NAMES + ['profile', 'profil', 'summary', 'contact']


def _normalize_line(line: str) -> str:
    s = line.strip().lower().rstrip(':').strip()
    s = re.sub(r'^[\d\.\-\*\•\■\▪\◆■●•]+\s*', '', s).strip()
    return s


def has_section(text: str, names: list[str]) -> bool:
    text_norm = text.replace('\r\n', '\n').replace('\r', '\n')
    for line in text_norm.split('\n'):
        clean = _normalize_line(line)
        for name in names:
            if clean == name:
                return True
            if name in clean and len(clean) <= len(name) + 8:
                return True
    lower = text_norm.lower()
    for name in names:
        pattern = rf'(?:^|[\n\r\t ])(?:{re.escape(name)})(?:[\n\r\t :]|$)'
        if re.search(pattern, lower, re.MULTILINE):
            return True
    return False


def extract_section_text(text: str, section_names: list[str]) -> str | None:
    text_norm = text.replace('\r\n', '\n').replace('\r', '\n')
    lines = text_norm.split('\n')
    start = -1
    for i, line in enumerate(lines):
        clean = _normalize_line(line)
        for name in section_names:
            if clean == name or (name in clean and len(clean) <= len(name) + 8):
                start = i
                break
        if start != -1:
            break
    if start == -1:
        return None

    end = len(lines)
    for i in range(start + 1, len(lines)):
        clean = _normalize_line(lines[i])
        for name in _ALL_SECTION_NAMES:
            if clean == name or (name in clean and len(clean) <= len(name) + 8):
                end = i
                break
        if end != len(lines):
            break

    section = '\n'.join(lines[start:end])
    if len(section) >= len(text_norm) * 0.75:
        return None
    return section


def extract_skills_from_section(raw_text: str, inventory: list[str]) -> list[str] | None:
    section = extract_section_text(raw_text, _SKILL_SECTION_NAMES)
    if section is None:
        return None
    found = [
        skill for skill in inventory
        if re.search(rf"(?<!\w){re.escape(skill.lower())}(?!\w)", section.lower())
    ]
    return sorted(set(found)) if found else None


def score_section_completeness(raw_text: str) -> float:
    score = 0.0
    if has_section(raw_text, _SKILL_SECTION_NAMES):
        score += 35.0
    if has_section(raw_text, _EXP_SECTION_NAMES):
        score += 35.0
    if has_section(raw_text, _EDU_SECTION_NAMES):
        score += 20.0
    if has_section(raw_text, _PROJ_SECTION_NAMES):
        score += 10.0
    return score


# ---------------------------
# Job parsing
# ---------------------------

def extract_job_title(job_text: str) -> str | None:
    lines = [line.strip() for line in job_text.splitlines() if line.strip()]
    return lines[0] if lines else None


def extract_skills_from_text(text: str) -> list[str]:
    lower = text.lower()
    inventory = sorted(set(KNOWN_SKILLS) | set(load_skill_inventory()))
    found = []
    for skill in inventory:
        pattern = rf"(?<!\w){re.escape(skill.lower())}(?!\w)"
        if re.search(pattern, lower):
            found.append(skill)
    return sorted(set(found))


def split_required_preferred_skills(job_text: str) -> tuple[list[str], list[str]]:
    lower = job_text.lower()
    required_block = []
    preferred_block = []

    req_match = re.search(
        r"(?:required skills|requirements|must have|must-have"
        r"|compétences requises|exigences|obligatoire"
        r")(.*?)(?:preferred|nice to have|good to have|bonus"
        r"|compétences souhaitées|un plus|atout|$)",
        lower,
        flags=re.DOTALL,
    )
    pref_match = re.search(
        r"(?:preferred skills|nice to have|good to have|bonus"
        r"|compétences souhaitées|un plus|atout)(.*)$",
        lower,
        flags=re.DOTALL,
    )

    if req_match:
        required_block = extract_skills_from_text(req_match.group(1))
    if pref_match:
        preferred_block = extract_skills_from_text(pref_match.group(1))

    if not required_block and not preferred_block:
        all_found = extract_skills_from_text(job_text)
        midpoint = math.ceil(len(all_found) * 0.7)
        required_block = all_found[:midpoint]
        preferred_block = all_found[midpoint:]

    return required_block, preferred_block


def extract_required_experience(job_text: str) -> float:
    lower = job_text.lower()
    patterns = [
        r"minimum\s+(\d+(?:\.\d+)?)\+?\s+years",
        r"at least\s+(\d+(?:\.\d+)?)\+?\s+years",
        r"(\d+(?:\.\d+)?)\+?\s+years of experience",
        r"(\d+(?:\.\d+)?)\+?\s+years experience",
        r"experience:?\s*(\d+(?:\.\d+)?)\+?\s+years",
        r"(\d+(?:\.\d+)?)\s*[-to]{1,3}\s*(\d+(?:\.\d+)?)\s+years",
        r"minimum\s+(\d+(?:\.\d+)?)\+?\s+ans",
        r"au moins\s+(\d+(?:\.\d+)?)\+?\s+ans",
        r"(\d+(?:\.\d+)?)\+?\s+ans d.expérience",
        r"expérience:?\s*(\d+(?:\.\d+)?)\+?\s+ans",
    ]
    for pattern in patterns:
        match = re.search(pattern, lower)
        if not match:
            continue
        if len(match.groups()) == 2:
            return float(match.group(1))
        return float(match.group(1))

    if any(token in lower for token in [
        "internship", "entry level", "junior", "graduate",
        "stage", "stagiaire", "débutant", "junior"
    ]):
        return 0.0
    return 0.0


def extract_years_of_experience(text: str) -> float:
    lower = text.lower()
    patterns = [
        r"(\d+(?:\.\d+)?)\+?\s+years of experience",
        r"(\d+(?:\.\d+)?)\+?\s+years experience",
        r"experience:?\s*(\d+(?:\.\d+)?)\+?\s+years",
        r"(\d+(?:\.\d+)?)\+?\s+ans d.expérience",
        r"(\d+(?:\.\d+)?)\+?\s+ans d.exp",
        r"expérience:?\s*(\d+(?:\.\d+)?)\+?\s+ans",
    ]
    values: list[float] = []
    for pattern in patterns:
        for match in re.finditer(pattern, lower):
            try:
                values.append(float(match.group(1)))
            except Exception:
                pass
    return max(values) if values else 0.0


def extract_experience_from_date_ranges(text: str) -> float:
    """Calculate total years of work experience from date ranges in the Experience section only."""
    from datetime import date as date_type

    exp_section = extract_section_text(text, _EXP_SECTION_NAMES)
    search_text = exp_section if exp_section else ""
    if not search_text:
        return 0.0

    month_map = {
        'jan': 1, 'january': 1, 'janvier': 1, 'janv': 1,
        'feb': 2, 'february': 2, 'fev': 2, 'fevr': 2,
        'mar': 3, 'march': 3, 'mars': 3,
        'apr': 4, 'april': 4, 'avr': 4, 'avril': 4,
        'may': 5, 'mai': 5,
        'jun': 6, 'june': 6, 'juin': 6,
        'jul': 7, 'july': 7, 'juil': 7, 'juillet': 7,
        'aug': 8, 'august': 8, 'aout': 8,
        'sep': 9, 'sept': 9, 'september': 9, 'septembre': 9,
        'oct': 10, 'october': 10, 'octobre': 10,
        'nov': 11, 'november': 11, 'novembre': 11,
        'dec': 12, 'december': 12, 'decembre': 12,
    }

    months_alt = '|'.join(sorted(month_map.keys(), key=len, reverse=True))
    year_pat = r'(?:20|19)\d{2}'
    present_pat = r"(?:present|now|aujourd'hui|actuel(?:le)?|current|en\s+cours)"

    pattern = (
        rf'({months_alt})\s*\.?\s*({year_pat})'
        rf'\s*[-–—]\s*'
        rf'(?:({months_alt})\s*\.?\s*({year_pat})|({present_pat}))'
    )

    today = date_type.today()
    total_days = 0

    for m in re.finditer(pattern, search_text, re.IGNORECASE):
        try:
            start_month = month_map.get(m.group(1).lower(), 1)
            start_year = int(m.group(2))
            if m.group(5):
                end_date = today
            elif m.group(3) and m.group(4):
                end_month = month_map.get(m.group(3).lower(), 1)
                end_year = int(m.group(4))
                end_date = date_type(end_year, end_month, 1)
            else:
                continue
            start_date = date_type(start_year, start_month, 1)
            if end_date > start_date:
                total_days += (end_date - start_date).days
        except Exception:
            continue

    return round(total_days / 365.25, 1) if total_days > 0 else 0.0


def infer_degree_level_from_text(text: str) -> str | None:
    lower = text.lower()
    for degree, patterns in DEGREE_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, lower):
                return degree
    return None


def infer_degree_level(parsed_degrees: list[str] | None) -> str | None:
    if not parsed_degrees:
        return None
    return infer_degree_level_from_text(" ".join(parsed_degrees)) or "other"


def parse_job(job_text: str) -> ParsedJob:
    required_skills, preferred_skills = split_required_preferred_skills(job_text)
    return ParsedJob(
        title=extract_job_title(job_text),
        required_skills=required_skills,
        preferred_skills=preferred_skills,
        required_experience=extract_required_experience(job_text),
        required_degree=infer_degree_level_from_text(job_text),
    )


# ---------------------------
# Similarity and summaries
# ---------------------------

_model_cache: dict = {}

def get_model(model_name: str):
    if not model_name or str(model_name).lower() in ("none", "no_model", "lexical"):
        return None
    if model_name in _model_cache:
        return _model_cache[model_name]
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer(model_name)
        _model_cache[model_name] = model
        return model
    except Exception:
        return None  # Do not cache failures — retry on next request


def lexical_similarity(text_a: str, text_b: str) -> float:
    tokens_a = re.findall(r"[a-zA-Z0-9+#.]+", text_a.lower())
    tokens_b = re.findall(r"[a-zA-Z0-9+#.]+", text_b.lower())
    if not tokens_a or not tokens_b:
        return 0.0

    from collections import Counter
    vec_a = Counter(tokens_a)
    vec_b = Counter(tokens_b)
    common = set(vec_a) & set(vec_b)
    dot = sum(vec_a[t] * vec_b[t] for t in common)
    norm_a = math.sqrt(sum(v * v for v in vec_a.values()))
    norm_b = math.sqrt(sum(v * v for v in vec_b.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    score = dot / (norm_a * norm_b)
    return max(0.0, min(score, 1.0)) * 100


def summarize_resume(parsed: dict[str, Any], raw_text: str) -> str:
    top_skills = ", ".join((parsed.get("skills") or [])[:15])
    degrees = ", ".join(parsed.get("degree") or [])
    titles = ", ".join((parsed.get("designation") or [])[:5])
    companies = ", ".join((parsed.get("company_names") or [])[:5])
    exp = parsed.get("total_experience", 0)
    projects = extract_project_snippet(raw_text)

    return (
        f"Candidate summary. "
        f"Experience: {exp} years. "
        f"Degrees: {degrees or 'not found'}. "
        f"Roles: {titles or 'not found'}. "
        f"Companies: {companies or 'not found'}. "
        f"Skills: {top_skills or 'not found'}. "
        f"Projects: {projects or 'not found'}."
    )


def summarize_job(job: ParsedJob, raw_jd: str) -> str:
    return (
        f"Job summary. "
        f"Title: {job.title or 'not provided'}. "
        f"Required experience: {job.required_experience} years. "
        f"Required degree: {job.required_degree or 'not specified'}. "
        f"Required skills: {', '.join(job.required_skills) or 'not specified'}. "
        f"Preferred skills: {', '.join(job.preferred_skills) or 'not specified'}. "
        f"Description: {raw_jd.strip()}"
    )


def extract_project_snippet(text: str, max_len: int = 500) -> str:
    lowered = text.lower()
    markers = [
        "projects", "project", "experience", "work experience", "internship",
        "projets", "expérience professionnelle", "expérience",
        "stage", "réalisations", "travaux",
    ]
    for marker in markers:
        idx = lowered.find(marker)
        if idx != -1:
            return text[idx: idx + max_len].replace("\n", " ").strip()
    return text[:max_len].replace("\n", " ").strip()


def semantic_similarity(model_name: str, text_a: str, text_b: str) -> float:
    model = get_model(model_name)
    if model is None:
        return lexical_similarity(text_a, text_b)

    embeddings = model.encode([text_a, text_b], normalize_embeddings=True)
    import numpy as np
    score = float(np.dot(embeddings[0], embeddings[1]))
    return max(0.0, min(score, 1.0)) * 100


# ---------------------------
# Scoring
# ---------------------------

def score_required_skills(cv_skills: list[str] | None, required_skills: list[str]) -> float:
    req = normalize_skills(required_skills)
    cv = normalize_skills(cv_skills)
    if not req:
        return 100.0
    return (len(req & cv) / len(req)) * 100.0


def score_preferred_skills(cv_skills: list[str] | None, preferred_skills: list[str]) -> float:
    pref = normalize_skills(preferred_skills)
    cv = normalize_skills(cv_skills)
    if not pref:
        return 100.0
    return (len(pref & cv) / len(pref)) * 100.0


def score_experience(candidate_years: float | int | None, required_years: float) -> float:
    candidate = float(candidate_years or 0.0)
    if required_years <= 0:
        return 100.0 if candidate >= 0 else 0.0
    return min(candidate / required_years, 1.0) * 100.0


def score_education(candidate_degree: str | None, required_degree: str | None) -> float:
    if not required_degree:
        return 100.0
    cand_rank = DEGREE_RANK.get(candidate_degree, 0)
    req_rank = DEGREE_RANK.get(required_degree, 0)
    if req_rank == 0:
        return 100.0
    if cand_rank >= req_rank:
        return 100.0
    return (cand_rank / req_rank) * 100.0


def score_title_alignment(parsed: dict[str, Any], job_title: str | None) -> float:
    if not job_title:
        return 100.0
    designations = parsed.get("designation") or []
    if not designations:
        return 40.0
    job_title_norm = normalize_text(job_title)
    desigs = [normalize_text(d) for d in designations]
    if any(job_title_norm in d or d in job_title_norm for d in desigs):
        return 100.0
    tokens_a = set(job_title_norm.split())
    overlaps = []
    for d in desigs:
        tokens_b = set(d.split())
        overlap = len(tokens_a & tokens_b) / max(len(tokens_a), 1)
        overlaps.append(overlap)
    return max(overlaps, default=0.0) * 100.0


def score_bonus(parsed: dict[str, Any], raw_text: str, job: ParsedJob) -> float:
    score = 0.0
    if parsed.get("company_names"):
        score += 20
    if parsed.get("designation"):
        score += 15
    if parsed.get("degree"):
        score += 15
    if extract_project_snippet(raw_text):
        score += 15
    if job.title and normalize_text(job.title) in normalize_text(raw_text):
        score += 10
    if parsed.get("total_experience") and float(parsed.get("total_experience") or 0) > 0:
        score += 15
    if parsed.get("skills") and len(parsed.get("skills") or []) >= 5:
        score += 10
    return min(score, 100.0)


def final_score(
    parsed: dict[str, Any],
    raw_resume_text: str,
    raw_jd_text: str,
    job: ParsedJob,
    model_name: str,
    weights: dict[str, float],
) -> dict[str, Any]:

    candidate_degree = infer_degree_level(parsed.get("degree"))
    candidate_years = float(parsed.get("total_experience") or 0.0)

    req_score = score_required_skills(parsed.get("skills"), job.required_skills)
    pref_score = score_preferred_skills(parsed.get("skills"), job.preferred_skills)
    skills_score = 0.75 * req_score + 0.25 * pref_score
    exp_score = score_experience(candidate_years, job.required_experience)
    edu_score = score_education(candidate_degree, job.required_degree)
    title_score = score_title_alignment(parsed, job.title)
    bonus_score = score_bonus(parsed, raw_resume_text, job)
    completeness_score = score_section_completeness(raw_resume_text)

    cv_summary = summarize_resume(parsed, raw_resume_text)
    jd_summary = summarize_job(job, raw_jd_text)
    skills_sentence_cv = "Candidate skills: " + ", ".join(parsed.get("skills") or [])
    skills_sentence_jd = "Required and preferred skills: " + ", ".join(
        job.required_skills + job.preferred_skills
    )
    projects_cv = "Project and experience section: " + extract_project_snippet(raw_resume_text)
    projects_jd = "Responsibilities and requirements: " + raw_jd_text[:1200]

    overall_sim = semantic_similarity(model_name, cv_summary, jd_summary)
    skills_sim = (
        semantic_similarity(model_name, skills_sentence_cv, skills_sentence_jd)
        if (parsed.get("skills") or job.required_skills or job.preferred_skills)
        else 0.0
    )
    projects_sim = semantic_similarity(model_name, projects_cv, projects_jd)
    semantic_score = 0.5 * overall_sim + 0.3 * skills_sim + 0.2 * projects_sim

    total = (
        weights.get("skills", 0) * skills_score
        + weights.get("experience", 0) * exp_score
        + weights.get("education", 0) * edu_score
        + weights.get("semantic", 0) * semantic_score
        + weights.get("title", 0) * title_score
        + weights.get("bonus", 0) * bonus_score
        + weights.get("completeness", 0) * completeness_score
    )

    cv_norm = normalize_skills(parsed.get("skills"))
    required_norm = normalize_skills(job.required_skills)
    preferred_norm = normalize_skills(job.preferred_skills)

    missing_required = sorted(required_norm - cv_norm)
    missing_preferred = sorted(preferred_norm - cv_norm)
    matched_required = sorted(required_norm & cv_norm)
    matched_preferred = sorted(preferred_norm & cv_norm)

    return {
        "final_score": round(total, 2),
        "breakdown": {
            "skills_score": round(skills_score, 2),
            "required_skills_score": round(req_score, 2),
            "preferred_skills_score": round(pref_score, 2),
            "experience_score": round(exp_score, 2),
            "education_score": round(edu_score, 2),
            "semantic_score": round(semantic_score, 2),
            "semantic_overall": round(overall_sim, 2),
            "semantic_skills": round(skills_sim, 2),
            "semantic_projects": round(projects_sim, 2),
            "title_score": round(title_score, 2),
            "bonus_score": round(bonus_score, 2),
            "completeness_score": round(completeness_score, 2),
        },
        "candidate": {
            "name": parsed.get("name"),
            "email": parsed.get("email"),
            "mobile_number": parsed.get("mobile_number"),
            "candidate_experience_years": candidate_years,
            "candidate_degree": candidate_degree,
            "candidate_skills": sorted(cv_norm),
        },
        "job": {
            "title": job.title,
            "required_experience": job.required_experience,
            "required_degree": job.required_degree,
            "required_skills": sorted(required_norm),
            "preferred_skills": sorted(preferred_norm),
        },
        "matches": {
            "matched_required_skills": matched_required,
            "matched_preferred_skills": matched_preferred,
            "missing_required_skills": missing_required,
            "missing_preferred_skills": missing_preferred,
        },
        "summaries": {
            "cv_summary": cv_summary,
            "job_summary": jd_summary,
        },
        "sections": {
            "has_skills_section": has_section(raw_resume_text, _SKILL_SECTION_NAMES),
            "has_experience_section": has_section(raw_resume_text, _EXP_SECTION_NAMES),
            "has_education_section": has_section(raw_resume_text, _EDU_SECTION_NAMES),
            "has_projects_section": has_section(raw_resume_text, _PROJ_SECTION_NAMES),
        },
    }


# ---------------------------
# UI / export helpers
# ---------------------------

def load_skill_inventory() -> list[str]:
    try:
        return [
            line.strip()
            for line in DEFAULT_SKILLS_FILE.read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
    except Exception:
        return sorted(KNOWN_SKILLS)


def score_label(score: float) -> str:
    if score >= 85:
        return "Excellent match ✅"
    if score >= 70:
        return "Strong match 🟢"
    if score >= 55:
        return "Moderate match 🟡"
    return "Weak match 🔴"


def generate_explanation(result: dict[str, Any]) -> str:
    matched_req = result["matches"]["matched_required_skills"]
    missing_req = result["matches"]["missing_required_skills"]
    years = result["candidate"]["candidate_experience_years"]
    required_years = result["job"]["required_experience"]

    parts = [f"Overall this CV is a {score_label(result['final_score']).lower()}."]

    if matched_req:
        parts.append(
            "Strong alignment on required skills such as "
            + ", ".join(matched_req[:6]) + "."
        )
    if missing_req:
        parts.append(
            "Main missing required skills: "
            + ", ".join(missing_req[:6]) + "."
        )

    if required_years > 0:
        if years >= required_years:
            parts.append(
                f"Experience looks sufficient: about {years:.1f} years "
                f"for a job asking {required_years:.1f} years."
            )
        else:
            parts.append(
                f"Experience may be below target: about {years:.1f} years "
                f"for a job asking {required_years:.1f} years."
            )

    degree = result["candidate"]["candidate_degree"]
    required_degree = result["job"]["required_degree"]
    if required_degree:
        if DEGREE_RANK.get(degree, 0) >= DEGREE_RANK.get(required_degree, 0):
            parts.append(
                f"Education appears to meet the minimum requirement ({required_degree})."
            )
        else:
            parts.append(
                f"Education may be below the requested level ({required_degree})."
            )

    return " ".join(parts)


def save_uploaded_file(uploaded_file) -> str:
    suffix = Path(uploaded_file.name).suffix.lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(uploaded_file.getvalue())
        return tmp.name


def make_dataframe(result: dict[str, Any]) -> pd.DataFrame:
    rows = []
    for key, value in result["breakdown"].items():
        rows.append({"component": key, "score": value})
    return pd.DataFrame(rows).sort_values("score", ascending=False)


def benchmark_models(
    parsed_resume: dict[str, Any],
    raw_resume_text: str,
    raw_jd_text: str,
    parsed_job: ParsedJob,
    weights: dict[str, float],
    model_names: list[str],
) -> tuple[pd.DataFrame, list[str]]:
    rows = []
    lexical_models: list[str] = []

    for model_name in model_names:
        start = time.perf_counter()
        result = final_score(
            parsed=parsed_resume,
            raw_resume_text=raw_resume_text,
            raw_jd_text=raw_jd_text,
            job=parsed_job,
            model_name=model_name,
            weights=weights,
        )
        elapsed_ms = (time.perf_counter() - start) * 1000

        backend = "transformer"
        if get_model(model_name) is None:
            backend = "lexical-fallback"
            lexical_models.append(model_name)

        rows.append(
            {
                "model": model_name,
                "backend": backend,
                "final_score": result["final_score"],
                "semantic_score": result["breakdown"]["semantic_score"],
                "skills_score": result["breakdown"]["skills_score"],
                "runtime_ms": round(elapsed_ms, 1),
            }
        )

    df = pd.DataFrame(rows).sort_values(["final_score", "semantic_score"], ascending=False)
    return df, lexical_models


__all__ = [
    'parse_resume', 'parse_job', 'final_score', 'generate_explanation',
    'load_skill_inventory', 'normalize_skills', 'score_section_completeness',
    'has_section', 'extract_experience_from_date_ranges', 'benchmark_models',
    'make_dataframe', 'save_uploaded_file', 'score_label',
]
