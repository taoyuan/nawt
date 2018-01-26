'use strict';

const {Wireless} = require('..');
const wireless = new Wireless();

(async () => {
  console.log(await wireless.mode());
})();
