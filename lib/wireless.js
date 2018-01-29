/* eslint-disable camelcase */
'use strict';

const debug = require('debug')('nwireless:wireless');
const PromiseA = require('bluebird');
const EventEmitter = require('eventemitter2').EventEmitter2;
const {exec} = require('child-process-promise');
const ifconfig = require('wireless-tools/ifconfig');

const utils = require('./utils');
const WPA = require('./wpa');
const iw = require('./iw');

/**
 *
 */
class Wireless extends EventEmitter {

  /**
   *
   * Async create Wireless instances to support `phy#` format interface.
   *
   * @param {String} [ifaceOrPhy] iface or phy. iface could be [wlan0, wlan2, ...]. Sometimes we need to use specific
   *  physical wlan device, phy is the physical name for wlan iface. It comes from `iw dev`.
   * @return {Promise<Wireless>}
   *
   * Example:
   *
   *  const wireless = await Wireless.create('wlan0');
   *
   *  const wireless = await Wireless.create('phy#0');
   */
  static async create(ifaceOrPhy) {
    ifaceOrPhy = ifaceOrPhy || 'phy#0';
    let match = ifaceOrPhy.match(/phy[#]?(\d+)/);
    let iface = match ? await iw.get_dev_by_phy(match[1]) : ifaceOrPhy;
    return new Wireless(iface);
  }

  constructor(iface) {
    super({wildcard: true});

    iface = iface || 'wlan0';
    this.iface = iface;
    this.wpa = new WPA(iface);

    const that = this;
    this.wpa.on('*', function () {
      that.emit(this.event, ...arguments);
    });
  }

  status() {
    return this.wpa.status();
  }

  async state() {
    const status = this.wpa.status();
    const state = utils.toLower(status.wpa_state);
    if (state === 'connected' || state === 'completed') {
      return 'connected';
    }
    return 'disconnected';
  }

  /**
   * Result could be one of: 'station' or 'ap'
   */
  mode() {
    const status = this.wpa.status();
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

  /**
   * List network interfaces on system
   */
  listInterfaces() {
    return PromiseA.fromCallback(cb => ifconfig.status(cb));
  }

  listNetworks() {
    return this.wpa.listNetworks();
  }

  async findNetworkBySsid(ssid) {
    const networks = await this.listNetworks();
    return networks.find(n => n.ssid === ssid);
  }

  // eslint-disable-next-line no-unused-vars
  connect(ssid, password, options) {
    return this.addOrUpdateNetwork(...arguments);
  }

  disconnect() {
    return this.wpa.disconnect();
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

    const wpa = this.wpa;
    const keys = Object.keys(data);
    debug('connect', data);
    const network = await this.findNetworkBySsid(ssid);
    const id = network ? network.id : await wpa.addNetwork();
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (['ssid', 'psk'].includes(key)) {
        await wpa.setNetworkSettingString(id, key, data[key]);
      } else {
        await wpa.setNetworkSetting(id, key, data[key]);
      }
    }
    await wpa.enableNetwork(id);
    await  wpa.selectNetwork(id);
    return await wpa.saveConfiguration();
  }

  removeNetwork(ssid) {
    const n = this.findNetworkBySsid(ssid);
    return n && this.wpa.removeNetwork(n.id);
  }

  enableNetworks(ssid) {
    const n = this.findNetworkBySsid(ssid);
    return n && this.wpa.enableNetwork(n.id);
  }

  disableNetwork(ssid) {
    const n = this.findNetworkBySsid(ssid);
    return n && this.wpa.disableNetwork(n.id);
  }

  selectNetwork(ssid) {
    const n = this.findNetworkBySsid(ssid);
    return n && this.wpa.selectNetwork(n.id);
  }

  reloadConfiguration() {
    return this.wpa.reloadConfiguration();
  }

  saveConfiguration() {
    return this.wpa.saveConfiguration();
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

  async reboot(delay = 1000) {
    debug(`rebooting ${this.iface}`);
    await this.down(this.iface);
    await PromiseA.delay(delay);
    await this.up(this.iface);
    debug(`rebooted ${this.iface}`);
    this.emit('reboot');
  }
}

module.exports = Wireless;
