---
description: Brainstorm and select the main sermon theme
---

1. Ask user for `Talk Path` and `Target Passage`.
2. **Goal**: Process synthesized research to identify the main idea—a single, central theme.
3. **Role**: Sermon communication specialist.

4. **Phase 1: Brainstorming (Chat Interaction)**
   - **Orient**: Analyze `.agents/boss/bible/.knowledge/user-DNA`.
   - **Analyze Research**: Read `Research/Outline.md` in the talk folder.
   - **Brainstorm**: Propose **5 theme ideas**.
     - Must be the sermon in a single sentence.
     - Life-application focused.
     - Consolidate teaching points.
     - **Theological Filter**: Consistent with Reformed Theology and Grace Dynamic.
   - **Presentation**: List the 5 themes (numbered 1-5) in the chat. Do not include commentary yet.
   - **Interactive Selection**:
     - Ask user: _"Which number do you want to use, or ‘More’ for 10 more ideas, or would you like something else?"_
     - If 'More', generate 10 new ideas in chat.
     - Do NOT write to any file until a selection is made.

5. **Phase 2: Final Output (File Creation)**
   - **Wait for user selection**.
   - **Create File**: `[Talk Path]/[BibleRef].md`.
   - **Content**:
     ```markdown
     ---
     # Main idea: [Selected Theme]
     ---
     ```
