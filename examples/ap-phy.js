const moment = require('moment');
const {Wireless, AP} = require('..');

function output(data, log) {
  data.trim().split(/[\n\r]/).forEach(line => log(`[ap] ${moment().utcOffset(-8).format('HH:mm:ss')} - ${line}`));
}

(async () => {
  const w = await Wireless.create('phy0');
  const mode = await w.mode();
  if (mode === 'station') {
    await w.disconnect();
  }

  const ap = await AP.create('AWT', {iface: 'phy0', password: '12345678'});

  ap.on('stdout', data => output(data, console.log));
  ap.on('stderr', data => output(data, console.error));

  ap.on('started', () => console.log('>>>> started'));
  ap.on('close', () => console.log('>>>> closed'));

  async function cleanup(sig) {
    console.log(sig);
    await ap.close();
    console.log('>>>> exit');
  }

  process.on('SIGINT', () => cleanup('SIGINT'));
  process.on('SIGTERM', () => cleanup('SIGTERM'));
})();
