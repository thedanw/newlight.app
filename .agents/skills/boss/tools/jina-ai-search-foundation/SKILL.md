---
name: jina-ai-search-foundation
description: "Use Jina AI Search Foundation APIs (Embeddings, Reranker, Reader, Search, Batch Embeddings) for semantic search, RAG, web scraping, and large-scale document processing. Get your Jina AI API key for free: https://jina.ai/?sui=apikey"
category: tools
risk: safe
source: local
tags: [embeddings, reranker, reader, search, batch-embeddings, rag, semantic-search, jina-ai, api, llm]
triggers: [embed, rerank, search, scrape, read, batch-embed, semantic-search, retrieve]
allowed-tools: [run_in_terminal, read_file, create_file, insert_edit_into_file, replace_string_in_file, grep_search, file_search, fetch_webpage, mcp_jina_ai_offic_search_web, mcp_jina_ai_offic_search_arxiv, mcp_jina_ai_offic_read_url, mcp_jina_ai_offic_parallel_read_url, mcp_jina_ai_offic_parallel_search_web, mcp_jina_ai_offic_parallel_search_arxiv, mcp_jina_ai_offic_sort_by_relevance, mcp_jina_ai_offic_classify_text, mcp_jina_ai_offic_deduplicate_strings, mcp_jina_ai_offic_deduplicate_images, mcp_jina_ai_offic_expand_query, mcp_jina_ai_offic_extract_pdf, mcp_jina_ai_offic_guess_datetime_url, mcp_jina_ai_offic_capture_screenshot_url, mcp_jina_ai_offic_search_images, mcp_jina_ai_offic_search_bibtex, mcp_jina_ai_offic_search_jina_blog, mcp_jina_ai_offic_search_ssrn, mcp_jina_ai_offic_primer, mcp_jina_ai_offic_show_api_key]
---

# Jina AI Search Foundation

## Overview

This skill provides comprehensive guidance for using Jina AI Search Foundation APIs to build semantic search, RAG pipelines, web scraping, and large-scale document processing applications. It covers all five core APIs with production-ready code patterns.

**API Key Required**: Get your free Jina AI API key at https://jina.ai/?sui=apikey and set it as the `JINA_API_KEY` environment variable.

## Core Principles

1. **Simplicity First** — Use single APIs when possible; don't overcomplicate
2. **Scope Awareness** — Answer "can't do" for tasks outside Jina AI Search Foundation
3. **Built-in Features** — Prefer native API capabilities over custom implementations
4. **Multimodal Ready** — Leverage multimodal models (jina-embeddings-v4, jina-clip-v2, jina-reranker-m0) when needed
5. **API-First** — All implementations must use Jina APIs directly
6. **No Placeholders** — Generate production-ready code with real API calls
7. **JSON Responses** — Always include `Accept: application/json` header
8. **Error Handling** — Use try/catch, implement retries, validate inputs

## API Overview

| API | Endpoint | Best For | Rate Limit |
|-----|----------|----------|------------|
| **Embeddings** | `https://api.jina.ai/v1/embeddings` | Semantic search, similarity, clustering | 500 RPM / 1M TPM |
| **Batch Embeddings** | `https://api.jina.ai/v1/batch/embeddings` | Bulk processing (10K-50K docs) | 500 RPM / 1M TPM |
| **Reranker** | `https://api.jina.ai/v1/rerank` | Refining search results, RAG chunk ranking | 500 RPM / 1M TPM |
| **Reader** | `https://r.jina.ai/` | Single URL content extraction | 500 RPM |
| **Search** | `https://s.jina.ai/` | Web search with LLM-friendly output | 100 RPM |

## Latest Models (2026)

### Embeddings
- **jina-embeddings-v5-text-small** (677M, 1024-dim, 32K context) — Best for retrieval, classification, clustering
- **jina-embeddings-v5-text-nano** (239M, 768-dim, 8K context) — Low-latency, edge deployment
- **jina-embeddings-v4** (3.8B, 2048-dim) — Multimodal (text, images, PDFs)
- **jina-embeddings-v3** (570M, 1024-dim) — 100+ languages, retrieval optimized
- **jina-clip-v2** (885M, 1024-dim) — Cross-modal text-image retrieval

### Rerankers
- **jina-reranker-v3** (0.6B) — Last-but-not-late interaction, multilingual
- **jina-reranker-m0** (2.4B) — Multimodal (text + images)
- **jina-reranker-v2-base-multilingual** (278M) — Fast multilingual
- **jina-colbert-v2** (560M) — ColBERT-style multi-vector

### Code Embeddings
- **jina-code-embeddings-0.5b** (494M) — NL2Code, TechQA, Code2Code
- **jina-code-embeddings-1.5b** (1.54B) — Larger code model

## When to Use This Skill

- Building semantic search or vector databases
- Implementing RAG (Retrieval-Augmented Generation) pipelines
- Scraping and extracting content from web pages
- Searching the web with LLM-optimized results
- Re-ranking search results for better relevance
- Processing thousands of documents for embeddings (batch API)
- Cross-modal search (text + images)
- Code search and technical Q&A

## Workflow Patterns

### Pattern 1: Basic Semantic Search
```
Search API → Reranker API → Embeddings API (for storage)
```

### Pattern 2: Web Content Processing
```
Reader API (extract) → Embeddings API (vectorize) → Vector DB
```

### Pattern 3: Large-Scale Document Indexing
```
Batch Embeddings API (submit) → Poll status → Download results → Vector DB
```

### Pattern 4: RAG Pipeline
```
Search API (retrieve) → Reader API (extract full content) → Reranker API (refine) → LLM
```

## API Reference & Code Patterns

### 1. Embeddings API

**Endpoint**: `POST https://api.jina.ai/v1/embeddings`

**Headers**:
```
Authorization: Bearer $JINA_API_KEY
Content-Type: application/json
Accept: application/json
```

**Models & Request Bodies**:

**jina-embeddings-v5-text-small / jina-embeddings-v5-text-nano**:
```json
{
  "model": "jina-embeddings-v5-text-small",
  "input": ["text1", "text2"],
  "embedding_type": "float",
  "task": "retrieval.passage",
  "dimensions": 512,
  "normalized": true,
  "late_chunking": false,
  "truncate": true
}
```

**jina-embeddings-v4** (multimodal):
```json
{
  "model": "jina-embeddings-v4",
  "input": ["text", {"image": "https://example.com/image.jpg"}],
  "embedding_type": "float",
  "task": "retrieval.passage",
  "dimensions": 1024,
  "late_chunking": false,
  "truncate": true,
  "return_multivector": false
}
```

**jina-embeddings-v3 / jina-clip-v2**:
```json
{
  "model": "jina-clip-v2",
  "input": ["text", {"image": "base64_or_url"}],
  "embedding_type": "float",
  "task": "retrieval.passage",
  "dimensions": 512,
  "normalized": true,
  "late_chunking": false,
  "truncate": true
}
```

**Code Embeddings** (jina-code-embeddings-0.5b / 1.5b):
```json
{
  "model": "jina-code-embeddings-1.5b",
  "input": ["function foo() {...}"],
  "embedding_type": "float",
  "task": "nl2code.query",
  "dimensions": 512,
  "truncate": true
}
```

**Python Example**:
```python
import os
import requests
import json

JINA_API_KEY = os.getenv("JINA_API_KEY")
if not JINA_API_KEY:
    raise ValueError("Set JINA_API_KEY environment variable. Get free key: https://jina.ai/?sui=apikey")

def get_embeddings(texts, model="jina-embeddings-v5-text-small", task="retrieval.passage", dimensions=None):
    url = "https://api.jina.ai/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {JINA_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    payload = {
        "model": model,
        "input": texts,
        "task": task,
        "embedding_type": "float"
    }
    if dimensions:
        payload["dimensions"] = dimensions
    if model in ["jina-embeddings-v5-text-small", "jina-embeddings-v5-text-nano"]:
        payload["normalized"] = True
    
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()["data"]

# Usage
embeddings = get_embeddings(
    ["Jina AI provides search foundation APIs", "Embeddings convert text to vectors"],
    model="jina-embeddings-v5-text-small",
    task="retrieval.passage",
    dimensions=512
)
print(f"Generated {len(embeddings)} embeddings of dimension {len(embeddings[0]['embedding'])}")
```

### 2. Batch Embeddings API

**Workflow**: Submit → Poll → Download

**Submit Job**:
```python
def submit_batch_embeddings(texts, model="jina-embeddings-v5-text-small", task="retrieval.passage"):
    url = "https://api.jina.ai/v1/batch/embeddings"
    headers = {
        "Authorization": f"Bearer {JINA_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    payload = {
        "model": model,
        "input": texts,
        "task": task
    }
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()["batch_id"]
```

**Poll Status**:
```python
import time

def poll_batch_status(batch_id, interval=10):
    url = f"https://api.jina.ai/v1/batch/{batch_id}"
    headers = {"Authorization": f"Bearer {JINA_API_KEY}", "Accept": "application/json"}
    
    while True:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        status = data["status"]
        print(f"Batch {batch_id}: {status} ({data['stats']['completed']}/{data['stats']['total']})")
        
        if status == "completed":
            return data["output_url"]
        elif status == "failed":
            raise RuntimeError(f"Batch failed: {data}")
        
        time.sleep(interval)
```

**Download Results**:
```python
def download_batch_results(output_url):
    url = f"https://api.jina.ai{output_url}"
    headers = {"Authorization": f"Bearer {JINA_API_KEY}", "Accept": "application/json"}
    response = requests.get(url, headers=headers, stream=True)
    response.raise_for_status()
    
    results = []
    for line in response.iter_lines():
        if line:
            results.append(json.loads(line))
    return results
```

### 3. Reranker API

**Endpoint**: `POST https://api.jina.ai/v1/rerank`

**Request** (jina-reranker-v3 / v2 / colbert-v2):
```json
{
  "model": "jina-reranker-v3",
  "query": "What is Jina AI?",
  "documents": [
    "Jina AI provides search foundation APIs...",
    "Machine learning platform for developers...",
    "Unrelated content about cooking..."
  ],
  "top_n": 3,
  "return_documents": true
}
```

**Request** (jina-reranker-m0 - multimodal):
```json
{
  "model": "jina-reranker-m0",
  "query": "Find images of cats",
  "documents": [
    {"text": "A cute cat sitting on a mat", "image": "https://example.com/cat.jpg"},
    {"text": "Dog playing in park", "image": "https://example.com/dog.jpg"}
  ],
  "top_n": 2,
  "return_documents": true
}
```

**Python Example**:
```python
def rerank(query, documents, model="jina-reranker-v3", top_n=None):
    url = "https://api.jina.ai/v1/rerank"
    headers = {
        "Authorization": f"Bearer {JINA_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    payload = {
        "model": model,
        "query": query,
        "documents": documents,
        "return_documents": True
    }
    if top_n:
        payload["top_n"] = top_n
    
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()["results"]

# Usage
results = rerank(
    query="Jina AI embedding models",
    documents=[
        "Jina AI provides embedding APIs for semantic search",
        "Machine learning frameworks for production",
        "Cooking recipes for Italian pasta"
    ],
    model="jina-reranker-v3",
    top_n=2
)
for r in results:
    print(f"Score: {r['relevance_score']:.4f} - {r['document']['text'][:80]}...")
```

### 4. Reader API

**Endpoint**: `POST https://r.jina.ai/` (or `https://eu.r.jina.ai/` for EU)

**Headers**:
```
Authorization: Bearer $JINA_API_KEY
Content-Type: application/json
Accept: application/json
X-Engine: browser (or direct, cf-browser-rendering)
X-Return-Format: markdown (or html, text, screenshot, pageshot)
X-With-Links-Summary: true
X-With-Images-Summary: true
X-With-Generated-Alt: true
X-No-Cache: true
X-Respond-With: readerlm-v2
```

**Request**:
```json
{
  "url": "https://example.com/article",
  "viewport": {"width": 1920, "height": 1080},
  "injectPageScript": "document.querySelector('.ads').remove();"
}
```

**Python Example**:
```python
def read_url(url, format="markdown", engine="browser", with_links=True, with_images=True):
    url_endpoint = "https://r.jina.ai/"
    headers = {
        "Authorization": f"Bearer {JINA_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Engine": engine,
        "X-Return-Format": format,
        "X-With-Links-Summary": "true" if with_links else "false",
        "X-With-Images-Summary": "true" if with_images else "false",
        "X-With-Generated-Alt": "true",
        "X-No-Cache": "true",
        "X-Respond-With": "readerlm-v2"
    }
    payload = {"url": url}
    
    response = requests.post(url_endpoint, headers=headers, json=payload)
    response.raise_for_status()
    data = response.json()
    
    return {
        "content": data["data"]["content"],
        "links": data["data"].get("links", []),
        "images": data["data"].get("images", []),
        "title": data["data"].get("title", ""),
        "url": data["data"].get("url", url)
    }

# Usage
page = read_url("https://jina.ai/news")
print(page["content"][:2000])
```

### 5. Search API

**Endpoint**: `POST https://s.jina.ai/` (or `https://eu.s.jina.ai/` for EU)

**Headers**:
```
Authorization: Bearer $JINA_API_KEY
Content-Type: application/json
Accept: application/json
X-Site: example.com (optional, for site-specific search)
X-With-Links-Summary: true
X-With-Images-Summary: true
X-Retain-Images: none (or omit to keep)
X-No-Cache: true
X-Respond-With: no-content (optional, exclude page content)
X-Return-Format: markdown
```

**Request**:
```json
{
  "q": "Jina AI embeddings tutorial",
  "gl": "us",
  "hl": "en",
  "location": "New York",
  "num": 10,
  "page": 1
}
```

**Python Example**:
```python
def search_web(query, num_results=10, site=None, location="New York"):
    url = "https://s.jina.ai/"
    headers = {
        "Authorization": f"Bearer {JINA_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-With-Links-Summary": "true",
        "X-With-Images-Summary": "true",
        "X-No-Cache": "true",
        "X-Return-Format": "markdown"
    }
    if site:
        headers["X-Site"] = site
    
    payload = {
        "q": query,
        "num": num_results,
        "location": location,
        "gl": "us",
        "hl": "en"
    }
    
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()

# Usage
results = search_web("latest Jina AI embedding models 2026", num_results=5)
for r in results["data"]:
    print(f"{r['title']}\n{r['url']}\n{r['description'][:200]}...\n")
```

## Complete RAG Pipeline Example

```python
import os
import requests
import json

JINA_API_KEY = os.getenv("JINA_API_KEY")

def rag_pipeline(question, top_k=5):
    # 1. Search web for relevant pages
    search_results = search_web(question, num_results=top_k * 2)
    
    # 2. Extract full content from top URLs
    urls = [r["url"] for r in search_results["data"][:top_k]]
    documents = []
    for url in urls:
        try:
            page = read_url(url, format="markdown")
            documents.append({"url": url, "content": page["content"], "title": page["title"]})
        except Exception as e:
            print(f"Failed to read {url}: {e}")
    
    # 3. Rerank documents by relevance to question
    doc_texts = [d["content"][:8000] for d in documents]  # Truncate for reranker
    reranked = rerank(question, doc_texts, model="jina-reranker-v3", top_n=3)
    
    # 4. Build context for LLM
    context = "\n\n---\n\n".join([
        f"Source: {documents[r['index']]['url']}\nTitle: {documents[r['index']]['title']}\n{r['document']['text']}"
        for r in reranked
    ])
    
    return {
        "question": question,
        "context": context,
        "sources": [documents[r['index']]['url'] for r in reranked]
    }

# Usage
result = rag_pipeline("How do Jina embeddings v5 compare to v3?")
print(result["context"])
```

## Error Handling Best Practices

```python
import time
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def create_session_with_retries():
    session = requests.Session()
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "POST", "OPTIONS"]
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session

SESSION = create_session_with_retries()

def safe_api_call(url, headers, payload, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = SESSION.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:
                wait = 2 ** attempt
                print(f"Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            elif e.response.status_code == 401:
                raise ValueError("Invalid API key. Get key at https://jina.ai/?sui=apikey")
            raise
        except requests.exceptions.RequestException as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)
    raise RuntimeError("Max retries exceeded")
```

## Rate Limits & Best Practices

| API | RPM | TPM | Notes |
|-----|-----|-----|-------|
| Embeddings / Reranker | 500 | 1M | Premium: 2K RPM / 5M TPM |
| Reader | 500 | - | Premium: 5K RPM |
| Search | 100 | - | Use pagination for more results |
| Batch Embeddings | - | - | Async, poll every 10-30s |

**Tips**:
- Use `truncate: true` to avoid context length errors
- Use `dimensions` parameter for smaller embeddings (Matryoshka)
- Use `normalized: true` for cosine similarity without extra computation
- Batch API for >1000 documents
- Cache embeddings locally to avoid re-computation
- Use EU endpoints (`eu.r.jina.ai`, `eu.s.jina.ai`) for GDPR compliance

## Limitations

Jina AI Search Foundation APIs **cannot**:
- Generate images
- Modify or edit content
- Execute code or perform calculations
- Store or cache results permanently
- Bypass authentication/authorization on target sites

## Key Rules

1. **Always** include `Accept: application/json` header
2. **Always** use `JINA_API_KEY` environment variable
3. **Always** handle errors with try/catch and retries
4. **Never** chain APIs unnecessarily — use single API when possible
5. **Never** use reranker without query-document pairs
6. **Never** use raw API responses without parsing
7. **Prefer** built-in features (late_chunking, truncate, dimensions) over custom code

## Quick Reference: Model Selection

| Use Case | Recommended Model |
|----------|-------------------|
| General semantic search | `jina-embeddings-v5-text-small` |
| Low latency / edge | `jina-embeddings-v5-text-nano` |
| Multimodal (text + images + PDFs) | `jina-embeddings-v4` |
| Cross-modal text-image search | `jina-clip-v2` |
| Code search / NL2Code | `jina-code-embeddings-1.5b` |
| Rerank search results | `jina-reranker-v3` |
| Rerank with images | `jina-reranker-m0` |
| Fast multilingual rerank | `jina-reranker-v2-base-multilingual` |
| ColBERT-style late interaction | `jina-colbert-v2` |
| Single page extraction | Reader API (`r.jina.ai`) |
| Web search | Search API (`s.jina.ai`) |
| Bulk embedding (10K+ docs) | Batch Embeddings API |

## Examples

### Example 1: Semantic Search with Reranking
```python
# Search → Rerank → Embed for storage
results = search_web("vector databases comparison 2024")
urls = [r["url"] for r in results["data"][:10]]
docs = [read_url(u)["content"] for u in urls]
reranked = rerank("vector databases comparison", docs, top_n=5)
embeddings = get_embeddings([r["document"]["text"] for r in reranked])
```

### Example 2: Batch Process 50,000 Documents
```python
batch_id = submit_batch_embeddings(large_document_list, model="jina-embeddings-v5-text-nano")
output_url = poll_batch_status(batch_id)
results = download_batch_results(output_url)
# Store in vector DB
```

### Example 3: Multimodal Search
```python
# Embed text and images together
embeddings = get_embeddings(
    input=["product description", {"image": "https://shop.com/product.jpg"}],
    model="jina-embeddings-v4"
)
# Rerank with multimodal reranker
reranked = rerank(
    query="red leather jacket",
    documents=[{"text": d["text"], "image": d["image"]} for d in candidates],
    model="jina-reranker-m0"
)
```

## Environment Setup

```bash
# Required
export JINA_API_KEY="your-api-key-here"

# Optional: Use EU endpoints for GDPR
export JINA_READER_ENDPOINT="https://eu.r.jina.ai/"
export JINA_SEARCH_ENDPOINT="https://eu.s.jina.ai/"

# Get free API key: https://jina.ai/?sui=apikey
```

## Related Skills

- `tools/using-superpowers` — Skill discovery and orchestration
- `code-plan/02_concise-planning` — Planning RAG implementations
- `github/github-actions` — CI/CD for embedding pipelines