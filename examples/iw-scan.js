'use strict';

const iw = require('..').iw;

(async () => {
  console.log(await iw.scan('wlan0'));
})();
