# ==============================================================================
# SECURE STORAGE FRAMEWORK — STARTUP SCRIPT (WINDOWS POWERSHELL)
# ==============================================================================

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  Starting SecureShare Framework (Backend & Web Portals)" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

$RootPath = (Get-Item $PSScriptRoot).Parent.Parent.FullName
Set-Location $RootPath

# 0. Load .env Configuration
if (Test-Path "$RootPath/.env") {
    Get-Content "$RootPath/.env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $k = $parts[0].Trim()
            $v = $parts[1].Trim().Trim('"').Trim("'")
            if ($k -eq "MAIL_PASSWORD" -and $v.Contains(" ")) {
                $v = $v.Replace(" ", "")
            }
            [System.Environment]::SetEnvironmentVariable($k, $v, "Process")
        }
    }
}

# 1. Verify PostgreSQL Database (Port 8450 / 5432)
Write-Host "`n[1/4] Checking PostgreSQL Connectivity..." -ForegroundColor Yellow
$pgTest = Test-NetConnection -ComputerName localhost -Port 8450 -WarningAction SilentlyContinue
if (-not $pgTest.TcpTestSucceeded) {
    $pgTest5432 = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
    if (-not $pgTest5432.TcpTestSucceeded) {
        Write-Warning "PostgreSQL is not responding on port 8450 or 5432."
        Write-Host "Attempting to launch Docker PostgreSQL container if Docker is available..." -ForegroundColor Yellow
        docker-compose -f "$RootPath/infrastructure/docker-compose.yml" up -d postgres mailpit
    } else {
        Write-Host "PostgreSQL is reachable on port 5432." -ForegroundColor Green
    }
} else {
    Write-Host "PostgreSQL is reachable on port 8450." -ForegroundColor Green
}

# 2. Check if Spring Boot Backend is already running
Write-Host "`n[2/4] Checking Spring Boot Backend..." -ForegroundColor Yellow
$backendActive = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($backendActive) {
    Write-Host "Backend is already active on port 8080." -ForegroundColor Green
} else {
    Write-Host "Starting Spring Boot Monolith (Port 8080)..." -ForegroundColor Yellow
    Start-Process -FilePath "mvn" -ArgumentList "spring-boot:run" -WorkingDirectory "$RootPath/backend" -WindowStyle Minimized
    Write-Host "Waiting for backend Tomcat to initialize..." -ForegroundColor Yellow
    $attempts = 0
    while ($attempts -lt 25) {
        Start-Sleep -Seconds 2
        $testPort = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
        if ($testPort) {
            Write-Host "Backend started successfully on http://localhost:8080" -ForegroundColor Green
            break
        }
        $attempts++
    }
}

# 3. Check if Vite Frontend is already running
Write-Host "`n[3/4] Checking Frontend Web Server..." -ForegroundColor Yellow
$frontendActive = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($frontendActive) {
    Write-Host "Frontend is already active on port 5173." -ForegroundColor Green
} else {
    Write-Host "Starting Vite Development Server (Port 5173)..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "$RootPath/web" -WindowStyle Minimized
    Start-Sleep -Seconds 3
    Write-Host "Frontend server initiated on http://localhost:5173" -ForegroundColor Green
}

# 4. Summary & Access Credentials
Write-Host "`n[4/4] System Operational Summary" -ForegroundColor Cyan
Write-Host "------------------------------------------------------------------" -ForegroundColor DarkCyan
Write-Host "  Web Portal:         http://localhost:5173" -ForegroundColor White
Write-Host "  Backend API:        http://localhost:8080" -ForegroundColor White
Write-Host "  Swagger UI Docs:    http://localhost:8080/swagger-ui.html" -ForegroundColor White
Write-Host "  Health Status:      http://localhost:8080/actuator/health" -ForegroundColor White
Write-Host ""
Write-Host "Default Administrator Credentials:" -ForegroundColor Yellow
Write-Host "  Email:              admin@gmail.com" -ForegroundColor White
Write-Host "  Password:           admin@12345678 (or Admin@12345)" -ForegroundColor White
Write-Host "  Direct Login:       http://localhost:5173/admin/login" -ForegroundColor White
Write-Host ""
Write-Host "Testing User Flow:" -ForegroundColor Yellow
Write-Host "  Registration:       http://localhost:5173/register" -ForegroundColor White
Write-Host "  Dev Master OTP:     123456" -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Cyan
