export const SDK_INJECTED_HEADER = "X-SDK-Injected";
export const SDK_INJECTED_HEADER_VALUE = "true";

export type RequestIgnoreRule = string | RegExp;

export interface RequestSkipOptions {
  url: string;
  dsn: string;
  headers?: unknown;
  ignoreUrls?: RequestIgnoreRule[];
}

export const normalizeRequestUrl = (url: string): string => {
  const normalizedInput = url.trim();
  if (!normalizedInput) {
    return normalizedInput;
  }

  if (typeof URL === "function") {
    try {
      const base =
        typeof window !== "undefined" && window.location
          ? window.location.href
          : undefined;

      return base
        ? new URL(normalizedInput, base).toString()
        : new URL(normalizedInput).toString();
    } catch {
      return normalizedInput;
    }
  }

  return normalizedInput;
};

export const isSameRequestEndpoint = (url: string, dsn: string): boolean => {
  return normalizeRequestUrl(url) === normalizeRequestUrl(dsn);
};

export const isSdkInjectedRequest = (headers?: unknown): boolean => {
  return extractHeader(headers, SDK_INJECTED_HEADER) !== null;
};

export const matchesRequestUrlRule = (
  url: string,
  rule: RequestIgnoreRule,
): boolean => {
  if (typeof rule === "string") {
    return url.includes(rule);
  }

  return rule.test(url);
};

export const shouldSkipMonitoringRequest = ({
  url,
  dsn,
  headers,
  ignoreUrls = [],
}: RequestSkipOptions): boolean => {
  if (isSameRequestEndpoint(url, dsn)) {
    return true;
  }

  if (ignoreUrls.some((rule) => matchesRequestUrlRule(url, rule))) {
    return true;
  }

  return isSdkInjectedRequest(headers);
};

const extractHeader = (headers: unknown, key: string): string | null => {
  if (!headers) {
    return null;
  }

  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    return headers.get(key);
  }

  if (Array.isArray(headers)) {
    const matchedHeader = headers.find((header) => {
      return (
        Array.isArray(header) &&
        header.length >= 2 &&
        String(header[0]).toLowerCase() === key.toLowerCase()
      );
    });

    return matchedHeader ? String(matchedHeader[1]) : null;
  }

  if (typeof headers === "object") {
    const headerRecord = headers as Record<string, unknown>;
    const matchedKey = Object.keys(headerRecord).find((headerKey) => {
      return headerKey.toLowerCase() === key.toLowerCase();
    });

    return matchedKey ? String(headerRecord[matchedKey]) : null;
  }

  return null;
};
