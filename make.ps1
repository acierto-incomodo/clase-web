Param()

$ErrorActionPreference = "Stop"

# --- Color and Print Functions ---
$C_RESET = "`e[0m"
$C_RED = "`e[0;31m"
$C_GREEN = "`e[0;32m"
$C_YELLOW = "`e[0;33m"
$C_CYAN = "`e[0;36m"

function Print-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "$C_CYAN=== $Text ===$C_RESET"
}

function Print-Success {
    param([string]$Text)
    Write-Host "$C_GREEN[✔] $Text$C_RESET"
}

function Print-Info {
    param([string]$Text)
    Write-Host "$C_YELLOW[i] $Text$C_RESET"
}

function Print-Error {
    param([string]$Text)
    Write-Host "$C_RED[✖] Error: $Text$C_RESET"
}

try {
    Print-Header "Updating and Publishing Repository"

    Print-Info "Committing and pushing changes to GitHub..."
    git add .
    git commit -m "Update repository"
    git push

    Print-Success "Repository updated and published successfully!"
    Print-Info "Repository URL: https://github.com/acierto-incomodo/clase-web"
}
catch {
    Print-Error $_.Exception.Message
    exit 1
}
*** End Patch*** />
