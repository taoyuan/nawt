'use strict';

const WiFi = require('./lib/wifi');

exports.iw = require('./lib/iw');
exports.iu = require('./lib/iu');
exports.wpa = require('./lib/wpa');
exports.apc = require('./lib/apctl');

exports.wifi = async iface => WiFi.create(iface);

exports.WiFi = WiFi;
