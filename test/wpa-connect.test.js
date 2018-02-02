'use strict';

const PromiseA = require('bluebird');
const s = require('./support');
const wpa = require('..').wpa;

const IFACE = 'wlan0';

if (s.ssid) {
  describe('WPA connect', () => {

    let monitor;
    before(async () => {
      monitor = await wpa.monitor(IFACE);
    });

    after(() => {
      monitor.close();
    });

    beforeEach(async () => {
      const networks = await wpa.listNetworks(IFACE);
      for (let i = 0; i < networks.length; i++) {
        await wpa.removeNetwork(IFACE, networks[i].id);
      }
    });

    it('should emit "invalidkey" event', function (done) {
      this.timeout(10000);
      monitor.once('invalidkey', () => done());

      addNetwork(IFACE, s.ssid, 'invalid_key');
    });

    it('should emit "connected" event', function (done) {
      this.timeout(10000);
      monitor.once('connected', () => done());

      addNetwork(IFACE, s.ssid, s.password);
    });

    it('should emit "disconnected" event', function (done) {
      this.timeout(10000);

      monitor.once('connected', async () => {
        monitor.once('disconnected', () => done());
        await wpa.disconnect(IFACE);
      });

      addNetwork(IFACE, s.ssid, s.password);
    });
  });
}

async function addNetwork(iface, ssid, password) {
  const id = await wpa.addNetwork(iface);
  return PromiseA.mapSeries([
    () => wpa.setNetworkSettingString(iface, id, 'ssid', ssid),
    () => wpa.setNetworkSettingString(iface, id, 'psk', password),
    () => wpa.enableNetwork(iface, id),
    () => wpa.selectNetwork(iface, id),
  ], fn => fn());
}
