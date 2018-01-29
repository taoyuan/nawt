'use strict';

const {Wireless} = require('..');
const wireless = new Wireless();

(async () => {
  const result = await wireless.disconnect();
  console.log('disconnect', result);
})();
