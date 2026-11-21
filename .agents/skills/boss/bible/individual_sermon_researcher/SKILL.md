---
name: Biblical & Theological Research Protocol
category: bible
description: The master instruction set for all biblical and theological research, defining the Research Source Router and the Gold Standard discovery loop.
---

# New Light Research Protocol & Source Router

This skill is the central authority for how research is conducted. It acts as a **Router** to channel requests to the best-in-class sources defined in @[.knowledge/ResearchSources.md].

## 1. The Research Source Matrix
Every research request must be categorized before execution to ensure the "Gold Standard" routing:

| Category | Priority Sources | Goal | Protocol |
| :--- | :--- | :--- | :--- |
| **Phase A: Framework** | StudyLight (Henry/Calvin), TGC Commentary | Structure, Context, Themes | [COM-01], [COM-02] |
| **Phase B: Theological Nuance** | Monergism, TGC Articles | Systematic Depth, Doctrine | [ART-01], [ART-02] |
| **Phase C: Homiletical Hook** | Skip Heitzig, Spurgeon, Piper | Application, Illustrations, Rhetoric | [SER-01], [SER-02] |

---

## 2. Decision Logic (The Router)

Before performing any search, you MUST follow this decision tree:

### Step 1: Check the "Phase"
- **Is this a first-pass?** (e.g. series-02 or talk-01 start).
    - **Action**: Prioritize **StudyLight Direct** and **TGC Direct** links. Construct URLs using the patterns in @[.knowledge/ResearchSources.md].
- **Is this an application/illustration pass?** (e.g. talk-04 or biblestudy-02).
    - **Action**: Use **Sermon/Expository Protocol**. Prioritize Skip Heitzig (Transcript) and Spurgeon.

### Step 2: Access & Extraction
- **Direct Access**: Construction URL construction -> `read_url_content` with `r.jina.ai/`.
- **Fail-Fast Scraping**: Always inspect the first 500 characters of a scrape. If it contains "bot detection," "access denied," or "paywall" messages, **STOP and WARN** the user.
- **Discovery**: Use `site:[domain]` searches for Monergism/TGC.

---

## 3. Anti-Hallucination & Verification
1.  **Jina Mandatory**: Every URL read must use `https://r.jina.ai/`.
2.  **Verbatim Extraction**: Only-extract full content. Do not generate summaries or inferred points during the extraction phase.
3.  **Citation Integrity**: Every point must carry a `[CITE]` and a verbatim snippet from the source.

---

## 4. Quality Audit Gates
1.  **Full-Text Audit**: Verify that extracted content is the actual resource, not a metadata page or search result snippet.
2.  **Deduplication Audit**: During synthesis, merge identical scholarly observations while preserving unique pastoral nuances.
3.  **Theological Pivot**: Every roadmap must identify the **Christological Pivot** (how the text points to Jesus) to avoid moralism.

## 5. Integration with Workflows
- @[/talk-01-research]: Sets the 4-phase loop (01-02-03).
- @[/series-02-research]: Drives the multi-pass system.
- @[/biblestudy-02-each_study]: Uses "Pivot" detection.
