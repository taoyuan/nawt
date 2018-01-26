'use strict';

const {Wireless} = require('..');
const wireless = new Wireless('wlan0');

(async () => {
  console.log(await wireless.listNetworks());
})();
