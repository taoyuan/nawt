// access point control

const c = require('sysctlx');
const fs = require('fs-extra');
const path = require('path');
const nprops = require('nprops');
const PromiseA = require('bluebird');
const _ = require('lodash');

const iw = require('./iw');

const REG_CONFIG_FILE = /--config ("(.+)"|([^ \r\n\t"]+))/;
const REG_IFACE_PHY = /phy[#]?(\d+)/;

class APC {

  static create(serviceName) {
    return new APC(serviceName);
  }

  constructor(serviceName = 'create_ap') {
    this.serviceName = serviceName;
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
  async configure(ssid, options) {
    const props = await normalize(ssid, options);
    const status = await c.status(this.serviceName);
    if (!status.file) {
      throw new Error('Service "' + this.serviceName + '" is not installed properly');
    }
    const content = fs.readFileSync(status.file).toString();
    const match = content.match(REG_CONFIG_FILE);
    if (!match) {
      throw new Error('Can not configure server "' + this.serviceName + '", it started without --config ');
    }
    const configFile = match[2] || match[3];
    if (!props) {
      return await PromiseA.fromCallback(cb => nprops.parse(configFile, {path: true}, cb));
    }

    const data = await PromiseA.fromCallback(cb => nprops.parse(path.resolve(__dirname, '../create_ap/create_ap.conf'), {path: true}, cb));

    _.forEach(props, (v, k) => {
      data[_.toUpper(k)] = v;
    });
    return await PromiseA.fromCallback(cb => nprops.stringify(data, {path: configFile, compact: true}, cb));
  }

  async start(ssid, options) {
    if (ssid) {
      await this.configure(ssid, options);
    }
    await c.start(this.serviceName, true);
  }

  async stop() {
    await c.stop(this.serviceName);
  }

  async state() {
    return await c.checkActive(this.serviceName);
  }

  async isActive() {
    return await c.isActive(this.serviceName);
  }

  async enable() {
    await c.enable(this.serviceName);
  }

  async disable() {
    await c.disable(this.serviceName);
  }

  async isEnabled() {
    await c.isEnabled(this.serviceName);
  }
}

module.exports = APC;

async function normalize(ssid, options) {
  if (!ssid) return;
  if (typeof ssid !== 'string') {
    options = ssid;
    ssid = null;
  }
  options = options || {};

  let match;

  let wifi_iface = options.wifi_iface || 'phy0';
  if (match = wifi_iface.match(REG_IFACE_PHY)) {
    wifi_iface = await iw.get_dev_by_phy(match[1]);
  }

  let internet_iface = options.internet_iface;
  if (internet_iface && (match = internet_iface.match(REG_IFACE_PHY))) {
    internet_iface = await iw.get_dev_by_phy(match[1]);
  }

  options = Object.assign({
    ssid,
    wifi_iface,
    internet_iface,
    share_method: internet_iface ? 'nat' : 'none',
    gateway: '10.1.1.1',
    no_virt: 1
  }, options);

  return _.transform(options, (result, value, key) => {
    result[_.toUpper(key)] = _.isNil(value) ? '' : value;
  }, {});
}
