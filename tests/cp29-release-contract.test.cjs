const test = require("node:test");
const assert = require("node:assert/strict");
const pkg = require("../package.json");
const lock = require("../package-lock.json");

test("CP29-01: direct dependencies do not float on latest tags", () => {
  for (const section of ["dependencies", "devDependencies"]) {
    for (const [name, version] of Object.entries(pkg[section] || {})) {
      assert.notEqual(version, "latest", `${section}.${name} must be pinned or range-constrained`);
      const locked = lock.packages[`node_modules/${name}`]?.version;
      assert.ok(locked, `missing lockfile entry for ${name}`);
      if (/^\d+\.\d+\.\d+/.test(version)) {
        assert.equal(locked, version, `${name} package.json must match lockfile`);
      }
    }
  }
});
