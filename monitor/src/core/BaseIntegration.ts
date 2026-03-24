import type { TrackerInstance } from "./types";

export abstract class BaseIntegration {
  public abstract readonly name: string;

  private isSetup = false;
  private trackerInstance: TrackerInstance | null = null;

  public setup(tracker: TrackerInstance) {
    if (this.isSetup) {
      return;
    }

    try {
      this.setupCore(tracker);
      this.trackerInstance = tracker;
      this.isSetup = true;
    } catch (error) {
      this.trackerInstance = null;
      this.isSetup = false;
      console.error(`[MonitorSDK] integration "${this.name}" setup failed.`, error);
    }
  }

  public dispose() {
    if (!this.isSetup || !this.trackerInstance) {
      return;
    }

    try {
      this.teardownCore(this.trackerInstance);
    } catch (error) {
      console.error(
        `[MonitorSDK] integration "${this.name}" dispose failed.`,
        error,
      );
    } finally {
      this.trackerInstance = null;
      this.isSetup = false;
    }
  }

  protected abstract setupCore(tracker: TrackerInstance): void;
  protected teardownCore(_tracker: TrackerInstance): void {}
}
