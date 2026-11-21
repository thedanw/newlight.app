# Bible Fetcher (NLT) - AI Handover Guide

This standalone Python script allows an AI agent (or user) to fetch Scripture passages from the New Living Translation (NLT) API and save them as clean, easy-to-read Markdown files.

## Files
- `script/bible_nlt_fetcher.py`: The main script (no external dependencies, uses `urllib` and `html.parser`).

## Usage
Run the script from the command line, providing the Bible reference in quotes.

```bash
python bible_fetcher.py "John 3:16"
python bible_fetcher.py "Genesis 1:1-5"
python bible_fetcher.py "Mark 2:12-3:12"
```

### Features
- **Standalone**: No `pip install` required.
- **Embedded API Key**: Includes the NLT API key (valid and active).
- **Auto-Formatting**: Converts NLT API HTML into clean Markdown with verse numbers and headings.
- **Smart Naming**: Saves output as `Reference.md` (e.g., `John_3_16.md`).

### Multi-Chapter Support
The script handles references spanning multiple chapters (e.g., `Mark 2:12-3:12`) by fetching the entire range from the NLT API and converting the concatenated HTML.

## For the Receiving AI Agent
- You can use this script to inject Scripture context into your project.
- The output Markdown is designed to be easily parsed or directly rendered in other MD-compatible views.
- If you need to change formatting, look at the `NLTToMarkdownParser` class in `bible_fetcher.py`.
