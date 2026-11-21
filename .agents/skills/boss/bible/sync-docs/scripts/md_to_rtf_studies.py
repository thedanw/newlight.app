import re
import sys
import os

# Standalone Markdown thematic breaks are structural page boundaries.
# Table-separator rows are excluded by requiring a line containing only
# three or more of the same separator character.
PAGE_BREAK_RE = re.compile(r'(?m)^[ \t]*(-{3,}|\*{3,}|_{3,})[ \t]*(?:\n|$)')
# Colors:
# 0: Black (Auto)
# 1: Brand Orange #FF7300 (255, 115, 0)
# 2: White #FFFFFF (255, 255, 255)
# 3: Brand Grey #313638 (49, 54, 56)
# 4: Light Grey Accent #F4F3EF (244, 243, 239) - Warm off-white
RTF_HEADER = r"""{\rtf1\ansi\deff0
{\fonttbl{\f0\fnil\fcharset0 Inter;}{\f1\fnil\fcharset0 Inter Tight;}{\f2\fnil\fcharset0 Segoe UI Symbol;}}
{\colortbl ;\red255\green115\blue0;\red255\green255\blue255;\red49\green54\blue56;\red244\green243\green239;}
\viewkind4\uc1\paperw11906\paperh16838\margl1440\margr1440\margt1440\margb1440
\sectd\sbknone
"""

def parse_markdown(file_content):
    """
    Parses the markdown content into a list of studies.
    Each study is expected to be separated by a standalone '---' line.
    Pipe-table separator rows are not page boundaries.
    """
    studies = PAGE_BREAK_RE.split(file_content)
    parsed_studies = []
    
    for study in studies:
        if not study.strip():
            continue
            
        study_data = {
            'number': '',
            'title': '',
            'summary': '',
            'passage_ref': '',
            'content_blocks': []
        }
        
        lines = study.strip().split('\n')
        
        # Parse based on expected specific format: | # **1** | # **Title** ... |
        header_found = False
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Table Header Row
            if line.startswith('|') and not header_found and '**' in line:
                # Naive pipe split, assuming the format is relatively stable as per user template
                # | # **1** | # **Title** ... |
                parts = [p.strip() for p in line.split('|') if p.strip()]
                
                if len(parts) >= 2:
                    # Extract Number: "# **1**" -> "1"
                    num_match = re.search(r'\*\*(\d+)\*\*', parts[0])
                    if num_match:
                        study_data['number'] = num_match.group(1)
                    
                    # Extract Title/Summary: "# **Title** <br> Summary <br> _Ref_"
                    # Remove markdown formatting for RTF
                    raw_text = parts[1]
                    
                    # Extract Title (Bold part)
                    title_match = re.search(r'\*\*([^*]+)\*\*', raw_text)
                    if title_match:
                        study_data['title'] = title_match.group(1).strip()
                        raw_text = raw_text.replace(f"**{study_data['title']}**", "")
                    
                    # Extract Summary and Ref
                    # Usually separated by <br> or spaces. 
                    # Let's clean up remaining text.
                    clean_rest = raw_text.replace('#', '').replace('<br>', '\n').strip()
                    
                    # Try to find Passage (usually in italics _Ref_ or just at end)
                    ref_match = re.search(r'_([^_]+)_', clean_rest)
                    if ref_match:
                        study_data['passage_ref'] = ref_match.group(1).strip()
                        clean_rest = clean_rest.replace(f"_{study_data['passage_ref']}_", "")
                    
                    study_data['summary'] = clean_rest.strip().replace('\n', ' ')
                    
                    header_found = True
                    continue

            if line.startswith('|---') or line.startswith('| ---'):
                continue

            # Standard Content Parsing
            # Header 2
            if line.startswith('## '):
                study_data['content_blocks'].append({'type': 'h2', 'text': line.replace('## ', '').replace('**', '')})
            # List items
            elif re.match(r'^\d+\.', line):
                study_data['content_blocks'].append({'type': 'numbered_list', 'text': line})
            elif line.startswith('- '):
                study_data['content_blocks'].append({'type': 'bullet_list', 'text': line[2:]})
            # Main Idea / Passages (Metadata lines often found at top)
            elif line.startswith('**Main Idea**'):
                study_data['content_blocks'].append({'type': 'meta', 'text': line})
            elif line.startswith('**Passage'):
                study_data['content_blocks'].append({'type': 'meta', 'text': line})
            else:
                study_data['content_blocks'].append({'type': 'para', 'text': line})
        
        parsed_studies.append(study_data)
        
    return parsed_studies

def rtf_text_escape(text):
    safe_text = ""
    for char in text:
        code = ord(char)
        if char == '\\':
            safe_text += "\\\\"
        elif char == '{':
            safe_text += "\\{"
        elif char == '}':
            safe_text += "\\}"
        elif code < 128:
            safe_text += char
        else:
            # RTF unicode escape: \uN? where N is signed 16-bit integer
            # If code > 32767, it becomes negative in signed 16-bit
            signed_code = code - 65536 if code > 32767 else code
            safe_text += f"\\u{signed_code}?"
    return safe_text

def markdown_to_rtf_str(text):
    # 1. Escape existing special characters
    text = rtf_text_escape(text)
    
    # 2. Apply formatting (now safe to introduce RTF control words)
    # Bold
    text = re.sub(r'\*\*(.*?)\*\*', r'\\b \1\\b0 ', text)
    # Italics
    text = re.sub(r'_(.*?)_', r'\\i \1\\i0 ', text)
    
    return text

def generate_rtf(studies, output_file):
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(RTF_HEADER)
        
        for i, study in enumerate(studies):
            if i > 0:
                f.write(r"\page")
            
            # --- Draw Header Table ---
            # Row settings: \trowd (reset) \trgaph108 (cell spacing)
            # Cell 1: Orange Background (\clcbpat1), Width ~1000 twips
            # Cell 2: White/No Background (\clcbpat0), Width remaining
            
            f.write(r"\pard\par") # Space before
            
            f.write(r"\trowd\trgaph180\trleft-100")
            # Cell 1 Definition: Orange bg, text white
            f.write(r"\clcbpat1\clbrdrl\brdrnil\clbrdrt\brdrnil\clbrdrr\brdrnil\clbrdrb\brdrnil\clvertalc\cellx1200") 
            # Cell 2 Definition: No bg
            f.write(r"\clcbpat0\clbrdrl\brdrnil\clbrdrt\brdrnil\clbrdrr\brdrnil\clbrdrb\brdrnil\clvertalc\cellx9500")
            
            # Cell 1 Content: The Number
            # \cf2 (White Text), \b (Bold), \f1 (Heading Font), \fs72 (36pt)
            f.write(r"{\pard\qc\intbl\sl480\slmult1\cf2\b\f1\fs72 " + rtf_text_escape(study['number']) + r"\cell}")
            
            # Cell 2 Content: Title, Summary, Reference
            # \cf1 (Orange Title) or \cf3 (Grey Text)
            f.write(r"{\pard\ql\intbl\sl276\slmult1")
            
            # Title: Orange, Bold, Large
            f.write(r"\cf1\b\f1\fs32 " + rtf_text_escape(study['title']) + r"\par")
            
            # Summary: Grey, Regular, Medium
            if study['summary']:
                f.write(r"\cf3\b0\f0\fs24 " + rtf_text_escape(study['summary']) + r"\par")
            
            # Reference: Grey, Italic, Small
            if study['passage_ref']:
                f.write(r"\cf3\i\fs20 " + rtf_text_escape(study['passage_ref']))
            
            f.write(r"\cell}\row")
            
            f.write(r"\pard\sa300\sl276\slmult1\par") # Clear table, add spacing
            
            # --- Content Blocks ---
            
            for block in study['content_blocks']:
                text = markdown_to_rtf_str(block['text'])
                
                if block['type'] == 'h2':
                    # Brand H2: Inter Tight Bold, Black/Grey, Size ~24px (fs36)
                    f.write(r"\pard\sa200\sb300\keepn\cf3\b\f1\fs36 " + text + r"\par")
                    
                elif block['type'] == 'meta':
                     # Meta info: italic, grey
                     f.write(r"\pard\sa150\cf3\b0\i\f0\fs22 " + text + r"\par")
                     
                elif block['type'] == 'numbered_list':
                    # Hang indent for list
                    # \fi-360 (first line indent negative) \li720 (left indent positive)
                    f.write(r"\pard\sa150\sl276\slmult1\li720\fi-360\cf3\b0\f0\fs22 " + text + r"\par")
                    
                elif block['type'] == 'bullet_list':
                     # Bullet char
                    f.write(r"\pard\sa150\sl276\slmult1\li720\fi-360\cf3\b0\f0\fs22 \bullet  " + text + r"\par")
                    
                else: # para
                    if text.strip():
                        f.write(r"\pard\sa240\sl276\slmult1\cf3\b0\f0\fs24 " + text + r"\par")
        
        f.write(r"}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python md_to_rtf_studies.py <input_md_file> [output_rtf_file]")
        sys.exit(1)
        
    input_path = sys.argv[1]
    if len(sys.argv) >= 3:
        output_path = sys.argv[2]
    else:
        output_path = input_path.rsplit('.', 1)[0] + ".rtf"
        
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        studies = parse_markdown(content)
        print(f"Parsed {len(studies)} studies.")
        
        generate_rtf(studies, output_path)
        print(f"Successfully created: {output_path}")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
