// access point control

const fs = require('fs-extra');
const sysctlx = require('sysctlx');
const nprops = require('nprops');
const PromiseA = require('bluebird');
const _ = require('lodash');

const REG_CONFIG_FILE = /--config ("(.+)"|([^ \r\n\t"]+))/;

let SERVICE_NAME = 'create_ap';


/**
 * @typedef {Object} APOptions
 * @property {string} channel
 * @property {string} gateway
 * @property {number} wpa_version
 * @property {boolean} etc_hosts
 * @property {string} dhcp_dns
 * @property {boolean} dns
 * @property {boolean} dnsmasq
 * @property {boolean} hidden
 * @property {boolean} mac_filter
 * @property {string} mac_filter_accept
 * @property {boolean} isolate_clients
 * @property {string} share_method
 * @property {boolean} ieee80211n
 * @property {boolean} ieee80211ac
 * @property {string} ht_capab
 * @property {string} vht_capab
 * @property {string} driver
 * @property {boolean} virt
 * @property {string} country
 * @property {string} freq_band
 * @property {string} new_macaddr
 * @property {boolean} daemonize
 * @property {boolean} haveged
 * @property {string} iface
 * @property {string} ifaceInternet
 * @property {string} ssid
 * @property {string} passphrase
 * @property {boolean} use_psk
 */

/**
 *
 * @type {APOptions}
 */
const DEFAULTS = {
  channel: 'default',
  gateway: '10.1.1.1',
  wpa_version: 2,
  etc_hosts: false,
  dhcp_dns: 'gateway',
  dns: true,
  dnsmasq: true,
  hidden: false,
  mac_filter: false,
  mac_filter_accept: '/etc/hostapd/hostapd.accept',
  isolate_clients: false,
  share_method: 'nat',
  ieee80211n: false,
  ieee80211ac: false,
  ht_capab: '[HT40+]',
  vht_capab: '',
  driver: 'nl80211',
  virt: true,
  country: '',
  freq_band: '2.4',
  new_macaddr: '',
  daemonize: false,
  haveged: true,
  iface: 'wlan0',
  ifaceInternet: 'eth0',
  ssid: 'MyAccessPoint',
  passphrase: '12345678',
  use_psk: false
};


module.exports = {
  defaults: DEFAULTS,
  normalize,
  getServiceName,
  setServiceName,
  configure: config,
  start,
  stop,
  state,
  enable,
  disable,
  isActive,
  isEnabled
};

const PROPS_PRE_NO = ['dns', 'dnsmasq', 'virt', 'haveged'];
const PROPS_MAP = {
  iface: 'wifi_iface',
  ifaceInternet: 'internet_iface'
};

/**
 *
 * @param {String} ssid
 * @param {APOptions} [options]
 * @private
 */
function normalize(ssid, options) {
  if (!ssid) return;
  if (typeof ssid !== 'string') {
    options = ssid;
    ssid = null;
  }
  options = options || {};
  const {ifaceInternet} = options;
  options = Object.assign(DEFAULTS, {
    ssid,
    ifaceInternet,
    share_method: ifaceInternet ? 'nat' : 'none',
    virt: false
  }, options);

  return _.transform(options, (result, value, key) => {
    if (PROPS_PRE_NO.includes(key)) {
      key = 'no_' + key;
      value = !value;
    }
    if (_.isBoolean(value)) {
      value = value ? 1 : 0;
    }

    if (PROPS_MAP[key]) {
      key = PROPS_MAP[key];
    }
    result[_.toUpper(key)] = _.isNil(value) ? '' : value;
  }, {});
}

function getServiceName() {
  return SERVICE_NAME;
}

function setServiceName(name) {
  if (name) {
    SERVICE_NAME = name;
  }
  return SERVICE_NAME;
}

/**
 *
 * @param ssid
 * @param options
 *  CHANNEL=default
 *  GATEWAY=10.0.0.1
 *  WPA_VERSION=2
 *  ETC_HOSTS=0
 *  DHCP_DNS=gateway
 *  NO_DNS=0
 *  NO_DNSMASQ=0
 *  HIDDEN=0
 *  MAC_FILTER=0
 *  MAC_FILTER_ACCEPT=/etc/hostapd/hostapd.accept
 *  ISOLATE_CLIENTS=0
 *  SHARE_METHOD=nat
 *  IEEE80211N=0
 *  IEEE80211AC=0
 *  HT_CAPAB=[HT40+]
 *  VHT_CAPAB=
 *  DRIVER=nl80211
 *  NO_VIRT=0
 *  COUNTRY=
 *  FREQ_BAND=2.4
 *  NEW_MACADDR=
 *  DAEMONIZE=0
 *  NO_HAVEGED=0
 *  WIFI_IFACE=wlan0
 *  INTERNET_IFACE=eth0
 *  SSID=MyAccessPoint
 *  PASSPHRASE=12345678
 *  USE_PSK=0
 * @return {Promise<*>}
 */
async function config(ssid, options) {
  const props = normalize(ssid, options);
  const status = await sysctlx.status(SERVICE_NAME);
  if (!status.file) {
    throw new Error('Service "' + SERVICE_NAME + '" is not installed properly');
  }
  const content = fs.readFileSync(status.file).toString();
  const match = content.match(REG_CONFIG_FILE);
  if (!match) {
    throw new Error('Can not configure server "' + SERVICE_NAME + '", it started without --config ');
  }
  const configFile = match[2] || match[3];
  const data = await PromiseA.fromCallback(cb => nprops.parse(configFile, {path: true}, cb));
  if (!props) {
    return data;
  }
  _.forEach(props, (v, k) => {
    data[_.toUpper(k)] = v;
  });
  return await PromiseA.fromCallback(cb => nprops.stringify(data, {path: configFile, compact: true}, cb));
}

async function start(ssid, options) {
  if (ssid) {
    await config(ssid, options);
  }
  await sysctlx.start(SERVICE_NAME, true);
}

async function stop() {
  await sysctlx.stop(SERVICE_NAME);
}

async function state() {
  return await sysctlx.checkActive(SERVICE_NAME);
}

async function enable() {
  await sysctlx.enable(SERVICE_NAME);
}

async function disable() {
  await sysctlx.disable(SERVICE_NAME);
}

async function isActive() {
  return await sysctlx.isActive(SERVICE_NAME);
}

async function isEnabled() {
  await sysctlx.isEnabled(SERVICE_NAME);
}

