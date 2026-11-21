# BOSS Index Schemas (LIVE Reference)

**Owned by:** skill-manage
**Generated source:** `update-index.ps1` reads SKILL.md frontmatter and writes both indexes.
**Rule:** Never edit the indexes manually — always run `scripts/update-index.ps1`.

---

## Category Index (CAT-IDX) — `category-index.json`

Array of category objects. Optimised for **agent category-first reasoning**.

```json
[
  {
    "cat_id": "debugging",
    "category_description": "Debug production issues: logging, profiling, error analysis, root cause analysis",
    "skills": [
      {
        "id": "bug-hunter",
        "description": "Find and fix bugs: systematic reproduction, isolation, and verification",
        "path": "debugging/bug-hunter"
      }
    ]
  }
]
```

| Field | Rule |
|-------|------|
| `cat_id` | Folder name, semantic, unique, kebab-case (e.g. `debugging`, `code-plan`) |
| `category_description` | Minimum words, task-focused purpose, imperative. Manually curated by skill-manage |
| `skills[].id` | Folder name, semantic, unique, kebab-case |
| `skills[].description` | Minimum words, when/why to use, task-focused (generated from SKILL.md frontmatter) |
| `skills[].path` | Relative to `.agents/skills/boss/` (e.g. `debugging/bug-hunter`) — **required for cross-category references** |

---

## Alphabetical Index (ALPHA-IDX) — `alphabetical-index.json`

Flat array of skill objects sorted by `id`. Optimised for **human reference and direct lookup**.

```json
[
  {
    "id": "bug-hunter",
    "description": "Find and fix bugs: systematic reproduction, isolation, and verification",
    "path": "debugging/bug-hunter",
    "search_terms": "debug, bug, error, reproduce, stacktrace"
  }
]
```

| Field | Rule |
|-------|------|
| `id` | Folder name, semantic, unique, kebab-case |
| `description` | Same as CAT-IDX skill description (when/why to use) |
| `path` | Relative to `.agents/skills/boss/` (e.g. `debugging/bug-hunter`) |
| `search_terms` | One line, comma-separated, specific coder terms only (max 5). e.g. `debug, error` not `fix, solve` |

---

## Legacy Index — `BOSS_INDEX.json`

Kept for backward compatibility (v2 format: `skills[]` with id, name, description, category, tags, triggers, risk, path, source). Do **not** use for new development.

---

## Generation Rules

1. **Skill description** — extracted from SKILL.md frontmatter `description`, transformed to "when/why to use" format by `update-index.ps1`
2. **Category description** — maintained manually in skill-manage taxonomy (source of truth in `SKILL.md` + live copy in `refs/categories.md`)
3. **Search terms** — extracted from skill tags/triggers/description, filtered to specific coder terms, max 5
4. **Cross-category references** — a skill lives in ONE folder; it may be listed in multiple CAT-IDX categories via `path`
5. **Alphabetical sort** — ALPHA-IDX sorted by `id` ascending
6. **Single source of truth** — one file copy per skill, multiple index listings with path refs
