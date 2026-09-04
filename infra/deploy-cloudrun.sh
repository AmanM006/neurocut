#!/usr/bin/env bash
# Deploy Neuro-Cut Backend to Google Cloud Run
set -e

PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"your-gcp-project-id"}
REGION=${GOOGLE_CLOUD_REGION:-"us-central1"}
SERVICE_NAME="neuro-cut-backend"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

echo "=== Building Neuro-Cut container image ==="
gcloud builds submit --tag "${IMAGE_NAME}" -f infra/Dockerfile .

echo "=== Deploying to Google Cloud Run ==="
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_NAME}" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars "CLICKHOUSE_HOST=${CLICKHOUSE_HOST},CLICKHOUSE_PORT=${CLICKHOUSE_PORT},CLICKHOUSE_USER=${CLICKHOUSE_USER},CLICKHOUSE_PASSWORD=${CLICKHOUSE_PASSWORD},CLICKHOUSE_DATABASE=${CLICKHOUSE_DATABASE},CLICKHOUSE_SECURE=true,GEMINI_API_KEY=${GEMINI_API_KEY}"

echo "=== Deployment Completed Successfully! ==="
gcloud run services describe "${SERVICE_NAME}" --platform managed --region "${REGION}" --format 'value(status.url)'
