export const VOTING_PERMISSION_KEYS = {
  POLLS: {
    CREATE: ["Voting.Polls.Create"],
    VIEW: ["Voting.Polls.View"],
    EDIT: ["Voting.Polls.Edit"],
    DELETE: ["Voting.Polls.Delete"],
    ACTIVATE: ["Voting.Polls.Activate"],
    CLOSE: ["Voting.Polls.Close"],
  },
  OPTIONS: {
    CREATE: ["Voting.Options.Create"],
    VIEW: ["Voting.Options.View"],
    EDIT: ["Voting.Options.Edit"],
    DELETE: ["Voting.Options.Delete"],
  },
  ELIGIBILITY: {
    CREATE: ["Voting.Eligibility.Create"],
    VIEW: ["Voting.Eligibility.View"],
    DELETE: ["Voting.Eligibility.Delete"],
  },
  VOTE: {
    CREATE: ["Voting.Vote.Create"],
  },
  RESULTS: {
    VIEW: ["Voting.Results.View"],
  },
} as const;

const unique = (permissionKeys: readonly string[]): string[] =>
  Array.from(new Set(permissionKeys));

export const VOTING_ROUTE_PERMISSION_KEYS = {
  HOME: unique([
    ...VOTING_PERMISSION_KEYS.POLLS.CREATE,
    ...VOTING_PERMISSION_KEYS.POLLS.VIEW,
    ...VOTING_PERMISSION_KEYS.POLLS.EDIT,
    ...VOTING_PERMISSION_KEYS.POLLS.DELETE,
    ...VOTING_PERMISSION_KEYS.POLLS.ACTIVATE,
    ...VOTING_PERMISSION_KEYS.POLLS.CLOSE,
    ...VOTING_PERMISSION_KEYS.OPTIONS.CREATE,
    ...VOTING_PERMISSION_KEYS.OPTIONS.VIEW,
    ...VOTING_PERMISSION_KEYS.OPTIONS.EDIT,
    ...VOTING_PERMISSION_KEYS.OPTIONS.DELETE,
    ...VOTING_PERMISSION_KEYS.ELIGIBILITY.CREATE,
    ...VOTING_PERMISSION_KEYS.ELIGIBILITY.VIEW,
    ...VOTING_PERMISSION_KEYS.ELIGIBILITY.DELETE,
    ...VOTING_PERMISSION_KEYS.VOTE.CREATE,
    ...VOTING_PERMISSION_KEYS.RESULTS.VIEW,
  ]),
  DASHBOARD: unique([
    ...VOTING_PERMISSION_KEYS.POLLS.VIEW,
    ...VOTING_PERMISSION_KEYS.POLLS.CREATE,
  ]),
  CREATE_POLL: unique([...VOTING_PERMISSION_KEYS.POLLS.CREATE]),
  POLL_DETAILS: unique([...VOTING_PERMISSION_KEYS.POLLS.VIEW]),
  VOTE: unique([...VOTING_PERMISSION_KEYS.VOTE.CREATE]),
  RESULTS: unique([...VOTING_PERMISSION_KEYS.RESULTS.VIEW]),
} as const;

export type VotingPermissionDomain = keyof typeof VOTING_PERMISSION_KEYS;