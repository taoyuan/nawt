const assert = require('chai').assert;
const sinon = require('sinon');
const iw = require('../lib/iw');

const IW_DEV_LIST_NONE = 'nl80211 not found.\n';
const IW_DEV_LIST = `phy#1
	Interface wlan0
		ifindex 3
		wdev 0x100000001
		addr e8:4e:06:34:ff:db
		type managed
		txpower 12.00 dBm
phy#0
	Unnamed/non-netdev interface
		wdev 0x2
		addr ba:27:eb:7e:11:87
		type P2P-device
		txpower 31.00 dBm
	Interface wlan1
		ifindex 4
		wdev 0x1
		addr b8:27:eb:7e:11:87
		type managed
		channel 1 (2412 MHz), width: 20 MHz, center1: 2412 MHz
		txpower 31.00 dBm
`;

describe('iw', () => {
  afterEach(() => {
    iw.exec.restore && iw.exec.restore();
  });

  describe('iw.dev_list()', function () {

    it('should list wlan devices', async function () {
      sinon.stub(iw, 'exec').callsFake((cmd) => {
        assert.equal(cmd, 'iw dev');
        return {stdout: IW_DEV_LIST}
      });

      const result = await iw.dev_list();
      console.log(result);
      assert.deepEqual(result, [{
        phy: 0,
        iface: 'Unnamed/non-netdev',
        wdev: '0x2',
        addr: 'ba:27:eb:7e:11:87',
        type: 'P2P-device',
        txpower: 31
      }, {
        phy: 0,
        iface: 'wlan1',
        ifindex: 4,
        wdev: '0x1',
        addr: 'b8:27:eb:7e:11:87',
        type: 'managed',
        txpower: 31,
        channel: 1
      }, {
        phy: 1,
        iface: 'wlan0',
        ifindex: 3,
        wdev: '0x100000001',
        addr: 'e8:4e:06:34:ff:db',
        type: 'managed',
        txpower: 12
      }]);
    });
  });
});
