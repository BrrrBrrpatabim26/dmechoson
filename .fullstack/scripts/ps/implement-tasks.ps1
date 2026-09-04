# implement-tasks.ps1 — JSON-emitting stub for /fullstack.implement
[CmdletBinding()]
param(
    [switch]$Json
)

@{
    COMPLETED = @()
    SKIPPED   = @()
    REMAINING = @()
} | ConvertTo-Json -Compress