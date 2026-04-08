# Voting Service Authentication Implementation

## Overview

This document describes the authentication integration between the EMS frontend and the Voting-Service backend.

## Architecture

### Components

1. **votingAuthService.ts** - Low-level auth utilities
   - `getVotingServiceHeaders()` - Builds request headers with X-Service-Ticket and Bearer token
   - `fetchCurrentVotingUser()` - Calls `/auth/me` to get authenticated user
   - `isVotingAuthReady()` - Checks if auth credentials are available

2. **VotingAuthContext.tsx** - React context for voting auth state
   - Manages `VotingAuthUser` state
   - Provides `initializeAuth()` and `logout()` methods
   - Initializes on mount

3. **useVotingAuthUser.ts** - Hook to access voting auth state
   - Returns user, loading, error, and isAuthenticated flags

4. **votingApi.ts** - Updated API client
   - All endpoints now use `getVotingServiceHeaders()`
   - `fetchPolls()` no longer takes `createdBy` parameter
   - Backend filters polls by logged-in user automatically

## Key Changes

### Before
```typescript
// Old: Frontend passed createdBy query parameter
const { polls } = await fetchPolls(userId);
```

### After
```typescript
// New: Backend filters by logged-in user automatically
const { polls } = await fetchPolls();
```

## Request Flow

1. **App Startup**
   - User logs in to main app
   - `authToken` is stored in localStorage
   - `VotingAuthProvider` initializes and calls `/auth/me`
   - Voting user context is populated

2. **API Requests**
   - All voting API calls use `getVotingServiceHeaders()`
   - Headers include:
     - `X-Service-Ticket` (if available)
     - `Authorization: Bearer <token>` (if available)
   - Backend uses these to identify the user

3. **Poll Filtering**
   - `GET /polls` returns only polls created by the logged-in user
   - No `createdBy` query parameter needed
   - Backend handles filtering

## Usage

### Wrap App with Provider

```typescript
import { VotingAuthProvider } from './modules/voting/context/VotingAuthContext';

function App() {
  return (
    <VotingAuthProvider>
      {/* Your app routes */}
    </VotingAuthProvider>
  );
}
```

### Access Voting User in Components

```typescript
import { useVotingAuthUser } from './modules/voting/hooks/useVotingAuthUser';

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useVotingAuthUser();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not authenticated</div>;
  
  return <div>Welcome, {user?.username}</div>;
}
```

### Fetch Polls

```typescript
import { fetchPolls } from './modules/voting/api/votingApi';

async function loadPolls() {
  try {
    const { polls } = await fetchPolls();
    // polls are already filtered by logged-in user
    console.log(polls);
  } catch (error) {
    console.error('Failed to load polls:', error);
  }
}
```

## Error Handling

### 401 Unauthorized
- Triggered when auth token is invalid or expired
- `votingAuthService` logs warning and returns null
- Component should handle null user gracefully

### 403 Forbidden
- User is authenticated but not eligible for the action
- Specific error message is thrown

### Network Errors
- Caught and logged in dev mode
- Error message is returned to caller

## Debug Logging

In development mode, the following is logged:

```
[VotingAuth] Request headers: { hasTicket: true, hasBearer: true }
[VotingAuth] User loaded: { id: '123', username: 'john' }
```

Secrets (ticket, token) are never logged.

## Environment Variables

```env
VITE_VOTING_SERVICE_TICKET=your-ticket-here
```

If not set, defaults to `TEST-SECRET-TICKET-2026`.

## Migration Checklist

- [x] Create voting auth types
- [x] Create voting auth service
- [x] Create voting auth context
- [x] Update voting API to use new headers
- [x] Remove `createdBy` parameter from `fetchPolls()`
- [x] Update PollsDashboard to use new auth
- [ ] Wrap app with VotingAuthProvider
- [ ] Test poll creation and filtering
- [ ] Test 401 error handling
- [ ] Verify debug logs in dev mode

## Testing

### Test Poll Filtering
1. Login as User A
2. Create Poll 1
3. Logout and login as User B
4. Verify Poll 1 is not visible
5. Create Poll 2
6. Verify only Poll 2 is visible

### Test Auth Failure
1. Clear authToken from localStorage
2. Try to access polls
3. Verify error is handled gracefully

### Test Debug Logs
1. Open browser DevTools console
2. Login and navigate to polls
3. Verify `[VotingAuth]` logs appear
4. Verify no secrets are logged
