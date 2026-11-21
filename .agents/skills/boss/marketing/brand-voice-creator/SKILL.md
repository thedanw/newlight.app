---
name: brand-voice-creator
description: "Create a brand voice document from scratch. Defines voice attributes, tone spectrum, vocabulary rules, do/don't examples, and agent-consumable guidelines. Use when establishing a new brand voice or formalizing an implicit one."
category: marketing
risk: safe
source: local
tags: [brand-voice, brand-guidelines, voice-document, tone-of-voice, content-strategy, ai-writing, copywriting]
triggers: [create, define, establish, document, brand-voice, voice-doc]
allowed-tools: Read Write Glob Grep
---

# Brand Voice Creator

Create a comprehensive, agent-consumable brand voice document from scratch. Outputs a structured Markdown file that any AI agent can load to write on-brand copy consistently.

## When to Use

- Establishing a new brand's voice from scratch
- Formalizing an implicit or inconsistent voice into a document
- Creating agent-readable voice guidelines for consistent AI output
- Auditing an existing voice document for completeness
- Onboarding a new team or AI system to your brand voice

## When NOT to Use

- The brand already has a complete voice document (use `brand-guidelines` to *apply* it instead)
- You need to write copy *within* an existing voice (use `brand-guidelines` or `copy-editing`)
- You need SEO-specific content guidance (use `seo-content` or `social-post-writer-seo`)

---

## Workflow

### Phase 1: DISCOVER

Gather brand context before defining anything.

1. **Interview the brand** — Ask:
   - What is the product/service?
   - Who is the target audience (personas)?
   - What are the brand's core values (3-5)?
   - What existing content exists (website, docs, social, emails)?
   - What competitors exist, and how do they sound?

2. **Analyze existing content** — If sample content exists:
   - Read 5-10 representative pieces (homepage, docs, marketing emails, social posts)
   - Identify patterns: sentence length, formality, humor level, vocabulary
   - Note inconsistencies or tone shifts

3. **Define constraints** — Clarify:
   - Regulatory requirements (legal, financial, healthcare)
   - Audience literacy level (technical, general, mixed)
   - Platform constraints (Twitter character limits, email subject lines)

### Phase 2: DEFINE

Build the brand voice framework.

#### 2a. Voice Pillars (3-5 Core Attributes)

Pick 3-5 adjectives that describe the brand's personality. Each pillar gets:
- A one-sentence definition
- A spectrum (too much ↔ too little)
- An example sentence

**Example:**
| Pillar | Definition | Too Much | Just Right | Too Little |
|--------|------------|----------|------------|------------|
| Confident | We know our stuff without being arrogant | "We're the ONLY solution you need" | "We built this for teams like yours" | "We might be able to help?" |
| Human | We talk like people, not corporations | "Hey friend! 👋" | "Here's what we'd recommend" | "Pursuant to Section 4.2..." |

#### 2b. Tone Spectrum (Contextual Shifts)

Define how the voice adapts across contexts. Not every context gets the same tone.

| Context | Tone Shift | Example |
|---------|------------|---------|
| Product UI | Direct, minimal | "Save" / "Delete" |
| Error messages | Calm, helpful | "Something went wrong. Try again." |
| Marketing | Energetic, benefit-led | "Ship faster with fewer bugs." |
| Documentation | Precise, patient | "To configure X, set Y = true in config.json." |
| Social media | Conversational, witty | "Debugging at 2 AM? Same." |
| Support | Empathetic, solution-focused | "That sounds frustrating — let's fix it." |

#### 2c. Vocabulary Rules

Define word choices that reinforce the brand.

**Do Use:**
| Word/Phrase | Why |
|-------------|-----|
| "Ship" | Active, builder-focused |
| "Folks" | Warm, inclusive |
| "Build" | Empowering, creative |

**Don't Use:**
| Word/Phrase | Why |
|-------------|-----|
| "Leverage" | Corporate jargon |
| "Synergy" | Buzzword, meaningless |
| "Users" (use "people" or "teams") | Depersonalizing |
| "Please" (in UI) | Unnecessary politeness |

**Brand-Specific Terms:**
| Term | Definition | Use |
|------|------------|-----|
| *Your product name* | Official spelling, capitalization | Always |
| "Dashboard" | Not "control panel" or "admin" | UI references |

#### 2d. Grammar & Style Rules

| Rule | Guideline |
|------|-----------|
| Spelling | American English (color, not colour) |
| Headings | Title Case |
| Body text | Sentence case |
| Oxford comma | Yes / No / Depends |
| Contractions | Yes ("don't" not "do not") / No (formal) |
| Exclamation marks | Never / Rarely / OK in marketing |
| ALL CAPS | Only for acronyms |
| Numbers | Spell out 1-9, numerals for 10+ |

#### 2e. Do/Don't Examples

Provide concrete before/after transformations.

| ❌ Don't | ✅ Do | Why |
|---------|-------|-----|
| "Click here to submit your application" | "Submit" | Direct action, no filler |
| "We are pleased to announce" | "New: [Feature]" | Skip the ceremony |
| "An error occurred while processing" | "Something went wrong" | Plain language |
| "Leverage our best-in-class solution" | "Use [Product] to..." | No jargon |

### Phase 3: VALIDATE

Test the voice document against real scenarios.

1. **Sample rewrite** — Take 3-5 existing pieces of copy and rewrite using the new voice doc
2. **Consistency check** — Ensure all examples align with the defined pillars
3. **Edge case review** — Check:
   - Error states
   - Empty states
   - Onboarding flows
   - Legal/privacy text
   - Support responses

### Phase 4: EXPORT

Output the final voice document.

**File:** `BRAND_VOICE.md`

```markdown
---
name: [Brand Name]
version: 1.0
created: [Date]
last_updated: [Date]
agents_compatible: true
---

# [Brand Name] Voice Guidelines

## Voice Pillars
[Table from Phase 2a]

## Tone Spectrum
[Table from Phase 2b]

## Vocabulary
### Do Use
[Table from Phase 2c]

### Don't Use
[Table from Phase 2c]

### Brand Terms
[Table from Phase 2c]

## Grammar & Style
[Table from Phase 2d]

## Do/Don't Examples
[Table from Phase 2e]

## Channel-Specific Notes
[Any additional context for specific platforms]

## Quick Reference Card
[One-page summary for agents]
```

---

## Key Rules

1. **Be specific** — Vague guidelines are useless. "Be friendly" means nothing; "Use contractions and first-person plural ('we')" means everything.
2. **Show, don't tell** — Every rule needs an example. Rules without examples are ignored.
3. **Define the spectrum** — "Be confident" is incomplete without "but not arrogant." Define the boundaries.
4. **Keep it agent-readable** — Agents need structured tables and explicit rules, not prose essays.
5. **Version it** — Brand voices evolve. Include version numbers and dates.

---

## Output Quality Checklist

- [ ] 3-5 voice pillars defined with spectra
- [ ] Tone spectrum covers 5+ contexts
- [ ] Vocabulary lists (do/don't) have 5+ entries each
- [ ] Grammar rules are explicit (not "use good judgment")
- [ ] 5+ before/after example pairs
- [ ] All examples are consistent with defined pillars
- [ ] Document is structured for agent consumption (tables, not prose)
- [ ] Quick reference card included
