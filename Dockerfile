FROM python:3.11-slim
WORKDIR /code
COPY src/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src/backend /code
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]