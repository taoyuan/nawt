'use strict';

const nw = require('..');
(async () => {
  const wifi = await nw.wifi('wlan0');
  const result = await wifi.disconnect();
  console.log('disconnect', result);
})();
