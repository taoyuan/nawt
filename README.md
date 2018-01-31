# AWT -Advanced Wireless Tools

[![NPM version][npm-image]][npm-url]
[![Downloads][download-image]][npm-url]

> A advanced wireless tools to control wpa_supplicant

## Installation

`npm i nwireless`

## Dependencies

* hostapd 
* dnsmasq 
* haveged
* [create_ap](https://github.com/oblique/create_ap)

## Note

This only works on linux, tested on ubuntu 14.4 and debian jesse.
you need to have wpa_supplicant installed , run using sudo and running  with wpa_spplicant having config : __ctrl_interface=/var/run/wpa_supplicant__

## Reference
http://w1.fi/wpa_supplicant/devel/ctrl_iface_page.html

## Examples

### Example: Wifi Connection

```js
const {Wireless} = require('nwireless');
const wireless = new Wireless();

(async () => {
  const result = await wireless.connect('ssid', 'password');
  console.log(result);
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

[npm-url]: https://npmjs.org/package/nwireless
[npm-image]: https://img.shields.io/npm/v/nwireless.svg?style=flat

[download-image]: http://img.shields.io/npm/dm/nwireless.svg?style=flat

