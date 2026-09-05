# Decision: Heading Breadcrumb System

## What & Why
Build a unified heading/breadcrumb system for module dashboards and settings pages. The Page.Header currently serves double duty as both a visual hero banner and a navigation context provider. This system separates concerns: the hero header provides visual identity, while a new heading/breadcrumb layer provides navigational context.

## Who
- Module developers adding pages to their modules
- Settings section/page authors
- Core maintainers

## Constraints
- Must work with existing Page slot recipe (root/header/body/footer)
- Must preserve existing hero header styling (hue-rotated backgrounds)
- Must not break existing module dashboards (People, Settings, Example)
- Must be compatible with react-router-dom v7
- Settings pages use dynamic section/page registration
- **Header has padding above/below and a solid background (::before). On scroll, the header content sticks to top, but the background scrolls away with Page.Body**

## Non-Goals
- Changing the sidebar navigation structure
- Modifying the Page.Body layout
- Adding a new top-level layout wrapper

## Assumptions
- Module manifests expose `id`, `name`, `icon`, `number`, `basePath` (confirmed)
- Settings sections/pages have stable `id` and `title` (confirmed)
- react-router-dom `useLocation` and `useNavigate` are available in all module pages (confirmed)

## Decision Log
| # | Decision | Alternatives | Rationale |
|---|----------|-------------|-----------|
| 1 | Place breadcrumbs inside Page.Header, not Page.Body | Keep in Page.Body | Requirement explicitly states "Place Breadcrumbs in the Page.Header" |
| 2 | Use fontSize '3xl' for breadcrumb heading | Use recipe textStyle | Requirement explicitly states fontSize:'3xl' |
| 3 | Hero header scroll behavior: sticky (not fixed) | position: fixed | Sticky preserves document flow and avoids overlap with Page.Body content |
| 4 | Default header on module subpages: sticky at top | No sticky behavior | Requirement: "use the default variant Page.Header fixed at the top of the page" |
| 5 | Breadcrumb levels implemented as 3 discrete patterns | Generic recursive breadcrumb | Requirement specifies exact patterns for level 0, 1, 2 |
| 6 | Dashboard home icon uses module manifest.icon | Hardcoded or prop-driven | Manifest already provides the icon; consistent with sidebar |
| 7 | Subpage level 2 back action uses navigate(-1) | navigate to known parent | Generic back is more robust for arbitrary depth |
| 8 | App home (/) shows no breadcrumb, only logo link | Show home breadcrumb | Requirement: "App home: none" |
| 9 | Header background scrolls away; only Page.Heading content sticks | Entire header sticky | Requirement: heading content stays fixed at top while the colored background + any sibling content scrolls off with Page.Body |
| 10 | Page.Heading is the sticky component; Page.Header is the scrolling background | Wrapper prop on Page.Header | Component-first: Page.Heading renders the sticky inner bar, any sibling content in Page.Header scrolls away with the background |
| 11 | Page scroll wrapper (`Page.Main`) contains `Page.Header` + `Page.Body` | Move scroll to `Page.Root` | Required so `Page.Header` participates in scrolling while keeping `Page.Footer` outside the scroll container (footer stays visible) |
| 12 | `Page.Footer` stays outside scroll container | Make `Page.Footer` sticky at bottom | Footer (e.g., Save/Cancel buttons) must remain visible; keeping it outside `Page.Main` achieves this without sticky positioning |

## Approaches Considered
### Recommended: Context-based Page.Heading component
Create a `Page.Heading` compound component that wraps `Page.Header` and automatically renders the correct breadcrumb pattern based on route depth. It reads module manifest from context, inspects the current route, and renders:
- Level 0 (dashboard root): Icon + Module name
- Level 1 (first subpage): Icon + Page title  
- Level 2+ (deep subpage): Icon + ChevronLeft + Page title

The component uses a `ModuleBreadcrumbProvider` that modules opt into by wrapping their routes.

### Alternative: Manual breadcrumb props
Each page manually passes breadcrumb items to Page.Header. More flexible but requires every page to know its breadcrumb state. Rejected because it duplicates routing logic across N pages.

### Alternative: Route meta data
Define breadcrumb metadata in route definitions. Clean separation but requires modifying every route object and doesn't leverage existing manifest/schema data. Rejected for higher implementation cost.
