export interface EventCallback {
    (...args: any[]): void;
}

interface EventList {
  [eventName: string]: EventCallback[];
}

export class Events {
  constructor() {
    this.clear();
  }

  protected events: EventList;

  destroy() {
    this.clear();
    this.events = null;
  }

  clear() {
    this.events = {};
  }

  on(eventName: string, callback: EventCallback) {
    const events = this._getEventsByName(eventName);
    events.push(callback);
  }

  off(eventName: string, callback: EventCallback) {
    const events = this._getEventsByName(eventName);
    const filteredEvents = events.filter((c: EventCallback) => c !== callback);
    this.events[eventName] = filteredEvents;
  }

  trigger(eventName: string, ...args: any[]) {
    const callbacks = this._getEventsByName(eventName);
    callbacks.forEach((callback: EventCallback) => callback(...args));
  }

  protected _getEventsByName(eventName: string): EventCallback[] {
    let result = this.events[eventName];
    if (!result) {
      this.events[eventName] = [];
      result = this.events[eventName];
    }
    return result;
  }
}
