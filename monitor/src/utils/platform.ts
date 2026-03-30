export type RuntimePlatform = "browser" | "mini-program" | "unknown";

export interface MiniProgramRequestOptions {
  url: string;
  method?: string;
  data?: unknown;
  header?: Record<string, string>;
  success?: (result: MiniProgramRequestSuccessResult) => void;
  fail?: (error: MiniProgramRequestFailResult) => void;
}

export interface MiniProgramRequestSuccessResult {
  statusCode?: number;
  data?: unknown;
  errMsg?: string;
  [key: string]: unknown;
}

export interface MiniProgramRequestFailResult {
  errMsg?: string;
  [key: string]: unknown;
}

export interface MiniProgramGlobalApi {
  request?: (options: MiniProgramRequestOptions) => unknown;
  onError?: (callback: (error: string) => void) => void;
  offError?: (callback: (error: string) => void) => void;
  onUnhandledRejection?: (
    callback: (result: { reason?: unknown }) => void,
  ) => void;
  offUnhandledRejection?: (
    callback: (result: { reason?: unknown }) => void,
  ) => void;
}

type MiniProgramPage = {
  route?: string;
  __route__?: string;
};

const MINI_PROGRAM_GLOBAL_KEYS = ["wx", "tt", "swan", "my", "uni"] as const;

export const getMiniProgramGlobal = (): MiniProgramGlobalApi | null => {
  const globalObject = globalThis as Record<string, unknown>;

  for (const key of MINI_PROGRAM_GLOBAL_KEYS) {
    const candidate = globalObject[key];
    if (!candidate || typeof candidate !== "object") {
      continue;
    }

    if (
      "request" in candidate ||
      "onError" in candidate ||
      "onUnhandledRejection" in candidate
    ) {
      return candidate as MiniProgramGlobalApi;
    }
  }

  return null;
};

export const isBrowserRuntime = (): boolean => {
  return typeof window !== "undefined" && typeof document !== "undefined";
};

export const isMiniProgramRuntime = (): boolean => {
  return getMiniProgramGlobal() !== null;
};

export const detectRuntimePlatform = (): RuntimePlatform => {
  if (isMiniProgramRuntime()) {
    return "mini-program";
  }

  if (isBrowserRuntime()) {
    return "browser";
  }

  return "unknown";
};

export const getCurrentMiniProgramRoute = (): string | null => {
  const globalObject = globalThis as {
    getCurrentPages?: () => MiniProgramPage[];
  };

  if (typeof globalObject.getCurrentPages !== "function") {
    return null;
  }

  try {
    const pages = globalObject.getCurrentPages();
    if (!Array.isArray(pages) || pages.length === 0) {
      return "app_launch";
    }

    const currentPage = pages[pages.length - 1];
    return currentPage.route ?? currentPage.__route__ ?? "unknown_mini_program_route";
  } catch {
    return "unknown_mini_program_route";
  }
};
