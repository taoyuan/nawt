'use strict';

const wifi = require('..').wifi;

(async () => {
  const result = await wifi.disconnect('onboard');
  console.log('disconnect', result);
})();
