import RealtimeConnection from './realtime-connection';
import { Events, EventCallback } from './events';
import { RestApi, FetchResult } from './rest-api';
import CallSession from './call-session';
import { ConfigParams, Config } from './config';
import AvailabilityInfo from './availability-info';

export class Client {
  config: Config;
  events: Events;
  http: RestApi;
  callSession: CallSession;
  realtime: RealtimeConnection;
  user: any;

  constructor(params: ConfigParams) {
    this.config = new Config(params);

    this._initializeRealtimeConnection();
    this.events = new Events();
    this.http = new RestApi(this.config);
  }

  destroy() {
    if (this.callSession) {
      this.callSession.destroy();
      this.callSession = null;
    }
    this.events.destroy();
    this.events = null;
    this.realtime.destroy();
    this.realtime = null;
  }

  /** Initializes the client by retrieving the required information from the MonsterConnect API. */
  fetch(): Promise<Client> {
    return this.getCurrentUser().then(() => {
      return this.getCurrentSession();
    }).then(() => {
      return this;
    });
  }

  /** Sends a request to the MonsterConnect API to retrieve the current user information. */
  getCurrentUser(): Promise<any> {
    return Promise.resolve().then(() => {
      if (this.user) {
        return this.user;
      } else {
        return this.http.get(`users?current=true`).then((response) => {
          const users = response.body.users || [];
          this.user = users[0];
          return this.user;
        });
      }
    });
  }

  /** Gets the current session information. */
  getCurrentSession(): Promise<CallSession> {
    this.callSession = new CallSession(this);
    return this.callSession.fetch();
  }

  /** Returns the current agent availability information from the MonsterConnect platform */
  getAvailability(): Promise<AvailabilityInfo> {
    return this.http.get('server_activities/availability').then((response) => {
      return new AvailabilityInfo(response.body.availability);
    });
  }

  protected _initializeRealtimeConnection() {
    this.realtime = new RealtimeConnection(this.config);
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
}
