export default class Events {
  constructor() {
    this.clear();
  }

  destroy() {
    this.clear();
    this.events = null;
  }

  clear() {
    this.events = {};
  }

  on(eventName, callback) {
    this.events[eventName] = this.events[eventName] || [];
    this.events[eventName].push(callback);
  }

  off(eventName, callback) {
    this.events[eventName] = this.events[eventName] || [];
    this.events[eventName] = this.events[eventName].filter((c) => c !== callback);
  }

  trigger(eventName, ...args) {
    const callbacks = this.events[eventName];
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }
}
