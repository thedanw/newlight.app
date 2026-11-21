---
description: Perform deep-dive research on a specific biblical passage
---

# Sermon Research Workflow (Talk-01)

This workflow utilizes the **Research Protocol Skill** (@[.agents/skills/individual_sermon_researcher/SKILL.md]) to perform high-fidelity, autonomous research on a specific biblical passage.

## Phase 1: Preparation & Scripture

1. **Folder Creation**: Create a folder for the research in `/Sermons_n_Series/YYYY/[Book or Series Name]/[BiblePassage]`.
2. **Scripture Fetch**: Fetch the exact wording of the passage in NLT and save it as `01-[book_passage](nlt).md` (e.g., `01-Mark 1_1-8(nlt).md`).
3. **Context Review**: Review `.knowledge/user-DNA` and derived "Lenses" (Christocentric, Christian Hedonist, etc.).

## Phase 2: Full Content Extraction (The Scraper Loop)

**Objective**: Build a raw library of full-text sources. Do NOT summarize or hallucinate content.

1. **Autonomous Loop**: For each source type in `@/.knowledge/ResearchSources.md`, initiate a search/scrape loop:
    - **Prioritization**: Always prioritize every source code listed under **StudyLight Direct** (at least 3) and **TGC Direct**  links for book-level context before falling back to broad web searches.
    - **Search Tools**: Use `search_web` and **Jina MCP** to find specific commentaries, articles, and sermons.
    - **Reformed Depth**: Specifically search for "reformed teaching" or "reformed commentary" for the passage to ensure theological depth.
    - **Verbatim Extraction**: Only-extract the **full content** relevant to the passage.
    - **Anti-Hallucination**:
        - Do NOT hallucinate URLs.
        - Do NOT generate summaries of the content.
        - Do NOT hallucinate what you think the author said.
    - **Storage**: Save each source as `[author].md` or `[title].md` in the research folder.
2. **Quality Gate (Full-Text Audit)**:
    - **Fail-Fast Scraping**: Check for "cookie walls," "bot detection," or "paywall" signatures in the Jina output.
    - **Stop and Verify**: Ensure every source is full-text. If a source is only a summary or a snippet, **STOP and WARN** the user. Provide the URL for manual retrieval.

## Phase 3: Point Extraction (The Analysis Loop - 02-research.md)

**Objective**: Methodically analyze each full-text source from Phase 2.

1. **Category Definitions**: Use these strict boundaries to categorize research:
    - **Historical Context**: External setting (dates, kings, cultural archeology, geography).
    - **Literary Context**: Structural placement (book structure, surrounding verses, genre themes).
    - **Text Observations**: Internal mechanics (word studies, metaphors, grammar, flow of thought).
    - **Teaching Points**: Theological conclusions and truth claims derived from the text.
    - **Illustrations**: Hooks, metaphors, or stories that aid communication.
    - **Applications**: Practical "so what?" calls to action/belief.
2. **Source Loop**: For every `.md` file created in Phase 2 (excluding the Bible text):
    - Conduct a methodical analysis to extract an **exhaustive list** of points.
    - **Categorize Carefully**: Place points into the correct category based on the definitions above.
    - **Omit If Empty**: Do NOT include a category header if the source contains no relevant content for it. No placeholders or hallucinations.
    - **Constraint**: Every point must be **<90 characters**.
    - **Storage**: Append/Update all points into a single file named `02-research.md`.
3. **Quality Gate (Granularity & Distinction Audit)**:
    - **Stop and Verify**: Ensure word studies and metaphors are in **Text Observations**, NOT Literary Context.
    - **Length Audit**: If any point exceeds 90 characters, it must be rewritten for brevity.

## Phase 4: Verse-by-Verse Synthesis (The Summary)

**Objective**: Create a comprehensive, non-redundant verse-by-verse roadmap.

1. **Consolidation**: Extract points from `02-research.md` and synthesize them into `03-summary.md`.
2. **Verse-by-Verse Order**: Follow the passage verse-by-verse (or by logical verse groupings).
3. **Omission Rule**: If a specific verse grouping has no research for a category (e.g., no Historical Context found), **OMIT** that category entire from the section.
4. **Synthesis**: Combine all source insights for each verse. Synthesize duplicates into a single point while retaining all unique nuances.
5. **Grace Dynamic Integration**: Within the verse-by-verse flow, identify the **Grace Narrative Arc** (Standard -> Inability -> Christ -> Gospel).
6. **Citation**: Ensure every point includes the source citation (e.g., [Henry] or [Piper]).
7. **Quality Gate (Theological & Deduplication Audit)**:
    - **Deduplication**: Ensure `03-summary.md` does not repeat points.
    - **Christ (Resolution)**: Ensure these sections are robust. **STOP and WARN** if the roadmap lacks a clear Christological pivot.

## Output Format (03-summary.md)

**Structure**: Group all points into natural groupings of verses titled with a **Call To Application/Action (CTA)**.

```markdown
# [Bible Book/Passage Reference]

# 1. [Verse Range with CTA Title]

## **Historical Context**
[Bible refs if applicable]
- <90char [CITE]

## **Literary Context**
[Bible refs if applicable]
- <90char [CITE]

## **Text Observations**
[Bible refs]
- observation <90char [CITE]

## **Teaching Points**
[Relevant Bible ref]
- point <90char [CITE]

## **Illustrations**
- title <30char [CITE]
  -> description <90char 

## **Applications**
- <90char [CITE]

```
