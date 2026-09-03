export type ExpiryUrgency =
  | "expired"
  | "today"
  | "soon"
  | "later";

export type ExpiryDateStatus =
  | "past"
  | "today"
  | "future";

export function getDaysUntilExpiry(
  expiryDate: string,
  today = new Date(),
): number {
  const expiry = new Date(`${expiryDate}T00:00:00`);
  const currentDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const differenceInMilliseconds =
    expiry.getTime() - currentDate.getTime();

  return Math.ceil(
    differenceInMilliseconds / (1000 * 60 * 60 * 24),
  );
}

export function getExpiryDateStatus(
  expiryDate: string,
  today = new Date(),
): ExpiryDateStatus {
  const daysUntilExpiry = getDaysUntilExpiry(
    expiryDate,
    today,
  );

  if (daysUntilExpiry < 0) return "past";
  if (daysUntilExpiry === 0) return "today";

  return "future";
}

export function getExpiryUrgency(
  expiryDate: string,
  today = new Date(),
): ExpiryUrgency {
  const daysUntilExpiry = getDaysUntilExpiry(expiryDate, today);

  if (daysUntilExpiry < 0) return "expired";
  if (daysUntilExpiry === 0) return "today";
  if (daysUntilExpiry <= 3) return "soon";

  return "later";
}

export function getRelevantExpiryDates(
  expiryDates: string[],
  today = new Date(),
): string[] {
  const futureDates = expiryDates.filter(
    (date) => getExpiryDateStatus(date, today) === "future",
  );

  if (futureDates.length > 0) {
    return futureDates;
  }

  const todayDates = expiryDates.filter(
    (date) => getExpiryDateStatus(date, today) === "today",
  );

  if (todayDates.length > 0) {
    return todayDates;
  }

  const pastDates = expiryDates
    .filter(
      (date) => getExpiryDateStatus(date, today) === "past",
    )
    .sort((a, b) => b.localeCompare(a));

  return pastDates.length > 0 ? [pastDates[0]] : [];
}

const monthNumbers: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function expandYear(year: number): number {
  if (year >= 100) {
    return year;
  }

  return 2000 + year;
}

function toIsoDate(
  year: number,
  month: number,
  day: number,
): string | null {
  if (
    year < 2000 ||
    year > 2100 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return [
    year.toString().padStart(4, "0"),
    month.toString().padStart(2, "0"),
    day.toString().padStart(2, "0"),
  ].join("-");
}

export function parseExpiryDate(
  value: string,
): string | null {
  const normalised = value.trim();

  if (!normalised) {
    return null;
  }

  const isoMatch = normalised.match(
    /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/,
  );

  if (isoMatch) {
    return toIsoDate(
      Number(isoMatch[1]),
      Number(isoMatch[2]),
      Number(isoMatch[3]),
    );
  }

  const dayFirstMatch = normalised.match(
    /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/,
  );

  if (dayFirstMatch) {
    return toIsoDate(
      expandYear(Number(dayFirstMatch[3])),
      Number(dayFirstMatch[2]),
      Number(dayFirstMatch[1]),
    );
  }

  const namedMonthMatch = normalised.match(
    /^(\d{1,2})\s+([a-z]+)\s+(\d{2}|\d{4})$/i,
  );

  if (namedMonthMatch) {
    const month =
      monthNumbers[namedMonthMatch[2].toLowerCase()];

    if (!month) {
      return null;
    }

    return toIsoDate(
      expandYear(Number(namedMonthMatch[3])),
      month,
      Number(namedMonthMatch[1]),
    );
  }

  return null;
}

export function extractExpiryDateCandidates(
  text: string,
): string[] {
  const candidates: string[] = [];

  const patterns = [
    /\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/g,
    /\b\d{1,2}[-/.]\d{1,2}[-/.](?:\d{2}(?=(?:[01]\d|2[0-3]):)|\d{4}\b|\d{2}\b)/g,
    /\b\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(?:\d{2}|\d{4})\b/gi,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);

    if (!matches) {
      continue;
    }

    for (const match of matches) {
      const normalised = match
        .replace(/\s+/g, " ")
        .trim();

      if (!candidates.includes(normalised)) {
        candidates.push(normalised);
      }
    }
  }

  return candidates;
}