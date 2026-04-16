import axios from "axios";

const GENERIC_MESSAGES = [
  "an error occurred",
  "one or more validation errors occurred",
  "validation failed",
  "request failed",
  "bad request",
];

function normalizeMessage(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isGenericMessage(value: string): boolean {
  const normalized = normalizeMessage(value).toLowerCase();
  return GENERIC_MESSAGES.some((generic) => normalized.includes(generic));
}

function pushMessage(target: string[], value: unknown): void {
  if (typeof value !== "string") {
    return;
  }

  const normalized = normalizeMessage(value);
  if (!normalized) {
    return;
  }

  if (!target.includes(normalized)) {
    target.push(normalized);
  }
}

function collectMessages(payload: unknown, target: string[]): void {
  if (!payload) {
    return;
  }

  if (typeof payload === "string") {
    pushMessage(target, payload);
    return;
  }

  if (Array.isArray(payload)) {
    payload.forEach((item) => collectMessages(item, target));
    return;
  }

  if (typeof payload !== "object") {
    return;
  }

  const record = payload as Record<string, unknown>;

  // Common API envelope/message fields
  pushMessage(target, record.message);
  pushMessage(target, record.error);
  pushMessage(target, record.title);
  pushMessage(target, record.detail);

  // ASP.NET validation payload shape: { errors: { field: ["msg"] } }
  const errors = record.errors;
  if (errors && typeof errors === "object") {
    Object.values(errors as Record<string, unknown>).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach((item) => pushMessage(target, item));
        return;
      }
      pushMessage(target, value);
    });
  }

  // Nested envelopes often use data/data.data
  if ("data" in record) {
    collectMessages(record.data, target);
  }
}

export function extractApiErrorMessage(
  error: unknown,
  fallback = "Operation failed.",
): string {
  const messages: string[] = [];

  if (axios.isAxiosError(error)) {
    collectMessages(error.response?.data, messages);
    pushMessage(messages, error.message);
  } else if (error instanceof Error) {
    pushMessage(messages, error.message);
    collectMessages(error, messages);
  } else {
    collectMessages(error, messages);
  }

  const specificMessage = messages.find((message) => !isGenericMessage(message));
  if (specificMessage) {
    return specificMessage;
  }

  return messages[0] || fallback;
}
