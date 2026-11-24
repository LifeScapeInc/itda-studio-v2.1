// Run with: node scripts/test-generation-batch.mjs
// Transpile project modules in memory; no app/server or paid generation calls.
import fs from "node:fs";
import path from "node:path";
import Module, { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const load = createRequire(import.meta.url);
import assert from "node:assert/strict";
import ts from "typescript";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (id, ...args) {
  return resolve.call(this, id.startsWith("@/") ? path.join(root, id.slice(2)) : id, ...args);
};
load.extensions[".ts"] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, esModuleInterop: true },
}).outputText, file);

const batch = load("../system/create/generation-batch.ts");
const { GENERATION_OPTION_TEXT: text } = load("../system/create/generation-option-text.ts");
const { buildGenerationPrompts } = load("../system/create/generation-prompt.ts");
const { createGenerationShots } = load("../system/create/generation-shots.ts");
const { mapSize } = load("../system/server/image-settings.ts");
const { useCreateStore: store } = load("../stores/useCreateStore.ts");
const { useWorkspaceLayoutStore: layout } = load("../stores/useWorkspaceLayoutStore.ts");
const base = { referenceImage: null, contentSet: null, angleVariationIds: [], freeCount: 1, quality: "medium", editMode: "swap", light: "", mood: "", props: [], prompt: "" };
let checks = 0;
function check(name, run) { run(); checks++; console.log("PASS", name); }

check("All 19 prompt blocks match the source document verbatim", () => {
  const doc = fs.readFileSync(path.join(root, "docs/generation-option-prompts.md"), "utf8");
  const blocks = [...doc.matchAll(/```text\r?\n([\s\S]*?)\r?\n```/g)].map(match => match[1].trim());
  assert.deepEqual(Object.values(text), blocks.slice(1, 20));
});
check("168 combinations retain five-block order and API ratio/resolution", () => {
  for (const purpose of batch.PURPOSE_OPTIONS) for (const composition of batch.COMPOSITION_OPTIONS) for (const ratio of batch.RATIO_OPTIONS) {
    const entry = { id: "combination", kind: "make", purpose: purpose.id, composition: composition.id, ratio, quantity: 1 };
    const input = { ...base, batchEntries: [entry] };
    const [prompt] = buildGenerationPrompts(input), [shot] = createGenerationShots(input);
    assert.deepEqual(prompt.prompt.split("\n\n"), [text.COMMON_PREFIX, text[purpose.id], text[composition.id], text[ratio], text.COMMON_SUFFIX]);
    assert.equal(prompt.id, shot.id);
    assert.equal(shot.ratio, ratio);
    assert.equal(shot.resolution.replace("×", "x"), mapSize(ratio));
  }
});
check("Preset layouts match the documented template mapping", () => {
  const doc = fs.readFileSync(path.join(root, "docs/generation-preset-decomposition.md"), "utf8");
  const mapping = doc.slice(doc.indexOf("## 기존 프리셋의 템플릿 매핑"), doc.indexOf("## 분석 근거"));
  const names = { detail: "상세페이지", sns: "SNS", ad: "광고", lookbook: "룩북", angle: "앵글 변주" };
  for (const [id, name] of Object.entries(names)) {
    const rows = mapping.split(/\r?\n/).filter(line => line.startsWith(`| ${name} |`));
    const expected = rows.map(line => line.split("|").slice(3, 6).map(value => value.trim().replace("일반 이미지", "일반")));
    const actual = batch.GENERATION_PRESETS[id].makes.map(make => [batch.PURPOSE_OPTIONS.find(o => o.id === make.purpose).label, batch.COMPOSITION_OPTIONS.find(o => o.id === make.composition).label, make.ratio]);
    assert.deepEqual(actual, expected, id);
  }
});
check("Per-make and preset quantities expand independently with unique IDs", () => {
  const entries = [{ ...batch.newMake("direct"), quantity: 2 }, { id: "preset", kind: "preset", presetId: "detail", quantity: 3 }];
  const shots = createGenerationShots({ ...base, batchEntries: entries });
  assert.equal(batch.getBatchCount(entries), 14);
  assert.equal(shots.length, 14);
  assert.equal(new Set(shots.map(s => s.id)).size, 14);
  assert.deepEqual(shots.map(s => s.id), buildGenerationPrompts({ ...base, batchEntries: entries }).map(p => p.id));
});
check("Free generation is a normal make, with legacy quantities retained", () => {
  assert.ok(!("free" in batch.GENERATION_PRESETS));
  const [entry] = batch.cloneBatch([{ id: "old-free", kind: "preset", presetId: "free", quantity: 3 }]);
  assert.deepEqual(entry, { ...batch.newMake("old-free"), quantity: 3 });
  assert.equal(batch.getBatchCount([entry]), 3);
  assert.equal(createGenerationShots({ ...base, batchEntries: [entry] }).length, 3);
});
check("Ctrl toggles, Shift ranges, Ctrl+Shift adds ranges and evaluation navigates only selected images", () => {
  store.setState({ generationShots: ["a", "b", "c", "d", "e"].map(id => ({ id, status: "done", imageUrl: "/" + id })), selectedShotIds: [], selectedShotId: null, selectionAnchorId: null });
  const select = (id, keys) => store.getState().selectShot(id, keys);
  select("b"); select("d", { shiftKey: true });
  assert.deepEqual(store.getState().selectedShotIds, ["b", "c", "d"]);
  select("c", { ctrlKey: true });
  assert.deepEqual(store.getState().selectedShotIds, ["b", "d"]);
  select("e", { ctrlKey: true, shiftKey: true });
  assert.deepEqual(store.getState().selectedShotIds, ["b", "c", "d", "e"]);
  store.getState().navigateSelection(-1); assert.equal(store.getState().selectedShotId, "d");
  assert.equal(store.getState().generationPanelTab, "evaluation");
  select("a"); assert.deepEqual(store.getState().selectedShotIds, ["a"]);
  select(null); assert.deepEqual(store.getState().selectedShotIds, []);
});
check("Image and history titles update saved results; draft titles stay separate", () => {
  store.setState({ generationHistory: [{ id: "rename", title: "Before", shots: [{ id: "image", label: "Old" }] }], generationShots: [{ id: "image", label: "Old" }], draftTitle: "새 생성" });
  store.getState().renameHistory("rename", "New history");
  store.getState().renameShot("image", "New image");
  assert.equal(store.getState().generationHistory[0].title, "New history");
  assert.equal(store.getState().generationHistory[0].shots[0].label, "New image");
  assert.equal(store.getState().generationShots[0].label, "New image");
  store.getState().renameDraft("Draft title");
  assert.equal(store.getState().draftTitle, "Draft title");
  store.getState().renameHistory("rename", "  ");
  assert.equal(store.getState().generationHistory[0].title, "New history");
  store.setState({ generationHistory: [], generationShots: [], selectedShotId: null, selectedShotIds: [], selectionAnchorId: null });
});
check("Bulk bookmarking updates every selected image and preserves others", () => {
  const shots = ["one", "two", "other"].map(id => ({ id, bookmarked: false }));
  store.setState({ generationHistory: [{ id: "bulk", shots }], generationShots: shots });
  store.getState().setBookmarks(["one", "two"], true);
  assert.deepEqual(store.getState().generationShots.map(s => s.bookmarked), [true, true, false]);
  assert.deepEqual(store.getState().generationHistory[0].shots.map(s => s.bookmarked), [true, true, false]);
  store.getState().setBookmarks(["one", "two"], false);
  assert.ok(store.getState().generationShots.every(s => !s.bookmarked));
  store.setState({ generationHistory: [], generationShots: [] });
});
check("Every deployed expert tag contributes its prompt; keep-original contributes none", () => {
  const maps = load("../system/create/expert-style-prompts.ts");
  const options = load("../system/create/generation-options.ts");
  const input = { ...base, batchEntries: [batch.newMake("tags")] };
  for (const [field, mapping, labels] of [["light", maps.LIGHT_PROMPTS, options.LIGHT_OPTIONS], ["mood", maps.MOOD_PROMPTS, options.MOOD_OPTIONS], ["props", maps.PROP_PROMPTS, options.PROP_OPTIONS]]) {
    assert.deepEqual(labels, Object.keys(mapping));
    for (const [label, phrase] of Object.entries(mapping)) {
      const [result] = buildGenerationPrompts({ ...input, [field]: field === "props" ? [label] : label });
      if (phrase) assert.ok(result.prompt.includes(phrase), label);
      else assert.ok(!result.prompt.includes("Requested styling changes:"));
    }
  }
  const [none] = buildGenerationPrompts({ ...input, props: ["소품 없음", "식물"] });
  assert.ok(none.prompt.includes(maps.PROP_PROMPTS["소품 없음"]));
  assert.ok(!none.prompt.includes(maps.PROP_PROMPTS["식물"]));
  store.setState({ props: ["식물", "러그"] });
  store.getState().toggleProp("소품 없음"); assert.deepEqual(store.getState().props, ["소품 없음"]);
  store.getState().toggleProp("커튼"); assert.deepEqual(store.getState().props, ["커튼"]);
  store.getState().toggleProp("소품 없음"); store.getState().toggleProp("소품 없음"); assert.deepEqual(store.getState().props, []);
});
check("Generated names use preset_purpose_composition or purpose_composition", () => {
  const entries = ["detail", "sns", "ad", "lookbook", "angle"].map(id => ({ id, kind: "preset", presetId: id, quantity: 1 }));
  const shots = createGenerationShots({ ...base, batchEntries: entries });
  assert.equal(shots.length, 20);
  assert.deepEqual(shots.slice(0, 4).map(shot => shot.label), ["상세페이지_일반_기본", "상세페이지_일반_사선", "상세페이지_일반_디테일", "상세페이지_일반_공간 포함"]);
  assert.equal(shots[4].label, "SNS_일반_기본");
  assert.equal(shots[8].label, "광고_배너_기본");
  assert.equal(shots[11].label, "룩북_일반_기본");
  assert.equal(shots[15].label, "앵글변주_일반_디테일");
  assert.equal(shots[19].label, "앵글변주_일반_공간 포함");
  const free = createGenerationShots({ ...base, batchEntries: [{ ...batch.newMake("named-free"), quantity: 2 }] });
  assert.deepEqual(free.map(shot => shot.label), ["일반_기본", "일반_기본"]);
  assert.equal(new Set(free.map(shot => shot.id)).size, 2);
});
check("Empty batch never falls back to an old content set", () => {
  assert.equal(buildGenerationPrompts({ ...base, contentSet: "detail", batchEntries: [] }).length, 0);
  assert.equal(createGenerationShots({ ...base, contentSet: "detail", batchEntries: [] }).length, 0);
  assert.equal(createGenerationShots({ ...base, contentSet: "ad" }).length, 3);
});
check("Expert controls, extra direction and reference editing remain effective", () => {
  const [result] = buildGenerationPrompts({ ...base, batchEntries: [batch.newMake("expert")], referenceImage: "/reference.jpg", editMode: "material", light: "노을빛", mood: "빈티지", props: ["러그"], prompt: "Keep the red cushion" });
  for (const fragment of ["material and color guidance", "golden-hour", "vintage retro", "a textured rug", "Keep the red cushion."]) assert.ok(result.prompt.includes(fragment), fragment);
});
check("Project switches preserve independent batches and quantities", () => {
  store.getState().setProjectContext("test-project-a");
  store.getState().clearEntries(); store.getState().addPreset("sns");
  const id = store.getState().batchEntries[0].id;
  store.getState().setEntryQuantity(id, 3);
  store.getState().setProjectContext("test-project-b");
  assert.equal(batch.getBatchCount(store.getState().batchEntries), 1);
  store.getState().setProjectContext("test-project-a");
  assert.equal(batch.getBatchCount(store.getState().batchEntries), 12);
  store.getState().setEntryQuantity(id, NaN); assert.equal(store.getState().batchEntries[0].quantity, 1);
  store.getState().setEntryQuantity(id, -5); assert.equal(store.getState().batchEntries[0].quantity, 1);
});
check("Navigation defaults to compact, expands and returns", () => {
  assert.equal(layout.getState().navigationCollapsed, true);
  layout.getState().toggleNavigation(); assert.equal(layout.getState().navigationCollapsed, false);
  layout.getState().toggleNavigation(); assert.equal(layout.getState().navigationCollapsed, true);
  assert.equal(layout.getState().settingsPanelWidth, 342);
});

(async () => {
  const requests = [];
  const { scheduleGeneration } = load("../system/create/generation-runner.ts");
  const started = [], releases = [];
  let active = 0, peak = 0;
  const tasks = Array.from({ length: 7 }, (_, index) => scheduleGeneration(async () => {
    started.push(index); active++; peak = Math.max(peak, active);
    try { await new Promise(resolve => { releases[index] = resolve; }); if (index === 1) throw new Error("expected failure"); }
    finally { active--; }
  }).catch(error => { assert.equal(error.message, "expected failure"); }));
  await new Promise(setImmediate);
  assert.deepEqual(started, [0, 1, 2, 3]);
  releases[1](); await new Promise(setImmediate);
  assert.deepEqual(started, [0, 1, 2, 3, 4]);
  releases[0](); await new Promise(setImmediate);
  assert.deepEqual(started, [0, 1, 2, 3, 4, 5]);
  releases[2](); await new Promise(setImmediate);
  assert.deepEqual(started, [0, 1, 2, 3, 4, 5, 6]);
  for (const index of [3, 4, 5, 6]) releases[index]();
  await Promise.all(tasks); assert.equal(peak, 4); assert.equal(active, 0);
  checks++; console.log("PASS Shared regeneration queue caps concurrency at four, starts FIFO and releases failed slots");
  const savedFetch = global.fetch;
  global.window = { setTimeout: callback => { callback(); return 0; } };
  global.fetch = async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ images: ["data:image/png;base64,test"], fidelityEvaluations: [{ status: "scored", score: 72.6, modelVersion: "test-v1" }], mock: true, note: "mock result" }) };
  };
  try {
    store.getState().setProjectContext(null);
    store.getState().clearEntries(); store.getState().addPreset("ad");
    const id = store.getState().batchEntries[0].id;
    store.getState().setEntryQuantity(id, 2);
    store.getState().setProductImage("data:image/png;base64,fixture");
    const [result, duplicate] = await Promise.all([store.getState().requestGeneration(true), store.getState().requestGeneration(true)]);
    assert.equal(duplicate.completed, 0);
    assert.equal(requests.length, 6); assert.equal(result.completed, 6);
    assert.ok(requests.every(request => request.mockMode === true));
    assert.equal(store.getState().selectedShotId, null);
    const [shot] = store.getState().generationShots;
    assert.deepEqual(shot.fidelity, { status: "scored", score: 72.6, modelVersion: "test-v1" });
    assert.equal(shot.metadata.generationSettings.batchEntries[0].quantity, 2);
    store.getState().selectShot(shot.id); assert.equal(store.getState().selectedShotId, shot.id);
    store.getState().toggleBookmark(shot.id); assert.equal(store.getState().generationShots[0].bookmarked, true);
    assert.equal(store.getState().generationPanelTab, "evaluation");
    const historyId = store.getState().activeHistoryId;
    const original = store.getState();
    const expected = Object.fromEntries(["batchEntries", "productImage", "referenceImage", "quality", "editMode", "light", "mood", "props", "prompt"].map(key => [key, structuredClone(original[key])]));
    store.setState({ batchEntries: [], productImage: "/different.jpg", referenceImage: "/other.jpg", quality: "high", editMode: "material", light: "different", mood: "different", props: ["different"], prompt: "different", generationPanelTab: "evaluation" });
    store.getState().restoreHistory(historyId);
    const restored = store.getState();
    for (const [key, value] of Object.entries(expected)) assert.deepEqual(restored[key], value, `history restores ${key}`);
    assert.equal(restored.generationPanelTab, "settings");
    assert.equal(restored.selectedShotId, null);
    assert.equal(restored.activeHistoryId, historyId);
    assert.ok(restored.generationShots.length);
    assert.deepEqual(restored.generationShots[0].fidelity, shot.fidelity);
    restored.batchEntries[0].quantity = 19;
    assert.notEqual(restored.generationHistory.find(h => h.id === historyId).shots[0].metadata.generationSettings.batchEntries[0].quantity, 19);
    restored.restoreHistory(historyId);
    checks++; console.log("PASS History restores inputs, batch quantities, expert settings and settings tab without mutating saved history");
    store.getState().reuseGenerationSettings(shot); assert.equal(batch.getBatchCount(store.getState().batchEntries), 6);
    checks++; console.log("PASS Mock requests, result selection, bookmarks, history and settings reuse");
    const run = store.getState().generationHistory.find(item => item.id === historyId);
    const failed = { ...run.shots[0], label: "Keep my name", status: "error", imageUrl: undefined, error: "failed" };
    const retryRun = { ...run, shots: [failed, ...run.shots.slice(1)] };
    store.setState({ activeHistoryId: historyId, generationHistory: [retryRun], generationShots: retryRun.shots, productImage: "different-current-product", quality: "high" });
    const beforeRequests = requests.length;
    await Promise.all([store.getState().retryShot(failed.id, true), store.getState().retryShot(failed.id, true)]);
    assert.equal(requests.length, beforeRequests + 1);
    assert.equal(requests.at(-1).prompt, failed.metadata.finalPrompt);
    assert.equal(requests.at(-1).productImage, failed.metadata.inputImages.find(image => image.kind === "product").imageUrl);
    assert.equal(requests.at(-1).quality, failed.metadata.generationSettings.quality);
    assert.equal(store.getState().generationShots[0].status, "done");
    assert.equal(store.getState().generationShots[0].label, "Keep my name");
    assert.deepEqual(store.getState().generationShots.slice(1), retryRun.shots.slice(1));
    assert.equal(store.getState().isGenerating, false);
    await store.getState().retryShot(failed.id, true);
    assert.equal(requests.length, beforeRequests + 1);
    global.fetch = async () => ({ ok: false, status: 503, json: async () => ({ error: "Retry failed" }) });
    store.setState({ generationHistory: [retryRun], generationShots: retryRun.shots });
    await store.getState().retryShot(failed.id, true);
    assert.equal(store.getState().generationShots[0].status, "error");
    assert.equal(store.getState().generationShots[0].error, "Retry failed");
    assert.equal(store.getState().isGenerating, false);
    checks++; console.log("PASS Retry only the failed image with original inputs/settings; preserve name/siblings, block duplicates and recover from failure");
    const successful = { ...failed, status: "done", imageUrl: "old-result" };
    const ready = { ...retryRun, shots: [successful, ...retryRun.shots.slice(1)] };
    store.setState({ generationHistory: [ready], generationShots: ready.shots });
    await store.getState().retryShot(successful.id, true, true);
    assert.equal(store.getState().generationShots[0].status, "done");
    assert.equal(store.getState().generationShots[0].imageUrl, "old-result");
    global.fetch = async () => ({ ok: true, json: async () => ({ images: ["new-result"], fidelityEvaluations: [{ status: "unavailable", reason: "evaluation offline" }], mock: true }) });
    await store.getState().retryShot(successful.id, true, true);
    assert.equal(store.getState().generationShots[0].imageUrl, "new-result");
    assert.deepEqual(store.getState().generationShots[0].fidelity, { status: "unavailable", reason: "evaluation offline" });
    assert.equal(store.getState().generationShots[0].label, successful.label);
    checks++; console.log("PASS Evaluation regeneration replaces a completed image on success and preserves it on failure");
    store.setState({ isGenerating: true, activeHistoryId: historyId });
    store.getState().clearStaging(); assert.equal(store.getState().activeHistoryId, null);
    store.getState().reuseGenerationSettings(successful); assert.equal(store.getState().productImage, successful.metadata.inputImages[0].imageUrl);
    store.getState().addMake(); const added = store.getState().batchEntries.at(-1);
    store.getState().updateMake(added.id, { ratio: "16:9" }); assert.equal(store.getState().batchEntries.at(-1).ratio, "16:9");
    store.getState().deleteHistory(historyId); assert.ok(!store.getState().generationHistory.some(item => item.id === historyId));
    assert.equal((await store.getState().requestGeneration(true)).completed, 0);
    store.setState({ isGenerating: false });
    checks++; console.log("PASS Editing, settings reuse, closing and history deletion remain available while generation submission stays locked");



  } finally { global.fetch = savedFetch; delete global.window; }
  console.log(`${checks} checks passed; no paid API requests`);
})().catch(error => { console.error(error); process.exitCode = 1; });
