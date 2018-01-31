const {ifacer} = require('..');

(async () => {
  console.log(await lshw({class: 'network'}));
})();
