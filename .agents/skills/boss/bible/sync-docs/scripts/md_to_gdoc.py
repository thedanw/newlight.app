import os
import sys
import re
import markdown
from googleapiclient.discovery import build

from google_auth import GoogleAuthConfigurationError, authenticate

# If modifying these SCOPES, delete the token configured by
# GOOGLE_OAUTH_TOKEN_PATH.
SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents'
]

# The root folder ID in Google Drive where sermons should be synced
PARENT_FOLDER_ID = '1dGRJkjh5hVGvhYc5cZ7k99BeCNA262yy'
TEMPLATE_ID = '1o3tbW_5jlMNsFKaZhht9xfT8rx6mYUdpqYfTJ3o8Zn8'

# Standalone Markdown horizontal rules are page boundaries in Bible-study
# exports. A GDoc paragraph using pageBreakBefore is the native equivalent of
# the HTML `.page-break` element and survives DOCX/PDF export.
PAGE_BREAK_RE = re.compile(r'(?m)^[ \t]*(-{3,}|\*{3,}|_{3,})[ \t]*(?:\n|$)')

def get_or_create_folder(service, folder_name, parent_id):
    """Finds a folder by name under a parent, or creates it if it doesn't exist."""
    query = f"name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and '{parent_id}' in parents and trashed = false"
    results = service.files().list(q=query, fields="files(id, name)").execute()
    files = results.get('files', [])
    
    if files:
        return files[0]['id']
    else:
        print(f"Creating folder '{folder_name}' under parent {parent_id}...")
        file_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [parent_id]
        }
        file = service.files().create(body=file_metadata, fields='id').execute()
        return file.get('id')

def parse_path_for_metadata(abs_path):
    """Extracts year and series name from the local file path."""
    parts = abs_path.split(os.sep)
    # Looking for 'Sermons_n_Series' as the anchor
    try:
        idx = parts.index('Sermons_n_Series')
        if len(parts) > idx + 2:
            year = parts[idx + 1]
            series = parts[idx + 2]
            return year, series
    except ValueError:
        pass
    return None, None

def parse_inline_styles(text):
    """
    Parses a string for markdown markers: **bold**, _underline_, *italic*, [link](url).
    Replaces <br> tags with \n.
    Returns (clean_text, list_of_style_ranges).
    """
    # Replace <br> tags with actual newlines
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    
    matches = []
    
    # 1. Links: [text](url)
    for m in re.finditer(r'\[(.*?)\]\((.*?)\)', text):
        matches.append({'start': m.start(), 'end': m.end(), 'type': 'LINK', 'content': m.group(1), 'url': m.group(2)})

    # EXTRA: Bold within brackets **[text]**
    for m in re.finditer(r'\*\*\[(.*?)\]\*\*', text):
        if not any(match['start'] <= m.start() and match['end'] >= m.end() for match in matches):
            matches.append({'start': m.start(), 'end': m.end(), 'type': 'BOLD', 'content': m.group(1)})

    # 2. Bold: **text**
    for m in re.finditer(r'\*\*(.*?)\*\*', text):
        if not any(match['start'] <= m.start() and match['end'] >= m.end() for match in matches):
            matches.append({'start': m.start(), 'end': m.end(), 'type': 'BOLD', 'content': m.group(1)})
    
    # 3. Underline/Italic: _text_
    for m in re.finditer(r'_(.*?)_', text):
        if not any(match['start'] <= m.start() and match['end'] >= m.end() for match in matches):
            matches.append({'start': m.start(), 'end': m.end(), 'type': 'UNDERLINE', 'content': m.group(1)})
            
    # 4. Italic: *text*
    for m in re.finditer(r'\*(?!\*)(.*?)\*', text):
        if not any(match['start'] <= m.start() and match['end'] >= m.end() for match in matches):
            matches.append({'start': m.start(), 'end': m.end(), 'type': 'ITALIC', 'content': m.group(1)})

    # Sort matches by start index
    matches.sort(key=lambda x: x['start'])
    
    clean_text = ""
    ranges = []
    last_idx = 0
    
    for m in matches:
        if m['start'] < last_idx:
            continue # Skip overlapping
        
        # Add plain text before match
        clean_text += text[last_idx:m['start']]
        
        # Record range in clean text
        range_start = len(clean_text)
        clean_text += m['content']
        range_end = len(clean_text)
        
        info = {'start': range_start, 'end': range_end, 'type': m['type']}
        if m['type'] == 'LINK':
            info['url'] = m['url']
        ranges.append(info)
        last_idx = m['end']
        
    clean_text += text[last_idx:]
    return clean_text, ranges

def create_table_styling_requests(table_index, full_borders=False):
    """Returns a list of requests to style an existing 1x2 table.
    
    Args:
        table_index: The start index of the table
        full_borders: If True, adds borders on all sides of second cell (for code blocks).
                      If False, only adds left border (for quoted text).
    """
    requests = [
        # Format column width
        {
            'updateTableColumnProperties': {
                'tableStartLocation': {'index': table_index},
                'columnIndices': [0],
                'tableColumnProperties': {
                    'width': {'magnitude': 70, 'unit': 'PT'},
                    'widthType': 'FIXED_WIDTH'
                },
                'fields': 'width,widthType'
            }
        },
        # Remove all borders
        {
            'updateTableCellStyle': {
                'tableStartLocation': {'index': table_index},
                'tableCellStyle': {
                    'borderTop': {'width': {'magnitude': 0, 'unit': 'PT'}, 'dashStyle': 'SOLID', 'color': {'color': {'rgbColor': {'red': 0, 'green': 0, 'blue': 0}}}},
                    'borderBottom': {'width': {'magnitude': 0, 'unit': 'PT'}, 'dashStyle': 'SOLID', 'color': {'color': {'rgbColor': {'red': 0, 'green': 0, 'blue': 0}}}},
                    'borderLeft': {'width': {'magnitude': 0, 'unit': 'PT'}, 'dashStyle': 'SOLID', 'color': {'color': {'rgbColor': {'red': 0, 'green': 0, 'blue': 0}}}},
                    'borderRight': {'width': {'magnitude': 0, 'unit': 'PT'}, 'dashStyle': 'SOLID', 'color': {'color': {'rgbColor': {'red': 0, 'green': 0, 'blue': 0}}}},
                },
                'fields': 'borderTop,borderBottom,borderLeft,borderRight'
            }
        }
    ]
    
    if full_borders:
        # Code blocks: borders on all sides of second cell
        requests.append({
            'updateTableCellStyle': {
                'tableRange': {
                    'tableCellLocation': {
                        'tableStartLocation': {'index': table_index},
                        'rowIndex': 0,
                        'columnIndex': 1
                    },
                    'rowSpan': 1,
                    'columnSpan': 1
                },
                'tableCellStyle': {
                    'borderTop': {
                        'dashStyle': 'SOLID',
                        'width': {'magnitude': 1, 'unit': 'PT'},
                        'color': {'color': {'rgbColor': {'blue': 0, 'green': 0, 'red': 0}}}
                    },
                    'borderBottom': {
                        'dashStyle': 'SOLID',
                        'width': {'magnitude': 1, 'unit': 'PT'},
                        'color': {'color': {'rgbColor': {'blue': 0, 'green': 0, 'red': 0}}}
                    },
                    'borderLeft': {
                        'dashStyle': 'SOLID',
                        'width': {'magnitude': 1, 'unit': 'PT'},
                        'color': {'color': {'rgbColor': {'blue': 0, 'green': 0, 'red': 0}}}
                    },
                    'borderRight': {
                        'dashStyle': 'SOLID',
                        'width': {'magnitude': 1, 'unit': 'PT'},
                        'color': {'color': {'rgbColor': {'blue': 0, 'green': 0, 'red': 0}}}
                    }
                },
                'fields': 'borderTop,borderBottom,borderLeft,borderRight'
            }
        })
    else:
        # Quoted text: only left border on second cell
        requests.append({
            'updateTableCellStyle': {
                'tableRange': {
                    'tableCellLocation': {
                        'tableStartLocation': {'index': table_index},
                        'rowIndex': 0,
                        'columnIndex': 1
                    },
                    'rowSpan': 1,
                    'columnSpan': 1
                },
                'tableCellStyle': {
                    'borderLeft': {
                        'dashStyle': 'SOLID',
                        'width': {'magnitude': 1, 'unit': 'PT'},
                        'color': {'color': {'rgbColor': {'blue': 0, 'green': 0, 'red': 0}}}
                    }
                },
                'fields': 'borderLeft'
            }
        })
    
    return requests

def append_markdown_content(docs_service, doc_id, md_content):
    """
    Markdown parser to append content to a Google Doc with style support.
    """
    def refresh_doc_state():
        doc = docs_service.documents().get(documentId=doc_id).execute()
        return doc.get('body').get('content')[-1].get('endIndex') - 1

    current_index = refresh_doc_state()
    
    # Initial separation
    if current_index > 1:
        docs_service.documents().batchUpdate(documentId=doc_id, body={
            'requests': [{'insertText': {'location': {'index': current_index}, 'text': '\n'}}]
        }).execute()
        current_index = refresh_doc_state()

    lines = md_content.split('\n')
    in_code_block = False
    code_buffer = []

    pending_requests = []

    def flush_requests():
        nonlocal pending_requests, current_index
        if pending_requests:
            try:
                docs_service.documents().batchUpdate(documentId=doc_id, body={'requests': pending_requests}).execute()
            except Exception as e:
                print(f"BatchUpdate Error: {e}")
            pending_requests = []
            current_index = refresh_doc_state()

    def add_table_callout(text, full_borders=False):
        nonlocal current_index
        flush_requests()
        table_idx_input = current_index
        
        # 1. Create Table alone
        docs_service.documents().batchUpdate(documentId=doc_id, body={
            'requests': [{'insertTable': {'rows': 1, 'columns': 2, 'location': {'index': table_idx_input}}}]
        }).execute()
        
        # 2. Find the actual table index by looking at the body content
        doc = docs_service.documents().get(documentId=doc_id).execute()
        table_element = None
        for element in reversed(doc.get('body').get('content')):
            if 'table' in element:
                table_element = element
                break
        
        if not table_element:
            print("Warning: Could not find created table.")
            return

        table_start = table_element.get('startIndex')
        
        # 3. Target the second cell's paragraph index dynamically
        try:
            target_index = table_element['table']['tableRows'][0]['tableCells'][1]['content'][0]['startIndex']
        except (KeyError, IndexError):
            print("Warning: Could not determine second cell index, defaulting.")
            target_index = table_start + 5

        # 4. Parse inline styles and insert clean text with styling
        clean_text, inline_ranges = parse_inline_styles(text)
        
        docs_service.documents().batchUpdate(documentId=doc_id, body={
            'requests': [{'insertText': {'location': {'index': target_index}, 'text': clean_text}}]
        }).execute()
        
        # 5. Apply inline text styles (bold, italic, underline, links)
        if inline_ranges:
            style_requests = []
            for r in inline_ranges:
                text_style = {}
                fields = []
                if r['type'] == 'BOLD':
                    text_style['bold'] = True
                    fields.append('bold')
                if r['type'] == 'ITALIC':
                    text_style['italic'] = True
                    fields.append('italic')
                if r['type'] == 'UNDERLINE':
                    text_style['underline'] = True
                    fields.append('underline')
                if r['type'] == 'LINK':
                    text_style['link'] = {'url': r['url']}
                    fields.append('link')
                
                style_requests.append({
                    'updateTextStyle': {
                        'range': {
                            'startIndex': target_index + r['start'],
                            'endIndex': target_index + r['end']
                        },
                        'textStyle': text_style,
                        'fields': ','.join(fields)
                    }
                })
            if style_requests:
                docs_service.documents().batchUpdate(documentId=doc_id, body={'requests': style_requests}).execute()
        
        # 6. Style the Table
        styling_reqs = create_table_styling_requests(table_start, full_borders=full_borders)
        styling_reqs.append({'insertText': {'location': {'index': refresh_doc_state()}, 'text': '\n'}})
        docs_service.documents().batchUpdate(documentId=doc_id, body={'requests': styling_reqs}).execute()
        current_index = refresh_doc_state()

    def insert_native_table(rows_data):
        nonlocal current_index
        flush_requests()
        rows = len(rows_data)
        cols = len(rows_data[0]) if rows > 0 else 0
        if rows == 0: return

        # 1. Create structure
        docs_service.documents().batchUpdate(documentId=doc_id, body={
            'requests': [{'insertTable': {'rows': rows, 'columns': cols, 'location': {'index': current_index}}}]
        }).execute()

        # 2. Fetch doc to find cell indices
        doc = docs_service.documents().get(documentId=doc_id).execute()
        table_element = None
        for element in reversed(doc.get('body').get('content')):
            if 'table' in element:
                table_element = element
                break
        if not table_element: return

        # 3. Build requests in REVERSE to keep indices stable
        table_content_reqs = []
        for r_idx in range(rows - 1, -1, -1):
            for c_idx in range(cols - 1, -1, -1):
                raw_cell_text = rows_data[r_idx][c_idx].strip()
                clean_cell_text, inline_ranges = parse_inline_styles(raw_cell_text)
                
                try:
                    p_idx = table_element['table']['tableRows'][r_idx]['tableCells'][c_idx]['content'][0]['startIndex']
                    # Insert clean text
                    if clean_cell_text:
                        table_content_reqs.append({'insertText': {'location': {'index': p_idx}, 'text': clean_cell_text}})
                    
                    # Apply cell styles
                    if r_idx == 0: # Header bolding
                         table_content_reqs.append({
                            'updateTextStyle': {
                                'range': {'startIndex': p_idx, 'endIndex': p_idx + max(1, len(clean_cell_text))},
                                'textStyle': {'bold': True},
                                'fields': 'bold'
                            }
                        })
                    
                    # Apply inline styles
                    for r in inline_ranges:
                        text_style = {}
                        fields = []
                        if r['type'] == 'BOLD': 
                            text_style['bold'] = True
                            fields.append('bold')
                        if r['type'] == 'ITALIC': 
                            text_style['italic'] = True
                            fields.append('italic')
                        if r['type'] == 'UNDERLINE': 
                            text_style['underline'] = True
                            fields.append('underline')
                        if r['type'] == 'LINK':
                            text_style['link'] = {'url': r['url']}
                            fields.append('link')
                         
                        table_content_reqs.append({
                            'updateTextStyle': {
                                'range': {
                                    'startIndex': p_idx + r['start'],
                                    'endIndex': p_idx + r['end']
                                },
                                'textStyle': text_style,
                                'fields': ','.join(fields)
                            }
                        })
                except (KeyError, IndexError):
                    continue

        if table_content_reqs:
            docs_service.documents().batchUpdate(documentId=doc_id, body={'requests': table_content_reqs}).execute()
        
        # Add trailing newline
        docs_service.documents().batchUpdate(documentId=doc_id, body={
            'requests': [{'insertText': {'location': {'index': refresh_doc_state()}, 'text': '\n'}}]
        }).execute()
        current_index = refresh_doc_state()

    table_buffer = []
    in_table = False

    for line in lines:
        stripped = line.strip()

        # A standalone thematic break starts the next content on a new page.
        if PAGE_BREAK_RE.fullmatch(line.rstrip('\r\n')):
            flush_requests()
            break_requests = [{'insertText': {'location': {'index': current_index}, 'text': '\n'}}]
            break_start = current_index
            break_end = current_index + 1
            break_requests.append({
                'updateParagraphStyle': {
                    'range': {'startIndex': break_start, 'endIndex': break_end},
                    'paragraphStyle': {'pageBreakBefore': True},
                    'fields': 'pageBreakBefore'
                }
            })
            docs_service.documents().batchUpdate(documentId=doc_id, body={
                'requests': break_requests
            }).execute()
            current_index = refresh_doc_state()
            continue

        # Detect table lines
        if stripped.startswith('|'):
            if re.match(r'^\|[\s:-|]*\|$', stripped):
                continue
            if not in_table:
                in_table = True
                table_buffer = []
            parts = [p.strip() for p in stripped.split('|')]
            if parts[0] == '': parts.pop(0)
            if parts and parts[-1] == '': parts.pop()
            table_buffer.append(parts)
            continue
        else:
            if in_table:
                insert_native_table(table_buffer)
                in_table = False
                table_buffer = []
        
        # Detect code block toggle (multi-line blocks with ``` on separate lines)
        # Skip inline single-line backtick blocks (already handled below)
        if stripped.startswith('```') and not (stripped.endswith('```') and len(stripped) > 6):
            if not in_code_block:
                in_code_block = True
                code_buffer = []
                continue
            else:
                in_code_block = False
                add_table_callout('\n'.join(code_buffer), full_borders=True)
                continue

        if in_code_block:
            code_buffer.append(line)
            continue

        # Detect quoted text (lines starting with >)
        if stripped.startswith('>'):
            # Remove the > and any leading space
            quote_text = stripped[1:].lstrip()
            add_table_callout(quote_text, full_borders=False)
            continue

        # Detect single backtick wrap
        if stripped.startswith('`') and stripped.endswith('`') and len(stripped) > 2:
            add_table_callout(stripped[1:-1].strip(), full_borders=True)
            continue
        
        # Detect inline triple-backtick wrap (same line open/close, e.g. ```text```)
        # This handles cases like: ```God's Spirit...```
        if stripped.startswith('```') and stripped.endswith('```') and len(stripped) > 6:
            inner_text = stripped[3:-3].strip()
            add_table_callout(inner_text, full_borders=True)
            continue

        if not stripped:
            pending_requests.append({'insertText': {'location': {'index': current_index}, 'text': '\n'}})
            current_index += 1 
            continue
            
        # 1. Determine Paragraph Style, Indentation & List nesting
        style = 'NORMAL_TEXT'
        bullet_prefix = ""
        text_to_parse = line
        
        # Calculate indentation (2 spaces = 1 tab)
        indent_match = re.match(r'^(\s*)', line)
        indent_spaces = len(indent_match.group(1)) if indent_match else 0
        literal_indent = "\t" * (indent_spaces // 2) if indent_spaces > 0 else ""
        
        # Special case: Headings should not be indented
        if line.strip().startswith('#'):
            literal_indent = ""
            text_to_parse = line.lstrip()
            if text_to_parse.startswith('# '):
                style = 'HEADING_1'
                text_to_parse = text_to_parse[2:]
            elif text_to_parse.startswith('## '):
                style = 'HEADING_2'
                text_to_parse = text_to_parse[3:]
            elif text_to_parse.startswith('### '):
                style = 'HEADING_3'
                text_to_parse = text_to_parse[4:]
        else:
            # Regular lines or lists
            text_to_parse = line[indent_spaces:]
            bullet_prefix = ""
            
            # Detect List Markers
            if re.match(r'^([A-Za-z0-9]+[\.\)])\s+', text_to_parse):
                m = re.match(r'^([A-Za-z0-9]+[\.\)])\s+', text_to_parse)
                bullet_prefix = f"{m.group(1)} "
                text_to_parse = text_to_parse[m.end():]
            elif re.match(r'^[\-\*]\s+', text_to_parse):
                m = re.match(r'^[\-\*]\s+', text_to_parse)
                if indent_spaces <= 2:
                    bullet_prefix = "▪ "
                else:
                    bullet_prefix = "- "
                text_to_parse = text_to_parse[m.end():]

        # 2. Parse Inline Styles
        clean_text, inline_ranges = parse_inline_styles(text_to_parse)
        
        # 3. Insert Text
        full_text_to_insert = literal_indent + bullet_prefix + clean_text + '\n'
        pending_requests.append({
            'insertText': {
                'location': {'index': current_index},
                'text': full_text_to_insert
            }
        })
        
        # 4. Apply Paragraph Style
        para_style_req = {
            'updateParagraphStyle': {
                'range': {
                    'startIndex': current_index,
                    'endIndex': current_index + len(full_text_to_insert) - 1
                },
                'paragraphStyle': {'namedStyleType': style},
                'fields': 'namedStyleType'
            }
        }
        
        pending_requests.append(para_style_req)
        
        # 6. Apply Inline Text Styles
        for r in inline_ranges:
            text_style = {}
            fields = []
            offset = len(literal_indent) + len(bullet_prefix)
            
            if r['type'] == 'BOLD': 
                text_style['bold'] = True
                fields.append('bold')
            if r['type'] == 'ITALIC': 
                text_style['italic'] = True
                fields.append('italic')
            if r['type'] == 'UNDERLINE': 
                text_style['underline'] = True
                fields.append('underline')
            if r['type'] == 'LINK':
                text_style['link'] = {'url': r['url']}
                fields.append('link')
            
            pending_requests.append({
                'updateTextStyle': {
                    'range': {
                        'startIndex': current_index + offset + r['start'],
                        'endIndex': current_index + offset + r['end']
                    },
                    'textStyle': text_style,
                    'fields': ','.join(fields)
                }
            })
            
        current_index += len(full_text_to_insert)

    if in_table:
        insert_native_table(table_buffer)

    flush_requests()

def clear_document_content(docs_service, doc_id):
    """Deletes all content in the document body."""
    doc = docs_service.documents().get(documentId=doc_id).execute()
    # The end index is the end of the entire document
    end_index = doc.get('body').get('content')[-1].get('endIndex') - 1
    if end_index > 1:
        requests = [{
            'deleteContentRange': {
                'range': {
                    'startIndex': 1,
                    'endIndex': end_index
                }
            }
        }]
        docs_service.documents().batchUpdate(documentId=doc_id, body={'requests': requests}).execute()

def export_document(drive_service, doc_id, export_formats, output_dir, base_name):
    """Exports a Google Doc to local formats."""
    mimetypes = {
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain',
        'rtf': 'application/rtf',
        'odt': 'application/vnd.oasis.opendocument.text'
    }
    
    for fmt in export_formats:
        if fmt not in mimetypes:
            print(f"Skipping unknown export format: {fmt}")
            continue
            
        print(f"Exporting to {fmt}...")
        try:
            request = drive_service.files().export_media(fileId=doc_id, mimeType=mimetypes[fmt])
            fh = request.execute()
            
            out_path = os.path.join(output_dir, f"{base_name}.{fmt}")
            with open(out_path, "wb") as f:
                f.write(fh)
            print(f"Saved: {out_path}")
        except Exception as e:
            print(f"Error exporting to {fmt}: {e}")

def upload_markdown_as_gdoc(md_path, existing_doc_id=None, export_formats=None):
    if not os.path.exists(md_path):
        print(f"Error: File '{md_path}' not found.")
        return

    creds = authenticate(SCOPES)
    drive_service = build('drive', 'v3', credentials=creds)
    docs_service = build('docs', 'v1', credentials=creds)

    new_doc_id = existing_doc_id
    md_abs_path = os.path.abspath(md_path)
    base_name = os.path.basename(md_path).replace('.md', '')
    output_dir = os.path.dirname(md_abs_path)

    if not new_doc_id:
        year, series = parse_path_for_metadata(md_abs_path)
        target_folder_id = PARENT_FOLDER_ID
        if year and series:
            print(f"Detected Year: {year}, Series: {series}")
            year_folder_id = get_or_create_folder(drive_service, year, PARENT_FOLDER_ID)
            target_folder_id = get_or_create_folder(drive_service, series, year_folder_id)
        
        print(f"Copying template '{TEMPLATE_ID}' as '{base_name}'...")
        copy_metadata = {'name': base_name, 'parents': [target_folder_id]}
        file = drive_service.files().copy(fileId=TEMPLATE_ID, body=copy_metadata, fields='id, webViewLink, name').execute()
        new_doc_id = file.get('id')
        web_link = file.get('webViewLink')
        doc_name = file.get('name')
    else:
        print(f"Updating existing document: {new_doc_id}")
        clear_document_content(docs_service, new_doc_id)
        file = drive_service.files().get(fileId=new_doc_id, fields='name, webViewLink').execute()
        web_link = file.get('webViewLink')
        doc_name = file.get('name')

    print(f"Reading {md_path}...")
    with open(md_path, 'r', encoding='utf-8') as f:
        md_content = f.read()

    print("Appending content to Doc...")
    try:
        append_markdown_content(docs_service, new_doc_id, md_content)
    except Exception as e:
        print(f"Warning: Error during content append: {e}")
        import traceback
        traceback.print_exc()
    
    # Export if requested
    if export_formats:
        export_document(drive_service, new_doc_id, export_formats, output_dir, base_name)

    print("-" * 30)
    print(f"Success: '{doc_name}' updated!")
    print(f"ID: {new_doc_id}")
    print(f"Link: {web_link}")
    print("-" * 30)

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Sync MD to GDoc and optionally export.')
    parser.add_argument('path', help='Path to markdown file')
    parser.add_argument('--id', help='Existing Google Doc ID', default=None)
    parser.add_argument('--export', help='Comma-separated formats to export (pdf,docx,rtf)', default=None)
    
    args = parser.parse_args()
    
    try:
        target_path = os.path.abspath(args.path)
        export_fmts = args.export.split(',') if args.export else []
        upload_markdown_as_gdoc(target_path, args.id, export_fmts)
    except GoogleAuthConfigurationError as error:
        print(f"Configuration error: {error}")
        sys.exit(1)
