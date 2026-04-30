FROM python:3.10-slim

WORKDIR /app

# System deps for pyresparser / pymupdf / spacy
RUN apt-get update && apt-get install -y \
    build-essential libpoppler-cpp-dev pkg-config python3-dev \
    libgl1 libglib2.0-0 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# spacy model required by pyresparser
RUN python -m spacy download en_core_web_sm || true

# NLTK data required by pyresparser
RUN python -c "\
import nltk; \
nltk.download('stopwords'); \
nltk.download('punkt'); \
nltk.download('punkt_tab'); \
nltk.download('averaged_perceptron_tagger'); \
nltk.download('averaged_perceptron_tagger_eng'); \
nltk.download('universal_tagset'); \
nltk.download('maxent_ne_chunker'); \
nltk.download('maxent_ne_chunker_tab'); \
nltk.download('words') \
" || true

# Copy app
COPY ./app ./app

EXPOSE 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
