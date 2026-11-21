#!/usr/bin/env python3
"""
Batch convert files to Markdown using MarkItDown.

Usage:
    python batch-convert.py --input-dir ./docs --output-dir ./markdown
    python batch-convert.py --input-dir ./docs --pattern "*.pdf" --recursive
    python batch-convert.py --input-dir ./docs --llm --model gpt-4o
"""

import argparse
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading


def main():
    parser = argparse.ArgumentParser(description="Batch convert files to Markdown using MarkItDown")
    parser.add_argument("--input-dir", required=True, help="Input directory")
    parser.add_argument("--output-dir", required=True, help="Output directory")
    parser.add_argument("--pattern", default="*", help="File pattern (default: *)")
    parser.add_argument("--recursive", "-r", action="store_true", help="Search recursively")
    parser.add_argument("--llm", action="store_true", help="Enable LLM for image descriptions")
    parser.add_argument("--model", default="gpt-4o", help="LLM model to use (default: gpt-4o)")
    parser.add_argument("--prompt", help="Custom prompt for LLM image descriptions")
    parser.add_argument("--plugins", action="store_true", help="Enable plugins (e.g., OCR)")
    parser.add_argument("--docintel", help="Azure Document Intelligence endpoint")
    parser.add_argument("--cu-endpoint", help="Azure Content Understanding endpoint")
    parser.add_argument("--cu-analyzer", help="Custom Content Understanding analyzer ID")
    parser.add_argument("--workers", type=int, default=4, help="Number of parallel workers (default: 4)")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing files")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be converted without doing it")

    args = parser.parse_args()

    try:
        from markitdown import MarkItDown
        from markitdown.converters import ContentUnderstandingFileType
    except ImportError:
        print("Error: markitdown not installed. Run install-markitdown.py first.")
        return 1

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)

    if not input_dir.exists():
        print(f"Error: Input directory '{input_dir}' does not exist")
        return 1

    output_dir.mkdir(parents=True, exist_ok=True)

    # Find files
    if args.recursive:
        files = list(input_dir.rglob(args.pattern))
    else:
        files = list(input_dir.glob(args.pattern))

    # Filter to files only
    files = [f for f in files if f.is_file()]

    if not files:
        print("No files found matching pattern")
        return 0

    print(f"Found {len(files)} file(s) to convert")

    if args.dry_run:
        for f in files:
            rel = f.relative_to(input_dir)
            out = output_dir / rel.with_suffix(".md")
            print(f"  {rel} -> {out}")
        return 0

    # Build MarkItDown instance (shared across threads)
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

    md = MarkItDown(**kwargs)

    # Convert function
    lock = threading.Lock()
    success_count = 0
    error_count = 0

    def convert_file(input_file):
        nonlocal success_count, error_count
        try:
            rel = input_file.relative_to(input_dir)
            output_file = output_dir / rel.with_suffix(".md")

            if output_file.exists() and not args.overwrite:
                with lock:
                    print(f"⏭️  Skipping (exists): {rel}")
                return

            output_file.parent.mkdir(parents=True, exist_ok=True)

            result = md.convert_local(str(input_file))
            output_file.write_text(result.text_content, encoding="utf-8")

            with lock:
                success_count += 1
                print(f"✅ {rel} -> {output_file.relative_to(output_dir)}")

        except Exception as e:
            with lock:
                error_count += 1
                print(f"❌ {input_file.relative_to(input_dir)}: {e}")

    # Process in parallel
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = [executor.submit(convert_file, f) for f in files]
        for future in as_completed(futures):
            future.result()  # Raise any exceptions

    print(f"\n📊 Complete: {success_count} succeeded, {error_count} failed")
    return 0 if error_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())