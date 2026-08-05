# Plan: New Light Anglican Church CRM - Base Platform

**Goal:** Build a lightweight, modular web application CRM platform for New Light Anglican Church with a baseline "people" module and extensible architecture for additional modules (groups, services, calendar) that can be independently developed and toggled on/off, using Supabase free tier for data storage.

**Current brainstorm (authentication):** Phone + SMS-code login for all users alongside email/password, magic link, OAuth. Single "email or mobile" identifier, then password OR SMS code (touchSMS). MFA-for-admin removed (#10). Driven by `01_brainstorming` skill; decisions land in [core decision.md](decision.md).

**New brainstorm (chat module):** Add a chat component allowing team leaders/members to communicate with opt-in gating — a user can only be messaged once they've accepted the chat/notification feature in the app on their phone. Team leaders can send a push notification (or in-app/SMS nudge) asking the user to accept chat notifications. Once enabled, browser + device notifications and popups behave like any chat app. Driven by `01_brainstorming` skill; decisions land in [chat decision.md](../chat/decision.md).

## Decision Logs (from brainstorming)
- [Core Platform decisions](decision.md)
- [People Module decisions](../people/decision.md)