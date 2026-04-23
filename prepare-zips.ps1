Param()

$ErrorActionPreference = "Stop"

function Ensure-Dir {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

# Rutas base
$baseAsignaturas = "asignaturas"
$baseAkademia = "akademia"
$baseZip = "asignaturas-zip"
$parte1 = Join-Path $baseZip "parte1/asignaturas"
$parte2 = Join-Path $baseZip "parte2/asignaturas"
$parte3 = Join-Path $baseZip "parte3"

# Limpiar y recrear estructura destino
if (Test-Path $parte1) { Remove-Item $parte1 -Recurse -Force }
if (Test-Path $parte2) { Remove-Item $parte2 -Recurse -Force }
if (Test-Path $parte3) { Remove-Item $parte3 -Recurse -Force }

Ensure-Dir $parte1
Ensure-Dir $parte2
Ensure-Dir $parte3

Write-Host "Copiando carpetas a parte1..." -ForegroundColor Cyan
foreach ($folder in @("euskera", "filosofia", "fisika", "gaztelera", "historia")) {
    $src = Join-Path $baseAsignaturas $folder
    $dst = Join-Path $parte1 $folder
    if (Test-Path $src) {
        Write-Host "  - $folder" -ForegroundColor Green
        Copy-Item $src -Destination $dst -Recurse
    }
    else {
        Write-Host "  - $folder (no existe, se omite)" -ForegroundColor Yellow
    }
}

Write-Host "Copiando carpetas a parte2..." -ForegroundColor Cyan
foreach ($folder in @("ingelesa", "marrazketa-teknikoa-II", "matematika", "mekanika", "tutoretza")) {
    $src = Join-Path $baseAsignaturas $folder
    $dst = Join-Path $parte2 $folder
    if (Test-Path $src) {
        Write-Host "  - $folder" -ForegroundColor Green
        Copy-Item $src -Destination $dst -Recurse
    }
    else {
        Write-Host "  - $folder (no existe, se omite)" -ForegroundColor Yellow
    }
}

Write-Host "Copiando carpeta akademia a parte3..." -ForegroundColor Cyan
$akaSrc = $baseAkademia
$akaDst = Join-Path $parte3 "akademia"
if (Test-Path $akaSrc) {
    Write-Host "  - akademia" -ForegroundColor Green
    Copy-Item $akaSrc -Destination $akaDst -Recurse
}
else {
    Write-Host "  - akademia (no existe, se omite)" -ForegroundColor Yellow
}

Write-Host "Copias completadas en 'asignaturas-zip/parte1', 'parte2' y 'parte3'." -ForegroundColor Cyan

