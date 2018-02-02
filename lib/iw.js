const {exec} = require('child-process-promise');
const iu = require('./iu');

/**
 * The **iw** command is used to control nl80211 radios.
 *
 * @static
 * @category iw
 *
 */
const iw = module.exports = {
  exec,
  scan
};

/**
 * Returns a truthy if the network has an ssid; falsy otherwise.
 *
 * @private
 * @static
 * @category iw
 * @param {object} network The scanned network object.
 * @returns {string} The ssid.
 *
 */
function has_ssid(network) {
  return network.ssid;
}

/**
 * Returns a truthy if the network has any key; falsy otherwise.
 *
 * @private
 * @static
 * @category iw
 * @param {object} network The scanned network object.
 * @returns {boolean} True if any key.
 *
 */
function has_keys(network) {
  return Object.keys(network).length !== 0;
}


/**
 * A comparison function to sort networks ordered by signal strength.
 *
 * @private
 * @static
 * @category iw
 * @param {object} a A scanned network object.
 * @param {object} b Another scanned network object.
 * @returns {number} The comparison value.
 *
 */
function by_signal(a, b) {
  return b.signal - a.signal;
}

/**
 * Parses a scanned wireless network cell.
 *
 * @private
 * @static
 * @category iw
 * @param {string} cell The section of stdout for the cell.
 * @returns {object} The scanned network object.
 *
 */
function parse_cell(cell) {
  const parsed = {};
  let match;

  if ((match = cell.match(/BSS ([0-9A-Fa-f:-]{17})\(on/))) {
    parsed.address = match[1].toLowerCase();
  }

  if ((match = cell.match(/freq: ([0-9]+)/))) {
    parsed.frequency = parseInt(match[1], 10);
  }

  if ((match = cell.match(/signal: (-?[0-9.]+) dBm/))) {
    parsed.signal = parseFloat(match[1]);
  }

  if ((match = cell.match(/last seen: ([0-9]+) ms ago/))) {
    parsed.lastSeenMs = parseInt(match[1], 10);
  }

  if ((match = cell.match(/SSID: \\x00/))) {
    delete parsed.ssid;
  }
  else if ((match = cell.match(/SSID: ([^\n]*)/))) {
    parsed.ssid = match[1];
  }

  if ((match = cell.match(/DS Parameter set: channel ([0-9]+)/))) {
    parsed.channel = parseInt(match[1], 10);
  }
  else if ((match = cell.match(/\* primary channel: ([0-9]+)/))) {
    parsed.channel = parseInt(match[1], 10);
  }

  if (cell.match(/RSN:[\s*]+Version: 1/)) {
    parsed.security = 'wpa2';
  }
  else if (cell.match(/WPA:[\s*]+Version: 1/)) {
    parsed.security = 'wpa';
  }
  else if (cell.match(/capability: ESS Privacy/)) {
    parsed.security = 'wep';
  }
  else if (cell.match(/capability: ESS/)) {
    parsed.security = 'open';
  }
  return parsed;
}

/**
 * Parses all scanned wireless network cells.
 *
 * @private
 * @static
 * @category iw
 * @param {Boolean} show_hidden
 * @param {String} stdout
 */
function parse_scan(show_hidden, stdout) {
  return show_hidden ?
    stdout
      .split(/(^|\n)(?=BSS )/)
      .map(parse_cell)
      .filter(has_keys)
      .sort(by_signal)
    :
    stdout
      .split(/(^|\n)(?=BSS )/)
      .map(parse_cell)
      .filter(has_ssid)
      .sort(by_signal);
}

/**
 * The **iw scan** command is used to scan for wireless networks
 * visible to a wireless interface. For convenience, the networks are
 * sorted by signal strength.
 *
 * @static
 * @category iw
 * @param {String|Object} options
 * @param {String} [options.iface]
 * @param {Boolean} [options.show_hidden]
 */
async function scan(options) {
  let iface, show_hidden;
  if (typeof options === 'string') {
    iface = options;
    show_hidden = false;
  } else {
    iface = options.iface;
    show_hidden = options.show_hidden || false;
  }

  iface = await iu.resolve(iface);
  const {stdout} = await iw.exec('iw dev ' + iface + ' scan');
  return parse_scan(show_hidden, stdout);
}
