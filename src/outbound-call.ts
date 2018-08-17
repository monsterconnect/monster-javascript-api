import { OutboundCallChangedEvent } from './call-session-events';

export class OutboundCall {
  protected lastStateEvent: OutboundCallChangedEvent;

  constructor(event: OutboundCallChangedEvent) {
    this.lastStateEvent = event;
  }

  eventReceived(event: OutboundCallChangedEvent) {
    if (event._time > this.lastStateEvent._time) {
      this.lastStateEvent = event;
    }
  }

  get id(): string {
    return this.lastStateEvent.id;
  }
}
