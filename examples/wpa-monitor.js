'use strict';

const wpa = require('..').wpa;

(async () => {
  const monitor = await wpa.monitor('wlan0');

  monitor.on('data', data => {
    console.log('data:', data);
  });
  monitor.on('control', (control, args) => {
    console.log('control:', control, args);
  });
})();
