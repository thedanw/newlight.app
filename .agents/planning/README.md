# New Light App Overview

## Purpose
This app is a church operations platform built around a shared people-first core, with feature modules layered on top. The goal is to keep domain boundaries clear, support incremental delivery, and make future module development predictable for small-context LLMs and humans.

## Component map

### 1) Core platform
Primary app infrastructure and shared contracts.

- People core
- Auth / identity
- Database schema and migrations
- Shared UI primitives
- Routing and app shell
- Settings and module registry
- Audit and soft-delete patterns

Use this as the stable foundation. Most other components depend on it.

### 2) Modules
Feature areas that are user-facing and logically self-contained.

- Services
- Groups
- Events
- Reports
- Website
- People

Module rule:
- Own their feature logic and UI under `src/modules/<name>/`
- Expose a typed public API
- Declare dependencies in a manifest
- Can be disabled in `module_config` without uninstalling data

Best categorisation:
- Business capability module: Services, Groups, Events, Reports, Website
- Always-on domain module: People

### 3) Tools
Operational utilities that support workflows but are not full product modules.

- Chat
- Email
- Audit / monitoring tools
- Background jobs / scheduler
- Import/export tooling

Tool rule:
- Not a full user feature surface
- Usually cross-cutting and shared by several modules
- Often integrate with external systems or internal automation

Best categorisation:
- Integration utility: email, chat connectors
- Workflow utility: reports generation, bulk import, scheduled tasks
- Ops utility: audit, telemetry, reconciliation

### 4) Plugins / extensions
Extensions that are not baked into the app shell but can remain logically isolated.

- Elvanto sync
- Third-party service adapters
- Optional integrations
- Feature toggles that add capability without redefining core domain objects

Plugin rule:
- Prefer same-repo compile-time integration
- Do not create runtime package plugins
- Keep contracts explicit and typed
- Availability is controlled by admin settings and feature enablement

Best categorisation:
- Optional capability plugin: Elvanto sync, website embeds, external CRM adapters, analytics
- System adapter plugin: email provider, chat provider, sync connector

Elvanto sync is a plugin: it is optional, integration-specific, and should be surfaced in Super Admin settings only when enabled.

### 5) Shared data and domain objects
Cross-cutting data that should not be owned by a single module.

- People and households
- Tags and custom fields
- Audit records
- Journey stages and tracks
- Settings and configs
- Sync metadata and error logs

These are platform concerns, even when consumed by modules.

## Recommended classification model

### A. Core
- Foundation parts: auth, people, schema, settings, routing, UI shell
- Always required for the app to operate

### B. Module
- End-user business feature with clear domain boundary
- Example: Services, Groups, Events, Reports, Website

### C. Tool
- Workflow support or automation utility
- Example: chat, email, sync worker, scheduler

### D. Plugin
- Optional extension with a clear integration seam
- Example: external provider adapters, optional website integrations

### E. Shared domain
- Cross-cutting objects and metadata used by many modules
- Example: audit logs, people identity, sync state, tags

## Recommended prioritisation

### Phase 1
- Core platform
- People module
- Elvanto sync plugin (off by default, enabled in Super Admin settings)
- Shared domain schema

### Phase 2
- Services module
- Groups module
- Events module

### Phase 3
- Reports module
- Website module
- Email and chat tools
- Optional plugins

## Practical boundary rules

- If users directly interact with it as a feature, it is a module.
- If it supports workflows or integrations across features, it is a tool.
- If it is optional and integration-focused, it is a plugin.
- If it is shared by many features, it belongs in core/shared domain.

## Current intake

### Planned or likely modules
- Services
- Groups
- Events
- Reports
- Website
- People

### Planned or likely tools
- Chat
- Email
- Scheduled jobs
- Imports / exports

### Likely plugins / adapters
- Elvanto sync
- External email provider
- External chat provider
- Website integration adapters
- Optional sync connectors

## Short rule of thumb
- Module = feature
- Tool = capability
- Plugin = optional integration extension
- Elvanto sync = plugin, exposed only when enabled in Super Admin settings
- Core = platform
- Shared domain = common data
