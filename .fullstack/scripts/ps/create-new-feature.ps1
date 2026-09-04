#!/usr/bin/env pwsh
# create-new-feature.ps1 — Tạo feature directory mới dưới `specs/`,
# resolve spec-template qua override stack, persist feature state
# (PowerShell variant).
#
# Tương đương spec-kit create-new-feature.ps1 đã rebrand:
#   - `SPECIFY_*` env-vars -> `FULLSTACK_*`
#   - `specs/` -> `specs/` (giữ convention)
#   - comment tiếng Việt
#
# Cách dùng: ./create-new-feature.ps1 [-Json] [-DryRun] [-AllowExistingBranch] [-ShortName <name>] [-Number N] [-Timestamp] <feature description>

[CmdletBinding()]
param(
    [switch]$Json,
    [switch]$AllowExistingBranch,
    [switch]$DryRun,
    [string]$ShortName,
    [Parameter()]
    [string]$Number = '',
    [switch]$Timestamp,
    [switch]$Help,
    [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
    [string[]]$FeatureDescription
)
$ErrorActionPreference = 'Stop'
$maxBranchLength = 244

# In hướng dẫn nếu được yêu cầu
if ($Help) {
    Write-Host "Usage: ./create-new-feature.ps1 [-Json] [-DryRun] [-AllowExistingBranch] [-ShortName <name>] [-Number N] [-Timestamp] <feature description>"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Json                 Output JSON"
    Write-Host "  -DryRun               Tính feature name và paths nhưng không tạo file/dir"
    Write-Host "  -AllowExistingBranch  Tái sử dụng feature directory đã tồn tại"
    Write-Host "  -ShortName <name>     Cung cấp short name (2-4 từ) cho feature"
    Write-Host "  -Number N             Ưu tiên feature number (auto-correct nếu prefix đã tồn tại)"
    Write-Host "  -Timestamp            Dùng timestamp prefix (YYYYMMDD-HHMMSS) thay vì số tuần tự"
    Write-Host "  -Help                 In hướng dẫn"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  ./create-new-feature.ps1 'Add user authentication system' -ShortName 'user-auth'"
    Write-Host "  ./create-new-feature.ps1 'Implement OAuth2 integration for API'"
    Write-Host "  ./create-new-feature.ps1 -Timestamp -ShortName 'user-auth' 'Add user authentication'"
    exit 0
}

# Check if feature description provided
if (-not $FeatureDescription -or $FeatureDescription.Count -eq 0) {
    Write-Error "Usage: ./create-new-feature.ps1 [-Json] [-DryRun] [-AllowExistingBranch] [-ShortName <name>] [-Number N] [-Timestamp] <feature description>"
    exit 1
}

$featureDesc = ($FeatureDescription -join ' ').Trim()

# Validate description không rỗng sau trim
if ([string]::IsNullOrWhiteSpace($featureDesc)) {
    Write-Error "Error: Feature description cannot be empty or contain only whitespace"
    exit 1
}

function Get-HighestNumberFromSpecs {
    param([string]$SpecsDir)

    [long]$highest = 0
    if (Test-Path $SpecsDir) {
        Get-ChildItem -Path $SpecsDir -Directory | ForEach-Object {
            if ($_.Name -match '^(\d{3,})-' -and $_.Name -notmatch '^\d{8}-\d{6}-') {
                [long]$num = 0
                if ([long]::TryParse($matches[1], [ref]$num) -and $num -gt $highest) {
                    $highest = $num
                }
            }
        }
    }
    return $highest
}

function Test-SpecPrefixInUse {
    param(
        [string]$SpecsDir,
        [string]$FeatureNum
    )

    if (-not (Test-Path -LiteralPath $SpecsDir -PathType Container)) {
        return $false
    }

    return $null -ne (Get-ChildItem -LiteralPath $SpecsDir -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "$FeatureNum-*" } |
        Select-Object -First 1)
}

function ConvertTo-CleanBranchName {
    param([string]$Name)

    return $Name.ToLower() -replace '[^a-z0-9]', '-' -replace '-{2,}', '-' -replace '^-', '' -replace '-$', ''
}

function Get-FittedBranchName {
    param(
        [string]$FeatureNum,
        [string]$BranchSuffix
    )

    $fittedName = "$FeatureNum-$BranchSuffix"
    if ($fittedName.Length -gt $maxBranchLength) {
        $prefixLength = $FeatureNum.Length + 1
        $maxSuffixLength = $maxBranchLength - $prefixLength
        $truncatedSuffix = $BranchSuffix.Substring(0, [Math]::Min($BranchSuffix.Length, $maxSuffixLength))
        $truncatedSuffix = $truncatedSuffix -replace '-$', ''
        $fittedName = "$FeatureNum-$truncatedSuffix"
    }

    return $fittedName
}

# Load common functions
. "$PSScriptRoot/common.ps1"

# Use common.ps1 functions which prioritize .fullstack
$repoRoot = Get-RepoRoot

Set-Location $repoRoot

$specsDir = Join-Path $repoRoot 'specs'
if (-not $DryRun) {
    New-Item -ItemType Directory -Path $specsDir -Force | Out-Null
}

# Generate branch name with stop word filtering and length filtering
function Get-BranchName {
    param([string]$Description)

    $stopWords = @(
        'i', 'a', 'an', 'the', 'to', 'for', 'of', 'in', 'on', 'at', 'by', 'with', 'from',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
        'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall',
        'this', 'that', 'these', 'those', 'my', 'your', 'our', 'their',
        'want', 'need', 'add', 'get', 'set'
    )

    $cleanName = $Description.ToLower() -replace '[^a-z0-9\s]', ' '
    $words = $cleanName -split '\s+' | Where-Object { $_ }

    $meaningfulWords = @()
    foreach ($word in $words) {
        if ($stopWords -contains $word) { continue }
        if ($word.Length -ge 3) {
            $meaningfulWords += $word
        } elseif ($Description -cmatch "\b$($word.ToUpper())\b") {
            $meaningfulWords += $word
        }
    }

    if ($meaningfulWords.Count -gt 0) {
        $maxWords = if ($meaningfulWords.Count -eq 4) { 4 } else { 3 }
        $result = ($meaningfulWords | Select-Object -First $maxWords) -join '-'
        return $result
    } else {
        $result = ConvertTo-CleanBranchName -Name $Description
        $fallbackWords = ($result -split '-') | Where-Object { $_ } | Select-Object -First 3
        return [string]::Join('-', $fallbackWords)
    }
}

# Generate branch name
if ($ShortName) {
    $branchSuffix = ConvertTo-CleanBranchName -Name $ShortName
} else {
    $branchSuffix = Get-BranchName -Description $featureDesc
}

# Treat an explicit empty string as omitted, matching the bash and Python twins.
$hasNumber = $PSBoundParameters.ContainsKey('Number') -and $Number -ne ''

# Warn if -Number and -Timestamp are both specified.
if ($Timestamp -and $hasNumber) {
    [Console]::Error.WriteLine("[fullstack] Warning: -Number is ignored when -Timestamp is used")
    $Number = ''
}

# Determine branch prefix
if ($Timestamp) {
    $featureNum = Get-Date -Format 'yyyyMMdd-HHmmss'
    $branchName = "$featureNum-$branchSuffix"
} else {
    [long]$resolvedNumber = 0
    if (-not $hasNumber) {
        $highestNumber = Get-HighestNumberFromSpecs -SpecsDir $specsDir
        if ($highestNumber -eq [long]::MaxValue) {
            Write-Error "Error: feature number must be between 0 and $([long]::MaxValue), got '9223372036854775808'"
            exit 1
        }
        $resolvedNumber = $highestNumber + 1
    } elseif ($Number -notmatch '^[0-9]+$') {
        Write-Error "Error: -Number must be an unsigned integer, got '$Number'"
        exit 1
    } elseif (-not [long]::TryParse($Number, [ref]$resolvedNumber)) {
        Write-Error "Error: -Number must be between 0 and $([long]::MaxValue), got '$Number'"
        exit 1
    }

    $featureNum = ('{0:000}' -f $resolvedNumber)

    $specConflict = $false
    if ($hasNumber -and (Test-Path -LiteralPath $specsDir -PathType Container)) {
        $requestedBranchName = Get-FittedBranchName -FeatureNum $featureNum -BranchSuffix $branchSuffix
        $requestedDir = Join-Path $specsDir $requestedBranchName
        if (-not $AllowExistingBranch -or -not (Test-Path -LiteralPath $requestedDir -PathType Container)) {
            $specConflict = Test-SpecPrefixInUse -SpecsDir $specsDir -FeatureNum $featureNum
        }
    }

    if ($specConflict) {
        $requestedNum = $featureNum
        $highestNumber = Get-HighestNumberFromSpecs -SpecsDir $specsDir
        $resolvedNumber = $highestNumber
        do {
            if ($resolvedNumber -eq [long]::MaxValue) {
                Write-Error "Error: feature number must be between 0 and $([long]::MaxValue), got '9223372036854775808'"
                exit 1
            }
            $resolvedNumber++
            $featureNum = ('{0:000}' -f $resolvedNumber)
        } while (Test-SpecPrefixInUse -SpecsDir $specsDir -FeatureNum $featureNum)
        [Console]::Error.WriteLine("[fullstack] Warning: -Number $requestedNum conflicts with an existing spec directory; using $featureNum instead")
    }
}

# GitHub enforces 244-byte limit on branch names
$originalBranchName = "$featureNum-$branchSuffix"
$branchName = Get-FittedBranchName -FeatureNum $featureNum -BranchSuffix $branchSuffix
if ($branchName -ne $originalBranchName) {
    [Console]::Error.WriteLine("[fullstack] Warning: Branch name exceeded GitHub's 244-byte limit")
    [Console]::Error.WriteLine("[fullstack] Original: $originalBranchName ($($originalBranchName.Length) bytes)")
    [Console]::Error.WriteLine("[fullstack] Truncated to: $branchName ($($branchName.Length) bytes)")
}

$featureDir = Join-Path $specsDir $branchName
$specFile = Join-Path $featureDir 'spec.md'

if (-not $DryRun) {
    if ((Test-Path -LiteralPath $featureDir -PathType Container) -and -not $AllowExistingBranch) {
        if ($Timestamp) {
            Write-Error "Error: Feature directory '$featureDir' already exists. Rerun to get a new timestamp or use a different -ShortName."
        } else {
            Write-Error "Error: Feature directory '$featureDir' already exists. Please use a different feature name or specify a different number with -Number."
        }
        exit 1
    }

    $needsSpec = -not (Test-Path -PathType Leaf $specFile)
    $content = $null
    if ($needsSpec) {
        $content = Resolve-TemplateContent -TemplateName 'spec-template' -RepoRoot $repoRoot
    }

    New-Item -ItemType Directory -Path $featureDir -Force | Out-Null

    if ($needsSpec) {
        if ($null -ne $content) {
            $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
            [System.IO.File]::WriteAllText($specFile, $content, $utf8NoBom)
        } else {
            # Match bash twin: warn on stderr trước khi tạo empty spec file
            [Console]::Error.WriteLine("Warning: Spec template not found; created empty spec file")
            New-Item -ItemType File -Path $specFile -Force | Out-Null
        }
    }

    # Persist xuống .fullstack/feature.json
    Save-FeatureJson -RepoRoot $repoRoot -FeatureDirectory $featureDir

    # Set environment variables cho current session
    $env:FULLSTACK_FEATURE = $branchName
    $env:FULLSTACK_FEATURE_DIRECTORY = $featureDir

    $quotedBranchName = "'" + $branchName.Replace("'", "''") + "'"
    $quotedFeatureDir = "'" + $featureDir.Replace("'", "''") + "'"
    $featureAssignment = '$env:FULLSTACK_FEATURE = ' + $quotedBranchName
    $directoryAssignment = '$env:FULLSTACK_FEATURE_DIRECTORY = ' + $quotedFeatureDir
    [Console]::Error.WriteLine("# To persist: $featureAssignment")
    [Console]::Error.WriteLine("#              $directoryAssignment")
}

if ($Json) {
    $obj = [PSCustomObject]@{
        BRANCH_NAME = $branchName
        SPEC_FILE = $specFile
        FEATURE_NUM = $featureNum
    }
    if ($DryRun) {
        $obj | Add-Member -NotePropertyName 'DRY_RUN' -NotePropertyValue $true
    }
    $obj | ConvertTo-Json -Compress
} else {
    Write-Output "BRANCH_NAME: $branchName"
    Write-Output "SPEC_FILE: $specFile"
    Write-Output "FEATURE_NUM: $featureNum"
    if (-not $DryRun) {
        Write-Output "# To persist in your shell: $featureAssignment"
        Write-Output "#                           $directoryAssignment"
    }
}
