/* eslint-disable camelcase */
'use strict';

const debug = require('debug')('awt:wifi');
const PromiseA = require('bluebird');
const {exec} = require('child-process-promise');

const iw = require('./iw');
const iu = require('./iu');
const wpa = require('./wpa');
const utils = require('./utils');

const wifi = module.exports = {};

wifi.status = async function(iface) {
  iface = await iu.resolve(iface);
  return await wpa.status(iface);
};

wifi.state = async function(iface) {
  iface = await iu.resolve(iface);
  const status = await wpa.status(iface);
  const state = utils.toLower(status.wpa_state);
  if (state === 'disconnected' && status.ip_address) {
    return 'ap';
  } else if (state === 'connected' || state === 'completed') {
    return 'connected';
  }
  return 'disconnected';
};

/**
 * Result could be one of: 'station' or 'ap'
 */
wifi.mode = async function(iface) {
  return await wifi.state(iface) === 'ap' ? 'ap' : 'station';
};

wifi.scan = async function(iface) {
  iface = await iu.resolve(iface);
  const cells = await iw.scan(iface);
  debug(`Found ${cells.length} wireless cells at ${iface}`);
  return cells;
};

wifi.listNetworks = async function(iface) {
  iface = await iu.resolve(iface);
  return await wpa.listNetworks(iface);
};

wifi.findNetworkBySSID = async function(iface, ssid) {
  const networks = await wpa.listNetworks(iface);
  return networks.find(n => n.ssid === ssid);
};

// eslint-disable-next-line no-unused-vars
wifi.connect = async function(iface, ssid, password, options) {
  return await wifi.addOrUpdateNetwork(...arguments);
};

wifi.disconnect = async function(iface) {
  iface = await iu.resolve(iface);
  return await wpa.disconnect(iface);
};

wifi.addOrUpdateNetwork = async function(iface, ssid, password, options) {
  iface = await iu.resolve(iface);
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
  const network = await wifi.findNetworkBySSID(iface, ssid);
  const id = network ? network.id : await wpa.addNetwork(iface);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (['ssid', 'psk'].includes(key)) {
      await wpa.setNetworkSettingString(iface, id, key, data[key]);
    } else {
      await wpa.setNetworkSetting(iface, id, key, data[key]);
    }
  }
  await wpa.enableNetwork(iface, id);
  await  wpa.selectNetwork(iface, id);
  return await wpa.saveConfiguration(iface);
};

wifi.up = async function(iface) {
  iface = await iu.resolve(iface);
  debug(`set ${iface} up`);
  await exec(`sudo ip link set ${iface} up`);
};

wifi.down = async function(iface) {
  iface = await iu.resolve(iface);
  debug(`set ${iface} down`);
  await exec(`sudo ip link set ${iface} down`);
};

wifi.reset = async function(iface, delay = 1000) {
  debug(`rebooting ${iface}`);
  await wifi.down(iface);
  await PromiseA.delay(delay);
  await wifi.up(iface);
  debug(`rebooted ${iface}`);
};
