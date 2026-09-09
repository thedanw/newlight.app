# Decision: Heading Breadcrumb System

Separate the Page.Header's dual role into a **hero banner** (visual identity) and a **heading/breadcrumb layer** (navigation context) for module dashboards and settings pages.

**Scope:** Module developers, settings authors, core maintainers.
**Constraints:** Existing Page slot recipe, hero styling, react-router-dom v7, dynamic settings registration. Header padding/solid background (::before) with content-stick + background-scroll on scroll.
**Non-Goals:** Sidebar changes, Page.Body layout, new wrapper.
**Assumptions:** Module manifests expose `id,name,icon,number,basePath`; settings have stable `id,title`; `useLocation`/`useNavigate` available.

## Decision Log: decision → Rationale (hierarchical; parent = decision, sub = dependent)
1. Breadcrumbs live inside Page.Header, not Page.Body → requirement
   1.1 Page.Heading = sticky inner bar; Page.Header = scrolling background → component-first; siblings in Header scroll away with background
   1.2 Header background scrolls away; heading content sticks at top → requirement
2. Page.Main scroll wrapper holds Page.Header + Page.Body → keeps Page.Footer outside scroll container (always visible)
   2.1 Page.Footer stays outside scroll container → Save/Cancel must remain reachable
3. Breadcrumb rendered as 3 discrete patterns (Level 0/1/2) → requirement; avoids generic recursive complexity
   3.1 Level 0 (dashboard): icon + module name; icon from manifest → consistent with sidebar
   3.2 Level 1 (first subpage): icon + page title
   3.3 Level 2+ (deep subpage): icon + ⬅ + page title; back = navigate(-1) → generic, robust for arbitrary depth
4. App home (/): no breadcrumb, logo link only → requirement
5. Module subpage header: sticky at top (default variant) → requirement
6. Hero header: sticky (not fixed) → preserves document flow, avoids Page.Body overlap
7. Breadcrumb fontSize '3xl' → requirement

## Approaches Considered
**Recommended:** Context-based `Page.Heading` compound component — auto-renders breadcrumb by route depth via `ModuleBreadcrumbProvider`; modules opt in by wrapping routes.
**Rejected:** Manual breadcrumb props — duplicates routing logic across every page. Route meta data — higher cost, ignores existing manifest/schema.
