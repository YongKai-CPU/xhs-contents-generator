# ============================================================
# Cloudflare Deployment - Step by Step
# ============================================================
# Run these commands one by one in PowerShell
# ============================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Xiaohongshu Content Generator - Cloudflare Deployment" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Change to worker directory
Set-Location -Path "worker"

Write-Host "Step 1: Creating KV Namespace..." -ForegroundColor Yellow
Write-Host ""

# Create KV namespace
$kvResult = wrangler kv:namespace create "RATE_LIMITER"
Write-Host $kvResult

Write-Host ""
Write-Host "Copy the KV Namespace ID from above!" -ForegroundColor Green
$kvId = Read-Host "Paste KV Namespace ID here"

# Update wrangler.toml with KV ID
$wranglerPath = "wrangler.toml"
$content = Get-Content $wranglerPath -Raw
$content = $content -replace "YOUR_KV_NAMESPACE_ID", $kvId
Set-Content $wranglerPath $content

Write-Host ""
Write-Host "Updated wrangler.toml with KV ID" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Setting Cloudflare Secrets..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Setting SUPABASE_URL..." -ForegroundColor Cyan
wrangler secret put SUPABASE_URL

Write-Host ""
Write-Host "Setting SUPABASE_SERVICE_KEY..." -ForegroundColor Cyan
wrangler secret put SUPABASE_SERVICE_KEY

Write-Host ""
Write-Host "Setting TELEGRAM_BOT_TOKEN..." -ForegroundColor Cyan
wrangler secret put TELEGRAM_BOT_TOKEN

Write-Host ""
Write-Host "Step 3: Deploying Cloudflare Worker..." -ForegroundColor Yellow
Write-Host ""

wrangler deploy

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Cloudflare Worker Deployed Successfully!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

# Get the worker URL
Write-Host "Your Worker URL is shown above. Copy it!" -ForegroundColor Green
Write-Host ""

# Change back to project root
Set-Location -Path ".."

Write-Host "Next: Deploy Railway backend" -ForegroundColor Cyan
Write-Host "Run: railway up (after setting environment variables)" -ForegroundColor Cyan
Write-Host ""
