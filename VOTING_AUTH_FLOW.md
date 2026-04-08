# Voting Service Authentication Flow

## 1. App Initialization Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User Opens App                                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ main.tsx renders                                            │
│ - Provider (Redux)                                          │
│ - QueryClientProvider                                       │
│ - AuthInitializer (main app auth)                           │
│ - VotingAuthProvider (NEW)                                  │
│ - AppRouter                                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ VotingAuthProvider mounts                                   │
│ useEffect runs on mount                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ initializeAuth() called                                     │
│ - Sets isLoading = true                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ fetchCurrentVotingUser() called                             │
│ - Gets authToken from localStorage                          │
│ - Gets serviceTicket from env/localStorage                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ GET /auth/me                                                │
│ Headers:                                                    │
│   X-Service-Ticket: <ticket>                                │
│   Authorization: Bearer <token>                             │
│   Content-Type: application/json                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │          │
                    ▼          ▼
            ┌──────────────┐  ┌──────────────┐
            │ 200 OK       │  │ 401 Unauth   │
            └──────┬───────┘  └──────┬───────┘
                   │                 │
                   ▼                 ▼
            ┌──────────────┐  ┌──────────────┐
            │ Parse user   │  │ Clear auth   │
            │ Set in state │  │ Return null  │
            │ isLoading=F  │  │ isLoading=F  │
            └──────┬───────┘  └──────┬───────┘
                   │                 │
                   └────────┬────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │ VotingAuthContext│
                   │ ready for use    │
                   └──────────────────┘
```

## 2. Poll Fetch Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Component: PollsDashboard                                   │
│ useVotingAuthUser() → { user, isInitialized }               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Wait for votingAuthReady                                    │
│ if (!votingAuthReady) return loading state                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Call fetchPolls()                                           │
│ (NO parameters - backend filters by user)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ votingApi.ts: fetchPolls()                                  │
│ - Call getVotingServiceHeaders()                            │
│ - Build headers with ticket + bearer token                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ GET /polls                                                  │
│ Headers:                                                    │
│   X-Service-Ticket: <ticket>                                │
│   Authorization: Bearer <token>                             │
│   Content-Type: application/json                            │
│                                                             │
│ Query: (NONE - backend filters)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend: Voting-Service                                     │
│ 1. Validate Bearer token                                    │
│ 2. Extract user ID from token                               │
│ 3. Query: SELECT * FROM polls WHERE createdById = userId    │
│ 4. Return filtered polls                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Response: { polls: [...] }                                  │
│ Only polls created by logged-in user                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Component: setPolls(data)                                   │
│ Render poll list                                            │
└─────────────────────────────────────────────────────────────┘
```

## 3. Poll Creation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Component: CreatePollPage                                   │
│ User fills form:                                            │
│   - title: "Team Decision"                                  │
│   - description: "What should we do?"                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Create Poll"                                   │
│ handleSubmit() called                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Call createPoll({                                           │
│   title: "Team Decision",                                   │
│   description: "What should we do?"                         │
│ })                                                          │
│                                                             │
│ NOTE: NO createdById sent                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ votingApi.ts: createPoll()                                  │
│ - Call getVotingServiceHeaders()                            │
│ - Build headers with ticket + bearer token                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /polls                                                 │
│ Headers:                                                    │
│   X-Service-Ticket: <ticket>                                │
│   Authorization: Bearer <token>                             │
│   Content-Type: application/json                            │
│                                                             │
│ Body:                                                       │
│ {                                                           │
│   "title": "Team Decision",                                 │
│   "description": "What should we do?"                       │
│ }                                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend: Voting-Service                                     │
│ 1. Validate Bearer token                                    │
│ 2. Extract user ID from token                               │
│ 3. Create poll with:                                        │
│    - title: "Team Decision"                                 │
│    - description: "What should we do?"                      │
│    - createdById: <extracted user ID>                       │
│    - status: "DRAFT"                                        │
│    - createdAt: now()                                       │
│ 4. Return created poll                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Response: Poll object                                       │
│ {                                                           │
│   "id": "poll-123",                                         │
│   "title": "Team Decision",                                 │
│   "description": "What should we do?",                      │
│   "status": "DRAFT",                                        │
│   "createdById": "user-456",                                │
│   "createdAt": "2026-04-07T10:30:00Z"                       │
│ }                                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Component: Navigate to poll details                         │
│ Poll is now visible in user's poll list                     │
└─────────────────────────────────────────────────────────────┘
```

## 4. Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│ API Request (any endpoint)                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Response received                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────┴────┬────────┬────────┐
                    │         │        │        │
                    ▼         ▼        ▼        ▼
            ┌──────────┐ ┌──────┐ ┌──────┐ ┌──────┐
            │ 200 OK   │ │ 401  │ │ 403  │ │ 400  │
            └──────┬───┘ └──┬───┘ └──┬───┘ └──┬───┘
                   │        │        │        │
                   ▼        ▼        ▼        ▼
            ┌──────────┐ ┌──────────┐ ┌──────────┐
            │ Return   │ │ Clear    │ │ Throw    │
            │ data     │ │ auth     │ │ error    │
            │          │ │ Return   │ │          │
            │          │ │ null     │ │          │
            └──────┬───┘ └──────┬───┘ └──────┬───┘
                   │           │            │
                   └─────┬─────┴────────────┘
                         │
                         ▼
            ┌──────────────────────────┐
            │ handleResponse()          │
            │ - Parse JSON              │
            │ - Check status            │
            │ - Return or throw         │
            └──────────────────────────┘
```

## 5. Multi-User Scenario

```
┌─────────────────────────────────────────────────────────────┐
│ User A (alice@example.com)                                  │
│ - Logs in                                                   │
│ - authToken = "token_alice"                                 │
│ - VotingAuthProvider initializes                            │
│ - GET /auth/me → user_id = "alice-123"                      │
│ - Calls fetchPolls()                                        │
│ - Backend filters: WHERE createdById = "alice-123"          │
│ - Sees: [Poll A, Poll B]                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ User A creates Poll C                                       │
│ - POST /polls with title "Poll C"                           │
│ - Backend sets createdById = "alice-123"                    │
│ - Poll C now visible in User A's list                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ User A logs out                                             │
│ - authToken removed from localStorage                       │
│ - VotingAuthProvider clears user state                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ User B (bob@example.com)                                    │
│ - Logs in                                                   │
│ - authToken = "token_bob"                                   │
│ - VotingAuthProvider initializes                            │
│ - GET /auth/me → user_id = "bob-456"                        │
│ - Calls fetchPolls()                                        │
│ - Backend filters: WHERE createdById = "bob-456"            │
│ - Sees: [Poll D] (NOT Poll A, B, or C)                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ User B creates Poll E                                       │
│ - POST /polls with title "Poll E"                           │
│ - Backend sets createdById = "bob-456"                      │
│ - Poll E now visible in User B's list                       │
│ - Poll E NOT visible to User A                              │
└─────────────────────────────────────────────────────────────┘
```

## 6. Debug Logging Flow (Dev Mode)

```
┌─────────────────────────────────────────────────────────────┐
│ Browser Console (Dev Mode)                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ [VotingAuth] Request headers: {                             │
│   hasTicket: true,                                          │
│   hasBearer: true                                           │
│ }                                                           │
│                                                             │
│ (No secrets logged - only flags)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ [VotingAuth] User loaded: {                                 │
│   id: '123',                                                │
│   username: 'john'                                          │
│ }                                                           │
│                                                             │
│ (User object logged for debugging)                          │
└─────────────────────────────────────────────────────────────┘
```

## Summary

The authentication flow ensures:

1. ✅ User context is established on app startup
2. ✅ All requests include proper auth headers
3. ✅ Backend filters polls by logged-in user
4. ✅ Poll creation automatically assigns owner
5. ✅ Errors are handled gracefully
6. ✅ Debug information is available in dev mode
7. ✅ No secrets are exposed in logs
8. ✅ Multi-user scenarios are properly isolated
