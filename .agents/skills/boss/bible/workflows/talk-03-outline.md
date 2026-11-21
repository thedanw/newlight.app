---
description: Brainstorm and output a refined sermon outline
---

1. Ask user for `Talk Path` and `Bible Reference`.
2. **Goal**: Transform main idea and research into a refined, memorable sermon outline.
3. **Role**: Reformed Homiletician.

4. **Phase 1: Initialize & Main Idea (Chat Interaction)**
   - Analyze `.knowledge/user-DNA`.
   - Read `[bibleRef].md` for Main Idea. If missing, ask user.
   - Read `[bibleRef]/Research` for content.
   - **Clarify Main Theme**: Identify 4 theological nuances of the main idea. Present them in chat and ask user to clarify/select one.

5. **Phase 2: Brainstorm Outline Options (Chat Interaction)**
   - **Review**: The synthesized content from `03-summary.md`. 
   - **Creative Tactics**: Generate 7 different outline variations using the [.agent/skills/boss/bible/rhetoric] skill 
   - **Constraints**
   - 1. Generate each outline using one or two of the tactics from the `rhetoric` skill
   - 2. For Each outline, reword the previously identified main idea to utilise the same `rhetoric` tactic as the related outline
   - 3. Each outline must drive a cohesive argument using the majority of the content from `03-summary.md`.
   - 4. Each outline argument MUST follow the order of the biblical text
   - 5. Every outline MUST use application-focused arguments for both `main idea` and `# first-level` headings. Avoid descriptive or thematic labels.
   - 6. Every `## First Level` heading must be < 30 chars
   - **Presentation**: Return the 7 options in the chat (each showing just the Top-level headings).
   - **Constraint**: Do NOT write to the file yet.
   - **Interactive Selection**: Ask user to choose one option.

6. **Phase 3: Brainstorm Outline Subpoint Options (Chat Interaction)**
   - **Review**: 
      - The synthesized content from `03-summary.md` 
      - the decision from Phase 2 or the outline the User has input in the request
      - the rhetoric tactic(s) utilised by the main outline
   - **Creative Tactics**: Generate 5 different outline variations that reflect, resonate, repeat or coincide with the rhetoric tactic in the selected outline
   - **Constraints**
   - 1. Each outline must be anchored around the one `main idea` was provided or selected by the user
   - 2. Each outline must drive a cohesive argument using the majority of the content from `03-summary.md`.
   - 3. Each outline argument must follow the order of the biblical text
   - 4. Every outline MUST use the`# first-level` headings selected or provided by the user
   - 5. Every `## second level` heading must reflect, resonate, repeat or coincide with the text in the related `# first level` heading
   - 6. Every `## Second Level` heading must be < 30 chars
   - **Presentation**: Return the 5 options in the chat (each showing just the `# first level` and `## second level` headings).
   - **Constraint**: Do NOT write to the file yet.
   - **Interactive Selection**: Ask user to choose one option.

7. **Phase 4: Final Output Construction (File Creation)**
   - **Wait for user selection**.
   - **Create File**: Updated `[Talk Path]/[BibleRef].md` with the full expanded version.
   - **Construction Logic**: Synthesize content from (`02-research.md`) to add `### third level` arguments driven from observations in the biblical text and its context. The research, teaching points, and textual nuances should shape the content. Do not halucinate or generate content from headings that isn't consistant or explicit in the research. Ensure a **comprehensive** use of all unique insights from the source material.
   - **Structural Rules**:
     - **# 1**: Top level application-focused headings from Phase 2.
     - **## A**: Second level headings from Phase 3
     - **### 1**: Third level of the outline is the detail/examples of the argument, synthesized from teaching points, text observations, and illustrations. All synthesized third-level points must be <90 chars.
     - **Comprehensive Subpoints**: Include as many subpoints at `### third level` as necessary to utilize the majority of the research material.
     - **No Singletons Rule**: Only create a `### third level` subpoints if there are **two or more** points at that level. If a heading would have only one subpoint, exclude the `### third level` subpoint and generate the content directly under the `## second level` heading. (e.g., If `## B`. has only one `### 1.`, do not add the `### 1` heading and just list the list the details under `## B.`).
     - **Biblical Clauses**
      - must be the clause of biblical text that the heading points to
      - quoted exactly from `Research/BibleText(NLT).md`
      - be preceeded by the bible reference reference (e.g., book ch:v-v)
      - displayed in a `> ` quote block.
     
   - **Format**:

   ```markdown
   # 1. [Top-Level heading from the user]

   ## A. [1st Second level heading from the user]

   ### 1. [Synthesized logical argument/teaching point <90 chars]
   > [Bible ref] "[Full quoted clause exactly from BibleText(NLT).md]"
     - **Textual Observation**: Texual Observation that reinforces the argument <90 chars
     - **Point**: teaching conclusion from text observation
     - **Illustration**: title <30char -> description <90char [Source]
     - **Application**: specific takeaway <90 chars
   
   ### 2. [Second logical argument <90 chars]
   > [Bible ref] "[Full quoted clause exactly from BibleText(NLT).md]"
     - **Textual Observation**: Texual Observation that reinforces the argument <90 chars
     - **Point**: teaching conclusion from text observation
     - **Illustration**: title <30char -> description <90char [Source]
     - **Application**: specific takeaway <90 chars
   ## B. [2nd Second level heading from the user]
   > [Bible ref] "[Full quoted clause exactly from BibleText(NLT).md]"
     - **Textual Observation**: Texual Observation that reinforces the argument <90 chars
     - **Point**: teaching conclusion from text observation
     - **Illustration**: title <30char -> description <90char [Source]
     - **Application**: specific takeaway <90 chars
   ```
- Final Quality Gate**
   - **Audit against Research**: Before concluding the workflow, explicitly cross-check the generated outline against `Research/03-summary.md` and `Research/03-research.md` to ensure no hallucination and correct citations . 
   - **Verification Requirement**: Ensure that the *majority* of the synthesized research (teaching points, textual nuances, and illustrations) from `Research/03-summary.md` has been successfully incorporated into the final output.
   - **Correction**: If significant portions of the research were omitted, revise the outline to include them naturally into the argument, or explicitly inform the user why certain portions were deliberately excluded.