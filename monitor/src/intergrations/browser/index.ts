import { BaseIntegration } from "../../core/BaseIntegration";
import type { TrackerInstance } from "../../core/types";
import { setupBrowserErrorCollection } from "./errors";
import {
  resolveBrowserIntegrationOptions,
  type BrowserIntegrationOptions,
  type ResolvedBrowserIntegrationOptions,
} from "./options";
import { setupWebVitalsCollection } from "./vitals";

export type { BrowserIntegrationOptions };

export class BrowserIntegration extends BaseIntegration {
  public readonly name = "BrowserIntegration";

  private readonly options: ResolvedBrowserIntegrationOptions;

  /**
   * @param options 浏览器端采集配置。
   */
  constructor(options?: BrowserIntegrationOptions) {
    super();
    options = options ?? {};
    this.options = resolveBrowserIntegrationOptions(options);
  }

  protected setupCore(tracker: TrackerInstance): void {
    if (!this.options.enabled) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    setupBrowserErrorCollection(tracker, this.options.errors);
    setupWebVitalsCollection(tracker, this.options.vitals);
  }
}
