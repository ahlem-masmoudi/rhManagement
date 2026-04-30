---
title: RH Scoring Service
emoji: 🎯
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# Resume Scoring Service

FastAPI service that scores resumes against job offers using sentence-transformers (semantic similarity) and NLP-based skill extraction.

## Endpoint

`POST /score`

Form fields:
- `file` — resume file (PDF, DOCX)
- `job_text` — job description text
- `model_name` — embedding model (default: `intfloat/multilingual-e5-large`)
- `weights` — JSON scoring weights (optional)
