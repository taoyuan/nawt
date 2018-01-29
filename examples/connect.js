'use strict';

const {Wireless} = require('..');

if (process.argv.length < 4) {
  console.log('Usage: sudo node examples/connect.js <ssid> <password>');
  process.exit(1);
}

(async () => {
  const wireless = await Wireless.create('phy0');
  const result = await wireless.connect(process.argv[2], process.argv[3]);
  console.log('connect', result);
})();
