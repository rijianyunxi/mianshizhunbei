class EventBus {
  constructor() {
    this.eventBus = new Map();
  }

  on(eventName, callback) {
    if (!this.eventBus.has(eventName)) {
      this.eventBus.set(eventName, []);
    }
    this.eventBus.get(eventName).push(callback);
  }
  emit(eventName, ...args) {
    if (this.eventBus.has(eventName)) {
      this.eventBus.get(eventName).forEach((callback) => callback(...args));
    }
  }
  off(eventName, callback) {
    if (this.eventBus.has(eventName)) {
      this.eventBus.set(
        eventName,
        this.eventBus.get(eventName).filter((cb) => cb !== callback)
      );
    }
  }

  once(eventName, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(eventName, wrapper);
    };
    this.on(eventName, wrapper);
  }
}
