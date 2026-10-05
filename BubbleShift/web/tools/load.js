// Loads the pure game modules (util, data, core, levels) into one Node context.
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function load(extraFiles) {
  const ctx = { console, Math, JSON, Date, Set, Map, Uint8Array, Array, Object, String, Number };
  vm.createContext(ctx);
  const dir = path.join(__dirname, '..', 'src', 'js');
  for (const f of ['00_util.js', '02_data.js', '03_core.js', '04_levels.js'].concat(extraFiles || [])) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8').replace(/^if \(typeof module.*$/m, '');
    vm.runInContext(src, ctx, { filename: f });
  }
  return vm.runInContext('({U, DATA, Core, Levels})', ctx);
};
