'use strict';

const wifi = require('..').wifi;

(async () => {
  console.log(await wifi.state('onboard'));
})();
