import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// Exercise the production save queue with a controllable HTTP boundary. No
// browser storage or remote database is used by these concurrency tests.
function library() {
  const seed = { id: "11111111-1111-4111-a111-111111111111", version: 1,
    projectId: null, title: "initial", createdAt: "2026-11-25T00:00:00Z", shots: [] };
  const posts = [];
  const errors = [];
  let version = 1;
  let block;
  let fail = false;
  const client = {
    portableState: async value => value,
    cloudRequest: async (resource, body) => {
      if (!body) return [structuredClone(seed)];
      if (resource === "delete-history") { posts.push({ resource }); return {}; }
      if (block) { const wait = block; block = undefined; await wait; }
      if (fail) { fail = false; throw new Error("offline"); }
      assert.equal(body.version, version, "save must use the last acknowledged version");
      posts.push({ resource, title: body.title, version: body.version });
      return { version: ++version };
    },
  };
  const imports = {
    "@/system/cloud/client": client,
    "@/stores/useCloudSyncStore": { reportCloudError: (error, retry) => errors.push({ error, retry }) },
    "./generation-batch": { cloneBatch: structuredClone },
  };
  const source = readFileSync(new URL("../system/create/generation-library.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const module = { exports: {} };
  const execute = vm.runInNewContext(`(function(require,module,exports){${outputText}\n})`, { structuredClone });
  execute(name => { assert.ok(imports[name], `unexpected dependency: ${name}`); return imports[name]; }, module, module.exports);
  return { api: module.exports, posts, errors, failNext: () => { fail = true; },
    blockNext: () => { let release; block = new Promise(resolve => { release = resolve; }); return release; } };
}

test("unchanged histories are not rewritten; subsequent edits advance the acknowledged version", async () => {
  const { api, posts } = library();
  const history = await api.loadGenerationHistory();
  await api.saveGenerationHistory(history);
  assert.equal(posts.length, 0);
  history[0].title = "first";
  await api.saveGenerationHistory(history);
  history[0].title = "second";
  await api.saveGenerationHistory(history);
  assert.deepEqual(posts.map(p => [p.title, p.version]), [["first", 1], ["second", 2]]);
});

test("rapid saves retain their own snapshots and execute in order", async () => {
  const { api, posts, blockNext } = library();
  const history = await api.loadGenerationHistory();
  const release = blockNext();
  history[0].title = "first";
  const first = api.saveGenerationHistory(history);
  history[0].title = "second";
  const second = api.saveGenerationHistory(history);
  release();
  await Promise.all([first, second]);
  assert.deepEqual(posts.map(p => p.title), ["first", "second"]);
});

test("a stale queued snapshot cannot recreate a deleted history", async () => {
  const { api, posts, blockNext } = library();
  const history = await api.loadGenerationHistory();
  const release = blockNext();
  history[0].title = "before delete";
  const saving = api.saveGenerationHistory(history);
  await new Promise(resolve => setImmediate(resolve));
  const deleting = api.deleteGenerationHistory(history[0].id);
  const stale = api.saveGenerationHistory(history);
  release();
  await Promise.all([saving, deleting, stale]);
  assert.equal(posts.filter(p => p.resource === "histories").length, 1);
  assert.equal(posts.at(-1).resource, "delete-history");
});

test("retry after a failed save uses the latest local snapshot", async () => {
  const { api, posts, errors, failNext } = library();
  const history = await api.loadGenerationHistory();
  history[0].title = "failed old edit";
  failNext();
  await assert.rejects(api.saveGenerationHistory(history), /offline/);
  assert.equal(errors.length, 1);
  history[0].title = "latest edit";
  await api.saveGenerationHistory(history);
  await errors[0].retry();
  assert.deepEqual(posts.map(p => p.title), ["latest edit"]);
});

test("workspace flush can recover a failed history save", async () => {
  const { api, posts, failNext } = library();
  const history = await api.loadGenerationHistory();
  history[0].title = "pending history";
  failNext();
  await assert.rejects(api.saveGenerationHistory(history), /offline/);
  await api.flushHistorySaves();
  assert.deepEqual(posts.map(p => p.title), ["pending history"]);
});
