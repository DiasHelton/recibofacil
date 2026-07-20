FROM node:22-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM python:3.12-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=frontend /app/dist /app/frontend_dist

EXPOSE 8000
CMD sh -c "python manage.py migrate --noinput && \
           python manage.py collectstatic --noinput && \
           gunicorn config.wsgi:application --bind 0.0.0.0:\$PORT --workers 2 --access-logfile -"
