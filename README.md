# 💸 hisaab

Settle group expenses fairly — trips, outings, flatmates. No more "main tujhe baad mein de dunga."

## Problem

A user wants a tool that splits group expenses fairly, so that everyone's share is settled without doing mental math or awkward spreadsheet talks.

## User Stories

- As a group coordinator, I want to create a group with a title, so that I can track expenses per event/trip.
- As a member, I want to add members to the group, so that everyone is included in the split.
- As a member, I want to log an expense (amount, description, who paid), so that the group's record is accurate.
- As a member, I want expenses auto-split equally among all members, so that nobody does manual math.
- As a participant, I want a dashboard of who owes how much to whom, so that I know my financial standing.
- As a member, I want to edit/delete a wrongly entered expense, so that records stay truthful.

## Scope

| Phase    | Features                                               |
| -------- | ------------------------------------------------------ |
| v1 (MVP) | group + members → add expense (equal split) → balances |
| v2       | settlements (mark paid), activity feed                 |
| v3       | exact/percentage splits                                |

## Core Design Decisions

- Single source of truth: only facts are stored (members, expenses). Balances/totals are always DERIVED by calculation — never stored.
- Every member & expense gets a unique ID (names are for display, never identity).
- Architecture: FACTS (plain JSON-safe objects) → RULES (pure functions) → VIEWS (DOM).

## Tech

JavaScript (vanilla), Git & GitHub. UI later; engine first.
