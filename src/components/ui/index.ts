// CLI template shim — do not hand-edit components.
//
// Park UI's `file-upload.tsx` (fresh CLI download) imports `Span` from
// `@/components/ui` — the CLI's *default* alias path. Our `components.json`
// overrides `ui` to `@/core/ui`, but the CLI does not rewrite this particular
// import. This barrel makes that path resolve to the native Park UI `Span`
// component so the pristine CLI file compiles unmodified.
export { Span, type SpanProps } from '@/core/ui/span'
