import { Client } from './client';
import { ConfigParams } from './config';

class MonsterConnect {
  static get Client() {
    return Client;
  }

  static createClient(params: ConfigParams) {
    const client = new Client(params);
    return client.fetch();
  }
}

export default MonsterConnect;
