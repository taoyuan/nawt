'use strict';

const nw = require('..');

(async function () {
  const wifi = await nw.wifi('wlan0');
  await wifi.reset();
})();
