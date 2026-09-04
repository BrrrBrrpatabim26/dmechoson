#!/usr/bin/env pwsh

# resolve-template.ps1 — Resolve một template name qua 4-tầng override
# stack (.fullstack/templates/overrides -> presets -> extensions -> core)
# và in content ra stdout (hoặc JSON envelope nếu -Json).
#
# Tương đương spec-kit resolve-template.ps1 đã rebrand:
#   - `.specify/` -> `.fullstack/`

param(
    [Parameter(Position=0)]
    [string]$TemplateName,
    [switch]$Json,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

if ($Help) {
    Write-Output "Usage: resolve-template.ps1 <template-name> [-Json]"
    exit 0
}

if (-not $TemplateName) {
    [Console]::Error.WriteLine("ERROR: Template name is required")
    exit 1
}

. "$PSScriptRoot/common.ps1"

$repoRoot = Get-RepoRoot
$templateContent = Resolve-TemplateContent -TemplateName $TemplateName -RepoRoot $repoRoot
if ($null -eq $templateContent) {
    [Console]::Error.WriteLine("ERROR: Could not resolve required $TemplateName from the template override stack for $repoRoot")
    exit 1
}

if ($Json) {
    [PSCustomObject]@{
        TEMPLATE_NAME = $TemplateName
        TEMPLATE_CONTENT = $templateContent
    } | ConvertTo-Json -Compress
} else {
    [Console]::Out.Write($templateContent)
}
