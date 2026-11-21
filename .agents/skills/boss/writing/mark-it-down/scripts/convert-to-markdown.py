#!/usr/bin/env python3
"""
Convert files to Markdown using MarkItDown.

Usage:
    python convert-to-markdown.py input.pdf
    python convert-to-markdown.py input.pdf -o output.md
    python convert-to-markdown.py input.pdf --llm --model gpt-4o
    python convert-to-markdown.py "https://youtube.com/watch?v=..." --youtube
"""

import argparse
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Convert files to Markdown using MarkItDown")
    parser.add_argument("input", help="Input file path or URL")
    parser.add_argument("-o", "--output", help="Output file path (default: stdout)")
    parser.add_argument("--llm", action="store_true", help="Enable LLM for image descriptions")
    parser.add_argument("--model", default="gpt-4o", help="LLM model to use (default: gpt-4o)")
    parser.add_argument("--prompt", help="Custom prompt for LLM image descriptions")
    parser.add_argument("--plugins", action="store_true", help="Enable plugins (e.g., OCR)")
    parser.add_argument("--docintel", help="Azure Document Intelligence endpoint")
    parser.add_argument("--cu-endpoint", help="Azure Content Understanding endpoint")
    parser.add_argument("--cu-analyzer", help="Custom Content Understanding analyzer ID")
    parser.add_argument("--cu-file-types", nargs="+", help="Restrict CU to specific file types")
    parser.add_argument("--local", action="store_true", help="Use convert_local (local files only)")
    parser.add_argument("--stream", action="store_true", help="Use convert_stream")

    args = parser.parse_args()

    try:
        from markitdown import MarkItDown
        from markitdown.converters import ContentUnderstandingFileType
    except ImportError:
        print("Error: markitdown not installed. Run install-markitdown.py first.")
        return 1

    # Build MarkItDown instance
    kwargs = {}

    if args.llm:
        try:
            from openai import OpenAI
            kwargs["llm_client"] = OpenAI()
            kwargs["llm_model"] = args.model
            if args.prompt:
                kwargs["llm_prompt"] = args.prompt
        except ImportError:
            print("Error: openai package required for LLM support. Install with: pip install openai")
            return 1

    if args.plugins:
        kwargs["enable_plugins"] = True

    if args.docintel:
        kwargs["docintel_endpoint"] = args.docintel

    if args.cu_endpoint:
        kwargs["cu_endpoint"] = args.cu_endpoint
        if args.cu_analyzer:
            kwargs["cu_analyzer_id"] = args.cu_analyzer
        if args.cu_file_types:
            file_types = []
            for ft in args.cu_file_types:
                try:
                    file_types.append(ContentUnderstandingFileType[ft.upper()])
                except KeyError:
                    print(f"Warning: Unknown file type '{ft}', skipping")
            if file_types:
                kwargs["cu_file_types"] = file_types

    md = MarkItDown(**kwargs)

    # Convert
    try:
        if args.local:
            result = md.convert_local(args.input)
        elif args.stream:
            with open(args.input, "rb") as f:
                result = md.convert_stream(f)
        else:
            result = md.convert(args.input)

        output = result.text_content

        if args.output:
            Path(args.output).write_text(output, encoding="utf-8")
            print(f"✅ Converted to {args.output}")
        else:
            print(output)

    except Exception as e:
        print(f"Error: {e}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())