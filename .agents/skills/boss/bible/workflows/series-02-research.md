---
description: Perform exhaustive, 9-pass research on a biblical book using Reformed interpretive methods, deep lexical study, and homiletic bridging. Optimized for multi-pass Deep Research integration.
---

# Robust Deep Research Logic

This workflow implements an exhaustive, multi-dimensional research process, starting with internal knowledge audit and utilizing the `deep-research` skill for every stage.

## Global Citation Policy

All claims, teaching points, and illustrations MUST be cited using `[CITE](url.com)`.

- **Anti-Hallucination 2.0**: Every URL must be verified via **Jina Reader** (`https://r.jina.ai/[URL]`) using `read_url_content`.
- **Verbatim Quotes**: Every research point must include an **exact verbatim quote** from the Jina-cleaned source test to ensure accuracy.
- **Protocol Reference**: Adhere to the master guidelines and **Source Router** in the **Research Protocol Skill** (@[.agents/skills/individual_sermon_researcher/SKILL.md]).
- **Decision Logic**: Use the **Source Matrix** in @[.knowledge/ResearchSources.md] to choose tools for each pass.

## Prerequisites

- **Series Path**: e.g., `Sermons_n_Series/2026/GospelOfMark`
- **Book/Topic**: The biblical book or specific topic (e.g., "Ephesians")
- **Research Path**: `[SeriesPath]/00_Research/`
- **Skill Usage**: Every pass below MUST utilize the `deep-research` skill (@[.agents/skills/deep-research/SKILL.md]). Use `python3 scripts/research.py` with specific queries for each pass. If Quota Exceeded (Exit Code 2), fallback to `search_web` and `read_url_content`.

---

## Orientation: Knowledge Orientation & Audit

**Goal**: Orient the research using existing internal knowledge to avoid redundancy.

1. **KnowledgeBase Audit**:
    - Review `.knowledge/user-DNA/` to align with the Grace Dynamic and Reformed distinctives.
    - Check `.knowledge/ResearchSources.md` for pre-approved scholar lists.
2. **KI Review**:
    - **CRITICAL**: Search for and read existing Knowledge Items (KIs) related to the topic/book BEFORE researching.
    - Don't reinvent the wheel; build upon existing synthesis found in `.knowledge`.
3. **Output**: Update `task.md` with an initial strategy based on what is ALREADY known.

## Pass 1: Strategy & Source Discovery (`sources.md`)

**Goal**: Identify key Reformed authors, scholars, and curated sources.

1. **Deep Research**: `python3 scripts/research.py --query "Best Reformed and Covenantal commentators for [Book/Topic] including TGC and classic sources"`.
2. **TGC Deep-Dive**: Targeted search for TGC courses/articles: `site:https://www.thegospelcoalition.org/ "[Book/Topic]" commentary`.
3. **Output**: Save curated authors and source links in `01-sources.md`.

## Pass 2: Historical, Cultural & Literary Context (`Context.md`)

**Goal**: Deep dive into the "world" of the text.

1. **Deep Research**: `python3 scripts/research.py --query "Historical, cultural, and literary context of [Book/Topic] from a Grammatical-Historical perspective"`.
2. **Output**: Save context research and genre analysis in `02-context.md`.

## Pass 3: Intertextuality & Biblical-Theological Mapping (`intertextuality.md`)

**Goal**: Trace the "Covenantal Thread" through the whole Bible.

1. **Deep Research**: `python3 scripts/research.py --query "Intertextuality and Biblical-Theological mapping of [Book/Topic] - quotes, allusions, and covenantal fulfillment"`.
2. **Output**: Map the book's intertextual dependencies in `03-intertextuality.md`.

## Pass 4: Structural Analysis & Scholarly Outlines (`Structure.md`)

**Goal**: Acquire at least 4 distinct scholarly frameworks.

1. **Deep Research**: `python3 scripts/research.py --query "Comparison of at least 4 scholarly structural outlines for [Book/Topic] with deep markers"`.
2. **Constraint**: Each outline MUST have a total of at least **5 points/subpoints**.
3. **Output**: Save all outlines in `04-structure.md`.

## Pass 5: Themes and Key Words (`themes.md`)

**Goal**: Synthesize theological motifs with deep linguistic study.

1. **Deep Research**: `python3 scripts/research.py --query "Linguistic study of 5-8 anchor words in [Book/Topic] and their theological significance"`.
2. **Thematic Multi-Pass**: `python3 scripts/research.py --query "Theological themes in [Book/Topic] under a Reformed, Christ-centered, Grace-dynamic lens"`.
3. **Output**: Store linguistic data and deep-dive themes in `05-themes.md`.

## Pass 6: Redemptive Application & Homiletical Bridge (`application.md`)

**Goal**: Research historical application logic.

1. **Deep Research**: `python3 scripts/research.py --query "How have Reformed preachers (Spurgeon, Piper, Lloyd-Jones) applied [Book/Topic] to the heart and world?"`.
2. **Output**: Save application strategies and illustrations in `06-application.md`.

## Pass 7: Opposition, Controversy & Alternate Views (`alternateviews.md`)

**Goal**: Address apologetic objections and identify "shadow" theologies.

1. **Deep Research**: `python3 scripts/research.py --query "Common objections and alternate theological views (Arminian, Dispensational) on [Book/Topic]"`.
2. **Output**: Save objections and comparative views in `07-alternateviews.md`.

## Pass 8: Worldview Bridge & Idol Deconstruction (`worldview.md`)

**Goal**: Connect the text to the modern world (2026).

1. **Deep Research**: `python3 scripts/research.py --query "Contemporary idols and modern cultural parallels to the themes in [Book/Topic]"`.
2. **Output**: Save worldview analysis and modern bridges in `08-worldview.md`.

## Summary: Final Research Summary (`SeriesResearchSummary.md`)

**Goal**: Create a comprehensive, cited executive synthesis of all reasearch passes.

1. **Verification Pass**: Re-search and verify every URL cited in the collection using **Jina Reader** prefixing to ensure deep-linking and reliability.
2. **Consolidation**: Create a robust `SeriesResearchSummary.md` in the research folder.
3. **Mandatory Structure**:
    - **Pass Headings**: Every Pass (0-8) must have its own `##` heading including **[filename.md]** for the artifact generated
    - **Pass Executive Summaries**: Provide a comprehensive bullet list (<90chars per point) of every key finding from the assosiated document. Include citation abbrevations of every source synthesised to make the point. eg. [CITE] [CITE] [CITE]
