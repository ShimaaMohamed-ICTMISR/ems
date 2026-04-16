const DATE_ONLY_PREFIX_REGEX = /^(\d{4}-\d{2}-\d{2})/;

function extractDateOnly(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const prefixMatch = trimmed.match(DATE_ONLY_PREFIX_REGEX);
  if (prefixMatch) {
    return prefixMatch[1];
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toDateInputValue(value?: string | null): string {
  return extractDateOnly(value) || "";
}

export function formatDateOnly(value?: string | null): string {
  const dateOnly = extractDateOnly(value);
  if (!dateOnly) {
    return "N/A";
  }

  const [year, month, day] = dateOnly.split("-").map((part) => Number(part));
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return dateOnly;
  }

  return date.toLocaleDateString();
}

export function toUtcDateOnly(value?: string | null): string | undefined {
  const dateOnly = extractDateOnly(value);
  return dateOnly ? `${dateOnly}T00:00:00Z` : undefined;
}
