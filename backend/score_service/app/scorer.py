# Minimal adapter that imports your existing scoring functions.
# Place the full script content (the one you shared) into this file and
# expose a helper `score_file_with_job(file_path, job_text, model_name, weights)`

from typing import Dict, Any

# ---- paste or import the full script here in production ----
# For this template we'll implement a thin wrapper that imports `final_score` from a module named `scoring_impl`.

try:
    # If you copied the long script into scoring_impl.py and exposed final_score
    from .scoring_impl import parse_resume, parse_job, final_score
except Exception:
    # fallback dummy implementations
    def parse_resume(path, skills_file=None):
        return ({"skills": []}, "", None)
    def parse_job(text):
        return type('J', (), { 'title': None, 'required_skills': [], 'preferred_skills': [], 'required_experience': 0.0, 'required_degree': None })()
    def final_score(parsed, raw_resume_text, raw_jd_text, job, model_name, weights):
        return {"final_score": 50.0, "breakdown": {}, "candidate": {}, "job": {}, "matches": {}, "summaries": {}}

DEFAULT_WEIGHTS = {
    "skills": 0.3,
    "experience": 0.2,
    "education": 0.1,
    "semantic": 0.25,
    "title": 0.05,
    "bonus": 0.1,
}


def normalize_weights(weights: Dict[str, float] | None) -> Dict[str, float]:
    merged = {**DEFAULT_WEIGHTS, **(weights or {})}
    total = sum(float(value or 0.0) for value in merged.values())
    if total <= 0:
        return DEFAULT_WEIGHTS.copy()
    return {key: float(value or 0.0) / total for key, value in merged.items()}


def score_file_with_job(file_path: str, job_text: str, model_name: str, weights: Dict[str, float]) -> Dict[str, Any]:
    parsed_resume, raw_resume_text, parser_error = parse_resume(file_path)
    job = parse_job(job_text)
    result = final_score(
        parsed=parsed_resume,
        raw_resume_text=raw_resume_text,
        raw_jd_text=job_text,
        job=job,
        model_name=model_name,
        weights=normalize_weights(weights)
    )
    result["meta"] = {
        "model": model_name,
        "parser_error": parser_error,
    }
    return result
