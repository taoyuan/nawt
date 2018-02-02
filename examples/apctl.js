const apctl = require('../lib/apctl');
const iu = require('..').iu;

const ssid = 'nw-' + (new Date()).getMilliseconds();

(async () => {
  if (await apctl.isActive()) {
    console.log('It is running, now stop');
    await apctl.stop();
  }

  console.log('Configuring');
  await apctl.configure(ssid, {wifi_iface: await iu.resolve('onboard')});
  console.log('Starting create_ap with ssid: ' + ssid);
  await apctl.start();
  console.log('Started. Waiting for 2 minute to stop automatically, or press CTRL+C to stop it manually');

  setTimeout(exit, 120000);
})();

process.on('SIGINT', exit);

async function exit() {
  console.log('Stopping');
  await apctl.stop();
  console.log('Stopped');
  process.exit(0);
}
