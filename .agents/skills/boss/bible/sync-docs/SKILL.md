---
name: Sync & Document Generation
category: bible
description: Sync markdown to Google Docs and generate high-fidelity RTF, HTML, and PDF documents with New Light Branding.
---

# Sync & Document Skill

A centralized suite of scripts for syncing sermon notes to Google Docs and generating print-ready materials (RTF, HTML, PDF, DOCX) with church-specific styling.

## Agent Execution Contract

This skill is installed at:

` .agents/skills/boss/bible/sync-docs `

Agents must use that canonical workspace-relative installation path. The legacy path `.agents/skills/sync-docs` is invalid and must not be used.

Shell commands are resolved from the caller's current working directory, not from `SKILL.md`. Therefore, `../` is not a reliable way to invoke these scripts when an agent runs from the workspace root. For PowerShell, establish the skill root once and invoke scripts from it:

```powershell
$SkillRoot = Resolve-Path '.agents\skills\boss\bible\sync-docs'
& py "$SkillRoot\scripts\md_to_gdoc.py" "[PathToMD]" --id [OptionalGDocID] --export [pdf,docx,rtf]
```

Within Markdown links in this file, normal relative links are resolved from `SKILL.md` itself. For example, `../brand/SKILL.md` correctly targets the sibling `bible/brand` skill. Python resource loading is handled inside each script from `__file__`, so scripts remain independent of the caller's working directory.

## 1. Google Doc Sync (`md_to_gdoc.py`)
Primary tool for uploading local Markdown sermon outlines to Google Docs while maintaining formatting.

**Usage:**
```powershell
$SkillRoot = Resolve-Path '.agents\skills\boss\bible\sync-docs'
& py "$SkillRoot\scripts\md_to_gdoc.py" "[PathToMD]" --id [OptionalGDocID] --export [pdf,docx,rtf]
```
*   **Sync**: Updates the Google Doc linked to the file or creates a new one.
*   **Export**: If `--export` is provided, it saves local copies of those formats in the same directory.

## 2. Multi-Format Generation (`create_docs.py`)
Centralized local generator for RTF and HTML formats.

**Usage:**
```powershell
$SkillRoot = Resolve-Path '.agents\skills\boss\bible\sync-docs'
& py "$SkillRoot\scripts\create_docs.py" "[PathToMD]" --html --rtf
```
*   Use this for direct markdown-to-formatted-file conversion without involving Google Docs.

## 3. Bible Study RTF Generator (`md_to_rtf_studies.py`)
Specialized high-fidelity RTF generator for Bible Study booklets. Uses New Light brand colors (Orange #FF7300) and specific layouts.

**Usage:**
```powershell
$SkillRoot = Resolve-Path '.agents\skills\boss\bible\sync-docs'
& py "$SkillRoot\scripts\md_to_rtf_studies.py" "[PathToMD]" "[OptionalOutputPath]"
```
*   **Format**: Expects studies separated by `---`.
*   **Styling**: Automatically applies the New Light "Header Table" design for each study.

## Security and Support Files

Google credentials and OAuth state must never live under the workspace or this skill directory.

*   `.env.example`: committed, non-secret configuration template at the skill root.
*   `.env`: local configuration created automatically at the skill root on the first Google operation when absent. It is excluded by this skill's `.gitignore` and must never be committed.
*   `.gitignore`: excludes `.env`, legacy credential files, OAuth tokens, Python caches, and generated utility output.
*   `scripts/google_auth.py`: shared authentication and environment-file loader used by every Google-connected script.
*   Google OAuth client JSON: preferably stored outside the workspace, with its path recorded in `.env`.
*   OAuth `token.json`: stored outside the workspace in the current user's application-data directory by default.

The legacy files `scripts/credentials.json` and `scripts/token.json` are forbidden. If either exists, move it outside the workspace before running a Google operation.

## Detailed Capabilities

### `md_to_gdoc.py` Capabilities

**Path-Based Folder Organization:**
- Automatically parses `Sermons_n_Series/{Year}/{Series}/` from the local file path
- Creates corresponding folder hierarchy in Google Drive under the root folder

**Document Creation:**
- Root folder ID in Google Drive: `1dGRJkjh5hVGvhYc5cZ7k99BeCNA262yy`
- Uses a shared Google Docs template (`1o3tbW_5jlMNsFKaZhht9xfT8rx6mYUdpqYfTJ3o8Zn8`) as the base for new documents
- Copies the template, names it after the markdown file, and places it in the correct Drive folder

**Inline Markdown Style Parsing:**
- `**bold**` → Bold text style
- `_underline_` → Underline text style
- `*italic*` → Italic text style
- `[link text](url)` → Hyperlinked text

**Table Support:**
- Creates native Google Docs tables from markdown pipe-delimited tables
- First row automatically receives bold styling (header row)
- Table callout rendering: 1x2 tables with a left border, used for code blocks and backtick-wrapped inline text

**Horizontal Rules:**
- Standalone `---`, `***`, and `___` lines are exported as native page breaks
- Google Docs uses `pageBreakBefore`; the separator itself is not rendered
- Pipe-table separator rows are not page breaks

**List Support:**
- Bullet lists with indentation levels (▪ for top level, - for nested)
- Numbered lists with tab indentation

**Export Formats:**
- Supported: `pdf`, `docx`, `rtf`, `txt`, `odt`

**Authentication and Environment Bootstrap:**
1. Every Google-connected script loads `scripts/google_auth.py`.
2. The loader looks for `.env` at the installed skill root. If it is missing, it copies `.env.example` to `.env`, applies user-only permissions where the operating system supports them, prints the created path, and stops before making a Google request.
3. Populate the newly created `.env` before rerunning:
   - Preferred: set `GOOGLE_OAUTH_CLIENT_CONFIG_PATH` to the full path of Google's downloaded OAuth client JSON stored outside the workspace.
   - Alternative: set both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from that JSON. Set `GOOGLE_OAUTH_REDIRECT_URIS` only when it differs from `http://localhost`.
4. Optional settings are `GOOGLE_OAUTH_TOKEN_PATH` and `SERMON_PLANNING_DATA_DIR`. If no token override is set, the token is stored at `%LOCALAPPDATA%\SermonPlanning\sync-docs\token.json` on Windows, or the platform's user data directory elsewhere.
5. On first authorization, the script opens a local browser flow. The resulting refresh token is written only to the configured external token path with restrictive permissions where supported.
6. Values already present in the process environment take precedence over values in `.env`.

Do not paste client secrets or tokens into prompts, issue trackers, command history, or generated documents. Prefer storing only the external client-config path in `.env`.

**Credential Incident Response:**
If `credentials.json` or `token.json` was ever pushed to GitHub, moving or deleting the file is not sufficient. Revoke the OAuth token in the Google account, regenerate the OAuth client secret, remove the secret from repository history, and verify all reachable commits and branches no longer contain it.

**Heading Support (Google Docs styles):**
Only `HEADING_1`, `HEADING_2`, `HEADING_3` heading levels are supported

### `create_docs.py` Capabilities

**HTML Generation:**
- Uses `bible_study_template.html` located in the scripts directory as the HTML template
- Template variables available for replacement:
  - `{{title}}` - Series title
  - `{{series_title}}` - Series title (repeated)
  - `{{intro_text}}` - Introductory text before the studies
  - `{{year}}` - Year detected from file path
  - `{{toc_rows}}` - Table of Contents rows generated from parsed studies
  - `{{reference_table}}` - Standalone pre-study reference page and its page break
  - `{{study_pages}}` - Individual study page HTML blocks

**Study Header Format Support:**
- **2x2 Table (Esther style)**: `| # **Num** | # **Title** |` row followed by `| **Main Idea**: ... | **Passages**: ... |` row
- **1x2 Table (Mark style)**: Single row with number + title/subtitle, plus separate **Main Idea** and **Passages** lines parsed from the content

**Metadata Detection:**
- Automatically detects year from file path using regex (`20\d{2}`)
- Generates a Table of Contents from parsed studies with links to study anchors
- Treats standalone thematic breaks as page boundaries
- Places any pre-study reference section on a separate page after the TOC

**PDF Generation:**
- Uses headless Chrome or Edge browser (checks standard Windows install paths)
- `--pdf` flag generates PDF from the HTML output automatically
- Requires HTML generation first (or `--pdf` implies `--html`)

**Brand Colors Baked In:**
- `PRIMARY_ORANGE: #FF7300`
- `MIDNIGHT: #313638`
- `SECONDARY_GREEN: #60695C`
- `OFF_WHITE: #F8F9FA`
- Fonts: Inter Tight (headings), Inter (body)

**RTF Generation (built-in):**
- Simple RTF generation with font table (Inter, Inter Tight) and color table (Orange, Midnight)
- Heading levels: `#` → large orange Inter Tight, `##` → medium orange Inter Tight
- Numbered list support with hanging indent
- Unicode escape handling for extended characters
- A4 page size with 1-inch margins

### `md_to_rtf_studies.py` Capabilities

**RTF Color Table:**
- Color 0: Black (Auto)
- Color 1: Brand Orange `#FF7300`
- Color 2: White `#FFFFFF`
- Color 3: Brand Grey `#313638`
- Color 4: Light Grey Accent `#F4F3EF` (warm off-white)

**Fonts Used:**
- Inter (body text, regular)
- Inter Tight (headings, bold)
- Segoe UI Symbol (bullet characters)

**Header Table Design:**
- Cell 1: Orange background (`\clcbpat1`) with white bold text for study number, 36pt (fs72), centered
- Cell 2: White background with orange title, grey summary paragraph, and italic grey passage reference

**Content Block Types:**
- `h2` — Heading 2, Inter Tight Bold, Brand Grey, ~24px
- `numbered_list` — Hanging indent with left indent 720 twips
- `bullet_list` — Bullet character prefix with hanging indent
- `meta` — Italic grey text for metadata lines (Main Idea, Passages)
- `para` — Standard paragraph, Inter Regular, 24pt, Brand Grey

**Layout:**
- Standalone thematic breaks generate RTF page breaks before each study
- Pipe-table separator rows remain table formatting rather than page breaks
- Paper: A4 (11906x16838 twips) with 1-inch margins (1440 twips)
- Unicode escape handling for characters outside ASCII range (signed 16-bit `\uN?` format)

## Brand Integration

The scripts reference brand assets defined in the [brand skill](../brand/SKILL.md):

**Color Reference (from brand skill):**
- Full brand color specifications available in RGB, CMYK, and Pantone values
- Primary Orange `#FF7300` (Pantone 151 C) for primary actions, headings, links
- Midnight `#313638` (Pantone 447 C) for body text, dark UI elements
- Secondary Green `#60695C` for info, secondary actions

**Typography (from brand skill):**
- Inter Tight Bold for all major headings (weight 700, capitalize)
- Inter Regular for body text (weight 400, sentence case)
- Mobile-first responsive font size scale

**Design Patterns (from brand skill):**
- Square corners (0px border-radius) as default
- Occasional single rounded corner accent (8px-12px) for featured elements
- Double-line accent style for decorative dividers

## Ecosystem Integration

Sync-docs is part of the Antigravity skill ecosystem managed by the [boss skill](../../SKILL.md).
- Successful sync workflows should be recorded via `memory_write` with type `skill_combination` for future reuse
- Task complexity guardrails apply: simple single-file updates do not need orchestration

**Input Sources:**
- The input markdown files for sync-docs are produced by the [`individual_sermon_brainstormer` workflow](../individual_sermon_brainstormer/SKILL.md)
- Brainstormer output is written to `[Talk Path]/[BibleRef].md`
- These markdown files contain sermon outlines with rhetorical devices from the [rhetoric skill](../rhetoric/SKILL.md)

## Utility Scripts

The `scripts/` directory includes additional helper utilities:

- `list_files.py`: Lists the 5 most recent files in the connected Google Drive (uses the shared secure authentication loader)
- `get_links.py`: Retrieves file names and `webViewLink` URLs from Google Drive and writes `scripts/links.txt` (uses the shared secure authentication loader)
- `links.txt`: Generated output; never commit it
- `output.txt`: Generated log output; never commit it

## Dependencies

**Python Libraries (required):**
- `google-auth` — Google authentication library
- `google-auth-oauthlib` — OAuth flow support
- `google-auth-httplib2` — HTTP transport for Google auth
- `google-api-python-client` — Google APIs client library
- `markdown` — Python Markdown to HTML conversion

No `python-dotenv` dependency is required; `google_auth.py` reads the small supported `.env` subset directly.

**For PDF Generation:**
- Google Chrome or Microsoft Edge browser installed on Windows (headless mode)
