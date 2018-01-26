# AWT -Advanced Wireless Tools

[![NPM version][npm-image]][npm-url]
[![Downloads][download-image]][npm-url]

> A advanced wireless tools to control wpa_supplicant

## Installation

`npm i awt`

## Pre-requirements

```bash
sudo apt-get install -y hostapd dnsmasq haveged
```

## Note

This only works on linux, tested on ubuntu 14.4 and debian jesse.
you need to have wpa_supplicant installed , run using sudo and running  with wpa_spplicant having config : __ctrl_interface=/var/run/wpa_supplicant__

## Reference
http://w1.fi/wpa_supplicant/devel/ctrl_iface_page.html

## Examples

### Example: Wifi Connection

```js
const {Wireless} = require('awt');
const wireless = new Wireless();

(async () => {
  await wireless.open();
  const result = await wireless.connect('ssid', 'password');
  console.log(result);
  await wireless.close();
})()
```

### More Examples

More examples are [here](examples)

## Test

* Setup a host access point.
* Run `npm test` in `sudo`.
```bash
sudo SSID="ssid" PASS="password" npm test
```

## License

 MIT ©  [Yuan Tao](https://github.com/taoyuan)

[npm-url]: https://npmjs.org/package/awt
[npm-image]: https://img.shields.io/npm/v/awt.svg?style=flat

[download-image]: http://img.shields.io/npm/dm/awt.svg?style=flat

