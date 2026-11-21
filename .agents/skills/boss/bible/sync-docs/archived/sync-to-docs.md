---
description: Sync a Markdown sermon outline to Google Docs using the central createDocs system
---

# Sync to Docs (createDocs Shortcut)

This workflow is a simplified wrapper for the central `createDocs` system, focused on Google Docs synchronization.

1.  **Identify Target**: Locate the `.md` file to sync.
2.  **Execute Sync**:
    - Set `$SkillRoot = Resolve-Path '.agents\skills\boss\bible\sync-docs'`.
    - Run `& py "$SkillRoot\scripts\md_to_gdoc.py" "[Target Path]" --export pdf,docx`.
    - On first use, populate the skill-root `.env` with `GOOGLE_OAUTH_CLIENT_CONFIG_PATH` or both OAuth client fields. The OAuth token is stored outside the workspace.
3.  **Result**: Provide the Google Doc link and confirm that PDF and DOCX exports have been saved to the local folder.
