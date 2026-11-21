---
name: mark-it-down
description: "Convert various file formats (PDF, Office docs, images, audio, HTML, etc.) to Markdown using Microsoft's MarkItDown library for LLM-ready text extraction"
category: writing
risk: safe
source: community
source_repo: microsoft/markitdown
source_type: community
date_added: "2026-08-19"
author: Microsoft
tags: [markdown, conversion, pdf, docx, pptx, xlsx, images, audio, html, text-extraction, llm-prep]
tools: [python, cli, pip]
license: "MIT"
license_source: "https://github.com/microsoft/markitdown/blob/main/LICENSE"
---

# mark-it-down — Convert Files to Markdown for LLM Processing

## Overview

MarkItDown is a lightweight Python utility from Microsoft for converting various file formats to Markdown, optimized for LLM consumption and text analysis pipelines. It preserves document structure (headings, lists, tables, links) while producing clean, token-efficient Markdown output.

Supports: PDF, PowerPoint, Word, Excel, Images (EXIF + OCR), Audio (EXIF + transcription), HTML, CSV/JSON/XML, ZIP files, YouTube URLs, EPubs, and more.

## When to Use This Skill

- When you need to convert documents (PDF, DOCX, PPTX, XLSX) to Markdown for LLM processing
- When extracting text from images via OCR or getting image descriptions via LLM vision
- When transcribing audio files to text for analysis
- When converting web pages (HTML) or structured data (CSV, JSON, XML) to Markdown
- When processing ZIP archives or YouTube transcripts
- When you need Azure Document Intelligence or Azure Content Understanding for higher-quality extraction

## Prerequisites

- Python 3.10 or higher
- Virtual environment recommended

## Installation

### Basic Install (core formats only)
```bash
pip install markitdown
```

### With All Optional Dependencies
```bash
pip install 'markitdown[all]'
```

### Specific Format Dependencies
```bash
# PDF support
pip install 'markitdown[pdf]'

# Word documents
pip install 'markitdown[docx]'

# PowerPoint
pip install 'markitdown[pptx]'

# Excel
pip install 'markitdown[xlsx]'

# Audio transcription
pip install 'markitdown[audio-transcription]'

# YouTube transcription
pip install 'markitdown[youtube-transcription]'

# Azure Document Intelligence
pip install 'markitdown[az-doc-intel]'

# Azure Content Understanding
pip install 'markitdown[az-content-understanding]'

# OCR plugin (requires OpenAI-compatible client)
pip install markitdown-ocr
pip install openai
```

## Usage

### Command Line Interface

```bash
# Convert file to stdout
markitdown path-to-file.pdf > document.md

# Convert with output file
markitdown path-to-file.pdf -o document.md

# Pipe content
cat path-to-file.pdf | markitdown

# List installed plugins
markitdown --list-plugins

# Enable plugins
markitdown --use-plugins path-to-file.pdf

# Use Azure Document Intelligence
markitdown path-to-file.pdf -o document.md -d -e "<document_intelligence_endpoint>"

# Use Azure Content Understanding
markitdown path-to-file.pdf --use-cu --cu-endpoint "<content_understanding_endpoint>"
```

### Python API

#### Basic Conversion
```python
from markitdown import MarkItDown

md = MarkItDown(enable_plugins=False)
result = md.convert("test.xlsx")
print(result.text_content)
```

#### With Azure Document Intelligence
```python
from markitdown import MarkItDown

md = MarkItDown(docintel_endpoint="<document_intelligence_endpoint>")
result = md.convert("test.pdf")
print(result.text_content)
```

#### With LLM for Image Descriptions
```python
from markitdown import MarkItDown
from openai import OpenAI

client = OpenAI()
md = MarkItDown(llm_client=client, llm_model="gpt-4o", llm_prompt="optional custom prompt")
result = md.convert("example.jpg")
print(result.text_content)
```

#### With Azure Content Understanding (Auto-routing)
```python
from markitdown import MarkItDown

# Zero-config — auto-selects analyzer per file type
md = MarkItDown(cu_endpoint="<content_understanding_endpoint>")
result = md.convert("report.pdf")   # documents → prebuilt-documentSearch
result = md.convert("meeting.mp4")  # video → prebuilt-videoSearch
result = md.convert("call.wav")     # audio → prebuilt-audioSearch
print(result.markdown)
```

#### With Custom Analyzer (Structured Field Extraction)
```python
from markitdown import MarkItDown

md = MarkItDown(
    cu_endpoint="<content_understanding_endpoint>",
    cu_analyzer_id="my-invoice-analyzer",
)
result = md.convert("invoice.pdf")
print(result.markdown)
# Output includes YAML front matter with extracted fields:
# ---
# contentType: document
# fields:
#   VendorName: CONTOSO LTD.
#   InvoiceDate: '2019-11-15'
# ---
# <!-- page 1 -->
```

#### Restrict CU to Specific File Types
```python
from markitdown import MarkItDown
from markitdown.converters import ContentUnderstandingFileType

md = MarkItDown(
    cu_endpoint="<content_understanding_endpoint>",
    cu_file_types=[ContentUnderstandingFileType.PDF],  # only PDFs use CU
)
```

#### With OCR Plugin
```python
from markitdown import MarkItDown
from openai import OpenAI

md = MarkItDown(
    enable_plugins=True,
    llm_client=OpenAI(),
    llm_model="gpt-4o",
)
result = md.convert("document_with_images.pdf")
print(result.text_content)
```

#### Narrow Conversion APIs (Security Best Practice)
```python
from markitdown import MarkItDown
import requests

md = MarkItDown()

# For local files only
result = md.convert_local("document.pdf")

# For HTTP responses
response = requests.get("https://example.com/doc.pdf")
result = md.convert_response(response)

# For streams
with open("document.pdf", "rb") as f:
    result = md.convert_stream(f)
```

### Docker Usage
```bash
# Build
docker build -t markitdown:latest .

# Run (stdin/stdout)
docker run --rm -i markitdown:latest < ~/your-file.pdf > output.md
```

## Supported Formats

| Format | Dependencies | Notes |
|--------|--------------|-------|
| PDF | `[pdf]` or `[all]` | Uses pdfplumber, pymupdf |
| PowerPoint (PPTX) | `[pptx]` or `[all]` | |
| Word (DOCX) | `[docx]` or `[all]` | |
| Excel (XLSX) | `[xlsx]` or `[all]` | |
| Legacy Excel (XLS) | `[xls]` or `[all]` | |
| Images | `[all]` | EXIF metadata; OCR with plugin |
| Audio (WAV, MP3) | `[audio-transcription]` | Speech transcription |
| HTML | Built-in | |
| CSV, JSON, XML | Built-in | |
| ZIP | Built-in | Iterates over contents |
| YouTube URLs | `[youtube-transcription]` | Fetches transcript |
| EPub | `[all]` | |
| Outlook Messages | `[outlook]` | |

## Advanced Features

### Azure Document Intelligence
Higher-quality cloud-based layout analysis and OCR for scanned PDFs, complex tables, and multi-page documents.

### Azure Content Understanding
- Multi-modal: documents, images, audio, video
- Structured field extraction (YAML front matter)
- Custom analyzers for domain-specific extraction
- Single API for all modalities

### Plugins
- `markitdown-ocr`: OCR support for PDF, DOCX, PPTX, XLSX using LLM Vision
- Third-party plugins via `#markitdown-plugin` on GitHub

## Security Considerations

- MarkItDown performs I/O with current process privileges
- Sanitize untrusted inputs before conversion
- Use narrowest conversion API: `convert_local()` for files, `convert_response()` for HTTP, `convert_stream()` for streams
- Restrict file paths, URI schemes, and network destinations in hosted environments

## Examples

### Example 1: Convert PDF to Markdown
```bash
markitdown report.pdf -o report.md
```

### Example 2: Batch Convert Directory
```bash
for f in *.pdf; do markitdown "$f" -o "${f%.pdf}.md"; done
```

### Example 3: Extract Text from Image with LLM Description
```python
from markitdown import MarkItDown
from openai import OpenAI

client = OpenAI()
md = MarkItDown(llm_client=client, llm_model="gpt-4o")
result = md.convert("chart.png")
print(result.text_content)
```

### Example 4: Process YouTube Video
```bash
markitdown "https://www.youtube.com/watch?v=VIDEO_ID" -o transcript.md
```

### Example 5: Convert with Azure Document Intelligence
```bash
markitdown scanned.pdf -o output.md -d -e "https://<resource>.cognitiveservices.azure.com/"
```

## Key Rules

- Always use virtual environment to avoid dependency conflicts
- Install only needed optional dependencies to minimize install size
- For production/hosted use, prefer narrow conversion APIs (`convert_local`, `convert_response`, `convert_stream`)
- Azure services incur costs per API call — restrict file types with `cu_file_types`
- OCR plugin requires OpenAI-compatible client and `enable_plugins=True`
- Output is optimized for LLM consumption, not high-fidelity human reading