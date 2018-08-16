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

type OutboundCallState = 'dialing' | 'connected' | 'offline';

export interface OutboundCallChangedEventPayload {
  id: string;
  state: OutboundCallState;
  lead_id: string;
  master_id?: string;
  started_at: Date;
  ended_at?: Date;
  _time: number;
}

export class OutboundCallChangedEvent {
  id: string;
  state: OutboundCallState;
  leadId: string;
  masterId: string;
  startedAt: Date;
  endedAt: Date;
  _time: number;

  constructor(payload: OutboundCallChangedEventPayload) {
    this.id = payload.id;
    this.state = payload.state;
    this.leadId = payload.lead_id;
    this.masterId = payload.master_id;
    this.startedAt = (payload.started_at && new Date(payload.started_at));
    this.endedAt = (payload.ended_at && new Date(payload.ended_at));
    this._time = payload._time;
  }
}
