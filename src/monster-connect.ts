import { Client, ClientParams } from './client';

const MonsterConnect = {
  Client,

  createClient(params: ClientParams) {
    const client = new Client(params);
    return client.fetch();
  }
}

export default MonsterConnect;
