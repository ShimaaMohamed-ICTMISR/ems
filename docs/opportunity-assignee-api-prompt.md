# Backend prompt — Opportunity assignee on `GET /opportunities/:id`

## Problem (frontend)

After `PATCH /api/v1/opportunities/{id}/assign` with body `{ "userId": "<uuid>", "role": "owner" }`, a `GET /api/v1/opportunities/{id}` often does **not** return a field the UI can use to show the assigned person’s name (or to match HR employee records). After a full page refresh, the UI loses in-memory state.

## What the frontend expects (pick one or more)

Include in the **opportunity** JSON returned by `GET` (and list endpoints if useful):

1. **Stable id** — at least one of:
   - `assignedTo` (string UUID)
   - `ownerId` (string UUID)
   - `userId` (string UUID) — same value sent in assign, or the canonical user id in your domain

2. **Human-readable (recommended)** — at least one of:
   - `assigneeName` (string), e.g. `"Ahmed Mohamed"`
   - `ownerName` (string)

3. **Consistency** — If assign uses HR **employee** id, return that same id in one of the fields above **or** return the **auth user** id that your identity service uses, and document which one. The EMS HR employee list is keyed by **employee `id`**; mismatch causes “—” in the UI unless we use localStorage workaround.

## Optional nested shape

```json
{
  "assignee": { "id": "uuid", "fullName": "...", "email": "..." }
}
```

## Acceptance criteria

- After assign, **without** relying on the SPA, `GET /opportunities/:id` includes enough data to know **who** is assigned.
- Same device/browser refresh shows the same assignee (true source of truth = API).

---

*Copy-paste the sections above to your Opportunity Management service backlog / Cursor prompt for the Nest (or other) backend repo.*
