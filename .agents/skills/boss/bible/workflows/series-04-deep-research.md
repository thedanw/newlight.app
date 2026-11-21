---
description: Unified robust deep research workflow using Perplexity Deep Research for every pass.
---

# Robust Deep Research Workflow (Step 02)

// turbo-all
## Goal
Execute a high-fidelity, autonomous research pass on a biblical book or topic, utilizing the **Research Protocol Skill** (@[.agents/skills/individual_sermon_researcher/SKILL.md]) and the `deep-research` skill to generate exhaustive, cited reports.

## Output Structure
All findings must be stored in:
- `00_Research/Sources.md`
- `00_Research/Context.md`
- `00_Research/Themes.md`
- `00_Research/Structure.md`
- `00_Research/Alternatives.md`
- `00_Research/Summary.md`

## Required Steps

### 0. Preparation & DNA Alignment
- Read `.knowledge/user-DNA/` to align the research perspective (Reformed, Christocentric).
- Define the `Topic` and `Series Path`.

### 1. Sources Discovery
- Execute **Jina Search** (`mcp_jina-reader_search_web`) with multiple queries to identify prominent Reformed voices.
- **Queries**: 
  - "Prominent Reformed authors and commentaries on [Topic]"
  - "site:thegospelcoalition.org [Topic] commentaries"
  - "site:ligonier.org [Topic] resources"
- Save output to `Sources.md`

### 2. Contextual Research
- Execute **Jina Search** (`mcp_jina-reader_search_web`) to gather Historical, Literary, and Cultural context.
- **Queries**: 
  - "Historical and cultural context of [Topic] Reformed perspective"
  - "Ancient Near East parallels to [Topic]"
  - "Literary genre and authorial occasion of [Topic]"
- Save output to `Context.md`.

### 3. Theological & Lexical Research
- Execute **Jina Search** (`mcp_jina-reader_search_web`) for motifs, lexical studies, and intertextuality.
- **Queries**: 
  - "[Topic] theological motifs covenantal Christocentric"
  - "Key Hebrew/Greek lexical terms in [Topic]"
  - "Intertextual links for [Topic] Redemptive-Historical mapping"
- Save output to `Themes.md`.

### 4. Structural Pass
- Execute **Jina Search** (`mcp_jina-reader_search_web`) for macro-structures.
- **Queries**: 
  - "[Topic] macro structure Reformed commentary"
  - "Outline of [Topic] Duguid Firth Jobes Gill"
- Save output to `Structure.md`.

### 5. Alternative Views
- Execute **Jina Search** (`mcp_jina-reader_search_web`) to analyze alternative perspectives.
- **Queries**: 
  - "Alternative non-Reformed views on [Topic] (Arminian, liberal, secular)"
  - "Reformed critique of [Topic] alternative interpretations"
- Save output to `Alternatives.md`.

### 6. Executive Summary Consolidation
- Use the findings from the 5 files to generate a consolidated `Summary.md`.
- Include a **Comparative Structure Table** showing all 4+ identified structures.
- **Verification**: Ensure all summaries are < 90 characters and cited using `[CITE](url)`. Every URL MUST be verified using the **Jina Reader** prefix (`https://r.jina.ai/[URL]`).