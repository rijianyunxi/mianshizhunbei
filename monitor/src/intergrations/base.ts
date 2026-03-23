import type { TrackerInstance } from "../core/types";

export abstract class BaseIntegration {
  public abstract readonly name: string;

  private isSetup = false;

  public setup(tracker: TrackerInstance) {
    if (this.isSetup) {
      console.error("alrealdy setup");
      return;
    }
    this.setupCore(tracker);
    this.isSetup = true;
  }

  protected abstract setupCore(tracker: TrackerInstance): void;
}
