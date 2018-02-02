'use strict';

const nw = require('..');

if (process.argv.length < 4) {
  console.log('Usage: sudo node examples/connect.js <ssid> <password>');
  process.exit(1);
}

(async () => {
  const wifi = await nw.wifi('wlan0');
  const result = await wifi.connect(process.argv[2], process.argv[3]);
  console.log('connect', result);
})();
