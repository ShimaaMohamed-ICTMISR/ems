# انسخ المحتوى من الأسفل وأرسله لـ Cursor على ريبو الـ Backend (Opportunity Management Service)

---

## Task: Expose assigned user on `GET /api/v1/opportunities/:id` (and list if easy)

### Context
The SPA calls `PATCH /api/v1/opportunities/{id}/assign` with body:
```json
{ "userId": "<uuid>", "role": "owner" }
```
After a full page refresh, `GET /api/v1/opportunities/{id}` does not return enough fields for the UI to show **who is assigned**. The frontend needs stable, documented fields on the opportunity entity in JSON responses.

### Requirements

1. **Persist assignment**  
   Ensure the user/assignee chosen in `PATCH .../assign` is stored on the opportunity (or relation) and **always** included when serializing the opportunity for `GET /opportunities/:id` and ideally `GET /opportunities` (paginated list).

2. **Response shape — include at least ONE id field** (string UUID), same semantics as stored at assign time:
   - Prefer one canonical name, e.g. `assignedTo` **or** `ownerId` **or** `userId`  
   - Document which field is the source of truth (HR employee id vs auth user id).

3. **Response shape — strongly recommended: display name**  
   Add at least one of:
   - `assigneeName` (string), e.g. full name for UI  
   - or `ownerName` (string)  
   - or nested: `assignee: { id, fullName, email }` (or equivalent)

4. **Consistency**  
   - The id returned in `GET` must match what clients send in `assign` **or** be clearly documented if you normalize to an internal user id.  
   - If the assign endpoint accepts HR employee id but you store auth `userId`, return **both** or return the id the EMS HR module uses for matching (`employee.id`).

5. **OpenAPI / Swagger**  
   Update `docs-json` (or OpenAPI schema) so the Opportunity schema documents the new/updated properties.

### Acceptance criteria
- After assign, calling `GET /api/v1/opportunities/{id}` in Postman/curl shows assignee id + (preferably) display name without relying on the SPA.
- Refreshing the browser shows the same assignee when the frontend maps id/name to HR/users.

### Out of scope
- Changing the EMS frontend repo; only the Opportunity Management backend service.

---

**End of prompt — paste everything from "Task:" through "Out of scope" into Cursor.**
