import 'babel-polyfill';
import 'whatwg-fetch';

import Client from './client';

if (!window.MonsterConnect) {
  const createClient = (params) => { return (new Client(params)).fetch(); }
  window.MonsterConnect = { Client, createClient };
}
