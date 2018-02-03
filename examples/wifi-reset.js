'use strict';

const wifi = require('..').wifi;

(async function () {
  await wifi.reset('onboard');
})();
