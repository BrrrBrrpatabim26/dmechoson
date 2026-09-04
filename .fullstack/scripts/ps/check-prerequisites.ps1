#!/usr/bin/env pwsh

# check-prerequisites.ps1 — Script kiểm tra điều kiện tiên quyết thống nhất
# cho quy trình Fullstack Design (PowerShell variant).
#
# Tương đương spec-kit check-prerequisites.ps1 đã rebrand:
#   - `.specify/` -> `.fullstack/`
#   - `Format-SpecKitCommand` -> `Format-FullstackCommand`
#   - comment tiếng Việt
#
# Cách dùng: ./check-prerequisites.ps1 [OPTIONS]

[CmdletBinding()]
param(
    [switch]$Json,
    [switch]$RequireTasks,
    [switch]$IncludeTasks,
    [switch]$PathsOnly,
    [string]$Template,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

# In hướng dẫn nếu được yêu cầu
if ($Help) {
    Write-Output @"
Usage: check-prerequisites.ps1 [OPTIONS]

Kiểm tra điều kiện tiên quyết thống nhất cho quy trình Fullstack Design.

OPTIONS:
  -Json               Output JSON
  -RequireTasks       Yêu cầu tasks.md tồn tại (Implementation phase)
  -IncludeTasks       Bao gồm tasks.md trong AVAILABLE_DOCS
  -PathsOnly          Chỉ in path variables (không validate)
  -Template NAME      Bao gồm nội dung template composed trong JSON
  -Help, -h           In hướng dẫn

EXAMPLES:
  # Kiểm tra trước khi chạy tasks (cần plan.md)
  .\check-prerequisites.ps1 -Json

  # Kiểm tra trước khi chạy implement (cần plan.md + tasks.md)
  .\check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks

  # Chỉ lấy feature paths (không validate)
  .\check-prerequisites.ps1 -PathsOnly
"@
    exit 0
}

# Source common functions
. "$PSScriptRoot/common.ps1"

# Lấy feature paths. -PathsOnly là pure resolution nên truyền -NoPersist
# để không ghi .fullstack/feature.json (issue #3025).
if ($PathsOnly) {
    $paths = Get-FeaturePathsEnv -NoPersist
} else {
    $paths = Get-FeaturePathsEnv
}

# Paths-only mode: chỉ in paths và thoát
if ($PathsOnly) {
    if ($Json) {
        [PSCustomObject]@{
            REPO_ROOT    = $paths.REPO_ROOT
            BRANCH       = $paths.CURRENT_BRANCH
            FEATURE_DIR  = $paths.FEATURE_DIR
            FEATURE_SPEC = $paths.FEATURE_SPEC
            IMPL_PLAN    = $paths.IMPL_PLAN
            TASKS        = $paths.TASKS
        } | ConvertTo-Json -Compress
    } else {
        Write-Output "REPO_ROOT: $($paths.REPO_ROOT)"
        Write-Output "BRANCH: $($paths.CURRENT_BRANCH)"
        Write-Output "FEATURE_DIR: $($paths.FEATURE_DIR)"
        Write-Output "FEATURE_SPEC: $($paths.FEATURE_SPEC)"
        Write-Output "IMPL_PLAN: $($paths.IMPL_PLAN)"
        Write-Output "TASKS: $($paths.TASKS)"
    }
    exit 0
}

# Validate thư mục và file bắt buộc
if (-not (Test-Path $paths.FEATURE_DIR -PathType Container)) {
    [Console]::Error.WriteLine("ERROR: Feature directory not found: $($paths.FEATURE_DIR)")
    $requirementCommand = Format-FullstackCommand -CommandName 'requirement' -RepoRoot $paths.REPO_ROOT
    [Console]::Error.WriteLine("Run $requirementCommand first to create the feature structure.")
    exit 1
}

if (-not (Test-Path $paths.IMPL_PLAN -PathType Leaf)) {
    [Console]::Error.WriteLine("ERROR: plan.md not found in $($paths.FEATURE_DIR)")
    $planCommand = Format-FullstackCommand -CommandName 'plan' -RepoRoot $paths.REPO_ROOT
    [Console]::Error.WriteLine("Run $planCommand first to create the implementation plan.")
    exit 1
}

# Nếu yêu cầu tasks.md mà chưa có -> báo lỗi
if ($RequireTasks -and -not (Test-Path $paths.TASKS -PathType Leaf)) {
    [Console]::Error.WriteLine("ERROR: tasks.md not found in $($paths.FEATURE_DIR)")
    $tasksCommand = Format-FullstackCommand -CommandName 'tasks' -RepoRoot $paths.REPO_ROOT
    [Console]::Error.WriteLine("Run $tasksCommand first to create the task list.")
    exit 1
}

# Build danh sách documents có sẵn
$docs = @()
if (Test-Path $paths.RESEARCH) { $docs += 'research.md' }
if (Test-Path $paths.DATA_MODEL) { $docs += 'data-model.md' }
if ((Test-Path $paths.CONTRACTS_DIR) -and (Get-ChildItem -Path $paths.CONTRACTS_DIR -ErrorAction SilentlyContinue | Select-Object -First 1)) {
    $docs += 'contracts/'
}
if (Test-Path $paths.QUICKSTART) { $docs += 'quickstart.md' }

if ($IncludeTasks -and (Test-Path $paths.TASKS)) {
    $docs += 'tasks.md'
}

$templateContent = $null
if ($Template) {
    $templateContent = Resolve-TemplateContent -TemplateName $Template -RepoRoot $paths.REPO_ROOT
    if ($null -eq $templateContent) {
        [Console]::Error.WriteLine("ERROR: Could not resolve required $Template from the template override stack for $($paths.REPO_ROOT)")
        exit 1
    }
}

# Output kết quả
if ($Json) {
    $result = [ordered]@{
        FEATURE_DIR = $paths.FEATURE_DIR
        AVAILABLE_DOCS = $docs
    }
    if ($Template) {
        $result.TEMPLATE_CONTENT = $templateContent
    }
    [PSCustomObject]$result | ConvertTo-Json -Compress
} else {
    Write-Output "FEATURE_DIR:$($paths.FEATURE_DIR)"
    Write-Output "AVAILABLE_DOCS:"

    Test-FileExists -Path $paths.RESEARCH -Description 'research.md' | Where-Object { $_ -isnot [bool] }
    Test-FileExists -Path $paths.DATA_MODEL -Description 'data-model.md' | Where-Object { $_ -isnot [bool] }
    Test-DirHasFiles -Path $paths.CONTRACTS_DIR -Description 'contracts/' | Where-Object { $_ -isnot [bool] }
    Test-FileExists -Path $paths.QUICKSTART -Description 'quickstart.md' | Where-Object { $_ -isnot [bool] }

    if ($IncludeTasks) {
        Test-FileExists -Path $paths.TASKS -Description 'tasks.md' | Where-Object { $_ -isnot [bool] }
    }
}
