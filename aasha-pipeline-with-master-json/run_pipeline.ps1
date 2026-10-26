#!/usr/bin/env pwsh
# run_pipeline.ps1 — One-command launcher for the AASHA PDF→HTML5 pipeline.
# Automatically sets PYTHONPATH, routes through OpenRouter free (Tier-1 anti-bleed).
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File run_pipeline.ps1 -Pdf "chapter.pdf" -Subject math -Grade 4
#   powershell -ExecutionPolicy Bypass -File run_pipeline.ps1 -Web          # Launch Flask web UI

param(
    [string]$Pdf        = "",
    [string]$Subject    = "math",
    [int]$Grade         = 4,
    [string]$Provider   = "openrouter",
    [string]$Mode       = "v5-engine",
    [string]$FromStage  = "",
    [string]$JobId      = "",
    [switch]$Offline,
    [switch]$Web,
    [switch]$Verbose,
    [switch]$JsonEvents
)

$ErrorActionPreference = "Stop"
$dir = $PSScriptRoot
$venvPy = Join-Path $dir ".venv\Scripts\python.exe"

# Gate: venv must exist
if (-not (Test-Path $venvPy)) {
    Write-Error "Virtual environment not found. Run bootstrap.ps1 first:`n  powershell -File bootstrap.ps1"
    exit 1
}

# PYTHONPATH injection (per Node.js v24 ESM + PYTHONPATH invariant)
$env:PYTHONPATH = Join-Path $dir "src"
$env:AASHA_CONFIG = Join-Path $dir "config.yaml"

# Anti-bleed guard: paid Gemini locked out
$env:ALLOW_PAID_GEMINI_FALLBACK = "false"

# 9Router auto-start & self-healing daemon check (local port 20128)
$serverJs = Join-Path $env:APPDATA "npm\node_modules\9router\app\custom-server.js"
if (Test-Path $serverJs) {
    $sock = New-Object System.Net.Sockets.TcpClient
    $alive = $false
    try {
        $ar = $sock.BeginConnect("127.0.0.1", 20128, $null, $null)
        if ($ar.AsyncWaitHandle.WaitOne(500, $false) -and $sock.Connected) {
            $sock.EndConnect($ar)
            $alive = $true
        }
    } catch {
        $alive = $false
    } finally {
        $sock.Close()
    }

    if (-not $alive) {
        Write-Host "   [9Router] Starting background gateway daemon on port 20128..." -ForegroundColor Cyan
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "node"
        $psi.Arguments = "`"$serverJs`""
        $psi.EnvironmentVariables["PORT"] = "20128"
        $psi.EnvironmentVariables["HOSTNAME"] = "127.0.0.1"
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true
        $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
        [System.Diagnostics.Process]::Start($psi) | Out-Null

        # Wait up to 5s for port to open
        for ($i = 0; $i -lt 10; $i++) {
            Start-Sleep -Milliseconds 500
            $testSock = New-Object System.Net.Sockets.TcpClient
            try {
                $ar2 = $testSock.BeginConnect("127.0.0.1", 20128, $null, $null)
                if ($ar2.AsyncWaitHandle.WaitOne(500, $false) -and $testSock.Connected) {
                    $testSock.EndConnect($ar2)
                    Write-Host "   [9Router] Gateway is online and healthy on port 20128." -ForegroundColor Green
                    break
                }
            } catch {} finally { $testSock.Close() }
        }
    }
}

# Assemble CLI args
$cliArgs = @()

if ($Web) {
    $cliArgs += "--web"
} else {
    if (-not $Pdf -and -not $JobId) {
        Write-Error "Provide -Pdf <path> or -JobId <id> or use -Web for the web UI."
        exit 1
    }
    if ($Pdf) {
        if (-not (Test-Path $Pdf)) {
            Write-Error "PDF not found: $Pdf"
            exit 1
        }
        $cliArgs += "--pdf", $Pdf
    }
    $cliArgs += "--subject", $Subject
    $cliArgs += "--grade", $Grade
    $cliArgs += "--provider", $Provider
    $cliArgs += "--mode", $Mode
    if ($FromStage) { $cliArgs += "--from-stage", $FromStage }
    if ($JobId)     { $cliArgs += "--job-id", $JobId }
    if ($JsonEvents){ $cliArgs += "--json-events" }
    if ($Offline)   { $cliArgs += "--offline" }
    if ($Verbose)   { $cliArgs += "--verbose" }
}

Write-Host "🚀 AASHA Pipeline Launcher" -ForegroundColor Cyan
Write-Host "   Python  : $venvPy"
Write-Host "   PYTHONPATH : $env:PYTHONPATH"
if (-not $Web) {
    Write-Host "   PDF     : $Pdf"
    Write-Host "   Subject : $Subject  Grade: $Grade  Mode: $Mode  Provider: $Provider"
}
Write-Host ""

# Execute
& $venvPy -m aasha.cli @cliArgs
exit $LASTEXITCODE
