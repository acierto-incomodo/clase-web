Param()

$ErrorActionPreference = "Stop"

try {
    # Ejecutar todos los escaneos
    python3 ./run_all_scans.py

    # Ejecutar el script de publicación en PowerShell
    ./make.ps1
}
catch {
    Write-Host "Error ejecutando all.ps1: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
*** End Patch
