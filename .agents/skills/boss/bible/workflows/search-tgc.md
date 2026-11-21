---
description: Search The Gospel Coalition (TGC) Commentary for a specific book or passage using Jina Reader.
---

# TGC Commentary Search (Jina-Powered)

This workflow utilizes Jina Reader to bypass Cloudflare protection and fetch clean markdown versions of the TGC Bible Commentary.

## Instructions

1.  **Identify the Target Book**:
    - Extract the book name from the request (e.g., "Esther").
    - Ensure the book name is formatted for a URL (lowercase, hyphens for spaces, e.g., "1-samuel").

2.  **Primary Retrieval (Jina Reader)**:
    - **Step 1**: Construct the TGC Commentary URL:
      `https://www.thegospelcoalition.org/commentary/[BOOK]/`
    - **Step 2**: Use **Jina Reader** via `read_url_content` with the `https://r.jina.ai/` prefix.
    - **Step 3**: Verify the content. Jina typically returns the *entire* commentary for the book at once.

3.  **Extraction & Synthesis**:
    - If the user requested a specific chapter (e.g., "Esther 2"), locate the relevant header or section in the returned Jina markdown.
    - Extract the **Teaching Points**, **Historical Context**, and **Theological Insights** for that specific passage.

4.  **Fallback (Browser Subagent)**:
    - If Jina returns a 403, 404, or fails to bypass Cloudflare (rare), launch a browser subagent to attempt manual navigation and "human verification" as per the legacy protocol.

## Output Format
- **Source**: TGC Commentary by [Author Name]
- **Structure**: Include the TGC outline for the section.
- **Content**: Provide the summarized or verbatim commentary text.
- **Citations**: All quotes must be cited using `[TGC: [AUTHOR]](url)`.
