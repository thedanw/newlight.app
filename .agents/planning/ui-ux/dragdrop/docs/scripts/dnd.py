#!/usr/bin/env python3
"""dnd-kit docs navigator - read only the lines you need.

Token-efficient access to this docs library for small-context LLM agents.
Never dump a whole document: locate the section, then read its line range.

Usage:
  python scripts/dnd.py map                     # one line per doc (START HERE)
  python scripts/dnd.py sections <doc>          # numbered sections + line ranges
  python scripts/dnd.py read <doc> -s <n>       # read ONE section
  python scripts/dnd.py read <doc> -l A-B       # read an exact line range
  python scripts/dnd.py find <query...>         # topic -> doc / section / lines
  python scripts/dnd.py topics [filter]         # compact topic index
  python scripts/dnd.py context <doc> -s <n>    # section with parent heading
  python scripts/dnd.py stats                   # token totals
  python scripts/dnd.py build                   # regenerate index.json

Docs library root = parent of this scripts/ dir. index.json is auto-built.
"""

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.json"
SKIP = {"skill.md", "index.json"}
CHARS_PER_TOKEN = 4
HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$")
CODE_SPAN_RE = re.compile(r"`([^`\n]+)`")
REF_RE = re.compile(r"`([A-Za-z0-9_./-]+\.md)#(\d+)(?:-(\d+))?`")
SKIP_WORDS = {"the", "and", "for", "with", "from", "this", "that", "into", "your"}


def doc_paths():
    """Sorted relative paths of navigable .md docs, excluding meta files."""
    return sorted(
        p.relative_to(ROOT).as_posix()
        for p in ROOT.rglob("*.md")
        if not any(part.startswith(".") for part in p.relative_to(ROOT).parts)
        and p.name not in SKIP
    )


def parse_doc(rel):
    """Parse a doc into {title, purpose, lines, tokens, keywords, sections}."""
    text = (ROOT / rel).read_text(encoding="utf-8")
    lines = text.splitlines()
    title, purpose = rel, ""
    sections, stack, quotes = [], [], []   # stack of open section indexes
    fenced, heads = False, []

    for i, raw in enumerate(lines, start=1):
        stripped = raw.strip()
        if raw.lstrip().startswith("```"):
            fenced = not fenced
            continue
        if fenced:
            continue
        if stripped.startswith(">"):
            q = stripped.lstrip(">").strip().strip("*`")
            if q and not q.lower().startswith("source"):
                quotes.append(q)
            continue
        m = HEADING_RE.match(raw)
        if not m:
            if not purpose and stripped and not stripped.startswith("|"):
                purpose = stripped
            continue
        level, htext = len(m.group(1)), m.group(2)
        if level == 1:
            title = htext
            continue
        while stack and sections[stack[-1]]["level"] >= level:
            sections[stack.pop()]["end"] = i - 1
        stack.append(len(sections))
        heads.append(htext)
        sections.append({"n": len(sections) + 1, "level": level, "title": htext, "start": i, "end": len(lines)})

    for idx in stack:
        sections[idx]["end"] = len(lines)
    for s in sections:
        s["lines"] = s["end"] - s["start"] + 1

    # Keywords: backtick code spans + heading words, first-seen order.
    keywords, seen = [], set()
    for src in (CODE_SPAN_RE.findall(text), heads):
        for token in src:
            for word in re.split(r"[\s/|,()]+", token) if isinstance(token, str) else [token]:
                word = word.strip("`*:.")
                if 2 < len(word) <= 40 and re.fullmatch(r"[A-Za-z][\w.@/-]*", word):
                    low = word.lower()
                    if low not in seen and low not in SKIP_WORDS:
                        seen.add(low)
                        keywords.append(word)

    return {
        "path": rel,
        "title": title,
        "purpose": (quotes[0] if quotes else purpose)[:200],
        "lines": len(lines),
        "tokens": round(sum(len(l) + 1 for l in lines) / CHARS_PER_TOKEN),
        "keywords": keywords[:18],
        "sections": sections,
    }


def build_index():
    """Scan all docs and write index.json (docs + reverse topic map)."""
    docs = [parse_doc(p) for p in doc_paths()]
    topics = {}
    for d in docs:
        lines = (ROOT / d["path"]).read_text(encoding="utf-8").splitlines()
        for s in d["sections"]:
            body = "\n".join(lines[s["start"] - 1:s["end"]]).lower()
            keys = {w.lower() for w in d["keywords"] if w.lower() in body}
            keys |= {w.lower() for w in re.split(r"\W+", s["title"]) if len(w) > 2}
            for k in keys:
                if len(k) < 4:
                    continue
                refs = topics.setdefault(k, [])
                ref = f"{d['path']}#{s['n']}"
                if ref not in refs and len(refs) < 4:
                    refs.append(ref)
    data = {"generated": date.today().isoformat(), "docs": docs, "topics": topics}
    INDEX.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
    return data


def load_index():
    if not INDEX.exists():
        return build_index()
    return json.loads(INDEX.read_text(encoding="utf-8"))


def find_doc(data, needle):
    """Resolve a doc by exact path, suffix, or unique substring."""
    needle = needle.replace("\\", "/").lower()
    hits = [d for d in data["docs"] if d["path"].lower() == needle]
    if not hits:
        hits = [d for d in data["docs"] if d["path"].lower().endswith(needle) or needle in d["path"].lower()]
    if len(hits) == 1:
        return hits[0]
    if not hits:
        sys.exit(f"doc not found: {needle}\nrun: python scripts/dnd.py map")
    sys.exit("ambiguous doc: " + ", ".join(h["path"] for h in hits))


def cmd_map(data, args):
    """One line per doc: cheapest possible overview. Start here."""
    print(f"DOCS ({len(data['docs'])}) - run 'sections <doc>' then 'read <doc> -s <n>'")
    for d in data["docs"]:
        print(f"{d['path']:<42} {d['lines']:>4}L ~{d['tokens']:>5}tok  {d['title']}")


def cmd_sections(data, args):
    """Numbered section map for one doc: pick a section, then read it."""
    d = find_doc(data, args.doc)
    print(f"# {d['path']}  ({d['lines']}L ~{d['tokens']}tok)")
    print(f"purpose: {d['purpose']}")
    for s in d["sections"]:
        pad = "  " * (s["level"] - 2)
        print(f"  [{s['n']:>2}] {s['start']:>4}-{s['end']:<4} ({s['lines']:>3}L) {pad}{s['title']}")
    print(f"read: python scripts/dnd.py read {d['path']} -s <n>")


def cmd_read(data, args):
    """Print exactly one section or one line range. No line numbers, no noise."""
    d = find_doc(data, args.doc)
    lines = (ROOT / d["path"]).read_text(encoding="utf-8").splitlines()
    if args.section is not None:
        sec = next((s for s in d["sections"] if s["n"] == args.section), None)
        if not sec:
            sys.exit(f"section {args.section} not in {d['path']}\nrun: python scripts/dnd.py sections {d['path']}")
        start, end = sec["start"], sec["end"]
    elif args.lines:
        try:
            start, end = (int(x) for x in args.lines.split("-"))
        except ValueError:
            sys.exit("--lines expects A-B, e.g. -l 12-40")
    else:
        sys.exit("specify -s <section> or -l A-B")
    start = max(1, start)
    end = min(len(lines), end)
    print("\n".join(lines[start - 1:end]))
    if args.verbose:
        print(f"\n[{d['path']} lines {start}-{end} = {end - start + 1}L ~{round(sum(len(l) + 1 for l in lines[start - 1:end]) / CHARS_PER_TOKEN)}tok]")


def cmd_context(data, args):
    """Self-contained block: doc + section heading path + section body."""
    d = find_doc(data, args.doc)
    lines = (ROOT / d["path"]).read_text(encoding="utf-8").splitlines()
    sec = next((s for s in d["sections"] if s["n"] == args.section), None)
    if not sec:
        sys.exit(f"section {args.section} not in {d['path']}")
    parents = [s["title"] for s in d["sections"] if s["level"] < sec["level"] and s["start"] < sec["start"]]
    trail = " > ".join(parents[-1:] + [sec["title"]])
    print(f"# {d['path']} :: {trail}  (L{sec['start']}-{sec['end']})")
    print("\n".join(lines[sec["start"] - 1:sec["end"]]))


def cmd_find(data, args):
    """Locate a topic -> doc / section / line range. Capped output."""
    terms = [t.lower() for t in args.query]
    scored = {}
    for d in data["docs"]:
        p, t = d["path"].lower(), d["title"].lower()
        kws = [k.lower() for k in d["keywords"]]
        for term in terms:
            if term in p or term in t:
                scored.setdefault((d["path"], 0), [0, d["title"]])[0] += 10
            if any(term == k for k in kws):
                scored.setdefault((d["path"], 0), [0, d["title"]])[0] += 6
            elif any(term in k for k in kws):
                scored.setdefault((d["path"], 0), [0, d["title"]])[0] += 3
        for s in d["sections"]:
            for term in terms:
                if term in s["title"].lower():
                    key = (d["path"], s["n"])
                    scored.setdefault(key, [0, s["title"]])[0] += 8
    for topic, refs in data["topics"].items():
        for term in terms:
            if term == topic or (len(term) > 3 and term in topic):
                for ref in refs:
                    path, _, num = ref.rpartition("#")
                    d = next((x for x in data["docs"] if x["path"] == path), None)
                    if not d:
                        continue
                    match = next((s for s in d["sections"] if s["n"] == int(num)), None)
                    if match:
                        scored.setdefault((path, int(num)), [0, match["title"]])[0] += 5

    # Body pass: a term may only exist in prose, not in any title/keyword.
    # Scores doc-level (+2) and the first section containing it (+4).
    for d in data["docs"]:
        text = (ROOT / d["path"]).read_text(encoding="utf-8")
        low, lines = text.lower(), text.splitlines()
        for term in terms:
            if term not in low:
                continue
            scored.setdefault((d["path"], 0), [0, d["title"]])[0] += 2
            for s in d["sections"]:
                if term in "\n".join(lines[s["start"] - 1:s["end"]]).lower():
                    scored.setdefault((d["path"], s["n"]), [0, s["title"]])[0] += 4
                    break

    if not scored:
        print("no match. run: python scripts/dnd.py topics")
        return
    print(f"HITS for {' '.join(terms)} (top {min(len(scored), 12)}):")
    for (path, n), (score, title) in sorted(scored.items(), key=lambda kv: -kv[1][0])[:12]:
        d = next(x for x in data["docs"] if x["path"] == path)
        if n == 0:
            print(f"  {path}  ({d['lines']}L ~{d['tokens']}tok)  doc-level")
        else:
            s = next(x for x in d["sections"] if x["n"] == n)
            print(f"  {path}#{n}  L{s['start']}-{s['end']} ({s['lines']}L)  {title}")
    print("read: python scripts/dnd.py read <doc> -s <n>")


def cmd_topics(data, args):
    """Compact reverse index: keyword -> doc#section refs."""
    filt = args.filter.lower() if args.filter else None
    for topic in sorted(data["topics"]):
        if filt and filt not in topic:
            continue
        refs = data["topics"][topic]
        joined = " ".join(refs[:4])
        print(f"{topic:<28} {joined}")


def cmd_stats(data, args):
    """Token totals so agents can budget context."""
    total_lines = sum(d["lines"] for d in data["docs"])
    total_tokens = sum(d["tokens"] for d in data["docs"])
    print(f"docs={len(data['docs'])} lines={total_lines} est_tokens={total_tokens}")
    print(f"avg_doc={total_tokens // max(1, len(data['docs']))}tok  topics={len(data['topics'])}")


def cmd_build(data, args):
    fresh = build_index()
    print(f"index.json rebuilt: docs={len(fresh['docs'])} topics={len(fresh['topics'])}")


def cmd_verify(data, args):
    """Validate every 'doc.md#n' reference in skill.md against the index."""
    skill = ROOT / "skill.md"
    if not skill.exists():
        sys.exit("skill.md not found")
    refs = REF_RE.findall(skill.read_text(encoding="utf-8"))
    if not refs:
        print("no doc#section refs found in skill.md")
        return
    bad, seen = [], set()
    for path, a, b in refs:
        if (path, a, b) in seen:
            continue
        seen.add((path, a, b))
        hits = [d for d in data["docs"] if d["path"] == path]
        if not hits:
            bad.append(f"{path} (doc not in index)")
            continue
        d = hits[0]
        lo, hi = int(a), int(b or a)
        have = {s["n"] for s in d["sections"]}
        missing = [n for n in range(lo, hi + 1) if n not in have]
        if missing:
            bad.append(f"{path}#{a}-{b or a} (missing {missing}; has {sorted(have)})")
    if bad:
        print(f"FAIL {len(bad)}/{len(seen)} refs")
        for x in bad:
            print("  " + x)
        sys.exit(1)
    print(f"OK {len(seen)}/{len(seen)} doc#section refs in skill.md resolve")


def main():
    ap = argparse.ArgumentParser(prog="dnd.py", description="Token-efficient dnd-kit docs navigator.")
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("map", help="one line per doc").set_defaults(fn=cmd_map)
    sub.add_parser("stats", help="token totals").set_defaults(fn=cmd_stats)
    sub.add_parser("build", help="regenerate index.json").set_defaults(fn=cmd_build)
    sub.add_parser("verify", help="validate skill.md section refs").set_defaults(fn=cmd_verify)

    p = sub.add_parser("sections", help="section map for a doc")
    p.add_argument("doc")
    p.set_defaults(fn=cmd_sections)

    p = sub.add_parser("read", help="read one section or line range")
    p.add_argument("doc")
    p.add_argument("-s", "--section", type=int)
    p.add_argument("-l", "--lines")
    p.add_argument("-v", "--verbose", action="store_true")
    p.set_defaults(fn=cmd_read)

    p = sub.add_parser("context", help="section + heading trail")
    p.add_argument("doc")
    p.add_argument("-s", "--section", type=int, required=True)
    p.set_defaults(fn=cmd_context)

    p = sub.add_parser("find", help="locate topic -> section")
    p.add_argument("query", nargs="+")
    p.set_defaults(fn=cmd_find)

    p = sub.add_parser("topics", help="compact topic index")
    p.add_argument("filter", nargs="?")
    p.set_defaults(fn=cmd_topics)

    args = ap.parse_args()
    args.fn(load_index(), args)


if __name__ == "__main__":
    main()
