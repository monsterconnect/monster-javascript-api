import { Client, ClientParams } from './client';

class MonsterConnect {
  static get Client() {
    return Client;
  }

  static createClient(params: ClientParams) {
    const client = new Client(params);
    return client.fetch();
  }
}

export default MonsterConnect;
