import urllib.request
import urllib.parse
import json
import os
import sys
import re
from html.parser import HTMLParser

# ========================================
# CONFIGURATION
# ========================================
NLT_API_KEY = 'd1519545-bde5-4322-86bf-2027288be8fa'
BASE_URL = 'https://api.nlt.to/api/passages'
DEFAULT_VERSION = 'NLT'

class NLTToMarkdownParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.output = []
        self.in_heading = False
        self.in_verse = False
        self.in_chapter_num = False
        self.in_note = False
        self.current_tag = ""

    def handle_starttag(self, tag, attrs):
        self.current_tag = tag
        attrs_dict = dict(attrs)
        class_name = attrs_dict.get('class', '')

        if tag in ['h1', 'h2', 'h3', 'h4']:
            self.output.append('\n\n### ' if 'subhead' in class_name or tag == 'h3' else '\n\n## ')
            self.in_heading = True
        elif tag == 'p':
            self.output.append('\n\n')
        elif tag == 'span' and 'vn' in class_name:
            self.output.append(' [')
            self.in_verse = True
        elif tag == 'span' and 'chapter-number' in class_name:
            self.output.append('\n\n## Chapter ')
            self.in_chapter_num = True
        elif tag == 'span' and ('tn' in class_name or 'a-tn' in class_name):
            self.in_note = True # We might want to skip notes or format them
        elif tag == 'br':
            self.output.append('\n')

    def handle_endtag(self, tag):
        if tag in ['h1', 'h2', 'h3', 'h4']:
            self.in_heading = False
        elif tag == 'span' and self.in_verse:
            self.output.append('] ')
            self.in_verse = False
        elif tag == 'span' and self.in_chapter_num:
            self.in_chapter_num = False
        elif tag == 'span' and self.in_note:
            self.in_note = False
        
        self.current_tag = ""

    def handle_data(self, data):
        if self.in_note:
            return # Skip notes for clean reading
        
        # Clean up whitespace but keep necessary spacing
        text = data.strip()
        if text:
            if self.current_tag == 'p' or self.in_heading or self.in_verse or self.in_chapter_num:
                self.output.append(text)
            else:
                self.output.append(text)

    def get_markdown(self):
        md = "".join(self.output)
        # Clean up multiple newlines
        md = re.sub(r'\n{3,}', '\n\n', md)
        return md.strip()

def fetch_passage(reference):
    params = {
        'key': NLT_API_KEY,
        'ref': reference,
        'version': DEFAULT_VERSION,
        'include-ref-headings': 'true',
        'include-book-title': 'true'
    }
    
    url = f"{BASE_URL}?{urllib.parse.urlencode(params)}"
    
    print(f"Fetching: {reference}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'})
        with urllib.request.urlopen(req) as response:
            if response.status != 200:
                print(f"Error: API returned status {response.status}")
                return None
            
            html_content = response.read().decode('utf-8')
            
            # If response is JSON, it might be an error
            try:
                error_data = json.loads(html_content)
                if 'error' in error_data:
                    print(f"API Error: {error_data['error']}")
                    return None
            except json.JSONDecodeError:
                pass # Not JSON, likely raw HTML
            
            return html_content
    except Exception as e:
        print(f"Connection Error: {e}")
        return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python bible_fetcher.py \"Reference\"")
        print("Example: python bible_fetcher.py \"John 3:16\"")
        return

    reference = sys.argv[1]
    html = fetch_passage(reference)
    
    if html:
        parser = NLTToMarkdownParser()
        parser.feed(html)
        markdown = parser.get_markdown()
        
        # Add a title header
        full_output = f"# {reference} (NLT)\n\n{markdown}"
        
        filename = f"{reference.replace(':', '_').replace(' ', '_')}.md"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(full_output)
            
        print(f"Successfully saved to {filename}")
    else:
        print("Failed to fetch passage.")

if __name__ == "__main__":
    main()
