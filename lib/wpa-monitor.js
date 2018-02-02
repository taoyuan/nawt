'use strict';

const debug = require('debug')('nwireless:monitor');
const EventEmitter = require('eventemitter2').EventEmitter2;
const spawn = require('child_process').spawn;
const _ = require('lodash');
const iu = require('./iu');

const EVENTS_MAP = {
  'CTRL-EVENT-SCAN-STARTED': 'scanning',
  'CTRL-EVENT-SCAN-RESULTS': 'scanned',
  'CTRL-EVENT-CONNECTED': 'connected',
  'CTRL-EVENT-DISCONNECTED': 'disconnected',
  'CTRL-EVENT-SSID-TEMP-DISABLED': 'invalidkey',
  'CTRL-EVENT-TERMINATING': 'terminating'
};

/**
 * @class Monitor
 * @extends EventEmitter
 */
class Monitor extends EventEmitter {

  static async create(iface) {
    iface = await iu.resolve(iface);
    return new Monitor(iface);
  }

  constructor(iface) {
    super({wildcard: true});
    this.iface = iface || 'wlan0';
    this._setup();
  }

  _setup() {
    if (this.ps) {
      return;
    }
    const ps = this.ps = spawn('wpa_cli', ['-i', this.iface]);

    ps.stdout.on('data', data => {
      data = Buffer.isBuffer(data) ? data.toString('utf-8') : data;
      data.split(/[\n\r]/)
        .map(line => line.trim())
        .filter(line => line && line !== '>')
        .forEach(line => this._handle(line));
    });

    ps.stderr.on('data', data => {
      debug('error', data);
      this.emit('error', new Error(data));
    });

    ps.on('close', code => {
      this.removeAllListeners();
      debug('closed');
      this.emit('close', code);
    });

    ps.on('error', err => {
      debug('error', err);
      this.emit('error', err);
    });
  }

  close() {
    this.ps.kill();
    this.ps = null;
  }

  /**
   * Message event handler
   * @param  {Buffer|String} data data received from wpa_ctrl
   */
  _handle(data) {
    data = Buffer.isBuffer(data) ? data.toString('utf-8') : data;
    data = data.trim();
    this.emit('data', data);
    if (/<3>CTRL/.test(data)) {
      this._handleCtrlEvent(data.substr(3));
    }
  }

  /**
   * Control event handler
   * @param  {String} data control event data
   */
  _handleCtrlEvent(data) {
    let match = data.match(/([A-Z\-]+)/);
    if (!match) {
      return;
    }

    let args;
    const ctrl = match[1];
    const other = data.substr(ctrl.length).trim();
    if (ctrl === 'CTRL-EVENT-CONNECTED') {
      args = {msg: other.substr(2)}
    } else if (other) {
      args = _.fromPairs(other.split(/[ \t]/).map(part => part.split('=')));
    }

    this.emit('control', ctrl, args);
    const eventName = EVENTS_MAP[ctrl];
    if (eventName) {
      debug('event', eventName);
      this.emit(eventName, args);
    }
  }
}

module.exports = Monitor;
