# ==============================================================================
# SECURE STORAGE FRAMEWORK — SHUTDOWN SCRIPT (WINDOWS POWERSHELL)
# ==============================================================================

Write-Host "==================================================================" -ForegroundColor Yellow
Write-Host "  Shutting down SecureShare Framework Services..." -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Yellow

# 1. Stop process listening on port 8080 (Spring Boot)
$backendPort = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($backendPort) {
    $pids = $backendPort | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        Write-Host "Terminating Spring Boot process (PID: $p)..." -ForegroundColor Yellow
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Backend stopped." -ForegroundColor Green
} else {
    Write-Host "No process listening on port 8080." -ForegroundColor Gray
}

# 2. Stop process listening on port 5173 (Vite)
$frontendPort = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($frontendPort) {
    $pids = $frontendPort | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        Write-Host "Terminating Vite Dev Server process (PID: $p)..." -ForegroundColor Yellow
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Frontend server stopped." -ForegroundColor Green
} else {
    Write-Host "No process listening on port 5173." -ForegroundColor Gray
}

Write-Host "`nAll application services have been safely shut down." -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Yellow
