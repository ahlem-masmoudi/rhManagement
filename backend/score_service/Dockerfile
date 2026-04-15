FROM python:3.11-slim

WORKDIR /app

# system deps for pyresparser / pymupdf
RUN apt-get update && apt-get install -y build-essential libpoppler-cpp-dev pkg-config python3-dev libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# copy app
COPY ./app ./app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
