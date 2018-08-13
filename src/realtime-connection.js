import Faye from '../vendor/faye';

export default class RealtimeConnection {

  constructor(params) {
    this.host = params.host;
    this.authToken = params.authToken;
    this.webSocketUrl = this.host + '/ws';
    this._initializeClient();
  }

  /**
    * @private
  */
  _initializeClient() {
    this._webSocketClient = new Faye.Client(this.webSocketUrl);
    // add this object as an extension so that incoming() and outgoing() will be called
    this._webSocketClient.addExtension(this);
    return this._webSocketClient;
  }

  subscribe(channel, callback) {
    this._webSocketClient.subscribe(channel, callback);
  }

  unsubscribe(channel, callback) {
    this._webSocketClient.unsubscribe(channel, callback);
  }

  get channels() {
    this._webSocketClient._channels.getKeys();
  }

  disconnect(options = {}) {
    // only disconnect if there are no more subscriptions or it is being forced
    if ((options.force) || (this.channels.length === 0)) {
      this._webSocketClient.disconnect();
    }
    // once disconnected, the client does not reconnect properly -- just reinitialize the client
    this._initializeClient();
  }

  // occurs when an incoming message is received
  incoming(message, callback) {
    if (message.channel !== "/meta/connect") {
      console.log("incoming", message);
    }

    if (message.data && message.ext && message.ext._time) {
      message.data._time = message.ext._time;
    }

    if (message.error) {
      console.warn(`Error from notification server: ${message.error}`);
    }

    callback(message);
    // disconnect on successful unsubscribe (if there are no other subscriptions)
    if ((message.channel == '/meta/unsubscribe') && (message.successful)) {
      this.disconnect();
    }
  }

  // occurs when a message is to be sent
  outgoing(message, callback) {
    if (message.channel !== "/meta/connect") {
      console.log("outgoing", message);
    }

    if (message.channel === '/meta/subscribe') {
      message.ext = message.ext || {};
      message.ext.session_id = this.authToken;
    }
    callback(message)
  }

}
