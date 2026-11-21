#!/usr/bin/env python3
"""
Install MarkItDown with optional dependencies for the mark-it-down skill.

Usage:
    python install-markitdown.py --all
    python install-markitdown.py --pdf --docx --pptx
    python install-markitdown.py --ocr
    python install-markitdown.py --dev --all
"""

import argparse
import subprocess
import sys
import os


def run_command(cmd, description):
    """Run a command and handle errors."""
    print(f"\n{description}...")
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    print(result.stdout)
    return True


def main():
    parser = argparse.ArgumentParser(description="Install MarkItDown with optional dependencies")
    parser.add_argument("--all", action="store_true", help="Install all optional dependencies")
    parser.add_argument("--pdf", action="store_true", help="Install PDF support")
    parser.add_argument("--docx", action="store_true", help="Install Word document support")
    parser.add_argument("--pptx", action="store_true", help="Install PowerPoint support")
    parser.add_argument("--xlsx", action="store_true", help="Install Excel support")
    parser.add_argument("--xls", action="store_true", help="Install legacy Excel support")
    parser.add_argument("--audio", action="store_true", help="Install audio transcription support")
    parser.add_argument("--youtube", action="store_true", help="Install YouTube transcription support")
    parser.add_argument("--az-doc-intel", action="store_true", help="Install Azure Document Intelligence support")
    parser.add_argument("--az-content-understanding", action="store_true", help="Install Azure Content Understanding support")
    parser.add_argument("--outlook", action="store_true", help="Install Outlook messages support")
    parser.add_argument("--ocr", action="store_true", help="Install OCR plugin (requires OpenAI-compatible client)")
    parser.add_argument("--dev", action="store_true", help="Install in development mode from source")
    parser.add_argument("--uv", action="store_true", help="Use uv instead of pip (recommended)")

    args = parser.parse_args()

    # Determine which extras to install
    extras = []
    if args.all:
        extras = ["all"]
    else:
        if args.pdf: extras.append("pdf")
        if args.docx: extras.append("docx")
        if args.pptx: extras.append("pptx")
        if args.xlsx: extras.append("xlsx")
        if args.xls: extras.append("xls")
        if args.audio: extras.append("audio-transcription")
        if args.youtube: extras.append("youtube-transcription")
        if args.az_doc_intel: extras.append("az-doc-intel")
        if args.az_content_understanding: extras.append("az-content-understanding")
        if args.outlook: extras.append("outlook")

    # Choose package manager
    pm = "uv" if args.uv or shutil.which("uv") else "pip"

    if args.dev:
        print("Installing MarkItDown in development mode from source...")
        if not os.path.exists("markitdown"):
            print("Cloning MarkItDown repository...")
            if not run_command(["git", "clone", "https://github.com/microsoft/markitdown.git"], "Clone repository"):
                return 1
        os.chdir("markitdown")
        if extras:
            extra_str = ",".join(extras)
            cmd = [pm, "pip", "install", "-e", f"packages/markitdown[{extra_str}]"]
        else:
            cmd = [pm, "pip", "install", "-e", "packages/markitdown"]
    else:
        if extras:
            extra_str = ",".join(extras)
            cmd = [pm, "pip", "install", f"markitdown[{extra_str}]"]
        else:
            cmd = [pm, "pip", "install", "markitdown"]

    if not run_command(cmd, "Install MarkItDown"):
        return 1

    # Install OCR plugin if requested
    if args.ocr:
        print("\nInstalling OCR plugin...")
        if not run_command([pm, "pip", "install", "markitdown-ocr"], "Install markitdown-ocr"):
            return 1
        if not run_command([pm, "pip", "install", "openai"], "Install openai"):
            return 1

    print("\n✅ Installation complete!")
    print("Verify with: markitdown --version")
    print("List plugins with: markitdown --list-plugins")
    return 0


if __name__ == "__main__":
    import shutil
    sys.exit(main())