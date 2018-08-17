import { Events, EventCallback } from './events';
import { Client } from './client';
import { FetchResult } from './rest-api';
import Lead from './lead';
import { OutboundCall } from './outbound-call';
import { CallSessionEventName, CallSessionEvents } from './call-session-events';
import { CallSessionState, CallSessionChangedEvent } from './call-session-events';
import { OutboundCallChangedEvent } from './call-session-events';

class CallSessionModel {
  id: string = 'current';
  startedAt: Date;
  endedAt: Date;
  state: CallSessionState = 'offline';

  protected _lastEvent: CallSessionChangedEvent;

  eventReceived(event: CallSessionChangedEvent) {
    if (!this._lastEvent || event._time > this._lastEvent._time) {
      this._lastEvent = event;
      this.id = event.id;
      this.state = event.state;
    }
  }
}

interface CallSessionCredentials {
  phoneNumber: string;
  pin: string;
}

interface OutboundCalls {
  [id: string]: OutboundCall;
}

export default class CallSession {

  client: Client;
  events: CallSessionEvents;
  outboundCalls: OutboundCalls;
  callSessionModel: CallSessionModel;

  constructor(client: Client) {
    this.client = client;
    this.outboundCalls = {};
    this.callSessionModel = new CallSessionModel();
    this._initializeEvents();
  }

  destroy() {
    this.events.destroy();
    this.events = null;
  }

  /** Fetches the current call session information from the MonsterConnect API. */
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

  /** The ID of the call session. */
  get id(): string {
    return this.callSessionModel && this.callSessionModel.id;
  }

  /** The timestamp that the call session started. */
  get startedAt(): Date {
    return this.callSessionModel && this.callSessionModel.startedAt;
  }

  /** The timestamp that the call session ended. */
  get endedAt(): Date {
    return this.callSessionModel && this.callSessionModel.endedAt;
  }

  /** The current state of the call session. **/
  get state(): CallSessionState {
    if (this.callSessionModel) {
      return this.callSessionModel.state;
    }
  }

  /** Sends a request to hang up the call session. */
  endCallSession(): Promise<FetchResult> {
    return this._sendAction('hangup');
  }

  /** Sends a request to hang up the outbound call currently connected to this call session. */
  endOutboundCall(): Promise<FetchResult> {
    return this._sendAction('disconnect');
  }

  /** Sends a requet to play an audible beep (for testing audio and latency). */
  beep(): Promise<FetchResult> {
    return this._sendAction('beep');
  }

  /** Dial the next lead in the list and connect immediately. */
  dialNext(): Promise<FetchResult> {
    return this._sendAction('dial_next');
  }

  /** Initiate a call session by calling the user's phone number. */
  callMe(): Promise<FetchResult> {
    return this._sendAction('call_me');
  }

  /** Start team dialing. */
  resume(): Promise<FetchResult> {
    return this._sendAction('resume_dialing');
  }

  /** Pause team dialing. */
  pause(): Promise<FetchResult> {
    return this._sendAction('pause_dialing');
  }

  /**
    * Sends a request to initiate a call session by returning a phone number
    * and pin to enter.  These credentials are one-time use, and calling it
    * will invalidate all previously created credentials.
  */
  getCallSessionCredentials(): Promise<CallSessionCredentials> {
    const userId = this.client.user.id;
    return this.client.http.get(`users/${userId}/inbound_phone_credentials`).then((response) => {
      return {
        phoneNumber: String(response.body.user.inbound_phone),
        pin: String(response.body.user.inbound_pin)
      };
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

  /** Subscribe to the specified event.  The specified callback will be triggered.  */
  on(eventName: CallSessionEventName, callback: EventCallback) {
    this.events.on(eventName, callback);
  }

  /** Unsubscribe the specified callback from the specified event. */
  off(eventName: CallSessionEventName, callback: EventCallback) {
    this.events.off(eventName, callback);
  }

  /** Trigger the specified event.  All subsequent arguments are passed to the callbacks. */
  trigger(eventName: CallSessionEventName, ...args: any[]) {
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

  protected _stateChanged(event: CallSessionChangedEvent) {
    this.callSessionModel.eventReceived(event);
  }

  protected _outboundCallChanged(event: OutboundCallChangedEvent) {
    const id = event.id;
    this.outboundCalls[id] = this.outboundCalls[id] || new OutboundCall(event);
    const outboundCall = this.outboundCalls[id];
    outboundCall.eventReceived(event);
  }

  protected _initializeEvents() {
    this.events = new CallSessionEvents(this.client);
    this.events.on('stateChanged', (event: CallSessionChangedEvent) => this._stateChanged(event));
    this.events.on('outboundCallChanged', (event: OutboundCallChangedEvent) => this._outboundCallChanged(event));
  }

}
