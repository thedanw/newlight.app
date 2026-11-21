---
name: Bible NLT Fetcher
category: bible
description: Fetch the exact wording of the New Living Translation (NLT) for any Bible passage.
---

# Bible NLT Fetcher Skill

## Goal

To retrieve accurate, formatted Scripture from the New Living Translation (NLT) and save it as Markdown for sermon planning and research.

## Capabilities

- **Fetch Passage**: Retrieves any Bible reference (verse, chapter, or range) from the NLT API.
- **Clean Formatting**: Converts API HTML into readable Markdown with verse numbers and headings.
- **Auto-Naming**: Saves the output file using the reference as the filename (e.g., `John_3_16.md`).

## Usage

To fetch a passage, run the Python script located at `d:\daniel\Documents\SermonPlanning\.agent\skills\bible-nlt\scripts\bible_nlt_fetcher.py`.

### Command

```bash
python "d:\daniel\Documents\SermonPlanning\.agent\skills\bible-nlt\scripts\bible_nlt_fetcher.py" "Reference"
```

### Examples

- `python bible_nlt_fetcher.py "Genesis 1:1-5"`
- `python bible_nlt_fetcher.py "John 3:16"`
- `python bible_nlt_fetcher.py "Mark 2:12-3:12"`

## Sermon Project Integration

According to the project's file structure rules, raw scripture text should be named `BibleText(NLT).md` within the specific sermon folder.

1. Fetch the passage using this skill.
2. Move and rename the generated file to the appropriate sermon directory:
   - `Sermons_n_Series/[Year]/[SeriesName]/[BibleRef]/BibleText(NLT).md`
