import { Client } from './client';
import { Events } from './events';
import RealtimeConnection from './realtime-connection';

/** The different states that the call session can have. */
export type CallSessionState = 'initializing' | 'paused' | 'idle' | 'connecting' | 'connected' | 'offline';

/** The message payload sent through the realtime connection to indicate the call session changed. */
export interface CallSessionChangedEventPayload {
  call_session_id: string;
  to: CallSessionState;
  reason: string;
  _time: number;
}

/** The event that is triggered to indicate the call session changed. */
export class CallSessionChangedEvent {
  id: string;
  state: CallSessionState;
  _time: number;
  reason: string;

  constructor(payload: CallSessionChangedEventPayload) {
    this.id = payload.call_session_id;
    this.state = payload.to;
    this.reason = payload.reason;
    this._time = payload._time;
  }
}


/** The different states that the outbound call can have. */
export type OutboundCallState = 'dialing' | 'connected' | 'offline';

/** The message payload sent through the realtime connection to indicate an outbound call changed. */
export interface OutboundCallChangedEventPayload {
  id: string;
  state: OutboundCallState;
  lead_id: string;
  master_id?: string;
  started_at: Date;
  ended_at?: Date;
  _time: number;
}

/** The event that is triggered to indicate an outbound call changed. */
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

/** The different events that can be triggered. */
export type CallSessionEventName = 'stateChanged' | 'outboundCallChanged' | 'leadRequested';

/**
  * Subscribes to the proper web socket channels for the call session
  * and triggers specific events.
**/
export class CallSessionEvents extends Events {

  client: Client;
  realtimeConnection: RealtimeConnection;

  protected subscribed: boolean = false;
  protected subscribedFn: (payload: any) => void;

  constructor(client: Client) {
    super();
    this.client = client;
    this.realtimeConnection = client.realtime;
    this.subscribe();
  }

  destroy() {
    this.unsubscribe();
    super.destroy();
  }

  /** Subscribes to the proper web socket channel for the client. */
  protected subscribe() {
    if (!this.subscribed) {
      const userId = this.client.user.id;
      const channel = `/users/${userId}/call`;
      this.subscribedFn = (payload) => this.handleRealtimeEvent(payload);
      this.realtimeConnection.subscribe(channel, this.subscribedFn);
      this.subscribed = true;
    }
  }

  /** Unsubscribes from all subscribed web socket channels. */
  protected unsubscribe() {
    if (this.subscribed) {
      const userId = this.client.user.id;
      const channel = `/users/${userId}/call`;
      this.realtimeConnection.unsubscribe(channel, this.subscribedFn);
      this.subscribed = false;
    }
  }

  /**
    * Entry point for all web socket events.
    * Takes the raw event name and data, and converts it to a higher order event.
  **/
  protected handleRealtimeEvent(payload: any) {
    switch(payload.event) {
      case 'state_changed':
        return this.handleStateChanged(payload);
      case 'lead_outbound_call_state':
        return this.handleOutboundCallChanged(payload);
      case 'request_lead':
        return this.handleLeadRequested();
    }
    if (this.client.config.debug) {
      console.warn(`Unknown call event: "${payload.event}"`, payload);
    }
  }

  /** Handles the call session state change event */
  protected handleStateChanged(payload: CallSessionChangedEventPayload) {
    const event = new CallSessionChangedEvent(payload);
    this.trigger('stateChanged', event);
  }

  /** Handles the outbound call change event */
  protected handleOutboundCallChanged(payload: OutboundCallChangedEventPayload) {
    const event = new OutboundCallChangedEvent(payload);
    this.trigger('outboundCallChanged', event);
  }

  /** Handles the lead requested event */
  protected handleLeadRequested() {
    this.trigger('leadRequested');
  }
}
