---
# Research Source Matrix (The Gold Standard)
---

This document is the "Central Source of Truth" for how research requests are channeled.

## 1. The Source Matrix

| Source Type | Source Name | Best For | Access Method | Protocol |
| :--- | :--- | :--- | :--- | :--- |
| **Commentary** | StudyLight (Henry/Calvin/Poole) | Framework, Structure, Exegesis | Jina Reader (Direct URL) | `COM-01` |
| **Commentary** | TGC (Commentaries) | Modern theological framework | Jina Reader (Direct URL) | `COM-02` |
| **Sermon** | Skip Heitzig (YouTube) | Application, Expository Points | Browser Subagent (Transcript) | `SER-01` |
| **Sermon** | Spurgeon Gems | Illustrations, Rhetoric | Jina Reader (PDF/HTML) | `SER-02` |
| **Sermon** | Desiring God | Christian Hedonism, Pastoral theology | Jina Reader/Browser | `SER-03` |
| **Article** | Monergism | Deep Systematic/Reformed depth | Jina Search + Reader | `ART-01` |
| **Article** | TGC (Articles/Essays) | Modern worldview context | Jina Search + Reader | `ART-02` |

---

## 2. Access Protocols (Router logic)

### [COM-01] StudyLight (Direct)

- **Logic**: Used for first-pass structure.
- **Pattern**: `https://www.studylight.org/commentaries/eng/[CODE]/[BOOK]-[CHAPTER].html`
- **Codes**: `mhm` (Henry), `cal` (Calvin), `mpc` (Poole), `geb` (Gill).
- **Tool**: `read_url_content` with `https://r.jina.ai/` prefix.

### [COM-02] TGC Commentary (Direct)

- **Logic**: Use @[.agents/workflows/search-tgc.md] logic.
- **Pattern**: `https://www.thegospelcoalition.org/commentary/[book]/`
- **Tool**: `read_url_content` with `https://r.jina.ai/` prefix.

### [SER-01] Skip Heitzig (YouTube)

- **Logic**: Use @[.agents/workflows/search-skip_heitzig.md] logic.
- **Tool**: **Browser Subagent** (YouTube Transcript Scraper).
- **Target**: A message based on the relevenent book or passage

### [SER-02] Spurgeon (Gems)

- **Logic**: Search for pastoral/homiletic fire.
- **Search**: `site:spurgeongems.org "[PASSAGE]"`
- **Tool**: `read_url_content` with `https://r.jina.ai/` prefix (Wait for Jina to parse PDF/Text).

### [SER-03] Desiring God

- **Logic**: Search for Christian Hedonist perspective and deep pastoral theology.
- **Search**: `https://www.desiringgod.org/search/results?utf8=%E2%9C%93&q=[book]%20[chapter]%3A[verses]#gsc.tab=0&gsc.q=[book]%20[chapter]%3A[verses]` or `q=[topic]`
- **Tool**: Agent to follow links to the top 5 returned results and extract the full content of the article or message as well as the author.

### [ART-01] Monergism (Systematic)

- **Logic**: Deep dive for "Shadow Theologies" or heavy Reformed doctrine.
- **Search**: `site:monergism.com "[TOPIC]"`
- **Tool**: `mcp_jina-reader_search_web` -> `read_url_content`.

### [ART-02] TGC Articles (Modern Culture)

- **Logic**: Finds the "NW Sydney/Professional" bridge.
- **Search**: `site:thegospelcoalition.org "[TOPIC]" essay`
- **Tool**: `mcp_jina-reader_search_web`.

---

## 3. Selector Logic (When to use what?)

1. **Phase 1: Structure (Commentaries)**: Always start with `COM-01` and `COM-02`. Do not look for illustrations yet.
2. **Phase 2: Depth (Articles)**: Use `ART-01` once you have the framework to find theological nuances.
3. **Phase 3: Connection (Sermons)**: Use `SER-01`, `SER-02`, and `SER-03` LAST to find the "homiletical hooks" and "pastoral application."
