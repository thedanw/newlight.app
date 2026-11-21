
import os
import re

input_path = r"d:\daniel\Documents\SermonPlanning\00.knowledge\CalvinsInstitutes"
output_path = r"d:\daniel\Documents\SermonPlanning\00.knowledge\CalvinsInstitutes_Cleaned.md"

print(f"Reading from: {input_path}")

try:
    with open(input_path, "r", encoding="utf-8") as f:
        raw_lines = f.readlines()
except UnicodeDecodeError:
    print("UTF-8 read failed, trying latin-1")
    with open(input_path, "r", encoding="latin-1") as f:
        raw_lines = f.readlines()

print(f"Read {len(raw_lines)} lines.")

# ==========================================
# HELPERS
# ==========================================

abbrevs = {
    "mr.", "mrs.", "ms.", "dr.", "rev.", "st.", "prof.", "gen.", "rep.", "sen.",
    "p.", "pp.", "v.", "vs.", "vol.", "no.", "op.", "cit.", "ed.", "lib.", "cap.", "c.", "sec.",
    "i.", "ii.", "iii.", "iv.", "v.", "vi.", "vii.", "viii.", "ix.", "x.",
    "xi.", "xii.", "xiii.", "xiv.", "xv.", "xvi.", "xvii.", "xviii.", "xix.", "xx."
}

def clean_line_content(text):
    # 1. REMOVE BACKTICKS
    text = text.replace("`", "")
    
    # 2. CONVERT BOLD TITLES TO HEADERS
    strip_text = text.strip()
    if strip_text.startswith('**') and strip_text.endswith('**'):
        inner = strip_text[2:-2].strip()
        if re.match(r'^(BOOK|CHAPTER|INTRODUCTORY|PREFATORY|EPISTLE)\b', inner, re.IGNORECASE):
            return "### " + inner
    
    return text

def is_header(text):
    return bool(re.match(r'^#+\s+', text))

def is_list_item(text):
    return bool(re.match(r'^([\-\*]|\d+[\.\)])\s+', text))

def should_break_after(text_block):
    text = text_block.rstrip()
    if not text: return False
    
    if is_header(text): return True

    if not text.endswith(('.', '!', '?', ':', ')', ']', '"', "'", '”', '’')):
        return False

    words = text.split()
    if not words: return False
    last_word = words[-1].lower()
    if last_word in abbrevs: return False
        
    return True

# ==========================================
# PRE-PROCESS
# ==========================================
cleaned_lines = []
for line in raw_lines:
    cleaned_content = clean_line_content(line.strip())
    cleaned_lines.append(cleaned_content)


# ==========================================
# PASS 1: UNWRAP LINES
# ==========================================
pass1_lines = []
accumulator = ""

for line in cleaned_lines:
    stripped = line 
    
    # 1. BLANK LINE HANDLING
    if not stripped:
        # NEW LOGIC: If accumulator is incomplete (mid-sentence), ignore this blank line.
        if accumulator and not should_break_after(accumulator):
            # Do NOT flush. Eat the blank line to allow merging.
            continue
            
        # Standard behavior: Flush if needed, then add blank.
        if accumulator:
            pass1_lines.append(accumulator)
            accumulator = ""
        pass1_lines.append("") 
        continue
    
    # 2. HEADER / LIST ITEMS
    if is_header(stripped) or is_list_item(stripped):
        if accumulator:
            pass1_lines.append(accumulator)
        accumulator = stripped
        continue

    # 3. TEXT CONTINUATION
    if accumulator:
        if should_break_after(accumulator):
            pass1_lines.append(accumulator)
            accumulator = stripped
        else:
            accumulator += " " + stripped
    else:
        accumulator = stripped

if accumulator:
    pass1_lines.append(accumulator)


# ==========================================
# PASS 2: MERGE SPLIT HEADERS
# ==========================================
pass2_lines = []
i = 0
while i < len(pass1_lines):
    line = pass1_lines[i]
    
    if not is_header(line):
        pass2_lines.append(line)
        i += 1
        continue
        
    current_header_text = line
    j = i + 1
    
    while j < len(pass1_lines):
        next_line = pass1_lines[j]
        if not next_line.strip():
            j += 1
            continue
            
        if is_header(next_line):
             if not current_header_text.strip().endswith(('.', ':', '?', '!')):
                 match = re.match(r'^(#+\s+)(.*)', next_line)
                 if match:
                     part2 = match.group(2)
                     current_header_text += " " + part2
                     i = j 
                 else:
                     break
             else:
                 break
        else:
            break
        j += 1
        
    pass2_lines.append(current_header_text)
    i += 1 


# ==========================================
# PASS 3: COMPACT LISTS
# ==========================================
final_lines = []
for idx, line in enumerate(pass2_lines):
    stripped = line.strip()
    
    if not stripped:
        prev_is_list = False
        if final_lines: 
             k = len(final_lines) - 1
             while k >= 0:
                 if final_lines[k].strip():
                     if is_list_item(final_lines[k]):
                         prev_is_list = True
                     break
                 k -= 1
        
        next_is_list = False
        k = idx + 1
        while k < len(pass2_lines):
            if pass2_lines[k].strip():
                if is_list_item(pass2_lines[k]):
                     next_is_list = True
                break
            k += 1
            
        if prev_is_list and next_is_list:
            continue
            
        final_lines.append(line)
        
    else:
        if is_list_item(stripped):
             prev_is_list = False
             prev_was_blank = False
             
             if final_lines:
                 if not final_lines[-1].strip():
                     prev_was_blank = True
                 
                 k = len(final_lines) - 1
                 while k >= 0:
                     if final_lines[k].strip():
                         if is_list_item(final_lines[k]):
                             prev_is_list = True
                         break
                     k -= 1
            
             if not prev_is_list and not prev_was_blank and final_lines:
                 final_lines.append("")
        
        else:
             prev_is_list = False
             prev_was_blank = False
             if final_lines:
                 if not final_lines[-1].strip():
                     prev_was_blank = True
                 
                 k = len(final_lines) - 1
                 while k >= 0:
                     if final_lines[k].strip():
                         if is_list_item(final_lines[k]):
                             prev_is_list = True
                         break
                     k -= 1
             
             if prev_is_list and not prev_was_blank:
                 final_lines.append("")
                 
        final_lines.append(line)

print(f"Writing {len(final_lines)} lines to: {output_path}")

with open(output_path, "w", encoding="utf-8") as f:
    f.write("\n".join(final_lines))

print("Success.")
