#!/usr/bin/env pwsh
# setup-plan.ps1 — Khởi tạo plan.md trong feature directory bằng cách
# resolve plan-template từ template override stack (PowerShell variant).
#
# Tương đương spec-kit setup-plan.ps1 đã rebrand:
#   - `.specify/` -> `.fullstack/`
#   - `specify` -> `requirement` cho command hint
#   - comment tiếng Việt

[CmdletBinding()]
param(
    [switch]$Json,
    [switch]$Help,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArgs
)

$ErrorActionPreference = 'Stop'

if ($Help) {
    Write-Output "Usage: ./setup-plan.ps1 [-Json] [-Help]"
    Write-Output "  -Json     Output kết quả dạng JSON"
    Write-Output "  -Help     In hướng dẫn"
    exit 0
}

# Load common functions
. "$PSScriptRoot/common.ps1"

# Lấy tất cả paths và biến từ common functions
$paths = Get-FeaturePathsEnv -ReturnNullOnError
if (-not $paths) {
    [Console]::Error.WriteLine("ERROR: Failed to resolve feature paths")
    exit 1
}

# Đảm bảo feature directory tồn tại
New-Item -ItemType Directory -Path $paths.FEATURE_DIR -Force | Out-Null

# Copy plan template nếu plan chưa tồn tại
if (Test-Path $paths.IMPL_PLAN -PathType Leaf) {
    if ($Json) {
        [Console]::Error.WriteLine("Plan already exists at $($paths.IMPL_PLAN), skipping template copy")
    } else {
        Write-Output "Plan already exists at $($paths.IMPL_PLAN), skipping template copy"
    }
} else {
    $content = Resolve-TemplateContent -TemplateName 'plan-template' -RepoRoot $paths.REPO_ROOT
    if ($null -ne $content) {
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($paths.IMPL_PLAN, $content, $utf8NoBom)
        if ($Json) {
            [Console]::Error.WriteLine("Copied plan template to $($paths.IMPL_PLAN)")
        } else {
            Write-Output "Copied plan template to $($paths.IMPL_PLAN)"
        }
    } else {
        if ($Json) {
            [Console]::Error.WriteLine("Warning: Plan template not found")
        } else {
            Write-Output "Warning: Plan template not found"
        }
        New-Item -ItemType File -Path $paths.IMPL_PLAN -Force | Out-Null
    }
}

# Output kết quả
if ($Json) {
    $result = [PSCustomObject]@{
        FEATURE_SPEC = $paths.FEATURE_SPEC
        IMPL_PLAN = $paths.IMPL_PLAN
        SPECS_DIR = $paths.FEATURE_DIR
        BRANCH = $paths.CURRENT_BRANCH
    }
    $result | ConvertTo-Json -Compress
} else {
    Write-Output "FEATURE_SPEC: $($paths.FEATURE_SPEC)"
    Write-Output "IMPL_PLAN: $($paths.IMPL_PLAN)"
    Write-Output "SPECS_DIR: $($paths.FEATURE_DIR)"
    Write-Output "BRANCH: $($paths.CURRENT_BRANCH)"
}
