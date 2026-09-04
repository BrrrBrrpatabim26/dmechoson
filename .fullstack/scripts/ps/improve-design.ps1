[CmdletBinding()]
param(
    [switch]$Json
)

$workspace = ".fullstack/improve-design"
New-Item -ItemType Directory -Force -Path $workspace | Out-Null
New-Item -ItemType Directory -Force -Path "$workspace/pages" | Out-Null
New-Item -ItemType Directory -Force -Path "$workspace/drafts" | Out-Null
New-Item -ItemType Directory -Force -Path "$workspace/evaluation" | Out-Null
New-Item -ItemType Directory -Force -Path "$workspace/outputs" | Out-Null
New-Item -ItemType Directory -Force -Path "$workspace/knowledge" | Out-Null
New-Item -ItemType Directory -Force -Path "$workspace/system-prompt" | Out-Null
New-Item -ItemType Directory -Force -Path "$workspace/anti-ui-ai" | Out-Null
New-Item -ItemType Directory -Force -Path "$workspace/exps" | Out-Null
New-Item -ItemType Directory -Force -Path "$workspace/examples" | Out-Null
New-Item -ItemType Directory -Force -Path "$workspace/adapted" | Out-Null

if (Test-Path "templates/improve-design") {
    Copy-Item -Path "templates/improve-design/*" -Destination $workspace -Recurse -Force -ErrorAction SilentlyContinue
}

if (-not (Test-Path "$workspace/page-queue.json")) {
    '{"pages": []}' | Out-File -FilePath "$workspace/page-queue.json" -Encoding utf8
}

if (-not (Test-Path "$workspace/global-config.yml") -and (Test-Path "$workspace/global-config.example.yml")) {
    Copy-Item -Path "$workspace/global-config.example.yml" -Destination "$workspace/global-config.yml" -Force
}

@{
    WORKSPACE   = $workspace
    STATUS      = "initialized"
    PAGES_DIR   = "$workspace/pages"
    ANTI_UI_DIR = "$workspace/anti-ui-ai"
    EXPS_DIR    = "$workspace/exps"
} | ConvertTo-Json -Compress