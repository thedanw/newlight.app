<#
.SYNOPSIS
    Install MarkItDown with optional dependencies for the mark-it-down skill.

.DESCRIPTION
    This script installs Microsoft's MarkItDown library with various optional dependency groups
    for converting different file formats to Markdown.

.PARAMETER All
    Install all optional dependencies.

.PARAMETER Pdf
    Install PDF support dependencies.

.PARAMETER Docx
    Install Word document support dependencies.

.PARAMETER Pptx
    Install PowerPoint support dependencies.

.PARAMETER Xlsx
    Install Excel support dependencies.

.PARAMETER Audio
    Install audio transcription dependencies.

.PARAMETER Youtube
    Install YouTube transcription dependencies.

.PARAMETER AzDocIntel
    Install Azure Document Intelligence dependencies.

.PARAMETER AzContentUnderstanding
    Install Azure Content Understanding dependencies.

.PARAMETER Ocr
    Install OCR plugin (requires OpenAI-compatible client).

.PARAMETER Dev
    Install in development mode from source.

.EXAMPLE
    .\install-markitdown.ps1 -All

.EXAMPLE
    .\install-markitdown.ps1 -Pdf -Docx -Pptx

.EXAMPLE
    .\install-markitdown.ps1 -Ocr
#>

param(
    [switch]$All,
    [switch]$Pdf,
    [switch]$Docx,
    [switch]$Pptx,
    [switch]$Xlsx,
    [switch]$Xls,
    [switch]$Audio,
    [switch]$Youtube,
    [switch]$AzDocIntel,
    [switch]$AzContentUnderstanding,
    [switch]$Outlook,
    [switch]$Ocr,
    [switch]$Dev
)

# Determine which extras to install
$extras = @()

if ($All) {
    $extras += "all"
} else {
    if ($Pdf) { $extras += "pdf" }
    if ($Docx) { $extras += "docx" }
    if ($Pptx) { $extras += "pptx" }
    if ($Xlsx) { $extras += "xlsx" }
    if ($Xls) { $extras += "xls" }
    if ($Audio) { $extras += "audio-transcription" }
    if ($Youtube) { $extras += "youtube-transcription" }
    if ($AzDocIntel) { $extras += "az-doc-intel" }
    if ($AzContentUnderstanding) { $extras += "az-content-understanding" }
    if ($Outlook) { $extras += "outlook" }
}

# Build install command
if ($Dev) {
    Write-Host "Installing MarkItDown in development mode from source..." -ForegroundColor Cyan
    if (-not (Test-Path "markitdown")) {
        Write-Host "Cloning MarkItDown repository..." -ForegroundColor Yellow
        git clone https://github.com/microsoft/markitdown.git
    }
    Set-Location "markitdown"
    if ($extras.Count -gt 0) {
        $extraStr = $extras -join ","
        Write-Host "Installing with extras: $extraStr" -ForegroundColor Green
        uv pip install -e "packages/markitdown[$extraStr]"
    } else {
        Write-Host "Installing core only" -ForegroundColor Green
        uv pip install -e "packages/markitdown"
    }
} else {
    if ($extras.Count -gt 0) {
        $extraStr = $extras -join ","
        Write-Host "Installing MarkItDown with extras: $extraStr" -ForegroundColor Green
        uv pip install "markitdown[$extraStr]"
    } else {
        Write-Host "Installing MarkItDown core only" -ForegroundColor Green
        uv pip install markitdown
    }
}

# Install OCR plugin if requested
if ($Ocr) {
    Write-Host "Installing OCR plugin..." -ForegroundColor Cyan
    uv pip install markitdown-ocr
    uv pip install openai
}

Write-Host "`nInstallation complete!" -ForegroundColor Green
Write-Host "Verify with: markitdown --version" -ForegroundColor Cyan
Write-Host "List plugins with: markitdown --list-plugins" -ForegroundColor Cyan