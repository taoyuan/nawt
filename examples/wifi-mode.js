'use strict';

const nw = require('..');

(async () => {
  const wifi = await nw.wifi('wlan0');
  console.log(await wifi.mode());
})();
