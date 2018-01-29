'use strict';

const debug = require('debug')('nwireless:ap');
const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const inflection = require('inflection');
const assert = require('assert');
const execa = require('execa');
const EventEmitter = require('eventemitter2').EventEmitter2;
const PromiseA = require('bluebird');

const iw = require('./iw');

const CREATE_AP = path.join(__dirname, '..', 'create_ap', 'create_ap');

const REG_IFACE_PHY = /phy[#]?(\d+)/;

/**
 * @class AP
 */
class AP extends EventEmitter {

  /**
   * Construct an AP instance
   *
   * @param {String|Object} name ap name or options
   * @param {Object} [options] Options for AP
   * @param {String} [options.iface] The wifi interface (wlan0, phy0)
   * @param {String} [options.ifaceInternet] The interface with internet
   * @param {String} [options.name] The access point name
   * @param {String} [options.password] The access point password
   * @param {Object} [options.opts] The options for create_ap. Camel case options. Example:
   *  {
   *    noVirt: true,  // -no-virt
   *    g: '10.1.1.1', // -g <gateway>
   *    ...
   *  }
   * @return {AP}
   */
  static async create(name, options) {
    assert(fs.existsSync(CREATE_AP), '"create_ap" has not been found in ' + CREATE_AP);

    if (typeof name !== 'string') {
      options = name;
      name = null;
    }

    let match;

    let iface = options.iface || 'wlan0';
    if (match = iface.match(REG_IFACE_PHY)) {
      iface = await iw.get_dev_by_phy(match[1]);
    }

    let ifaceInternet = options.ifaceInternet;
    if (ifaceInternet && (match = ifaceInternet.match(REG_IFACE_PHY))) {
      ifaceInternet = await iw.get_dev_by_phy(match[1]);
    }

    options = _.merge({
      name,
      opts: {
        g: '10.1.1.1',
        noVirt: true
      }
    }, options);

    name = options.name;
    const {opts, password} = options;

    const apopts = [];
    const apargs = [];

    _.forEach(opts, (v, k) => {
      if (k.length === 1) {
        apopts.push('-' + k);
      } else {
        apopts.push('--' + inflection.dasherize(inflection.underscore(k)));
      }
      if (!_.isBoolean(v) && v !== true) {
        apopts.push(v);
      }
    });

    // wifi-interface
    apargs.push(iface);
    if (ifaceInternet) {
      // interface-with-internet
      apargs.push(ifaceInternet);
    } else {
      // disable internet sharing
      apopts.push('-n');
    }
    // access-point-name
    apargs.push(name);
    // passphrase
    if (password) {
      apargs.push(password);
    }

    const args = [CREATE_AP].concat(apopts).concat(apargs);
    debug('create_ap', args);
    return new AP(execa.shell(args.join(' ')));
  }

  /**
   *
   * @param {ChildProcess} p
   */
  constructor(p) {
    super();
    // assert(ap instanceof ChildProcess, 'Argument `ap` must be a ChildProcess. Using AP.create() to construct AP instance.');
    this._process = p;

    p.on('error', err => this.emit('error', err));

    p.stdout.on('data', data => this._handleStatusData(data));
    p.stderr.on('data', data => this._handleErrorData(data));
  }

  get active() {
    return this._started && !this._killing;
  }

  _handleStatusData(data) {
    if (Buffer.isBuffer(data)) {
      data = data.toString();
    }
    this.emit('stdout', data);
    if (/AP-ENABLED/.test(data)) {
      this._started = true;
      this.emit('started');
    }
    if (this._killing) {
      if (/done/.test(data)) {
        this._close();
      }
    }
  }

  _handleErrorData(data) {
    if (Buffer.isBuffer(data)) {
      data = data.toString();
    }
    this.emit('stderr', data);
  }

  _close() {
    if (this._process) {
      this._started = false;
      this._killing = false;
      this._process = null;
      this.emit('close');
    }
  }

  async close(sig = 'SIGINT') {
    if (!this._process) {
      return;
    }

    try {
      if (!this._killing) {
        this._killing = true;
        this._process.kill(sig);
      }

      await PromiseA.fromCallback(cb => this.once('close', () => cb())).timeout(5000);
    } catch (e) {
      this._close();
    }
  }
}

module.exports = AP;
