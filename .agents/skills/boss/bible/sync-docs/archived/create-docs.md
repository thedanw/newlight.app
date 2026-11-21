---
description: Central document generation and sync workflow (HTML, RTF, PDF, DOCX, Google Docs)
---

# createDocs Workflow

This workflow handles the transformation of Markdown content into various professional formats using brand guidelines and syncing with Google Docs.

## 1. Parameters
- **Source**: Target `.md` file.
- **Formats**: Any combination of `html`, `rtf`, `pdf`, `docx`, `gdoc`.
- **Context**: (Optional) Specify if it's a "Bible Study" or "Sermon" to apply specific layout logic.

## 2. Brand Identity (from SKILL.md)
- **Fonts**: **Inter Tight** (Bold, Capitalize, LH 1.2) for Headings; **Inter** for Body.
- **Colors**: Primary Orange `#FF7300`, Midnight `#313638`, Secondary Green `#60695C`.
- **Style**: Square corners (`0px` radius), double-line accents.

## 3. Step-by-Step Instructions

### Step 1: Analyze & Prepare
1.  **Verify Source**: Ensure the Markdown file exists and follows naming conventions.
2.  **Determine Output Directory**: Defaults to the folder of the source file unless specified.

### Step 2: Format-Specific Processing

#### **Option: Google Docs (`gdoc`, `pdf`, `docx`)**
1.  **Sync to GDoc**: Set `$SkillRoot = Resolve-Path '.agents\skills\boss\bible\sync-docs'`, then run `& py "$SkillRoot\scripts\md_to_gdoc.py" "[Source Path]"`.
2.  **Export (if PDF/DOCX)**: Use the Google Drive API to export the newly synced Doc into the requested format.
3.  **Authenticate securely**: On first use, populate the skill-root `.env` with `GOOGLE_OAUTH_CLIENT_CONFIG_PATH` or both OAuth client fields. The OAuth token is stored outside the workspace.

#### **Option: HTML (`html`)**
1.  **Generate HTML**: Create a standalone HTML file with embedded CSS.
2.  **Apply Layout**: Use a centered "Page" container (max-width 210mm) for screen and clean white background for print.
3.  **Responsiveness**: Ensure typography scales correctly for mobile (< 850px).

#### **Option: RTF (`rtf`)**
1.  **Convert to RTF**: Set `$SkillRoot = Resolve-Path '.agents\skills\boss\bible\sync-docs'`, then run `& py "$SkillRoot\scripts\create_docs.py" "[Source Path]" --rtf`.
2.  **Styling**: Apply brand fonts and colors using RTF control words.

### Step 3: Bible Study Specific Logic (if applicable)
If the project is a Bible Study (e.g., from `biblestudy-03-export.md`):
1.  **Table of Contents**: Generate a hyperlinked TOC.
2.  **Header Table**: Use the brand header table (Orange number box + Title/Summary).
3.  **Continuous Numbering**: Ensure questions are numbered sequentially across the document.

## 4. Completion
- Provide links to GDocs.
- List paths to generated local files.
- If authentication fails, direct the user to the skill-root `.env`; never ask for or print OAuth secrets.
