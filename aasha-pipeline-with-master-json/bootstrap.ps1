# bootstrap.ps1 — AASHA Pipeline venv setup (PowerShell 5.1 compatible)
# Creates isolated .venv and installs all pipeline deps.

$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$venv = Join-Path $dir ".venv"
$venvPy  = Join-Path $venv "Scripts\python.exe"
$venvPip = Join-Path $venv "Scripts\pip.exe"

Write-Host "=== AASHA Pipeline Bootstrap ===" -ForegroundColor Cyan
Write-Host "Dir : $dir"
Write-Host "Venv: $venv"

# Step 1: create venv
if (Test-Path $venvPy) {
    Write-Host "Virtual environment already exists." -ForegroundColor Green
} else {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv $venv
    Write-Host "Venv created." -ForegroundColor Green
}

# Step 2: upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
& $venvPy -m pip install --upgrade pip --quiet

# Step 3: install package + dev extras
Write-Host "Installing aasha-pipeline (editable + dev deps)..." -ForegroundColor Yellow
& $venvPip install -e "$dir[dev]" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error "pip install failed. See output above."
    exit 1
}

# Step 4: verify key imports
Write-Host "`nVerifying imports..." -ForegroundColor Yellow
$ok = $true
$imports = @("yaml","pydantic","fitz","flask","tenacity","openai","requests","pymupdf")
foreach ($pkg in $imports) {
    & $venvPy -c "import $pkg" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK  $pkg" -ForegroundColor Green
    } else {
        Write-Host "  FAIL $pkg" -ForegroundColor Red
        $ok = $false
    }
}

if (-not $ok) {
    Write-Error "Some imports failed. Fix deps and re-run."
    exit 1
}

Write-Host "`nBootstrap complete!" -ForegroundColor Green
Write-Host "Run pipeline: powershell -File run_pipeline.ps1 -Pdf chapter.pdf -Subject math -Grade 4"
