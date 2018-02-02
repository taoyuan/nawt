/* eslint-disable camelcase */
'use strict';

const debug = require('debug')('nwireless:wifi');
const PromiseA = require('bluebird');
const EventEmitter = require('eventemitter2').EventEmitter2;
const {exec} = require('child-process-promise');

const iw = require('./iw');
const iu = require('./iu');
const wpa = require('./wpa');
const utils = require('./utils');

/**
 *
 */
class WiFi extends EventEmitter {

  /**
   *
   * Async create Wireless instances to support `phy#` format interface.
   *
   * @param {String} [iface] wlan0, wlan1, ...
   * @return {Promise<WiFi>}
   *
   * Example:
   *
   *  const wireless = await Wireless.create('onboard');
   */
  static async create(iface) {
    return new WiFi(await iu.resolve(iface));
  }

  /**
   *
   * @param {String} [iface]
   */
  constructor(iface) {
    super({wildcard: true});

    iface = iface || 'wlan0';
    this.iface = iface;
  }

  async status() {
    return await wpa.status(this.iface);
  }

  async state() {
    const status = await this.status();
    const state = utils.toLower(status.wpa_state);
    if (state === 'connected' || state === 'completed') {
      return 'connected';
    }
    return 'disconnected';
  }

  /**
   * Result could be one of: 'station' or 'ap'
   */
  async mode() {
    const status = await this.status();
    if (utils.toLower(status.wpa_state) === 'disconnected' && status.ip_address) {
      return 'ap';
    }
    return 'station';
  }

  async scan() {
    const cells = await iw.scan(this.iface);
    debug(`Found ${cells.length} wireless cells at ${this.iface}`);
    this.emit('scan_result', cells);
    return cells;
  }

  listNetworks() {
    return wpa.listNetworks(this.iface);
  }

  async findNetworkBySSID(ssid) {
    const networks = await this.listNetworks();
    return networks.find(n => n.ssid === ssid);
  }

  // eslint-disable-next-line no-unused-vars
  connect(ssid, password, options) {
    return this.addOrUpdateNetwork(...arguments);
  }

  disconnect() {
    return wpa.disconnect(this.iface);
  }

  async addOrUpdateNetwork(ssid, password, options) {
    options = options || {};
    const {auth} = options;
    const data = {ssid, psk: password};
    if (password) {
      data.key_mgmt = 'WPA-PSK';
    } else {
      data.key_mgmt = 'NONE';
      if (auth === 'WEP' || (password && !auth)) {
        data.wep_tx_keyidx = 0;
        data.wep_key0 = password;
      }
    }
    data.scan_ssid = 1;

    const keys = Object.keys(data);
    debug('connect', data);
    const network = await this.findNetworkBySSID(ssid);
    const id = network ? network.id : await wpa.addNetwork(this.iface);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (['ssid', 'psk'].includes(key)) {
        await wpa.setNetworkSettingString(this.iface, id, key, data[key]);
      } else {
        await wpa.setNetworkSetting(this.iface, id, key, data[key]);
      }
    }
    await wpa.enableNetwork(this.iface, id);
    await  wpa.selectNetwork(this.iface, id);
    return await wpa.saveConfiguration(this.iface);
  }

  async up() {
    debug(`set ${this.iface} up`);
    try {
      await exec(`sudo ip link set ${this.iface} up`);
    } finally {
      this.emit('up');
    }
  }

  async down() {
    debug(`set ${this.iface} down`);
    try {
      await exec(`sudo ip link set ${this.iface} down`);
    } finally {
      this.emit('down');
    }
  }

  async reset(delay = 1000) {
    debug(`rebooting ${this.iface}`);
    await this.down(this.iface);
    await PromiseA.delay(delay);
    await this.up(this.iface);
    debug(`rebooted ${this.iface}`);
    this.emit('reboot');
  }
}

module.exports = WiFi;
