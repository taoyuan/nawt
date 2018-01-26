'use strict';

const {Wireless} = require('..');
const wireless = new Wireless();

(async () => {
  const result = await wireless.connect('TY', 'password');
  console.log(result);
})();