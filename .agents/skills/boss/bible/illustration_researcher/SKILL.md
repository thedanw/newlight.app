---
name: Illustration Researcher
category: bible
description: Research and curate engaging sermon illustrations from a verified knowledgebase.
---

# Illustration Researcher Skill

## Goal

To find compelling, relevant, and theologically safe illustrations for sermon points, applications, and biblical texts.

## Knowledgebase

### Primary Sources (Verified)

- **Illustrations.Bible**: `https://illustrations.bible/` (Free, searchable)
- **SermonCentral**: `https://www.sermoncentral.com/sermon-illustrations` (Massive database)
- **Preaching.com**: `https://www.preaching.com/sermon-illustrations/` (Topical)
- **Bible.org/Visuals**: `https://bible.org/illustrations` (Theologically robust)
- **Ministry Pass**: `https://ministrypass.com/` (Visuals and series ideas)
- **HotSermons**: `https://hotsermons.com/` (Anecdotes and quotes)

### Specialized Sources

- **WingClips**: `https://www.wingclips.com/` (Movie clips with themes)
- **History.com**: `https://www.history.com/` (Historical events for analogies)
- **Science News**: `https://www.sciencenews.org/` (Nature/Science analogies)

## Workflow

### 1. Analyze the Request

- **Identify Core Theme**: What is the ONE big idea? (e.g., "Grace vs. Works").
- **Extract Keywords**: List 3-5 synonyms or related concepts (e.g., "Rescue," "Gift," "Debt").
- **Determine Tone**: Serious, humorous, historical, or personal?

### 2. Formulate Search Queries

- **Direct**: `site:illustrations.bible [theme]`
- **Metaphor**: `metaphor for [concept] in nature`
- **Historical**: `historical event illustrating [concept]`
- **Quote**: `famous quotes about [concept]`

### 3. Execute Research

- Use `search_web` to query the Knowledgebase sites first.
- If insufficient, expand to general web search with calculated queries.
- **Criteria**:
  - **Freshness**: Avoid clichés (e.g., "footprints in the sand").
  - **Accuracy**: Verify historical/scientific facts.
  - **Relevance**: Must strongly support the specific teaching point.

### 4. Process and Output

- **Storage**: Create/Update `[Talk Path]/Research/Illustrations.md`.
- **Format**:

  ```markdown
  ## [Brief Title < 30 chars]

  > [One-sentence summary explanation]

  **Detail**: [Full story/quote/fact]

  **Cite**: [Source Name](url)
  ```

- **Insertion**: When inserting into the Sermon Outline:
  - Use `**Illustration**` heading under the relevant point.
  - Keep the description **brief** (< 90 chars).

## Maintenance

- **New Sources**: If a high-quality source is found during research, add it to the `Knowledgebase` section of this file.
