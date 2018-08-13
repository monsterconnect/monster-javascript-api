import RealtimeConnection from './realtime-connection';
import Events from './events';
import RestApi from './rest-api';
import CallSession from './call-session';

const DEFAULT_HOST = 'https://app.monsterconnect.com';
const DEFAULT_NAMESPACE = 'api/v1';

export default class Client {
  constructor(params) {
    this.host = params.host || DEFAULT_HOST;
    this.namespace = params.namespace || DEFAULT_NAMESPACE;
    this.authToken = params.authToken;

    this._initializeRealtimeConnection();
    this.events = new Events();
    this.http = new RestApi({ host: this.host, namespace: this.namespace, authToken: this.authToken });
  }

  fetch() {
    return this.getCurrentUser().then(() => {
      return this.getCurrentSession();
    }).then(() => {
      return this;
    });
  }

  getCurrentUser() {
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

  getCurrentSession() {
    this.callSession = new CallSession(this);
    return this.callSession.fetch();
  }

  _initializeRealtimeConnection() {
    this.realtime = new RealtimeConnection({ host: this.host, authToken: this.authToken });
  }

  on() {
    this.events.on(...arguments);
  }

  off(eventName, callback) {
    this.events.off(...arguments);
  }

  trigger() {
    this.events.trigger(...arguments);
  }
}
