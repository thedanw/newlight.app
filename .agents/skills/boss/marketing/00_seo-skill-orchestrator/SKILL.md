---
name: seo-skill-orchestrator
description: "Meta orchestrator for all SEO skills. Defines two comprehensive workflows: (1) Full-site SEO audit from macro structure to micro page analysis, and (2) End-to-end content creation from site-wide strategy to granular page optimization. Uses every SEO skill in the correct sequence."
category: marketing
risk: safe
source: adapted
tags: [seo, meta, orchestrator, workflow, audit, content-creation, strategy, execution]
triggers: [seo-workflow, audit-site, create-content, full-audit, content-strategy, orchestrate]
---

# SEO Meta Orchestrator

**Purpose**: This skill coordinates ALL 11 SEO skills into two complete, macro-to-micro workflows. It does not perform SEO tasks itself—it tells you which skill to invoke, when, and with what inputs.

---

## Available SEO Skills Inventory

| Skill | Purpose | Category |
|-------|---------|----------|
| `seo-audit` | Full-site technical SEO audit (crawlability, indexation, rankings) | Technical |
| `seo-technical` | Deep technical audit (Core Web Vitals, JS rendering, robots.txt, AI crawlers) | Technical |
| `seo-plan` | Strategic SEO planning, competitive analysis, content strategy, roadmap | Strategy |
| `seo-structure-architect` | Site architecture, header hierarchy, schema, internal linking map | Structure |
| `seo-cannibalization-detector` | Keyword overlap analysis across pages | Content Quality |
| `seo-content` | Content quality & E-E-A-T analysis with AI citation readiness | Content Quality |
| `seo-content-auditor` | Scores content quality, E-E-A-T signals, SEO best practices | Content Quality |
| `seo-content-planner` | Content outlines, topic clusters, content calendars, gap analysis | Content Strategy |
| `seo-keyword-strategist` | Keyword density, semantic variations, LSI keywords, over-optimization prevention | Keywords |
| `seo-meta-optimizer` | Meta titles, descriptions, URLs optimization | On-Page |
| `seo-aeo-meta-description-generator` | 3 title + 3 meta variants with SERP preview, OG/Twitter cards | On-Page (AEO) |
| `seo-page` | Deep single-page SEO analysis (on-page, content, technical, schema, images) | Page Analysis |
| `seo-snippet-hunter` | Featured snippet & SERP feature optimization | SERP Features |
| `seo-content-writer` | Writes SEO-optimized content from keywords/briefs | Content Creation |
| `seo-aeo-blog-writer` | Long-form blogs with TL;DR, definitions, comparison tables, FAQ | Content Creation (AEO) |
| `seo-aeo-landing-page-writer` | SEO+AEO+conversion optimized landing pages | Content Creation (AEO) |
| `seo-aeo-content-cluster` | Topical authority maps: pillar + cluster articles + link map | Content Strategy (AEO) |
| `seo-aeo-internal-linking` | Internal link opportunities, anchor text, orphan detection | Internal Linking |
| `seo-aeo-keyword-research` | Keywords + AEO question queries, difficulty tiers, content map | Keyword Research (AEO) |
| `seo-aeo-schema-generator` | 10 JSON-LD schema types with rich result validation | Schema |
| `seo-schema` | Schema.org detection, validation, JSON-LD generation | Schema |
| `seo-sitemap` | XML sitemap analysis & generation | Technical |
| `seo-hreflang` | International SEO hreflang audit & generation | International |
| `seo-geo` | AI Overview/ChatGPT/Perplexity optimization (GEO) | AI Search |
| `seo-forensic-incident-response` | Traffic drop investigation & recovery plan | Forensics |
| `seo-authority-builder` | E-E-A-T signal analysis for authority/trust | Authority |
| `seo-content-refresher` | Outdated content detection (stats, dates, examples) | Maintenance |
| `seo-competitor-pages` | Competitor comparison/alternatives pages | Competitive |
| `seo-programmatic` | Programmatic SEO at scale (templates, URL systems, quality gates) | Programmatic |
| `seo-dataforseo` | Live SERPs, keywords, backlinks via DataForSEO API | Data |
| `seo-images` | Image optimization (alt, size, format, responsive, CLS) | Images |
| `seo-image-gen` | SEO-focused image generation (OG cards, hero, schema assets) | Images |

---

## WORKFLOW 1: FULL-SITE SEO AUDIT (Macro → Micro)

### Phase 1: MACRO — Site-Wide Strategy & Architecture

#### Step 1.1: Strategic Foundation
**Skill**: `seo-plan`
**Input**: Business context, target markets, primary goals
**Output**: SEO strategy doc, competitive landscape, content strategy, implementation roadmap
**Triggers**: "SEO strategy", "SEO plan", "site roadmap", "competitive analysis"

#### Step 1.2: Technical Health Baseline
**Skill**: `seo-audit`
**Input**: Domain, crawl scope (full site or sections)
**Output**: Prioritized issue list (crawlability, indexation, rankings, performance)
**Triggers**: "full site audit", "technical SEO audit", "site health check"

#### Step 1.3: Deep Technical Audit
**Skill**: `seo-technical`
**Input**: Domain, specific technical concerns from Step 1.2
**Output**: Core Web Vitals, JS rendering, robots.txt, AI crawler access, security, mobile
**Triggers**: "Core Web Vitals", "technical SEO", "JavaScript SEO", "crawl budget"

#### Step 1.4: Site Architecture & Structure
**Skill**: `seo-structure-architect`
**Input**: Current site map, URL structure, navigation
**Output**: Header hierarchy audit, schema opportunities, internal linking architecture, orphan pages
**Triggers**: "site structure", "information architecture", "internal linking", "site architecture"

#### Step 1.5: International & Programmatic (if applicable)
**Skill**: `seo-hreflang` / `seo-programmatic`
**Input**: Multi-language/region setup or programmatic page templates
**Output**: Hreflang validation/implementation or programmatic quality gates
**Triggers**: "international SEO", "hreflang", "programmatic SEO", "multi-language"

---

### Phase 2: MESO — Section & Cluster Analysis

#### Step 2.1: Content Inventory & Quality
**Skill**: `seo-content` + `seo-content-auditor`
**Input**: All indexable URLs (from crawl)
**Output**: Content quality scores, E-E-A-T gaps, AI citation readiness, thin content flags
**Triggers**: "content audit", "content quality", "E-E-A-T", "thin content"

#### Step 2.2: Cannibalization Detection
**Skill**: `seo-cannibalization-detector`
**Input**: Page groups by topic/keyword theme
**Output**: Keyword overlap matrix, cannibalization severity, differentiation strategies
**Triggers**: "keyword cannibalization", "content overlap", "duplicate keywords"

#### Step 2.3: Topical Authority & Clusters
**Skill**: `seo-aeo-content-cluster` + `seo-content-planner`
**Input**: Core topics, business priorities
**Output**: Pillar pages, cluster articles, content types, internal link map, content gaps
**Triggers**: "topic clusters", "topical authority", "content strategy", "pillar pages"

#### Step 2.4: Internal Linking Opportunities
**Skill**: `seo-aeo-internal-linking`
**Input**: All pages, target keywords
**Output**: Link opportunities with anchor text, placement instructions, orphan detection
**Triggers**: "internal linking", "link opportunities", "orphan pages"

#### Step 2.5: Schema & Structured Data
**Skill**: `seo-schema` + `seo-aeo-schema-generator`
**Input**: Page types (Article, Product, FAQ, HowTo, etc.)
**Output**: Missing schema, validation errors, JSON-LD blocks for 10+ types
**Triggers**: "schema markup", "structured data", "rich results", "JSON-LD"

#### Step 2.6: Sitemap & Indexation
**Skill**: `seo-sitemap`
**Input**: Current XML sitemaps
**Output**: Format validation, URL coverage, indexation gaps
**Triggers**: "sitemap", "XML sitemap", "indexation issues"

---

### Phase 3: MICRO — Page-Level Deep Dive

#### Step 3.1: Priority Page Analysis
**Skill**: `seo-page`
**Input**: Top-priority URLs (from Phase 1-2 findings)
**Output**: Complete on-page audit: content, technical meta, schema, images, performance
**Triggers**: "analyze this page", "page SEO", "single page audit"

#### Step 3.2: Keyword Optimization per Page
**Skill**: `seo-keyword-strategist`
**Input**: Page content + target keywords
**Output**: Density analysis, semantic gaps, LSI suggestions, over-optimization warnings
**Triggers**: "keyword optimization", "keyword density", "LSI keywords", "semantic SEO"

#### Step 3.3: Meta Tag Optimization
**Skill**: `seo-meta-optimizer` + `seo-aeo-meta-description-generator`
**Input**: Page topic, target keyword, brand voice
**Output**: Optimized titles, descriptions, URLs + 3 variants each with SERP preview, OG/Twitter cards
**Triggers**: "meta tags", "title tags", "meta descriptions", "SERP preview"

#### Step 3.4: Featured Snippet & SERP Features
**Skill**: `seo-snippet-hunter`
**Input**: Target questions, current page content
**Output**: Snippet-optimized content blocks (paragraph, list, table, video)
**Triggers**: "featured snippet", "position zero", "SERP features", "snippet optimization"

#### Step 3.5: Image & Media Optimization
**Skill**: `seo-images` + `seo-image-gen`
**Input**: Page images, target keywords
**Output**: Alt text audit, file size/format issues, responsive setup, CLS prevention + generated assets
**Triggers**: "image optimization", "alt text", "image SEO", "OG images"

#### Step 3.6: Content Freshness & Authority
**Skill**: `seo-content-refresher` + `seo-authority-builder`
**Input**: Older high-traffic pages
**Output**: Outdated stats/dates/examples flagged + E-E-A-T credibility gaps
**Triggers**: "content freshness", "outdated content", "E-E-A-T", "authority building"

---

### Phase 4: SPECIALIZED (Conditional)

| Condition | Skill | Trigger |
|-----------|-------|---------|
| Sudden traffic drop | `seo-forensic-incident-response` | "traffic drop", "ranking drop", "penalty" |
| AI search visibility | `seo-geo` | "AI Overview", "ChatGPT citation", "GEO", "llms.txt" |
| Competitor comparison pages | `seo-competitor-pages` | "vs page", "alternatives page", "competitor comparison" |
| Live SERP/keyword data needed | `seo-dataforseo` | "live SERP", "keyword volume", "backlink data" |
| Backlink/profile analysis | (external) | "backlink audit", "link profile" |

---

## WORKFLOW 2: END-TO-END CONTENT CREATION (Macro → Micro)

### Phase 1: MACRO — Site-Wide Content Strategy

#### Step 1.1: Keyword Research & Topic Mapping
**Skill**: `seo-aeo-keyword-research` + `seo-keyword-strategist`
**Input**: Seed topics, business goals, target audience
**Output**: Prioritized keyword list with AEO questions, difficulty tiers, cannibalization checks, content map
**Triggers**: "keyword research", "topic research", "content map", "keyword strategy"

#### Step 1.2: Topical Authority Architecture
**Skill**: `seo-aeo-content-cluster` + `seo-content-planner`
**Input**: Keyword clusters from Step 1.1
**Output**: Pillar pages, cluster articles, content types, internal link map, content calendar, gap analysis
**Triggers**: "content clusters", "topic clusters", "pillar pages", "content calendar"

#### Step 1.3: Competitive Content Gap
**Skill**: `seo-competitor-pages` + `seo-plan`
**Input**: Top competitors, target keywords
**Output**: "X vs Y" page opportunities, "alternatives to X" pages, feature matrices
**Triggers**: "competitor content", "comparison pages", "alternatives pages"

#### Step 1.4: Programmatic Content Plan (if applicable)
**Skill**: `seo-programmatic`
**Input**: Structured data sources, page templates
**Output**: URL system, template specs, quality gates, index-bloat safeguards
**Triggers**: "programmatic SEO", "scaled content", "template pages"

---

### Phase 2: MESO — Content Briefs & Specifications

#### Step 2.1: Detailed Content Briefs
**Skill**: `seo-content-planner` (per cluster)
**Input**: Cluster topic, target keywords, search intent
**Output**: Comprehensive briefs: outline, word count, heading structure, schema type, internal links, FAQ questions
**Triggers**: "content brief", "content outline", "writing brief"

#### Step 2.2: Internal Linking Strategy per Brief
**Skill**: `seo-aeo-internal-linking`
**Input**: New content topics + existing site pages
**Output**: Target anchor texts, placement instructions, link equity distribution
**Triggers**: "internal linking plan", "link strategy for new content"

#### Step 2.3: Schema Requirements per Page Type
**Skill**: `seo-aeo-schema-generator` + `seo-schema`
**Input**: Page type (Article, Product, FAQ, HowTo, etc.)
**Output**: Required JSON-LD blocks, rich result eligibility validation
**Triggers**: "schema for content", "structured data for new pages"

---

### Phase 3: MICRO — Page Creation & Optimization

#### Step 3.1: Content Writing
**Skill**: Choose by content type:
- **Blog/Article**: `seo-aeo-blog-writer` (TL;DR, definitions, comparison tables, FAQ)
- **Landing Page**: `seo-aeo-landing-page-writer` (SEO + AEO + conversion)
- **General SEO Content**: `seo-content-writer` (keywords + brief)
**Input**: Content brief from Step 2.1
**Output**: Complete, optimized draft
**Triggers**: "write blog post", "write landing page", "create content", "write article"

#### Step 3.2: On-Page Optimization
**Skill**: `seo-keyword-strategist` + `seo-meta-optimizer` + `seo-aeo-meta-description-generator`
**Input**: Draft content, target keywords
**Output**: Keyword density check, semantic coverage, 3 title variants, 3 meta variants, SERP preview, OG/Twitter cards
**Triggers**: "optimize content", "on-page SEO", "meta tags", "keyword optimization"

#### Step 3.3: Structure & Schema Implementation
**Skill**: `seo-structure-architect` + `seo-aeo-schema-generator`
**Input**: Draft content, page type
**Output**: Header hierarchy (H1-H6), schema JSON-LD blocks, internal link placements
**Triggers**: "content structure", "header hierarchy", "schema implementation"

#### Step 3.4: Featured Snippet Optimization
**Skill**: `seo-snippet-hunter`
**Input**: Target questions from keyword research
**Output**: Snippet-optimized blocks (definitions, lists, tables, steps)
**Triggers**: "featured snippet", "position zero", "snippet optimization"

#### Step 3.5: Image & Media Creation
**Skill**: `seo-image-gen` + `seo-images`
**Input**: Content topics, brand guidelines
**Output**: OG cards, hero images, schema assets, infographics + optimization checklist
**Triggers**: "create images", "OG images", "hero images", "schema images"

#### Step 3.6: Final Page Validation
**Skill**: `seo-page`
**Input**: Complete page (content + meta + schema + images + links)
**Output**: Full single-page audit score, remaining issues, launch readiness
**Triggers**: "validate page", "pre-launch check", "page quality check"

---

### Phase 4: POST-PUBLISH (Ongoing)

| Step | Skill | Frequency | Trigger |
|------|-------|-----------|---------|
| Indexation check | `seo-sitemap` + GSC | Weekly | "indexation status" |
| Performance monitoring | `seo-audit` (targeted) | Monthly | "ranking check", "traffic check" |
| Content freshness | `seo-content-refresher` | Quarterly | "update content", "outdated stats" |
| Cannibalization watch | `seo-cannibalization-detector` | Quarterly | "new content published" |
| AI search visibility | `seo-geo` | Monthly | "AI Overview tracking" |

---

## HOW TO USE THIS ORCHESTRATOR

### For a Full Site Audit:
```
User: "Audit my entire site"
→ Invoke seo-meta-orchestrator
→ Follow WORKFLOW 1 Phase 1 → 2 → 3 → 4
→ Each step tells you which skill to call next
```

### For Content Creation:
```
User: "Create a content strategy and write 10 articles"
→ Invoke seo-meta-orchestrator
→ Follow WORKFLOW 2 Phase 1 → 2 → 3 → 4
→ Each step tells you which skill to call next
```

### For a Single Page:
```
User: "Optimize this page: example.com/page"
→ Invoke seo-page (Phase 3.1)
→ Then seo-keyword-strategist (3.2)
→ Then seo-meta-optimizer + seo-aeo-meta-description-generator (3.3)
→ Then seo-structure-architect + seo-aeo-schema-generator (3.4)
→ Then seo-snippet-hunter (3.5)
→ Then seo-images (3.6)
```

---

## SKILL INVOCATION PATTERN

Each workflow step follows this pattern:

```
1. READ this orchestrator step
2. IDENTIFY the skill name (e.g., seo-audit)
3. INVOKE that skill with the specified inputs
4. RECEIVE the skill's output
5. PROCEED to next step with that output as context
```

**Do not skip steps.** The macro-to-micro sequence ensures findings from higher levels inform lower-level work.

---

## QUICK REFERENCE: SKILL BY WORKFLOW POSITION

| Workflow | Phase | Step | Skill |
|----------|-------|------|-------|
| Audit | 1 Macro | 1.1 | seo-plan |
| Audit | 1 Macro | 1.2 | seo-audit |
| Audit | 1 Macro | 1.3 | seo-technical |
| Audit | 1 Macro | 1.4 | seo-structure-architect |
| Audit | 1 Macro | 1.5 | seo-hreflang / seo-programmatic |
| Audit | 2 Meso | 2.1 | seo-content + seo-content-auditor |
| Audit | 2 Meso | 2.2 | seo-cannibalization-detector |
| Audit | 2 Meso | 2.3 | seo-aeo-content-cluster + seo-content-planner |
| Audit | 2 Meso | 2.4 | seo-aeo-internal-linking |
| Audit | 2 Meso | 2.5 | seo-schema + seo-aeo-schema-generator |
| Audit | 2 Meso | 2.6 | seo-sitemap |
| Audit | 3 Micro | 3.1 | seo-page |
| Audit | 3 Micro | 3.2 | seo-keyword-strategist |
| Audit | 3 Micro | 3.3 | seo-meta-optimizer + seo-aeo-meta-description-generator |
| Audit | 3 Micro | 3.4 | seo-snippet-hunter |
| Audit | 3 Micro | 3.5 | seo-images + seo-image-gen |
| Audit | 3 Micro | 3.6 | seo-content-refresher + seo-authority-builder |
| Content | 1 Macro | 1.1 | seo-aeo-keyword-research + seo-keyword-strategist |
| Content | 1 Macro | 1.2 | seo-aeo-content-cluster + seo-content-planner |
| Content | 1 Macro | 1.3 | seo-competitor-pages + seo-plan |
| Content | 1 Macro | 1.4 | seo-programmatic |
| Content | 2 Meso | 2.1 | seo-content-planner |
| Content | 2 Meso | 2.2 | seo-aeo-internal-linking |
| Content | 2 Meso | 2.3 | seo-aeo-schema-generator + seo-schema |
| Content | 3 Micro | 3.1 | seo-aeo-blog-writer / seo-aeo-landing-page-writer / seo-content-writer |
| Content | 3 Micro | 3.2 | seo-keyword-strategist + seo-meta-optimizer + seo-aeo-meta-description-generator |
| Content | 3 Micro | 3.3 | seo-structure-architect + seo-aeo-schema-generator |
| Content | 3 Micro | 3.4 | seo-snippet-hunter |
| Content | 3 Micro | 3.5 | seo-image-gen + seo-images |
| Content | 3 Micro | 3.6 | seo-page |
| Content | 4 Post | - | seo-sitemap, seo-audit, seo-content-refresher, seo-cannibalization-detector, seo-geo |