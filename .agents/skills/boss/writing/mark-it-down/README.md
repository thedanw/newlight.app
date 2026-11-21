# mark-it-down Skill

Convert various file formats (PDF, Office docs, images, audio, HTML, etc.) to Markdown using Microsoft's MarkItDown library for LLM-ready text extraction.

## Quick Start

```bash
# Install dependencies
cd .agents/skills/boss/writing/mark-it-down/scripts
python install-markitdown.py --all

# Convert a single file
python convert-to-markdown.py document.pdf -o document.md

# Batch convert a directory
python batch-convert.py --input-dir ./docs --output-dir ./markdown --recursive
```

## Scripts

| Script | Description |
|--------|-------------|
| `install-markitdown.py` | Install MarkItDown with optional dependencies |
| `install-markitdown.ps1` | PowerShell version of installer |
| `convert-to-markdown.py` | Convert single file to Markdown |
| `batch-convert.py` | Batch convert directory of files |

## Installation Options

```bash
# Core only
python install-markitdown.py

# Specific formats
python install-markitdown.py --pdf --docx --pptx --xlsx

# All formats
python install-markitdown.py --all

# With OCR plugin (requires OpenAI API key)
python install-markitdown.py --all --ocr

# Development mode from source
python install-markitdown.py --dev --all
```

## Conversion Examples

```bash
# Basic conversion
python convert-to-markdown.py report.pdf -o report.md

# With LLM image descriptions
python convert-to-markdown.py chart.png --llm --model gpt-4o

# With Azure Document Intelligence
python convert-to-markdown.py scanned.pdf --docintel "https://<resource>.cognitiveservices.azure.com/"

# With Azure Content Understanding
python convert-to-markdown.py invoice.pdf --cu-endpoint "https://<endpoint>.cognitiveservices.azure.com/" --cu-analyzer "my-invoice-analyzer"

# YouTube transcript
python convert-to-markdown.py "https://youtube.com/watch?v=VIDEO_ID" --youtube
```

## Batch Conversion

```bash
# Convert all PDFs in directory recursively
python batch-convert.py --input-dir ./pdfs --output-dir ./markdown --pattern "*.pdf" --recursive

# With LLM for images
python batch-convert.py --input-dir ./docs --output-dir ./markdown --llm --workers 8

# Dry run to preview
python batch-convert.py --input-dir ./docs --output-dir ./markdown --dry-run
```

## Supported Formats

- **Documents**: PDF, DOCX, PPTX, XLSX, XLS
- **Images**: PNG, JPG, GIF, BMP, TIFF (EXIF + OCR with plugin)
- **Audio**: WAV, MP3 (transcription)
- **Web**: HTML, YouTube URLs
- **Data**: CSV, JSON, XML
- **Archives**: ZIP (iterates contents)
- **E-books**: EPUB
- **Email**: Outlook MSG

## Azure Integration

### Document Intelligence
Higher-quality cloud OCR for scanned documents and complex tables.

### Content Understanding
- Multi-modal: documents, images, audio, video
- Structured field extraction (YAML front matter)
- Custom analyzers for domain-specific extraction

## Security Best Practices

- Use `convert_local()` for local files only
- Use `convert_response()` for HTTP responses
- Use `convert_stream()` for stream inputs
- Sanitize untrusted inputs before conversion
- Restrict file paths and network destinations in hosted environments

## Requirements

- Python 3.10+
- Virtual environment recommended
- OpenAI API key for LLM image descriptions/OCR
- Azure credentials for Document Intelligence/Content Understanding

## License

MIT License - see [Microsoft MarkItDown](https://github.com/microsoft/markitdown) for details.