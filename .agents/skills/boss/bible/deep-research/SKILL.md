---
name: deep-research
category: bible
description: "Execute autonomous multi-step research using Jina AI (Search & Reader). This skill establishes the logic for the agent to plan, search, read, and synthesize information into comprehensive reports."
---

# Jina-Powered Deep Research Skill

Run autonomous research tasks that plan, search, read, and synthesize information into comprehensive reports using Jina AI's Search and Reader tools.

## Requirements

- **Jina Search MCP**: `mcp_jina-reader_search_web`
- **Jina Reader MCP**: `mcp_jina-reader_read_webpage`
- **Agent Intelligence**: The agent handles the synthesis and multi-step coordination previously managed by external APIs.

## Protocol: The "Jina-Discovery" Loop

When a "Deep Research" task is initiated, follow this autonomous multi-pass protocol:

1.  **Macro Discovery (Pass 1)**
    - Generate 3-5 high-level search queries.
    - Execute `mcp_jina-reader_search_web` for each.
    - Analyze the markdown results to identify key themes, sources, and gaps.

2.  **Detail Deep-Dive (Pass 2)**
    - For high-value sources identified in Pass 1, use `read_url_content` (prefixed with `https://r.jina.ai/`) to extract the full text.
    - Generate 5+ specific sub-queries to fill historical or theological gaps.

3.  **Synthesis & Christocentric Bridging**
    - Synthesize all findings according to Reformed DNA.
    - Ensure every claim is cited using `[CITE](url)` with verbatim blockquotes.

## Output Requirements

- **Citations**: All claims must be cited using `[CITE](url)` format. 
- **Verbatim**: Always include a verbatim quote for critical theological points.
- **DNA Alignment**: Ensure the "Grace Dynamic" is identified in every research report.

## Fallback

If Jina Search is unavailable, use standard browser-based research with `read_browser_page` on verified theological domains (TGC, Ligonier, etc.).
