const child_process = require('child-process-promise');
const wtiw = require('wireless-tools').iw;
const PromiseA = require('bluebird');

const iw = module.exports = {
  exec: child_process.exec,
  scan: (options) => PromiseA.fromCallback(cb => wtiw.scan(options, cb)),
  dev_list,
  get_dev_by_phy,
  find_dev_by_phy
};

function parse_dev(phy) {

  return function (s) {
    const parsed = {};
    let match;

    if (match = s.match(/Interface (.+)/)) {
      parsed.iface = match[1];
    } else if (match = s.match(/(Unnamed.*) interface/)) {
      parsed.iface = match[1];
    }

    if (match = s.match(/ifindex (\d*)/)) {
      parsed.ifindex = parseInt(match[1]);
    }

    if (match = s.match(/wdev (0[xX][0-9a-fA-F]+)/)) {
      parsed.wdev = match[1];
    }

    if (match = s.match(/addr ([A-Fa-f0-9:]{17})/)) {
      parsed.addr = match[1];
    }

    if (match = s.match(/type (.+)/)) {
      parsed.type = match[1];
    }

    if (match = s.match(/txpower ([.\d]*) ?dBm/)) {
      parsed.txpower = parseFloat(match[1]);
    }

    if (match = s.match(/channel ([.\d]*)/)) {
      parsed.channel = parseInt(match[1]);
    }

    return {phy, ...parsed};
  }
}

function parse_phy(s) {
  let match = s.match(/phy#(\d*)\n/);
  if (match) {
    const idx = parseInt(match[1]);
    return s
      .substr(match[0].length)
      .trim()
      .split(/(?=Interface .+|Unnamed.*)/)
      .map(parse_dev(idx));
  }
  return [];
}

function parse_dev_list({stdout}) {
  return stdout.split(/(?=phy#\d*)/)
    .map(parse_phy)
    .reduce((result, curr) => result.concat(curr), [])
    .sort((a, b) => a.phy - b.phy);
}

async function dev_list() {
  return parse_dev_list(await iw.exec('iw dev'));
}

async function find_dev_by_phy(phy) {
  const found = (await dev_list()).find(dev => dev.ifindex && (dev.phy === parseInt(phy)));
  return found && found.iface;
}

async function get_dev_by_phy(phy) {
  const found = await find_dev_by_phy(phy);
  if (!found) {
    throw new Error('No dev found for phy#' + phy);
  }
  return found;
}
