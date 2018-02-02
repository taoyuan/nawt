const assert = require('chai').assert;
const apctl = require('..').apctl;

describe('apctl', () => {
  it('should normalize with default options', () => {
    const options = apctl.normalize('test');
    assert.deepEqual(options, {
      CHANNEL: 'default',
      GATEWAY: '10.1.1.1',
      WPA_VERSION: 2,
      ETC_HOSTS: 0,
      DHCP_DNS: 'gateway',
      NO_DNS: 0,
      NO_DNSMASQ: 0,
      HIDDEN: 0,
      MAC_FILTER: 0,
      MAC_FILTER_ACCEPT: '/etc/hostapd/hostapd.accept',
      ISOLATE_CLIENTS: 0,
      SHARE_METHOD: 'none',
      IEEE80211N: 0,
      IEEE80211AC: 0,
      HT_CAPAB: '[HT40+]',
      VHT_CAPAB: '',
      DRIVER: 'nl80211',
      NO_VIRT: 1,
      COUNTRY: '',
      FREQ_BAND: '2.4',
      NEW_MACADDR: '',
      DAEMONIZE: 0,
      NO_HAVEGED: 0,
      WIFI_IFACE: 'wlan0',
      INTERNET_IFACE: '',
      SSID: 'test',
      PASSPHRASE: '12345678',
      USE_PSK: 0
    })
  });
});
