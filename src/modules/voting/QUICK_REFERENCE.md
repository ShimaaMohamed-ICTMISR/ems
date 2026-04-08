# Voting Service Auth - Quick Reference

## TL;DR

The voting service now automatically filters polls by the logged-in user. No need to pass `createdBy` anymore.

## Common Tasks

### Access Current Voting User

```typescript
import { useVotingAuthUser } from './hooks/useVotingAuthUser';

function MyComponent() {
  const { user, isAuthenticated } = useVotingAuthUser();
  
  if (!isAuthenticated) return <div>Not authenticated</div>;
  return <div>User: {user?.username}</div>;
}
```

### Fetch Polls (Auto-filtered by User)

```typescript
import { fetchPolls } from './api/votingApi';

async function loadPolls() {
  const { polls } = await fetchPolls();
  // polls are already filtered by logged-in user
}
```

### Create Poll (Auto-assigned to User)

```typescript
import { createPoll } from './api/votingApi';

async function createNewPoll() {
  const poll = await createPoll({
    title: 'My Poll',
    description: 'Optional description'
  });
  // poll.createdById is set automatically by backend
}
```

### Check Auth Status

```typescript
import { useVotingAuthUser } from './hooks/useVotingAuthUser';

function MyComponent() {
  const { isInitialized, isLoading, error } = useVotingAuthUser();
  
  if (isLoading) return <div>Loading auth...</div>;
  if (error) return <div>Auth error: {error}</div>;
  if (!isInitialized) return <div>Not initialized</div>;
  
  return <div>Ready!</div>;
}
```

## What Changed

| Before | After |
|--------|-------|
| `fetchPolls(userId)` | `fetchPolls()` |
| `createPoll({ title, createdById })` | `createPoll({ title })` |
| Manual user ID passing | Automatic from auth context |
| No auth context | VotingAuthProvider wraps app |

## Debug Mode

In development, check console for:
```
[VotingAuth] Request headers: { hasTicket: true, hasBearer: true }
[VotingAuth] User loaded: { id: '123', username: 'john' }
```

## Common Issues

### "User is null"
- Check if VotingAuthProvider is wrapping your component
- Check if authToken is in localStorage
- Check browser Network tab for `/auth/me` response

### "401 Unauthorized"
- authToken may be expired
- Try logging out and back in
- Check if X-Service-Ticket is valid

### "Polls not showing"
- Wait for `isInitialized` to be true
- Check if user is authenticated
- Check browser Network tab for `/polls` response

## Files to Know

- `votingAuthService.ts` - Low-level auth utilities
- `VotingAuthContext.tsx` - React context provider
- `useVotingAuthUser.ts` - Hook to access auth state
- `votingApi.ts` - API client (updated)
- `PollsDashboard.tsx` - Example usage

## Environment

```env
# Optional
VITE_VOTING_SERVICE_TICKET=your-ticket
```

## Next Steps

1. Wrap app with `VotingAuthProvider` (already done in main.tsx)
2. Use `useVotingAuthUser()` in components
3. Call `fetchPolls()` without parameters
4. Test with multiple users
5. Check debug logs in DevTools
