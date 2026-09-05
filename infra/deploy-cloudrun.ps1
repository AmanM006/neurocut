# Deploy Neuro-Cut to Google Cloud Run (Windows PowerShell)
$ErrorActionPreference = "Stop"

# Load local .env if present
$EnvFile = if (Test-Path ".env") { ".env" } elseif (Test-Path "$PSScriptRoot\..\.env") { "$PSScriptRoot\..\.env" } else { "" }
if ($EnvFile -and (Test-Path $EnvFile)) {
    Write-Host "=== Loading environment variables from $EnvFile ===" -ForegroundColor Cyan
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $varName = $parts[0].Trim()
            $varVal = $parts[1].Trim()
            if (-not [System.Environment]::GetEnvironmentVariable($varName)) {
                [System.Environment]::SetEnvironmentVariable($varName, $varVal, "Process")
            }
        }
    }
}


$PROJECT_ID = if ($env:GOOGLE_CLOUD_PROJECT) { $env:GOOGLE_CLOUD_PROJECT } else { "agent-505917" }
$REGION = if ($env:GOOGLE_CLOUD_REGION) { $env:GOOGLE_CLOUD_REGION } else { "us-central1" }
$SERVICE_NAME = "neuro-cut"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/${SERVICE_NAME}:latest"

Write-Host "=== Setting active GCP project to $PROJECT_ID ===" -ForegroundColor Cyan
gcloud config set project $PROJECT_ID

Write-Host "=== Submitting build to Google Cloud Build ===" -ForegroundColor Cyan
gcloud builds submit --config=cloudbuild.yaml --substitutions=_IMAGE_NAME=$IMAGE_NAME .

Write-Host "=== Deploying $SERVICE_NAME to Cloud Run ($REGION) ===" -ForegroundColor Cyan
gcloud run deploy $SERVICE_NAME `
  --image $IMAGE_NAME `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --memory 2Gi `
  --cpu 2 `
  --port 8080 `
  --min-instances 1 `
  --no-cpu-throttling `
  --timeout 300 `
  --set-env-vars "CLICKHOUSE_HOST=$env:CLICKHOUSE_HOST,CLICKHOUSE_PORT=$env:CLICKHOUSE_PORT,CLICKHOUSE_USER=$env:CLICKHOUSE_USER,CLICKHOUSE_PASSWORD=$env:CLICKHOUSE_PASSWORD,CLICKHOUSE_DATABASE=$env:CLICKHOUSE_DATABASE,CLICKHOUSE_SECURE=true,GEMINI_API_KEY=$env:GEMINI_API_KEY,GEMINI_MODEL=gemini-2.5-flash,GCP_PROJECT_ID=$PROJECT_ID,GCP_LOCATION=$REGION"

Write-Host "=== Deployment Completed! Fetching Public URL ===" -ForegroundColor Green
$URL = gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)'
Write-Host "LIVE SERVICE URL: $URL" -ForegroundColor Green

