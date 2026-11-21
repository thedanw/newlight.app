---
name: stock-photo-finder
description: Find usable free stock photos for design work, with a strong bias toward Unsplash and other trusted free stock sources. Filter by subject, orientation, mood, and licensing needs.
category: ui-ux
risk: low
source: custom
tags: [stock-photos, unsplash, pexels, pixabay, openverse, free-images, design-assets, licensing]
triggers: [find, search, stock-photo, image, photo, photography]
date_added: "2026-07-24"
---

# Stock Photo Finder

Use this skill to find free, usable stock photography for web, marketing, landing pages, and creative assets. Prefer Unsplash first for editorial and hero-image use, then cross-check with Pexels, Pixabay, and Openverse when a broader set is needed.

## What to do

1. Clarify the visual brief:
   - subject matter
   - mood / style
   - color palette
   - orientation (portrait / landscape / square)
   - whether the image must be free for commercial use

2. Search in this order:
   - Unsplash: `https://unsplash.com/s/photos/{keyword}`
   - Pexels: `https://www.pexels.com/search/{keyword}/`
   - Pixabay: `https://pixabay.com/images/search/{keyword}/`
   - Openverse: `https://openverse.org/search?q={keyword}`

3. Shortlist the best 3–5 candidates.
   - prefer clear subject focus
   - prefer high resolution and clean composition
   - avoid cluttered or low-quality results

4. For each result, report:
   - source site
   - direct image URL or page URL
   - license / usage note
   - why it fits the brief

## Output format

```markdown
# Stock Photo Finder Output

**Goal**: {brief}
**Preferred sources**: Unsplash, Pexels, Pixabay, Openverse

## Recommended images

1. {title} — {site}
   - URL: {link}
   - License: {license note}
   - Why it fits: {reason}

## Best fit

{best image recommendation}

## Notes

- Prefer Unsplash for fast, polished editorial imagery.
- Confirm licensing before publishing or downloading for commercial use.
```

## Best practices

- Be specific with the search terms.
- Search by keyword + mood, not only by generic nouns.
- If the brief is for a landing page hero image, prefer wide, clean compositions.
- Always note the source and license status.
- Prefer direct links to image pages when possible.

## Example prompt

> Find 3 free Unsplash images for a modern SaaS landing page hero, using a soft blue palette, office lifestyle mood, and wide landscape orientation.
