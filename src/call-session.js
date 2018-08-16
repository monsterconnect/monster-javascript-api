import Events from './events';

export default class CallSession {

  constructor(client) {
    this.client = client;
    this.events = new Events();
    this.outboundCalls = {};
    this._subscribe();
  }

  destroy() {
    this.events.destroy();
    this.events = null;
    this._unsubscribe();
  }

  fetch() {
    return this.client.http.get(`call_sessions/current`).then((response) => {
      const data = response.body.call_session;
      if (data) {
        this.id = data.id;
        this.startedAt = data.started_at;
        this.endedAt = data.ended_at;
        this.state = data.state;
      }
      return this;
    });
  }

  endCallSession() {
    return this._sendAction('hangup');
  }

  endOutboundCall() {
    return this._sendAction('disconnect');
  }

  beep() {
    return this._sendAction('beep');
  }

  dialNext() {
    return this._sendAction('dial_next');
  }

  callMe() {
    return this._sendAction('call_me');
  }

  pause() {
    return this._sendAction('pause_dialing');
  }

  resume() {
    return this._sendAction('resume_dialing');
  }

  getCallSessionCredentials() {
    const userId = this.client.user.id;
    return this.client.http.get(`users/${userId}/inbound_phone_credentials`).then((response) => {
      return { phoneNumber: response.body.user.inbound_phone, pin: response.body.user.inbound_pin }
    });
  }

  /**
    * Submit one or more leads to be dialed.  Leads can be sent in realtime upon request,
    * or they can be sent in batches ahead of time.  The leads will be dialed in the order
    * in which they are submitted.
    * The _masterId_ property is a unique identifier from the external system,
    * such as the CRM's contact ID.
  */
  submitLead(...leads) {
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
  clearLeads() {
    const path = this._getUrlPath('leads')
    return this.client.http.delete(path);
  }

  on() {
    this.events.on(...arguments);
  }

  off() {
    this.events.off(...arguments);
  }

  trigger() {
    this.events.trigger(...arguments);
  }

  /**
    * Specifies how the leads will be selected. Valid options are:
    * lead_list: A data source and lead list is loaded and selected
    * queue: The call session will be requesting leads in realtime
  */
  setLeadSelectionMethod(method) {
    const path = this._getUrlPath();
    const data = { call_session: { lead_selection_method: method } };
    return this.client.http.put(path, data);
  }

  /**
    * @private
  */
  _getUrlPath(action) {
    const base = `call_sessions/${this.id}`;
    if (action) {
      return base + '/' + action;
    } else {
      return base;
    }
  }

  /**
    * @private
  */
  _sendAction(action) {
    const path = this._getUrlPath(action);
    return this.client.http.get(path);
  }

  /**
    * @private
  */
  _subscribe() {
    if (!this._subscribed) {
      const userId = this.client.user.id;
      const channel = `/users/${userId}/call`;
      this._subscribedFn = (payload) => this._handleRealtimeEvent(payload);
      this.client.realtime.subscribe(channel, this._subscribedFn);
      this._subscribed = true;
    }
  }

  /**
    * @private
  */
  _unsubscribe() {
    if (this._subscribed) {
      const userId = this.client.user.id;
      const channel = `/users/${userId}/call`;
      this.client.realtime.unsubscribe(channel, this._subscribedFn);
      this._subscribed = false;
    }
  }

  /**
    * @private
  */
  _handleRealtimeEvent(payload) {
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

  /**
    * @private
  */
  _handleStateChanged(payload) {
    this.id = payload.call_session_id;
    this.state = payload.to;
    if (!this._lastStateChangeTimestamp || this._lastStateChangeTimestamp < payload._time) {
      this._lastStateChangeTimestamp = payload._time;
      this.trigger('stateChanged', {
        id: payload.call_session_id,
        state: payload.to,
        reason: payload.reason
      });
    }
  }

  /**
    * @private
  */
  _handleOutboundCallChanged(payload) {
    const id = payload.id;
    this.outboundCalls[id] = this.outboundCalls[id] || {};
    const outboundCall = this.outboundCalls[id];
    if (!outboundCall.lastStateEvent || outboundCall.lastStateEvent._time < payload._time) {
      outboundCall.lastStateEvent = payload;
      this.trigger('outboundCallChanged', {
        id: payload.id,
        state: payload.state,
        leadId: payload.lead_id,
        masterId: payload.master_id,
        startedAt: (payload.started_at && new Date(payload.started_at)),
        endedAt: (payload.ended_at && new Date(payload.ended_at))
      });
    }
  }

  /**
    * @private
  */
  _handleLeadRequested(payload) {
    this.trigger('leadRequested');
  }
}
