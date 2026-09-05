#!/usr/bin/env bash
# Deploy Neuro-Cut to Google Cloud Run
set -e

# Load local .env if present
if [ -f .env ]; then
  echo "=== Loading environment variables from .env ==="
  export $(grep -v '^#' .env | xargs)
fi

PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"agent-505917"}
REGION=${GOOGLE_CLOUD_REGION:-"us-central1"}
SERVICE_NAME="neuro-cut"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

echo "=== Building Neuro-Cut container image ==="
gcloud builds submit --config=cloudbuild.yaml --substitutions=_IMAGE_NAME="${IMAGE_NAME}" .

echo "=== Deploying to Google Cloud Run ==="
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_NAME}" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --port 8080 \
  --min-instances 1 \
  --no-cpu-throttling \
  --timeout 300 \
  --set-env-vars "CLICKHOUSE_HOST=${CLICKHOUSE_HOST},CLICKHOUSE_PORT=${CLICKHOUSE_PORT},CLICKHOUSE_USER=${CLICKHOUSE_USER},CLICKHOUSE_PASSWORD=${CLICKHOUSE_PASSWORD},CLICKHOUSE_DATABASE=${CLICKHOUSE_DATABASE},CLICKHOUSE_SECURE=true,GEMINI_API_KEY=${GEMINI_API_KEY},GEMINI_MODEL=gemini-2.5-flash,GCP_PROJECT_ID=${PROJECT_ID},GCP_LOCATION=${REGION}"

echo "=== Deployment Completed Successfully! ==="
gcloud run services describe "${SERVICE_NAME}" --platform managed --region "${REGION}" --format 'value(status.url)'

