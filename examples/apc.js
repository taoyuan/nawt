const APC = require('../lib/apc');
const apc = APC.create();

const ssid = 'nw-' + (new Date()).getMilliseconds();

(async () => {
  if (await apc.isActive()) {
    console.log('It is running, now stop');
    await apc.stop();
  }

  console.log('Configuring');
  await apc.configure(ssid);
  console.log('Starting create_ap with ssid: ' + ssid);
  await apc.start();
  console.log('Started. Waiting for 1 minute to stop automatically, or press CTRL+C to stop it manually');

  setTimeout(exit, 60000);
})();

process.on('SIGINT', exit);

async function exit() {
  console.log('Stopping');
  await apc.stop();
  console.log('Stopped');
  process.exit(0);
}
