import RealtimeConnection from './realtime-connection';
import { Events, EventCallback } from './events';
import { RestApi, FetchResult } from './rest-api';
import CallSession from './call-session';

const DEFAULT_HOST = 'https://app.monsterconnect.com';
const DEFAULT_NAMESPACE = 'api/v1';

export interface ClientParams {
  host?: string;
  namespace?: string;
  authToken?: string;
}

export class Client {

  host: string;
  namespace: string;
  authToken: string;
  events: Events;
  http: RestApi;
  callSession: CallSession;
  realtime: RealtimeConnection;
  user: any;

  constructor(params: ClientParams) {
    this.host = params.host || DEFAULT_HOST;
    this.namespace = params.namespace || DEFAULT_NAMESPACE;
    this.authToken = params.authToken;

    this._initializeRealtimeConnection();
    this.events = new Events();
    this.http = new RestApi({ host: this.host, namespace: this.namespace, authToken: this.authToken });
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

  fetch(): Promise<Client> {
    return this.getCurrentUser().then(() => {
      return this.getCurrentSession();
    }).then(() => {
      return this;
    });
  }

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

  getCurrentSession(): Promise<CallSession> {
    this.callSession = new CallSession(this);
    return this.callSession.fetch();
  }

  protected _initializeRealtimeConnection() {
    this.realtime = new RealtimeConnection({ host: this.host, authToken: this.authToken });
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
