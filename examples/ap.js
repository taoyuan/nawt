const {Wireless, AP} = require('..');
const w = new Wireless();

function output(data, log) {
  data.trim().split(/[\n\r]/).forEach(line => log(`[ap] ${line}`));
}

(async () => {
  const mode = await w.mode();
  if (mode === 'station') {
    await w.disconnect();
  }
  const ap = AP.create('AWT', {iface: 'wlan0'});
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
