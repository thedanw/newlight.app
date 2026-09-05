# Plan: Email Module (send-only, drag-drop editor) — design in progress

**Goal:** Add an email component to the New Light CRM that lets admins/staff send emails to people in the church database through a drag-drop modular editor. No inbox. The editor must support draggable blocks and be extensible so future blocks can be populated by other modules (e.g. the events calendar). The capability must be embeddable from other modules (built into core, extensible as its own feature). Prefer free / open-source / white-labellable libraries compatible with existing decisions.

**Brainstorm skill:** `.agents/skills/boss/code-plan/01_brainstorming/SKILL.md`

**Understanding Lock CONFIRMED 2026-08-08** — see decision.md. Core picks: foundation module (core #13), GrapesJS editor, Google Workspace SMTP via Edge Fn, global sender + alias override, edit-time snapshot data blocks, templates + send history MVP, unsubscribe/suppression/consent now, consent flags `broadcasts` + `team_updates` in people module.

## Decision logs (from brainstorming)
- [Email decisions](decision.md) (created after Understanding Lock)
- [Research findings](findings.md)
- Upstream: [Core Platform decisions](../core/decision.md) · [Module design + agent containment](../module-design/decision.md) · [UI/CSS decisions](../ui-ux/decision.md) · [People Module decisions](../people/decision.md) (contact channels/consents source)
