---
description: Search Skip Heitzig's YouTube channel for a specific Bible passage and extract the verbatim transcript.
---

# Skip Heitzig YouTube Transcript Scraper

This workflow bypasses the limited search functionality of the ConnectWithSkip website by directly searching the Calvary Church YouTube channel and extracting transcripts using a browser subagent.

## Instructions

1.  **Extract the Bible Passage** from the user's request (e.g., "Esther 2").

2.  **Generate Search URL**:
    `https://www.youtube.com/@CalvaryABQ/search?query=[PASSAGE]`

3.  **Launch Browser Subagent**:
    Execute the following task for the browser subagent:
    - **Step 1**: Navigate to the generated YouTube search URL.
    - **Step 2**: Click the first relevant video result (prioritize "The Bible from 30,000 Feet" or "Verse-by-Verse" series).
    - **Step 3**: Open the **Transcript Sidebar**:
        - Locate the "Transcript" section in the description or under the "..." more menu.
        - Click **"Show transcript"**.
    - **Step 4**: **Verbatim Extraction**:
        - Execute the following JavaScript to scrape the text:
          ```javascript
          let transcript = Array.from(document.querySelectorAll('ytd-transcript-segment-renderer'))
            .map(segment => segment.innerText.replace(/\n/g, ' '))
            .join(' ');
          return transcript;
          ```
    - **Step 5**: Capture a screenshot of the video page for verification.

4.  **Synthesis & Reporting**:
    - Provide the verbatim transcript to the user.
    - **Optional**: Run a theological comparison against Reformed DNA (Christocentric focus, Grace Dynamic) to highlight areas of agreement or distinctive dispensationalist emphases.

## Quality Gate
- Ensure the transcript is complete.
- Verify that the video matches the requested passage.