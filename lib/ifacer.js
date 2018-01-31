// network hardware

const {exec} = require('child_process');
const PromiseA = require('bluebird');
const _ = require('lodash');
const CMD_LSHW = 'lshw -json';

const ifacer = module.exports = {
  lshw,
  resolve
};

/**
 *
 * @param {Object} [opts]
 * @param {String} [opts.class] only list a certain class of hardware
 * @return {Promise<any>}
 *
 * Example:
 *
 * [ { id: 'network:0',
    class: 'network',
    claimed: true,
    description: 'Ethernet interface',
    physid: '1',
    logicalname: 'eth0',
    serial: 'b8:27:eb:2b:44:d2',
    units: 'bit/s',
    size: 100000000,
    capacity: 100000000,
    configuration:
     { autonegotiation: 'on',
       broadcast: 'yes',
       driver: 'smsc95xx',
       driverversion: '22-Aug-2005',
       duplex: 'full',
       firmware: 'smsc95xx USB 2.0 Ethernet',
       ip: '10.0.0.18',
       link: 'yes',
       multicast: 'yes',
       port: 'MII',
       speed: '100Mbit/s' },
    capabilities:
     { ethernet: true,
       physical: 'Physical interface',
       tp: 'twisted pair',
       mii: 'Media Independent Interface',
       '10bt': '10Mbit/s',
       '10bt-fd': '10Mbit/s (full duplex)',
       '100bt': '100Mbit/s',
       '100bt-fd': '100Mbit/s (full duplex)',
       autonegotiation: 'Auto-negotiation' } },
 { id: 'network:1',
   class: 'network',
   claimed: true,
   description: 'Wireless interface',
   physid: '2',
   businfo: 'usb@1:1.4',
   logicalname: 'wlan0',
   serial: 'e8:4e:06:34:ff:db',
   configuration:
    { broadcast: 'yes',
      driver: 'rtl8192cu',
      multicast: 'yes',
      wireless: 'unassociated' },
   capabilities:
    { ethernet: true,
      physical: 'Physical interface',
      wireless: 'Wireless-LAN' } },
 { id: 'network:2',
   class: 'network',
   claimed: true,
   description: 'Wireless interface',
   physid: '3',
   logicalname: 'wlan1',
   serial: 'b8:27:eb:7e:11:87',
   configuration:
    { broadcast: 'yes',
      driver: 'brcmfmac',
      driverversion: '7.45.41.46',
      firmware: '01-f8a78378',
      multicast: 'yes',
      wireless: 'IEEE 802.11' },
   capabilities:
    { ethernet: true,
      physical: 'Physical interface',
      wireless: 'Wireless-LAN' } } ]
 */
async function lshw(opts) {
  opts = opts || {};
  const cmd = [CMD_LSHW];
  if (opts.class) {
    cmd.push('-c', opts.class);
  }
  let [content] = await PromiseA.fromCallback(cb => exec(cmd.join(' '), cb), {multiArgs: true});
  if (opts.class) {
    content = '[' + content + ']';
  }
  return JSON.parse(content);
}

async function resolve(iface) {
  if (!iface || iface.startsWith('wlan')) {
    return iface;
  }

  const networks = (await ifacer.lshw({class: 'network'})).filter(n => n.capabilities.wireless === 'Wireless-LAN');
  const found = _.find(networks, n => iface === 'onboard' ? !n.businfo : _.startsWith(n.businfo, iface));
  if (found) return found.logicalname;
  throw new Error('Can not resolve iface "' + iface + '"');
}
