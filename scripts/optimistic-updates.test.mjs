import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import ts from "typescript";
const require = createRequire(import.meta.url);
function load(file, imports = {}) {
 const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
 const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
 const compiled = { exports: {} };
 vm.runInNewContext(`(function(require,module,exports){${outputText}\n})`, { crypto: webcrypto, structuredClone })(name => { assert.ok(name in imports, name); return imports[name]; }, compiled, compiled.exports);
 return compiled.exports;
}
const optimistic = load("system/cloud/optimistic-record.ts");
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const tick = () => new Promise(setImmediate);
test("renders before persistence, retains newer changes after earlier responses, and serializes writes", async () => {
 let visible; const first = deferred(); const writes = [];
 const record = optimistic.createOptimisticRecord({ name: "original", count: 0 }, (value, pending) => { visible = { value, pending }; });
 const one = record.enqueue(value => ({ ...value, name: "changed" }), async next => { writes.push(next); await first.promise; return next; });
 assert.equal(visible.value.name, "changed"); assert.equal(writes.length, 0);
 const two = record.enqueue(value => ({ ...value, count: 2 }), async next => { writes.push(next); return next; });
 await tick(); assert.equal(writes.length, 1); assert.equal(visible.value.count, 2);
 first.resolve(); await Promise.all([one, two]);
 assert.equal(writes.length, 2); assert.equal(visible.pending, 0); assert.equal(visible.value.count, 2); assert.equal(visible.value.name, "changed");
});
test("failed edit rolls back alone, while subsequent edits are replayed on the acknowledged state", async () => {
 let visible; const gate = deferred();
 const record = optimistic.createOptimisticRecord({ name: "original", count: 0 }, value => { visible = value; });
 const one = record.enqueue(value => ({ ...value, name: "will fail" }), async () => { await gate.promise; throw new Error("offline"); });
 const failure = assert.rejects(one, /offline/);
 const two = record.enqueue(value => ({ ...value, count: 3 }), async next => next);
 assert.equal(visible.name, "will fail"); assert.equal(visible.count, 3);
 gate.resolve(); await Promise.all([failure, two]);
 assert.equal(visible.name, "original"); assert.equal(visible.count, 3);
});
test("deleting a just-created record stays invisible while creation and deletion are saved in order", async () => {
 let visible; const gate = deferred(); const writes = [];
 const record = optimistic.createOptimisticRecord(null, value => { visible = value; });
 const add = record.enqueue(() => ({ id: "new", version: 1 }), async next => { writes.push("create"); await gate.promise; return next; });
 const remove = record.enqueue(() => null, async (_next, previous) => { assert.equal(previous.id, "new"); writes.push("delete"); return null; });
 assert.equal(visible, null); gate.resolve(); await Promise.all([add, remove]); assert.equal(visible, null); assert.deepEqual(writes, ["create", "delete"]);
});
function projects() {
 const requests = [];
 const cloudRequest = (resource, body) => { const gate = deferred(); requests.push({ resource, body, ...gate }); return gate.promise; };
 const { useProjectStore: store } = load("stores/useProjectStore.ts", {
   zustand: require("zustand"), "zustand/middleware": { persist: value => value },
   "@/system/cloud/client": { cloudRequest }, "@/system/cloud/optimistic-record": optimistic,
   "@/system/integrations/cases": { getCaseKey: item => item.id },
 });
 return { store, requests };
}
test("project creation shows a stable client ID immediately and stale hydration cannot remove it", async () => {
 const { store, requests } = projects();
 const hydration = store.getState().hydrate();
 const adding = store.getState().createManualProject({ projectName: "new", workType: "studio_cut", stage: "draft" });
 const draft = store.getState().projects[0]; assert.ok(draft.id); assert.equal(draft.projectName, "new");
 requests[0].resolve([]); await hydration; assert.equal(store.getState().projects[0].id, draft.id);
 await tick(); const create = requests.find(request => request.body?.input);
 assert.equal(create.body.id, draft.id); create.resolve(draft); await adding;
 assert.equal(store.getState().projects.length, 1); assert.equal(store.getState().pendingProjectIds.length, 0);
});
test("failed project deletion restores its card and tabs without losing another concurrent creation", async () => {
 const { store, requests } = projects();
 const original = { id: "original", projectName: "original", workType: "studio_cut", stage: "draft", workHistory: [] };
 store.setState({ projects: [original], activeProjectId: original.id, openProjectIds: [original.id] });
 const removing = store.getState().deleteProject(original.id); const failure = assert.rejects(removing, /offline/);
 assert.equal(store.getState().projects.length, 0); assert.equal(store.getState().openProjectIds.length, 0);
 const adding = store.getState().createManualProject({ projectName: "another", workType: "studio_cut", stage: "draft" });
 const other = store.getState().projects[0];
 await tick(); requests.find(request => request.resource === "delete-project").reject(new Error("offline"));
 requests.find(request => request.body?.input).resolve(other);
 await Promise.all([failure, adding]);
 assert.equal(store.getState().projects.length, 2); assert.ok(store.getState().projects.some(project => project.id === "original"));
 assert.equal(store.getState().activeProjectId, "original"); assert.ok(store.getState().openProjectIds.includes("original"));
});

test("brand upload then removal renders immediately and persists against acknowledged versions with stable image IDs", async () => {
 const upload = deferred(); const requests = [];
 const seed = { id: "brand", name: "brand", version: 1, images: [], createdAt: "2026-11-26", updatedAt: "2026-11-26" };
 const { useBrandStore: store } = load("stores/useBrandStore.ts", {
   zustand: require("zustand"), "@/system/cloud/optimistic-record": optimistic,
   "@/system/cloud/client": {
     cloudImage: async url => { if (url.startsWith("data:")) { await upload.promise; return "/api/assets/uploaded"; } return url; },
     cloudRequest: async (resource, body) => { requests.push({ resource, body }); return { version: body.expectedVersion + 1 }; },
   },
   "@/system/brand/brand-library": { loadBrands: async () => [seed] },
   "./useCloudSyncStore": { reportCloudError: () => {} },
 });
 await store.getState().hydrate();
 const add = store.getState().change("brand", brand => ({ ...brand, images: [{ id: "local-image", imageUrl: "data:image/png;base64,fixture", name: "fixture" }] }));
 assert.equal(store.getState().brands[0].images[0].id, "local-image");
 const remove = store.getState().change("brand", brand => ({ ...brand, images: brand.images.filter(image => image.id !== "local-image") }));
 assert.equal(store.getState().brands[0].images.length, 0);
 await tick(); assert.equal(requests.length, 0);
 upload.resolve(); await Promise.all([add, remove]);
 assert.equal(store.getState().brands[0].images.length, 0);
 assert.deepEqual(requests.map(request => request.body.expectedVersion), [1, 2]);
 assert.equal(requests[0].body.brand.images[0].imageUrl, "/api/assets/uploaded");
 assert.equal(requests[1].body.brand.images.length, 0);
});
