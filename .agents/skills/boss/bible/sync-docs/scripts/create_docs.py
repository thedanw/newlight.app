import os
import sys
import re
import argparse
import markdown

# Standalone Markdown thematic breaks are structural page boundaries.
# Table-separator rows are excluded by requiring a line containing only
# three or more of the same separator character.
PAGE_BREAK_RE = re.compile(r'(?m)^[ \t]*(-{3,}|\*{3,}|_{3,})[ \t]*(?:\n|$)')

BRAND = {
    "PRIMARY_ORANGE": "#FF7300",
    "MIDNIGHT": "#313638",
    "SECONDARY_GREEN": "#60695C",
    "OFF_WHITE": "#F8F9FA",
    "FONT_HEADINGS": "'Inter Tight', sans-serif",
    "FONT_BODY": "'Inter', sans-serif"
}

# Standalone Markdown thematic breaks. Table-separator rows are excluded by
# requiring a line that contains only three or more hyphens.
HORIZONTAL_RULE_RE = re.compile(r'(?m)^[ \t]*-{3,}[ \t]*(?:\n|$)')

# Brand Guidelines
BRAND = {
    "PRIMARY_ORANGE": "#FF7300",
    "MIDNIGHT": "#313638",
    "SECONDARY_GREEN": "#60695C",
    "OFF_WHITE": "#F8F9FA",
    "FONT_HEADINGS": "'Inter Tight', sans-serif",
    "FONT_BODY": "'Inter', sans-serif"
}


def generate_html(md_path, output_path):
    print(f"Generating HTML for {md_path}...")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    template_path = os.path.join(script_dir, "bible_study_template.html")
    
    if not os.path.exists(template_path):
        print(f"Error: Template not found at {template_path}")
        return

    with open(template_path, 'r', encoding='utf-8') as f:
        html_template = f.read()

    with open(md_path, 'r', encoding='utf-8') as f:
        full_text = f.read()

    # Detect Year from path
    year_match = re.search(r'20\d{2}', md_path)
    year = year_match.group(0) if year_match else "2026"

    # 1. Extract Title and Intro
    lines = full_text.split('\n')
    first_line = lines[0].strip()
    if first_line.startswith('| #') or first_line.startswith('|#'):
        # No series title line - the file starts directly with study tables
        series_title = "Post-Exilic Psalms"
        series_subtitle = "Light in the Silence — Bible Study Series"
    else:
        series_title = first_line.replace('# ', '').strip()
        series_subtitle = ""
        if len(lines) > 1 and not lines[1].strip().startswith('|') and not lines[1].strip().startswith('#'):
            series_subtitle = lines[1].strip()
    intro_text = ""

    # 1b. Extract the first non-study section (for example, "Symbols in
    # Revelation"). It receives its own generated page between the TOC and the
    # first study; it is not included in that study's content.
    reference_table = ""
    studies_raw = PAGE_BREAK_RE.split(full_text)
    studies_raw = [re.sub(r'\r\n?', '\n', block).strip() for block in studies_raw]

    if studies_raw and not re.search(r'^\|\s*#', studies_raw[0], re.MULTILINE):
        reference_block = studies_raw.pop(0)
        if reference_block:
            reference_html = markdown.markdown(reference_block, extensions=['extra', 'tables'])
            reference_table = (
                f"<div class='reference-page'>{reference_html}</div>\n"
                "    <div class='page-break'></div>"
            )

    # TOC and Study Accumulators
    toc_rows = ""
    study_pages = ""
    
    studies_processed = []
    current_study = None

    for block in studies_raw:
        if '| #' in block:
            if current_study:
                studies_processed.append(current_study)
            current_study = {"header": block, "bonus": ""}
        elif current_study and block.strip():
            current_study["bonus"] += "\n---\n" + block

    if current_study:
        studies_processed.append(current_study)

    for study_data in studies_processed:
        header_block = study_data["header"]
        bonus_content = study_data["bonus"]
        
        # 1. Try 2x2 Table Format (Esther Style) - matches numbered or Bonus studies
        header_match_2x2 = re.search(r'\|\s*#\s*\*\*(?:(\d+)|Bonus\s+(\d+))\*\*\s*\|\s*#\s*\*\*(.*?)\*\*\s*\|.*?\|\s*\*\*Main Idea\*\*:\s*(.*?)\s*\|\s*\*\*Passages\*\*:\s*(.*?)\s*\|', header_block, re.DOTALL)
        
        # 2. Try 1x2 Table Format (Mark Style) - matches numbered or Bonus studies
        header_match_1x2 = re.search(r'\|\s*#\s*\*\*(?:(\d+)|Bonus\s+(\d+))\*\*\s*\|\s*#\s*\*\*(.*?)\*\*(.*?)\s*\|', header_block)
        
        if header_match_2x2:
            # Group 1 = numbered study, Group 2 = bonus study number
            num = header_match_2x2.group(1) or f"bonus-{header_match_2x2.group(2)}"
            title = header_match_2x2.group(3)
            main_idea = header_match_2x2.group(4)
            passages = header_match_2x2.group(5)
            subtitle = ""
            content_only = re.sub(r'^\|.*?\n', '', header_block, flags=re.MULTILINE).strip()
        elif header_match_1x2:
            # Group 1 = numbered study, Group 2 = bonus study number
            num = header_match_1x2.group(1) or f"bonus-{header_match_1x2.group(2)}"
            title = header_match_1x2.group(3)
            subtitle = header_match_1x2.group(4).strip()
            main_idea_match = re.search(r'\*\*Main Idea\*\*:\s*(.*?)\n', header_block)
            passages_match = re.search(r'\*\*Passages\*\*:\s*(.*?)\n', header_block)
            main_idea = main_idea_match.group(1) if main_idea_match else ""
            passages = passages_match.group(1) if passages_match else ""
            content_only = re.sub(r'^\|.*?\n', '', header_block, flags=re.MULTILINE).strip()
            content_only = re.sub(r'\*\*Main Idea\*\*.*?\n', '', content_only)
            content_only = re.sub(r'\*\*Passages\*\*.*?\n', '', content_only)
        else:
            continue

        # Add bonus content back if it exists
        content_only += bonus_content

        # Add to TOC
        toc_rows += f"<tr><td class='num-col'>{num}</td><td class='content-col'><a href='#study-{num}'>{title}</a><span class='toc-passage'>{passages}</span></td></tr>\n"
        
        # Convert markdown to html
        # Convert markdown to html
        # Replace horizontal rules (---) with empty strings to prevent
        # the markdown library from breaking open <ol> lists
        content_clean = content_only.replace('\n---\n', '\n\n')
        # Ensure blockquotes following list items are separated by a blank line
        # so the markdown library doesn't nest them inside <li> elements
        content_clean = re.sub(r'(\n\d+\..*?\n)(> )', r'\1\n\2', content_clean)
        body_html = markdown.markdown(content_clean, extensions=['extra', 'tables', 'nl2br'])
        
        # Post-process body_html to restructure labels into a two-column grid layout
        def replace_question_row(match):
            label = match.group(1).strip()
            text = match.group(2).strip()
            
            return f"""<div class="question-row">
                <div class="question-label question-label-default">{label}</div>
                <div class="question-content">{text}</div>
            </div>"""
        
        # In HTML output, markdown renders blocks with <br /> tags inside <p> when they are adjacent:
        # e.g., <p><strong>Observe</strong>: ...<br />\n<strong>Interpret</strong>: ...</p>
        # Let's break apart these combined paragraph chunks into individual <p> tags first.
        # Clean up <p> blocks containing <br /> so each label line gets its own paragraph:
        def split_combined_paragraphs(match):
            content = match.group(1)
            parts = re.split(r'<br\s*/?>', content)
            cleaned_parts = []
            for part in parts:
                part_strip = part.strip()
                if part_strip:
                    cleaned_parts.append(f"<p>{part_strip}</p>")
            return "\n".join(cleaned_parts)

        body_html = re.sub(r'<p>(<strong>\w+</strong>:.*?)</p>', split_combined_paragraphs, body_html, flags=re.DOTALL)
        body_html = re.sub(r'<p>(\w+:.*?)</p>', split_combined_paragraphs, body_html, flags=re.DOTALL)

        # Match pattern: <p><strong>(Label)</strong>:\s*(.*?)</p> or <p>(Label):\s*(.*?)</p>
        body_html = re.sub(r'<p><strong>(\w+)</strong>:\s*(.*?)</p>', replace_question_row, body_html)
        body_html = re.sub(r'<p>(\w+):\s*(.*?)</p>', replace_question_row, body_html)

        # Convert <ul><li> lists that immediately follow a question-row into
        # sub-question rows (indented, no bullet) instead of bulleted lists.
        def replace_subquestion_list(match):
            list_html = match.group(1)
            items = re.findall(r'<li>(.*?)</li>', list_html, flags=re.DOTALL)
            rows = []
            for item in items:
                item_clean = item.strip()
                if not item_clean:
                    continue
                rows.append(f"""<div class="question-row subquestion">
                    <div class="question-label question-label-sub"></div>
                    <div class="question-content">{item_clean}</div>
                </div>""")
            return "\n".join(rows)

        body_html = re.sub(
            r'<ul>\s*((?:<li>.*?</li>\s*)+)</ul>',
            lambda m: replace_subquestion_list(m) if '<li>' in m.group(1) else m.group(0),
            body_html,
            flags=re.DOTALL
        )

        # Style Read headers: format "## Read [Passage]" as an H2 with a Material Icon
        # Pattern: <h2>Read (.*?)</h2>
        def replace_read_heading(match):
            passage_text = match.group(1).strip()
            return f"""<h2 class="read-heading">
                <span class="material-symbols-sharp read-icon">menu_book</span>
                <span class="read-title">Read {passage_text}</span>
            </h2>"""
        
        body_html = re.sub(r'<h2>Read\s*(.*?)</h2>', replace_read_heading, body_html)
        body_html = re.sub(r'<h2><strong>Read\s*(.*?)</strong></h2>', replace_read_heading, body_html)
        # Handle blockquote format: > Read [Passage] renders as <blockquote><p>Read ...</p></blockquote>
        body_html = re.sub(r'<blockquote>\s*<p>Read\s*(.*?)</p>\s*</blockquote>', replace_read_heading, body_html)
        
        # Build Study Page
        subtitle_html = f"<div class='study-subtitle'>{subtitle}</div>" if subtitle else ""
        passages_html = f"<div class='study-passages'><strong>Passages:</strong> {passages}</div>" if passages else ""
        main_idea_html = f"<div class='main-idea'>{main_idea}</div>" if main_idea else ""
        study_pages += f"""
        <div class='page'>
            <div id='study-{num}' class='study-container'>
                <div class='header-top'>
                    <div class='study-num'>{num}</div>
                    <div class='study-title'>
                        <h1>{title}</h1>
                        {subtitle_html}
                        {passages_html}
                        {main_idea_html}
                    </div>
                </div>
                {body_html}
            </div>
        </div>
        <div class='page-break'></div>
        """

    # Perform Template Replacements
    final_html = html_template.replace("{{title}}", series_title)
    final_html = final_html.replace("{{series_title}}", series_title)
    final_html = final_html.replace("{{intro_text}}", intro_text.strip().replace("\n", "<br>"))
    final_html = final_html.replace("{{year}}", year)
    final_html = final_html.replace("{{toc_rows}}", toc_rows)
    final_html = final_html.replace("{{reference_table}}", reference_table)
    final_html = final_html.replace("{{study_pages}}", study_pages)
    final_html = final_html.replace("{{series_subtitle}}", series_subtitle)

    # Strip any remaining HTML template boilerplate comments
    # Use [\\s\\S]* (greedy, across all lines) to match from <!-- to the LAST --> 
    final_html = re.sub(r'<!--\s*STUDY PAGE TEMPLATE[\s\S]*-->', '', final_html)
    # Clean up any stray template variables
    final_html = re.sub(r'\{\{.*?\}\}', '', final_html, flags=re.DOTALL)
    # Remove stray text fragments
    final_html = re.sub(r'\n\s+block\.\n', '\n', final_html)
    # Remove any remaining stray --> that aren't part of valid HTML comments
    final_html = re.sub(r'\n-->\s*\n', '\n', final_html)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(final_html)
    print(f"Successfully created: {output_path}")

def rtf_text_escape(text):
    safe_text = ""
    for char in text:
        code = ord(char)
        if char == '\\': safe_text += "\\\\"
        elif char == '{': safe_text += "\\}"
        elif char == '}': safe_text += "\\}"
        elif code < 128: safe_text += char
        else:
            signed_code = code - 65536 if code > 32767 else code
            safe_text += f"\\u{signed_code}?"
    return safe_text

def markdown_to_rtf(md_path, output_path):
    print(f"Generating RTF for {md_path}...")
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    header = r"""{\rtf1\ansi\deff0
{\fonttbl{\f0\fnil\fcharset0 Inter;}{\f1\fnil\fcharset0 Inter Tight;}}
{\colortbl ;\red255\green115\blue0;\red49\green54\blue56;}
\viewkind4\uc1\paperw11906\paperh16838\margl1440\margr1440\margt1440\margb1440
"""
    
    rtf_body = ""
    for line in lines:
        stripped = line.strip()
        if not stripped:
            rtf_body += r"\pard\par "
            continue
            
        if stripped.startswith('# '):
            text = rtf_text_escape(stripped[2:])
            rtf_body += r"\pard\sa300\sb300\cf1\b\f1\fs48 " + text + r"\par "
        elif stripped.startswith('## '):
            text = rtf_text_escape(stripped[3:])
            rtf_body += r"\pard\sa200\sb200\cf1\b\f1\fs36 " + text + r"\par "
        elif re.match(r'^\d+\.\s+', stripped):
            text = rtf_text_escape(stripped)
            rtf_body += r"\pard\li720\fi-360 " + text + r"\par "
        else:
            text = rtf_text_escape(stripped)
            rtf_body += r"\pard\sa180\cf2\f0\fs24 " + text + r"\par "

    full_rtf = header + rtf_body + "}"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(full_rtf)

import subprocess

def generate_pdf(html_path, pdf_path):
    print(f"Generating PDF from {html_path}...")
    
    # Common paths for Chrome/Edge on Windows
    browsers = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    ]
    
    browser_path = None
    for path in browsers:
        if os.path.exists(path):
            browser_path = path
            break
            
    if not browser_path:
        print("Error: Could not find Chrome or Edge for PDF generation.")
        return

    try:
        # Use headless browser to print to PDF
        # --no-pdf-header-footer removes the URL/date from the top/bottom
        cmd = [
            browser_path,
            "--headless",
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--print-to-pdf={pdf_path}",
            html_path
        ]
        subprocess.run(cmd, check=True)
        print(f"Successfully created PDF: {pdf_path}")
    except Exception as e:
        print(f"Error during PDF generation: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Multi-format MD conversion.')
    parser.add_argument('path', help='Source MD file')
    parser.add_argument('--html', action='store_true', help='Generate HTML')
    parser.add_argument('--rtf', action='store_true', help='Generate RTF')
    parser.add_argument('--pdf', action='store_true', help='Generate PDF (from HTML template)')
    parser.add_argument('--output', default=None, help='Output file path (overrides default naming)')
    parser.add_argument('--mode', choices=['leader', 'participant'], default=None,
                        help='leader: render <!-- ANSWER --> as grey answer blocks; participant: strip them')
    args = parser.parse_args()
    
    if not os.path.exists(args.path):
        print(f"Error: {args.path} not found.")
        sys.exit(1)
        
    base = os.path.splitext(args.path)[0]
    
    # If PDF is requested, we MUST generate HTML first (or at least have it available)
    html_path = args.output if args.output else base + ".html"
    
    if args.mode:
        # Pre-process the markdown for answer handling
        import tempfile
        with open(args.path, 'r', encoding='utf-8') as f:
            md_content = f.read()
        
        if args.mode == 'participant':
            # Strip all <!-- ANSWER ... --> comments entirely
            md_content = re.sub(r'<!--\s*ANSWER[\s\S]*?-->\s*\n?', '', md_content)
        else:  # leader
            # Convert <!-- ANSWER: text --> into a visible div for grey rendering
            # Ensure blank lines around the div so markdown treats it as a block element
            def answer_replacer(m):
                answer_text = m.group(1).strip()
                return f'\n\n<div class="answer-block">{answer_text}</div>\n\n'
            md_content = re.sub(r'<!--\s*ANSWER:?\s*([\s\S]*?)\s*-->', answer_replacer, md_content)
        
        tmp = tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False, encoding='utf-8')
        tmp.write(md_content)
        tmp.close()
        source_path = tmp.name
    else:
        source_path = args.path
    
    if args.html or args.pdf:
        generate_html(source_path, html_path)
        
    if args.pdf:
        # PDF name follows the --output name if given (e.g. ..._leadersguide.pdf)
        pdf_path = os.path.splitext(html_path)[0] + ".pdf" if args.output else base + ".pdf"
        generate_pdf(os.path.abspath(html_path), os.path.abspath(pdf_path))
        
    if args.rtf:
        markdown_to_rtf(source_path, base + ".rtf")
    
    if args.mode:
        os.unlink(source_path)  # Clean up temp file

