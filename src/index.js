import 'babel-polyfill';
import 'whatwg-fetch';

import MonsterConnect from './monster-connect';

if (!window.MonsterConnect) {
  window.MonsterConnect = MonsterConnect;
}
