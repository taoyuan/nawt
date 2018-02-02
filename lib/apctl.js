// access point control

const fs = require('fs-extra');
const sysctlx = require('sysctlx');
const nprops = require('nprops');
const PromiseA = require('bluebird');
const _ = require('lodash');

const REG_CONFIG_FILE = /--config ("(.+)"|([^ \r\n\t"]+))/;

let SERVICE_NAME = 'create_ap';

module.exports = {
  getServiceName,
  setServiceName,
  configure,
  start,
  stop,
  state,
  enable,
  disable,
  isActive,
  isEnabled
};

async function _normalize(ssid, options) {
  if (!ssid) return;
  if (typeof ssid !== 'string') {
    options = ssid;
    ssid = null;
  }
  options = options || {};
  options = Object.assign({
    ssid,
    share_method: options.internet_iface ? 'nat' : 'none',
    gateway: '10.1.1.1',
    no_virt: 1
  }, options);

  return _.transform(options, (result, value, key) => {
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
async function configure(ssid, options) {
  const props = await _normalize(ssid, options);
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
    await configure(ssid, options);
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

