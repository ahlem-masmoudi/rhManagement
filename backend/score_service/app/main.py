from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import tempfile
import shutil
import os
import json

# Import scoring functions from the original script
# We'll assume the scoring code is placed in app/scorer.py and exposes a `score_file_with_job` function
try:
    from .scorer import score_file_with_job
except Exception:
    # placeholder if scorer not available
    def score_file_with_job(file_path: str, job_text: str, model_name: str, weights: dict):
        # simple dummy response
        return {
            "final_score": 50.0,
            "breakdown": {},
            "candidate": {},
            "job": {},
            "matches": {},
            "summaries": {}
        }

app = FastAPI(title="Scoring Service")

class ScoreResponse(BaseModel):
    final_score: float

@app.post('/score')
async def score(
    job_text: str = Form(...),
    model_name: str = Form('intfloat/multilingual-e5-large'),
    weights: str = Form('{}'),
    file: UploadFile = File(...)
):
    # Save uploaded file to temp path
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        weights_obj = json.loads(weights)
    except Exception:
        weights_obj = {}

    try:
        result = score_file_with_job(tmp_path, job_text, model_name, weights_obj)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass
