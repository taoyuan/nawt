'use strict';

const debug = require('debug')('nwireless:wpa');
const {exec} = require('child-process-promise');
const assert = require('assert');
const _ = require('lodash');
const iu = require('./iu');
const Monitor = require('./wpa-monitor');

/**
 * @static
 * @category wpa
 */
const wpa = module.exports = {
  Monitor,
  monitor: async iface => await Monitor.create(iface)
};

/**
 *
 * @param {String} iface
 * @param {string} action
 * @param {Array} [args]
 * @return {Promise<string|*>}
 */
wpa.exec = async function (iface, action, args) {
  iface = await iu.resolve(iface);
  args = args || [];
  if (!Array.isArray(args)) {
    args = [args];
  }
  const cmd = ['wpa_cli', '-i', iface, action, ...args].join(' ');
  debug('<<<', cmd);
  const result = await exec(cmd);
  const out = result.stdout.trim();
  debug('>>>', out);
  if (out === 'FAIL') {
    throw new Error('Command failed: ' + cmd);
  }
  return out;
};

/**
 * Request for status
 */
wpa.status = async function (iface) {
  assert(!_.isNil(iface), 'iface is required');
  const res = await wpa.exec(iface, 'status');
  const status = {};
  const lines = res.split('\n');
  lines.filter(line => line.length > 3).forEach(line => {
    const parts = line.split('=').map(s => s.trim());
    status[parts[0]] = parts[1];
  });
  return status;
};


/**
 * Scan for WiFi AP
 */
wpa.scan = async function (iface) {
  assert(!_.isNil(iface), 'iface is required');
  let res = await wpa.exec(iface, 'scan');
  if (_.toUpper(res) !== 'OK') {
    throw new Error(res);
  }
  res = await wpa.exec(iface, 'scan_result');
  const lines = res.split('\n');
  lines.splice(0, 1);
  return lines
    .map(line => line.split('\t'))
    .filter(record => record.length > 3)
    .map(record => ({
      bssid: record[0].trim(),
      freq: record[1].trim(),
      rssi: record[2].trim(),
      ssid: record[4].trim()
    }));
};


/**
 * Add new network
 * @return {Number}
 */
wpa.addNetwork = async function (iface) {
  assert(!_.isNil(iface), 'iface is required');
  return parseInt(await wpa.exec(iface, 'add_network'));
};


/**
 * Request to list networks
 */
wpa.listNetworks = async function (iface) {
  assert(!_.isNil(iface), 'iface is required');
  const res = await wpa.exec(iface, 'list_networks');
  const lines = res.split('\n');
  lines.splice(0, 1);
  return lines
    .map(line => line.split('\t').map(s => s.trim()))
    .filter(record => record.length >= 3)
    .map(record => ({
      id: record[0],
      ssid: record[1],
      essid: record[2],
      flags: record[3],
    }));
};

wpa.setNetworkSetting = async function (iface, id, name, value) {
  assert(!_.isNil(iface), 'iface is required');
  assert(!_.isNil(id), 'id is required');
  assert(!_.isNil(name), 'name is required');
  assert(!_.isNil(value), 'value is required');
  return await wpa.exec(iface, 'set_network', [id, name, value]);
};

wpa.setNetworkSettingString = async function (iface, id, name, value) {
  assert(!_.isNil(iface), 'iface is required');
  assert(!_.isNil(id), 'id is required');
  assert(!_.isNil(name), 'name is required');
  assert(!_.isNil(value), 'value is required');
  return await this.setNetworkSetting(iface, id, name, `'"${value}"'`);
};

wpa.getNetworkSetting = async function (iface, id, name) {
  assert(!_.isNil(iface), 'iface is required');
  assert(!_.isNil(id), 'id is required');
  assert(!_.isNil(name), 'name is required');
  return await wpa.exec(iface, 'get_network', [id, name]);
};

/**
 * Enable configured network
 * @param {String} iface
 * @param {String} id network id recieved from list networks
 */
wpa.enableNetwork = async function (iface, id) {
  assert(!_.isNil(iface), 'iface is required');
  assert(!_.isNil(id), 'id is required');
  return await wpa.exec(iface, 'enable_network', [id]);
};

/**
 * Disable configured network
 * @param {String} iface
 * @param {String} id id network id received from list networks
 */
wpa.disableNetwork = async function (iface, id) {
  assert(!_.isNil(iface), 'iface is required');
  assert(!_.isNil(id), 'id is required');
  return await wpa.exec(iface, 'disable_network', [id]);
};

/**
 * Select network to connect
 * @param {String} iface
 * @param {String} id id network id received from list networks
 */
wpa.selectNetwork = async function (iface, id) {
  assert(!_.isNil(iface), 'iface is required');
  assert(!_.isNil(id), 'id is required');
  return await wpa.exec(iface, 'select_network', [id]);
};

/**
 * Remove network to connect
 * @param {String} iface
 * @param {String|Number} id id network id received from list networks
 */
wpa.removeNetwork = async function (iface, id) {
  assert(!_.isNil(iface), 'iface is required');
  assert(!_.isNil(id), 'id is required');
  return await wpa.exec(iface, 'remove_network', [id]);
};

wpa.reloadConfiguration = async function (iface) {
  assert(!_.isNil(iface), 'iface is required');
  return await wpa.exec(iface, 'reconfigure');
};

wpa.saveConfiguration = async function (iface) {
  assert(!_.isNil(iface), 'iface is required');
  return await wpa.exec(iface, 'save_config');
};

/**
 * Disconnect from AP
 */
wpa.disconnect = async function (iface) {
  return await wpa.exec(iface, 'disconnect');
};

// --------------------------------------
// TODO: P2P communication
// --------------------------------------
