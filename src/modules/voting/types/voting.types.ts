export type PollStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';

export interface Poll {
  id: string;
  title: string;
  description: string | null;
  status: PollStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface PollOption {
  id: string;
  pollId: string;
  title: string;
  displayOrder?: number;
  createdAt?: string;
}

export interface PollEligibility {
  id: string;
  pollId: string;
  type: string;
  value: string;
  createdAt?: string;
}

export interface VoteRequest {
  pollOptionId: string;
}

export interface OptionResult {
  pollOptionId: string;
  optionTitle: string;
  voteCount: number;
  percentage: number;
}

export interface PollResults {
  pollId: string;
  totalVotes: number;
  options: OptionResult[];
}

export interface CreatePollRequest {
  title: string;
  description?: string;
}

export interface CreateOptionRequest {
  title: string;
  displayOrder?: number;
}

export interface BulkCreateOptionsRequest {
  options: { title: string; displayOrder?: number }[];
}

export interface UpdateOptionRequest {
  title?: string;
  displayOrder?: number;
}

export interface CreateEligibilityRequest {
  type: string;
  value: string;
}

export type VotingErrorCode = 'NOT_ELIGIBLE' | 'ALREADY_VOTED' | 'POLL_NOT_FOUND' | 'UNKNOWN';
