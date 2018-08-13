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
    return this._sendAction('dialNext');
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
    if (payload.event === 'state_changed') {
      this._handleStateChanged(payload);
    } else if (payload.event === 'lead_outbound_call_state') {
      this._handleOutboundCallChanged(payload);
    } else {
      console.warn(`Unknown call event: "${payload.event}"`, payload);
    }
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
        startedAt: (payload.started_at && new Date(payload.started_at)),
        endedAt: (payload.ended_at && new Date(payload.ended_at))
      });
    }
  }
}
