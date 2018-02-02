const iu = require('..').iu;

(async () => {
  console.log(await iu.lshw({class: 'network'}));
})();
