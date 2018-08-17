export interface EventCallback {
    (...args: any[]): void;
}

interface EventList {
  [eventName: string]: EventCallback[];
}

/**
  * Subscribe and unsubscribe to named events.
  * When an event is triggered, all listeners will be fired.
*/
export class Events {
  constructor() {
    this.clear();
  }

  protected events: EventList;

  /** Removes all event listeners and shuts down. */
  destroy() {
    this.clear();
    this.events = null;
  }

  /** Clears the event list */
  clear() {
    this.events = {};
  }

  /**
    * Subsribe to an event with the specified name.
    * When the event is triggered, the callback will occur.
    * Be sure to bind the callback to the proper context (i.e. "this") prior to subscribing.
  */
  on(eventName: string, callback: EventCallback) {
    const events = this._getEventsByName(eventName);
    events.push(callback);
  }

  /**
    * Unsubsribe from an event with the specified name and previously subscribed callback.
    * Be sure to send the same exact instance of the callback (i.e. the bound function).
  */
  off(eventName: string, callback: EventCallback) {
    const events = this._getEventsByName(eventName);
    const filteredEvents = events.filter((c: EventCallback) => c !== callback);
    this.events[eventName] = filteredEvents;
  }

  /**
    * Trigger the specified event.
    * All subsequent arguments will be passed to the callback.
  */
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
