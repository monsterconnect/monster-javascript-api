import Promise from 'promise-polyfill';

if (!window.Promise) {
  window.Promise = Promise;
}

import 'whatwg-fetch';


import MonsterConnect from './monster-connect';

if (!window.MonsterConnect) {
  window.MonsterConnect = MonsterConnect;
}
