import type { Transport, TransportResult } from "../types";
import {
  detectRuntimePlatform,
  getMiniProgramGlobal,
} from "../../utils/platform";
import { BrowserTransport } from "./browser";
import { FetchTransport } from "./fetch";
import { MiniProgramTransport } from "./miniprogram";

class NoopTransport implements Transport {
  public send(): TransportResult {
    return {
      ok: false,
      error: new Error("No transport is available for the current runtime."),
      retryable: false,
    };
  }
}

export const createDefaultTransport = (dsn: string): Transport => {
  const runtimePlatform = detectRuntimePlatform();

  if (runtimePlatform === "mini-program") {
    const miniProgramApi = getMiniProgramGlobal();
    if (miniProgramApi?.request) {
      return new MiniProgramTransport({
        dsn,
        api: miniProgramApi,
      });
    }
  }

  if (runtimePlatform === "browser") {
    return new BrowserTransport({ dsn });
  }

  if (typeof fetch === "function") {
    return new FetchTransport({ dsn });
  }

  return new NoopTransport();
};
