---
name: unsplash-integration
description: Fetch and evaluate Unsplash images for design work using direct Unsplash search URLs, source filtering, and practical licensing guidance.
category: ui-ux
risk: low
source: custom
tags: [unsplash, stock-photos, images, design, photography, licensing]
triggers: [find, search, image, photo, unsplash]
date_added: "2026-07-24"
---

# Unsplash Integration

Use this skill to find specific Unsplash imagery for landing pages, hero sections, blog headers, and product design visuals.

## Goal

Search Unsplash directly and return the best options for the user’s brief.

## Search approach

1. Convert the need into a precise keyword phrase.
   - Example: `modern office teamwork`, `minimal product mockup`, `cozy cafe interior`
2. Build a direct Unsplash query URL:
   - `https://unsplash.com/s/photos/{keyword}`
3. Review the first 3–5 relevant images.
4. Prefer images with a clean subject and good composition.

## Output format

```markdown
# Unsplash Image Results

**Brief**: {short description}

## Best matches

1. {title} — Unsplash
   - URL: {image page link}
   - Why it fits: {reason}
   - Notes: {license / attribution note}

## Recommended pick

{best candidate}
```

## Rules

- Always mention the specific Unsplash search URL pattern used.
- Prefer direct image pages or image links over generic text results.
- Keep the output concise and actionable.
- Explicitly note that license status should be checked before commercial publication.

## Example

> Find 3 Unsplash images for a modern SaaS homepage hero with a calm blue palette and wide landscape composition.
