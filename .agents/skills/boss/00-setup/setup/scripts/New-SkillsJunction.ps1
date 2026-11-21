<#
.SYNOPSIS
    Create or repair the skills junction from a workspace to the skill repository.
.DESCRIPTION
    Creates a junction (Windows) or symlink (Linux/macOS) at
    <WorkspaceRoot>\.agents\skills pointing to <SkillRepoPath>.
.PARAMETER WorkspaceRoot
    The root directory of the project to set up.
.PARAMETER SkillRepoPath
    The full path to the skill repository's .agents\skills folder.
.EXAMPLE
    .\New-SkillsJunction.ps1 -WorkspaceRoot "C:\Projects\my-app" -SkillRepoPath "C:\skill-repo\.agents\skills"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceRoot,

    [Parameter(Mandatory = $true)]
    [string]$SkillRepoPath
)

$ErrorActionPreference = "Stop"
$agentsDir = Join-Path -Path $WorkspaceRoot -ChildPath ".agents"
$junctionPath = Join-Path -Path $agentsDir -ChildPath "skills"

# Create .agents directory if it doesn't exist
if (-not (Test-Path -Path $agentsDir)) {
    New-Item -ItemType Directory -Path $agentsDir -Force | Out-Null
    Write-Host "Created: $agentsDir"
}

# Validate skill repo path
if (-not (Test-Path -Path $SkillRepoPath)) {
    Write-Error "Skill repository path not found: $SkillRepoPath"
    exit 1
}

# Remove existing junction/symlink if present
if (Test-Path -Path $junctionPath) {
    $item = Get-Item -Path $junctionPath -Force
    if ($item.LinkType -eq "Junction") {
        Remove-Item -Path $junctionPath -Force -Recurse
        Write-Host "Removed existing junction: $junctionPath"
    } else {
        Write-Warning "Path exists but is not a junction: $junctionPath"
        Write-Warning "Remove it manually or use -Force to overwrite."
        exit 1
    }
}

# Create the junction
New-Item -ItemType Junction -Path $junctionPath -Target $SkillRepoPath -Force | Out-Null
Write-Host "Created junction: $junctionPath → $SkillRepoPath"
