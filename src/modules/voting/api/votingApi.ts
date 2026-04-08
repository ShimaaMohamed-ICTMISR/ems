import type {
  OptionResult,
  Poll,
  PollOption,
  PollEligibility,
  PollResults,
  CreatePollRequest,
  CreateOptionRequest,
  BulkCreateOptionsRequest,
  UpdateOptionRequest,
  CreateEligibilityRequest,
  VoteRequest,
} from '../types/voting.types';
import { getVotingServiceHeaders } from '../services/votingAuthService';

const BASE_URL = 'http://apigetway.runasp.net/api/voting';

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown = null;
  try {
    if (text) data = JSON.parse(text);
  } catch {
    // ignore
  }

  if (!res.ok) {
    const message = (data as { message?: string })?.message ?? res.statusText ?? 'Request failed';

    if (res.status === 401) {
      const lower = String(message).toLowerCase();
      if (
        lower.includes('x-service-ticket') ||
        lower.includes('service ticket verification failed') ||
        lower.includes('service ticket')
      ) {
        throw new Error(
          'Voting API requires a valid X-Service-Ticket. Check .env.local (VITE_VOTING_SERVICE_TICKET) and ensure the backend is running at ' +
            BASE_URL +
            '.'
        );
      }
    }

    if (res.status === 403) {
      throw new Error(message || 'NOT_ELIGIBLE');
    }
    if (res.status === 400) {
      throw new Error(message);
    }
    if (res.status === 404) {
      throw new Error('POLL_NOT_FOUND');
    }
    throw new Error(message);
  }

  return (data ?? {}) as T;
}

// Polls — GET /polls (backend filters by logged-in user automatically)
export async function fetchPolls(): Promise<{ polls: Poll[] }> {
  const url = `${BASE_URL}/polls`;
  const res = await fetch(url, { headers: getVotingServiceHeaders() });
  const data = await handleResponse<{ polls?: Poll[]; data?: Poll[] } | Poll[]>(res);
  // Support both { polls: [] } and top-level array from backend
  const list = Array.isArray(data)
    ? data
    : (data?.polls ?? data?.data ?? []);
  return { polls: Array.isArray(list) ? list : [] };
}

export async function fetchPoll(id: string): Promise<Poll> {
  const res = await fetch(`${BASE_URL}/polls/${id}`, { headers: getVotingServiceHeaders() });
  return handleResponse(res);
}

export async function createPoll(body: CreatePollRequest): Promise<Poll> {
  const res = await fetch(`${BASE_URL}/polls`, {
    method: 'POST',
    headers: getVotingServiceHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function activatePoll(id: string): Promise<Poll> {
  const res = await fetch(`${BASE_URL}/polls/${id}/activate`, {
    method: 'PATCH',
    headers: getVotingServiceHeaders(),
  });
  return handleResponse(res);
}

export async function closePoll(id: string): Promise<Poll> {
  const res = await fetch(`${BASE_URL}/polls/${id}/close`, {
    method: 'PATCH',
    headers: getVotingServiceHeaders(),
  });
  return handleResponse(res);
}

export async function deletePoll(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/polls/${id}`, {
    method: 'DELETE',
    headers: getVotingServiceHeaders(),
  });
  if (!res.ok) await handleResponse(res);
}

// Options
export async function fetchPollOptions(
  pollId: string
): Promise<{ options: PollOption[] }> {
  const res = await fetch(`${BASE_URL}/polls/${pollId}/options`, { headers: getVotingServiceHeaders() });
  const data = await handleResponse<{ options?: PollOption[]; data?: PollOption[] } | PollOption[]>(res);
  const list = Array.isArray(data)
    ? data
    : (data?.options ?? data?.data ?? []);
  return { options: Array.isArray(list) ? list : [] };
}

export async function createPollOption(
  pollId: string,
  body: CreateOptionRequest
): Promise<PollOption> {
  const res = await fetch(`${BASE_URL}/polls/${pollId}/options`, {
    method: 'POST',
    headers: getVotingServiceHeaders(),
    body: JSON.stringify({
      optionText: body.title,
      ...(body.displayOrder != null && { displayOrder: body.displayOrder }),
    }),
  });
  const raw = await handleResponse<PollOption | { option?: PollOption; data?: PollOption }>(res);
  if (raw && typeof raw === 'object' && 'id' in raw) return raw as PollOption;
  const option = (raw as { option?: PollOption; data?: PollOption })?.option ?? (raw as { option?: PollOption; data?: PollOption })?.data;
  if (option && typeof option === 'object') return option;
  return raw as PollOption;
}

export async function bulkCreatePollOptions(
  pollId: string,
  body: BulkCreateOptionsRequest
): Promise<{ options: PollOption[] }> {
  const res = await fetch(`${BASE_URL}/polls/${pollId}/options/bulk`, {
    method: 'POST',
    headers: getVotingServiceHeaders(),
    body: JSON.stringify({
      options: body.options.map((o) => ({
        optionText: o.title,
        ...(o.displayOrder != null && { displayOrder: o.displayOrder }),
      })),
    }),
  });
  return handleResponse(res);
}

export async function updatePollOption(
  pollId: string,
  optionId: string,
  body: UpdateOptionRequest
): Promise<PollOption> {
  const payload: Record<string, unknown> = {};
  if (body.title != null) payload.optionText = body.title;
  if (body.displayOrder != null) payload.displayOrder = body.displayOrder;
  const res = await fetch(`${BASE_URL}/polls/${pollId}/options/${optionId}`, {
    method: 'PUT',
    headers: getVotingServiceHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deletePollOption(
  pollId: string,
  optionId: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/polls/${pollId}/options/${optionId}`, {
    method: 'DELETE',
    headers: getVotingServiceHeaders(),
  });
  if (!res.ok) await handleResponse(res);
}

// Eligibility
export async function fetchEligibility(
  pollId: string
): Promise<{ eligibility: PollEligibility[] }> {
  const res = await fetch(`${BASE_URL}/polls/${pollId}/participants/eligibility`, {
    headers: getVotingServiceHeaders(),
  });
  return handleResponse(res);
}

export async function createEligibility(
  pollId: string,
  body: CreateEligibilityRequest
): Promise<PollEligibility> {
  const res = await fetch(`${BASE_URL}/polls/${pollId}/participants/eligibility`, {
    method: 'POST',
    headers: getVotingServiceHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function deleteEligibility(
  pollId: string,
  eligibilityId: string
): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/polls/${pollId}/participants/eligibility/${eligibilityId}`,
    { method: 'DELETE', headers: getVotingServiceHeaders() }
  );
  if (!res.ok) await handleResponse(res);
}

// Vote
export async function submitVote(
  pollId: string,
  body: VoteRequest
): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/polls/${pollId}/vote`, {
    method: 'POST',
    headers: getVotingServiceHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

// Results
export async function fetchPollResults(pollId: string): Promise<PollResults> {
  const res = await fetch(`${BASE_URL}/polls/${pollId}/results`, { headers: getVotingServiceHeaders() });
  const data = await handleResponse<
    | PollResults
    | {
        pollId?: string;
        totalVotes?: number;
        options?: unknown[];
        data?: unknown[];
        byOption?: unknown[];
      }
  >(res);

  const pollIdValue =
    (data as PollResults).pollId ??
    (data as { pollId?: string }).pollId ??
    pollId;

  const totalVotesValue =
    (data as PollResults).totalVotes ??
    (data as { totalVotes?: number; total?: number }).totalVotes ??
    (data as { totalVotes?: number; total?: number }).total ??
    0;

  const rawOptions =
    (data as PollResults).options ??
    (data as { options?: unknown[] }).options ??
    (data as { byOption?: unknown[] }).byOption ??
    (data as { data?: unknown[] }).data ??
    [];

  const options: OptionResult[] = Array.isArray(rawOptions)
    ? rawOptions.map((o) => {
        const obj = o as unknown as Record<string, unknown>;
        const pollOptionId =
          (obj.pollOptionId as string | undefined) ??
          (obj.optionId as string | undefined) ??
          (obj.id as string | undefined) ??
          '';
        const optionTitle =
          (obj.optionTitle as string | undefined) ??
          (obj.optionText as string | undefined) ??
          (obj.title as string | undefined) ??
          (obj.name as string | undefined) ??
          '';
        const voteCount =
          (obj.voteCount as number | undefined) ??
          (obj.votes as number | undefined) ??
          (obj.count as number | undefined) ??
          0;
        const percentage =
          (obj.percentage as number | undefined) ??
          (obj.percent as number | undefined) ??
          (obj.percentageOfTotal as number | undefined) ??
          0;

        return {
          pollOptionId,
          optionTitle,
          voteCount,
          percentage,
        };
      })
    : [];

  return {
    pollId: pollIdValue,
    totalVotes: totalVotesValue,
    options,
  };
}

export function setServiceTicket(ticket: string): void {
  if (ticket) localStorage.setItem('voting-service-ticket', ticket);
  else localStorage.removeItem('voting-service-ticket');
}

export function getVotingApiBaseUrl(): string {
  return BASE_URL;
}
