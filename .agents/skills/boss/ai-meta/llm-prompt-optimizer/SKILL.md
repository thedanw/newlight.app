---
name: llm-prompt-optimizer
description: "Use when improving prompts for any LLM. Applies proven prompt engineering techniques to boost output quality, reduce hallucinations, and cut token usage."
category: ai-meta
risk: safe
source: adapted
tags: [prompt-engineering, optimization, llm, ai, quality, hallucination-reduction]
triggers: [optimize, improve, enhance, refine, fix, prompt, llm, quality, hallucination]
allowed-tools: Read Write Glob Grep
---

# LLM Prompt Optimizer

## Overview

This skill transforms weak, vague, or inconsistent prompts into precision-engineered instructions that reliably produce high-quality outputs from any LLM (Claude, Gemini, GPT-4, Llama, etc.). It applies systematic prompt engineering frameworks — from zero-shot to few-shot, chain-of-thought, and structured output patterns.

## When to Use This Skill

- Use when a prompt returns inconsistent, vague, or hallucinated results
- Use when you need structured/JSON output from an LLM reliably
- Use when designing system prompts for AI agents or chatbots
- Use when you want to reduce token usage without sacrificing quality
- Use when implementing chain-of-thought reasoning for complex tasks
- Use when prompts work on one model but fail on another

## Step-by-Step Guide

### 1. Diagnose the Weak Prompt

Before optimizing, identify which problem pattern applies:

| Problem | Symptom | Fix |
|---------|---------|-----|
| Too vague | Generic, unhelpful answers | Add role + context + constraints |
| No structure | Unformatted, hard-to-parse output | Specify output format explicitly |
| Hallucination | Confident wrong answers | Add "say I don't know if unsure" |
| Inconsistent | Different answers each run | Add few-shot examples |
| Too long | Verbose, padded responses | Add length constraints |

### 2. Apply the RSCIT Framework

Every optimized prompt should have:

- **R** — **Role**: Who is the AI in this interaction?
- **S** — **Situation**: What context does it need?
- **C** — **Constraints**: What are the rules and limits?
- **I** — **Instructions**: What exactly should it do?
- **T** — **Template**: What should the output look like?

**Before (weak prompt):**
```
Explain machine learning.
```

**After (optimized prompt):**
```
You are a senior ML engineer explaining concepts to a junior developer.

Context: The developer has 1 year of Python experience but no ML background.

Task: Explain supervised machine learning in simple terms.

Constraints:
- Use an analogy from everyday life
- Maximum 200 words
- No mathematical formulas
- End with one actionable next step

Format: Plain prose, no bullet points.
```

### 3. Chain-of-Thought (CoT) Pattern

For reasoning tasks, instruct the model to think step-by-step:

```
Solve this problem step by step, showing your work at each stage.
Only provide the final answer after completing all reasoning steps.

Problem: [your problem here]

Thinking process:
Step 1: [identify what's given]
Step 2: [identify what's needed]
Step 3: [apply logic or formula]
Step 4: [verify the answer]

Final Answer:
```

### 4. Few-Shot Examples Pattern

Provide 2-3 examples to establish the pattern:

```
Classify the sentiment of customer reviews as POSITIVE, NEGATIVE, or NEUTRAL.

Examples:
Review: "This product exceeded my expectations!" -> POSITIVE
Review: "It arrived broken and support was useless." -> NEGATIVE  
Review: "Product works as described, nothing special." -> NEUTRAL

Now classify:
Review: "[your review here]" ->
```

### 5. Structured JSON Output Pattern

```
Extract the following information from the text below and return it as valid JSON only.
Do not include any explanation or markdown — just the raw JSON object.

Schema:
{
  "name": string,
  "email": string | null,
  "company": string | null,
  "role": string | null
}

Text: [input text here]
```

### 6. Reduce Hallucination Pattern

```
Answer the following question based ONLY on the provided context.
If the answer is not contained in the context, respond with exactly: "I don't have enough information to answer this."
Do not make up or infer information not present in the context.

Context:
[your context here]

Question: [your question here]
```

### 7. Prompt Compression Techniques

Reduce token count without losing effectiveness:

```
# Verbose (expensive)
"Please carefully analyze the following code and provide a detailed explanation of 
what it does, how it works, and any potential issues you might find."

# Compressed (efficient, same quality)
"Analyze this code: explain what it does, how it works, and flag any issues."
```

### 8. Stock Photo Strategy Pattern

For generating a strategy to find high-quality, non-cliché hero images for each page of a website, grounded in page content, SEO strategy, brand voice, and visual brand guidelines.

```
You are a visual brand strategist and art director for {church_name}, a {denomination} church in {location}.

## Context

You are sourcing hero images for the following pages (EXCEPT the home page — keep the existing hero image):
{list_of_pages_with_descriptions}

## Brand Voice Reference

{content_of_BRAND_VOICE.md}

## Visual Brand Guidelines Reference

{content_of_BRAND_VISUAL_GUIDELINES.md}

## Page Content & SEO Strategy

For each page, here is the content, target audience, and SEO keywords:
{page_content_and_seo_keywords_per_page}

## Task

For EACH page (except home), generate a stock photo strategy that includes:

1. **Visual Concept** — Describe the ideal hero image in concrete, non-cliché terms. Avoid:
   - Empty pews or church buildings (too generic)
   - Hands raised in isolation (overused)
   - Sunsets/sunrises with crosses (cliché)
   - People looking at cameras with forced smiles (stock-photo feel)
   - Solitary figures in dramatic lighting (too commercial)

2. **Authentic Alternatives** — Prefer:
   - Candid moments of real community interaction (laughing, serving, listening)
   - Diverse ages and ethnicities interacting naturally
   - Local Far North Queensland / Tablelands scenery (bushland, cane fields, rural landscapes)
   - Warm, inviting environments with natural light
   - Action shots: people serving, children playing, hands working together
   - Details that tell a story: coffee cups, open Bibles, musical instruments, community garden

3. **Color Palette Alignment** — Map the image's dominant colors to the brand palette:
   - Primary `#006747` (deep green) — growth, life, nature
   - Secondary `#c4916c` (warm gold) — welcome, warmth
   - Accent Sage `#9cba9e` — subtle, calm backgrounds
   - Accent Gold `#fed26f` — celebration, joy
   Ensure the image's dominant tones harmonize with these colors.

4. **Search Query** — Write 3-5 specific, non-cliché search queries for the stock-photo-finder skill. Include:
   - Location context (Far North Queensland, Tablelands, Mareeba)
   - Activity/emotion (not just "church" or "worship")
   - Composition (wide shot, candid, detail, environmental portrait)
   - Lighting/mood (warm natural light, golden hour, soft diffused)

5. **Image Technical Requirements**:
   - Minimum 1920×1080px (16:9) for hero
   - WebP format preferred
   - File size under 200KB after compression
   - Licensed for commercial use (CC0, Pixabay, Unsplash, Pexels)

## Output Format

```markdown
# Hero Image Strategy — {Page Name}

**URL**: `/{page-slug}`

## Visual Concept
{2-3 sentence description of the ideal image}

## Color Harmony
- Dominant tones: {list colors}
- Brand palette match: {which brand colors these map to}

## Search Queries
1. "{specific search query 1}"
2. "{specific search query 2}"
3. "{specific search query 3}"

## Why This Works
{1-2 sentences connecting the image to the page's content, SEO keywords, brand voice pillar, and visual guidelines}

---

```

## Execution

After generating the strategy for all pages, use the stock-photo-finder skill to execute the search queries and find actual images. For each page, select the best match and provide the image URL, license type, and a brief rationale for why it fits.
```

## Best Practices

- ✅ **Do:** Always specify the output format (JSON, markdown, plain text, bullet list)
- ✅ **Do:** Use delimiters (```, ---) to separate instructions from content
- ✅ **Do:** Test prompts with edge cases (empty input, unusual data)
- ✅ **Do:** Version your system prompts in source control
- ✅ **Do:** Add "think step by step" for math, logic, or multi-step tasks
- ❌ **Don't:** Use negative-only instructions ("don't be verbose") — add positive alternatives
- ❌ **Don't:** Assume the model knows your codebase context — always include it
- ❌ **Don't:** Use the same prompt across different models without testing — they behave differently

## Prompt Audit Checklist

Before using a prompt in production:

- [ ] Does it have a clear role/persona?
- [ ] Is the output format explicitly defined?
- [ ] Are edge cases handled (empty input, ambiguous data)?
- [ ] Is the length appropriate (not too long/short)?
- [ ] Has it been tested on 5+ varied inputs?
- [ ] Is hallucination risk addressed for factual tasks?

## Troubleshooting

**Problem:** Model ignores format instructions
**Solution:** Move format instructions to the END of the prompt, after examples. Use strong language: "You MUST return only valid JSON."

**Problem:** Inconsistent results between runs
**Solution:** Lower the temperature setting (0.0-0.3 for factual tasks). Add more few-shot examples.

**Problem:** Prompt works in playground but fails in production
**Solution:** Check if system prompt is being sent correctly. Verify token limits aren't being exceeded (use a token counter).

**Problem:** Output is too long
**Solution:** Add explicit word/sentence limits: "Respond in exactly 3 bullet points, each under 20 words."

## Limitations
- Use this skill only when the task clearly matches the scope described above.
- Do not treat the output as a substitute for environment-specific validation, testing, or expert review.
- Stop and ask for clarification if required inputs, permissions, safety boundaries, or success criteria are missing.
