# Jina-Powered Deep Research Skill

Execute autonomous multi-step research tasks using Jina AI's Search and Reader tools. This skill establishes the logic for the agent to plan, search, read, and synthesize information into comprehensive, cited reports within a Reformed and Christocentric framework.

## Overview

Unlike standard search queries, Jina-Powered Deep Research uses a multi-pass discovery loop:

1.  **Macro Discovery**: Broad sweep across theological domains (TGC, Ligonier, etc.).
2.  **Detail Deep-Dive**: Targeted extraction of verbatim quotes and lexical nuances.
3.  **Synthesis**: Christ-centered integration and Grace-diagnostic analysis.

## Usage

This skill is designed to be used by the AI Agent (Antigravity) using MCP tools. 

### Core Tools
- **Jina Search**: `mcp_jina-reader_search_web`
- **Jina Reader**: `mcp_jina-reader_read_webpage`
- **NLT Fetcher**: For accurate scriptural text.

## Operational Protocol: The "Jina-Discovery" Loop

When performing "Deep Research," follow these steps:

### 1. Planning
Break the research request into 5-8 specific search queries based on the **Research Protocol Skill**.

### 2. Execution
Execute each query using `mcp_jina-reader_search_web` and analyze the markdown results.

### 3. Verification
For all critical theological claims, use `read_url_content` (prefixed with `https://r.jina.ai/`) to extract the full text and verify verbatim.

### 4. Output
Format as a complete, cited report with:
- **Christological Typology**: Where the text points to Jesus.
- **Grace-Driven Application**: Transformation vs Moralism.
- **Verbatim Citations**: Direct proof from verified sources.

## Configuration

Ensure your `JINA_API_KEY` is configured in your MCP settings or environment. Perplexity keys are no longer required for this skill.

## Safety & Privacy

- **Verification**: Always cross-reference Jina findings with the NLT Bible Fetcher for scriptural accuracy.
- **DNA Alignment**: Every report must align with the `user-DNA` (Reformed, Christocentric).
