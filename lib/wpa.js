'use strict';

const debug = require('debug')('nwireless:wpa');
const EventEmitter = require('eventemitter2').EventEmitter2;
const {exec} = require('child-process-promise');

class WPA extends EventEmitter {

  constructor(iface) {
    super({wildcard: true, maxListeners: 20});
    this.iface = iface || 'wlan0';
  }

  static async exec() {
    return exec(...arguments);
  }

  async wpacli(cmd, args) {
    args = args || [];
    if (!Array.isArray(args)) {
      args = [args];
    }
    const c = ['wpa_cli', '-i', this.iface, cmd, ...args].join(' ');
    debug('<<<', c);
    const result = await WPA.exec(c);
    const out = result.stdout.trim();
    debug('>>>', out);
    if (out === 'FAIL') {
      throw new Error('Command failed: ' + c);
    }
    return out;
  }

  /**
   * Request for status
   */
  async status() {
    // return this.sendCmd(COMMANDS.STATUS).then(res => {
    const res = await this.wpacli('status');
    const status = {};
    const lines = res.split('\n');
    lines.filter(line => line.length > 3).forEach(line => {
      const parts = line.split('=').map(s => s.trim());
      status[parts[0]] = parts[1];
    });
    this.emit('status', status);
    return status;
  }

  /**
   * Scan for wifi AP
   */
  async scan() {
    // return this.sendCmd(COMMANDS.SCAN)

    let res = await this.wpacli('scan');
    if (_.toUpper(res) !== 'OK') {
      throw new Error(res);
    }
    res = await this.wpacli('scan_result');
    const lines = res.split('\n');
    lines.splice(0, 1);
    const networks = lines
      .map(line => line.split('\t'))
      .filter(record => record.length > 3)
      .map(record => ({
        bssid: record[0].trim(),
        freq: record[1].trim(),
        rssi: record[2].trim(),
        ssid: record[4].trim()
      }));
    this.emit('scanned', networks);
    return networks;
  }

  /**
   * Add new network
   */
  async addNetwork() {
    return parseInt(await this.wpacli('add_network'));
  }

  /**
   * Request to list networks
   */
  async listNetworks() {
    // return this.sendCmd(COMMANDS.LIST_NETWORK)
    const res = await this.wpacli('list_networks');
    const lines = res.split('\n');
    lines.splice(0, 1);
    const networks = lines
      .map(line => line.split('\t').map(s => s.trim()))
      .filter(record => record.length >= 3)
      .map(record => ({
        id: record[0],
        ssid: record[1],
        essid: record[2],
        flags: record[3],
      }));
    this.emit('networks', networks);
    return networks;
  }

  async setNetworkSetting(networkId, name, value) {
    return await this.wpacli('set_network', [networkId, name, value]);
  }

  async setNetworkSettingString(networkId, name, value) {
    value = `'"${value}"'`;
    return await this.setNetworkSetting(networkId, name, value);
  }

  async getNetworkSetting(networkId, name) {
    // return this.sendCmd(`GET_NETWORK ${networkId} ${name}`);
    return await this.wpacli('get_network', [networkId, name]);
  }

  /**
   * Enable configured network
   * @param  {string} networkId network id recieved from list networks
   */
  async enableNetwork(networkId) {
    // return this.sendCmd(`ENABLE_NETWORK ${networkId}`);
    return await this.wpacli('enable_network', [networkId]);
  }

  /**
   * Disable configured network
   * @param  {string} networkId networkId network id received from list networks
   */
  async disableNetwork(networkId) {
    // return this.sendCmd(`DISABLE_NETWORK ${networkId}`);
    return await this.wpacli('disable_network', [networkId]);
  }

  /**
   * Select network to connect
   * @param  {String} networkId networkId network id received from list networks
   */
  async selectNetwork(networkId) {
    // return this.sendCmd(`SELECT_NETWORK ${networkId}`);
    return await this.wpacli('select_network', [networkId]);
  }

  /**
   * Remove network to connect
   * @param  {String} networkId networkId network id received from list networks
   */
  async removeNetwork(networkId) {
    // return this.sendCmd(`REMOVE_NETWORK ${networkId}`);
    return await this.wpacli('remove_network', [networkId]);
  }

  async reloadConfiguration() {
    // this.sendCmd(`RECONFIGURE`);
    return await this.wpacli('reconfigure');
  }

  async saveConfiguration() {
    // return this.sendCmd(`SAVE_CONFIG`);
    return await this.wpacli('save_config');
  }

  /**
   * Disconnect from AP
   */
  async disconnect() {
    // return this.sendCmd('DISCONNECT');
    return await this.wpacli('disconnect');
  }

  // --------------------------------------
  // TODO: P2P communication
  // --------------------------------------

}

module.exports = WPA;
