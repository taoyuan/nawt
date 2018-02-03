'use strict';

const wifi = require('..').wifi;

if (process.argv.length < 4) {
  console.log('Usage: sudo node examples/connect.js <ssid> <password>');
  process.exit(1);
}

(async () => {
  const result = await wifi.connect('onboard', process.argv[2], process.argv[3]);
  console.log('connect', result);
})();
