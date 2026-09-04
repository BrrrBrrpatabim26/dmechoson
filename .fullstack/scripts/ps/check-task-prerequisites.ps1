[CmdletBinding()]
param(
    [switch]$Json
)

$ok = $true
$missing = @()
$current = ".fullstack/specs/current"
foreach ($f in @("spec.md", "plan.md", "design.md")) {
    if (-not (Test-Path (Join-Path $current $f))) {
        $missing += $f
        $ok = $false
    }
}

@{
    OK                     = $ok
    MISSING                = $missing
    PREREQUISITES_PASSED   = $ok
} | ConvertTo-Json -Compress