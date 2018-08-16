import { Events, EventCallback } from './events';
import { Client } from './client';
import { FetchResult } from './rest-api';
import Lead from './lead';
import { OutboundCall, OutboundCallChangedEventPayload, OutboundCallChangedEvent } from './outbound-call';

class CallSessionModel {
  id: string = 'current';
  startedAt: Date;
  endedAt: Date;
  state: string = 'offline';
}

class CallSessionCredentials {
  phoneNumber: string;
  pin: string;
}

interface OutboundCalls {
  [key: string]: OutboundCall;
}

interface OutboundCallChangedPayload {
  id: string;
  state: string;
  leadId: string;
  masterId: string;
  startedAt: Date;
  endedAt: Date;
}

export default class CallSession {

  client: Client;
  events: Events;
  outboundCalls: OutboundCalls;
  callSessionModel: CallSessionModel;

  protected _subscribed: boolean = false;
  protected _subscribedFn: (payload: any) => void;
  protected _lastStateChangeTimestamp: number;


  constructor(client: Client) {
    this.client = client;
    this.events = new Events();
    this.outboundCalls = {};
    this.callSessionModel = new CallSessionModel();
    this._subscribe();
  }

  destroy() {
    this.events.destroy();
    this.events = null;
    this._unsubscribe();
  }

  fetch(): Promise<CallSession> {
    return this.client.http.get(`call_sessions/current`).then((response) => {
      const data = response.body.call_session;
      if (data) {
        this.callSessionModel.id = String(data.id);
        this.callSessionModel.startedAt = data.started_at && new Date(data.started_at);
        this.callSessionModel.endedAt = data.ended_at && new Date(data.ended_at);
        this.callSessionModel.state = data.state;
      }
      return this;
    });
  }

  get id(): string {
    return this.callSessionModel && this.callSessionModel.id;
  }

  get startedAt(): Date {
    return this.callSessionModel && this.callSessionModel.startedAt;
  }

  get endedAt(): Date {
    return this.callSessionModel && this.callSessionModel.endedAt;
  }

  get state(): string {
    return this.callSessionModel && this.callSessionModel.state;
  }

  endCallSession(): Promise<FetchResult> {
    return this._sendAction('hangup');
  }

  endOutboundCall(): Promise<FetchResult> {
    return this._sendAction('disconnect');
  }

  beep(): Promise<FetchResult> {
    return this._sendAction('beep');
  }

  dialNext(): Promise<FetchResult> {
    return this._sendAction('dial_next');
  }

  callMe(): Promise<FetchResult> {
    return this._sendAction('call_me');
  }

  pause(): Promise<FetchResult> {
    return this._sendAction('pause_dialing');
  }

  resume(): Promise<FetchResult> {
    return this._sendAction('resume_dialing');
  }

  getCallSessionCredentials(): Promise<CallSessionCredentials> {
    const userId = this.client.user.id;
    return this.client.http.get(`users/${userId}/inbound_phone_credentials`).then((response) => {
      const result = new CallSessionCredentials();
      result.phoneNumber = String(response.body.user.inbound_phone);
      result.pin = String(response.body.user.inbound_pin);
      return result;
    });
  }

  /**
    * Submit one or more leads to be dialed.  Leads can be sent in realtime upon request,
    * or they can be sent in batches ahead of time.  The leads will be dialed in the order
    * in which they are submitted.
    * The _masterId_ property is a unique identifier from the external system,
    * such as the CRM's contact ID.
  */
  submitLead(...leads: Lead[]): Promise<FetchResult> {
    const data = {
      leads: leads.map((l) => {
        return {
          master_id: l.masterId,
          first_name: l.firstName,
          last_name: l.lastName,
          title: l.title,
          company_name: l.companyName,
          phone: l.phone,
          email: l.email
        }
      })
    };
    const path = this._getUrlPath('leads')
    return this.client.http.post(path, data);
  }

  /**
    * Clears the list of submitted leads.
  */
  clearLeads(): Promise<FetchResult> {
    const path = this._getUrlPath('leads')
    return this.client.http.delete(path);
  }

  on(eventName: string, callback: EventCallback) {
    this.events.on(eventName, callback);
  }

  off(eventName: string, callback: EventCallback) {
    this.events.off(eventName, callback);
  }

  trigger(eventName: string, ...args: any[]) {
    this.events.trigger(eventName, ...args);
  }

  /**
    * Specifies how the leads will be selected. Valid options are:
    * lead_list: A data source and lead list is loaded and selected
    * queue: The call session will be requesting leads in realtime
  */
  setLeadSelectionMethod(method: string): Promise<FetchResult> {
    const path = this._getUrlPath();
    const data = { call_session: { lead_selection_method: method } };
    return this.client.http.put(path, data);
  }

  protected _getUrlPath(action: string = null): string {
    const base = `call_sessions/${this.id}`;
    if (action) {
      return base + '/' + action;
    } else {
      return base;
    }
  }

  protected _sendAction(action: string = null): Promise<FetchResult> {
    const path = this._getUrlPath(action);
    return this.client.http.get(path);
  }

  protected _subscribe() {
    if (!this._subscribed) {
      const userId = this.client.user.id;
      const channel = `/users/${userId}/call`;
      this._subscribedFn = (payload) => this._handleRealtimeEvent(payload);
      this.client.realtime.subscribe(channel, this._subscribedFn);
      this._subscribed = true;
    }
  }

  protected _unsubscribe() {
    if (this._subscribed) {
      const userId = this.client.user.id;
      const channel = `/users/${userId}/call`;
      this.client.realtime.unsubscribe(channel, this._subscribedFn);
      this._subscribed = false;
    }
  }

  protected _handleRealtimeEvent(payload: any) {
    switch(payload.event) {
      case 'state_changed':
        return this._handleStateChanged(payload);
      case 'lead_outbound_call_state':
        return this._handleOutboundCallChanged(payload);
      case 'request_lead':
        return this._handleLeadRequested(payload);
    }
    console.warn(`Unknown call event: "${payload.event}"`, payload);
  }

  protected _handleStateChanged(payload: any) {
    if (!this._lastStateChangeTimestamp || this._lastStateChangeTimestamp < payload._time) {
      this.callSessionModel.id = payload.call_session_id;
      this.callSessionModel.state = payload.to;
      this._lastStateChangeTimestamp = payload._time;
      this.trigger('stateChanged', {
        id: payload.call_session_id,
        state: payload.to,
        reason: payload.reason
      });
    }
  }

  protected _handleOutboundCallChanged(payload: OutboundCallChangedEventPayload) {
    const id = payload.id;

    const event = new OutboundCallChangedEvent(payload);
    this.outboundCalls[id] = this.outboundCalls[id] || new OutboundCall(event);
    const outboundCall = this.outboundCalls[id];
    outboundCall.eventReceived(event);
    this.trigger('outboundCallChanged', event);
  }

  protected _handleLeadRequested(payload: any) {
    this.trigger('leadRequested');
  }
}
