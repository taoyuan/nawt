/* eslint-disable prefer-arrow-callback */

'use strict';
const {assert} = require('chai');
require('./support');
const wpa = require('..').wpa;

describe('WPA Basic Tests', function () {

  describe('functions', function () {

    it('should list networks', async function () {
      const networks = await wpa.listNetworks('wlan0');
      assert.typeOf(networks, 'array');
    });

    it('should get status', async function () {
      const status = await wpa.status('wlan0');
      assert.typeOf(status, 'object');
    });

    it('should scan', async function () {
      this.timeout(6000);
      const networks = await wpa.scan('wlan0');
      assert.typeOf(networks, 'array');
    });
  });
});
