import Client from './client';

const MonsterConnect = {
  Client,

  createClient(params) {
    const client = new Client(params);
    return client.fetch();
  }
}

export default MonsterConnect;
