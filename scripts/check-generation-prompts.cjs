/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS loader is needed to test TypeScript modules and the actual Zustand request path without a test framework. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveFilename(request, parent, ...rest) {
  return originalResolveFilename.call(
    this,
    request.startsWith("@/") ? path.join(root, request.slice(2)) : request,
    parent,
    ...rest,
  );
};
Module._extensions[".ts"] = function loadTypescript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const { buildGenerationPrompts } = require("../system/create/generation-prompt.ts");
const { buildKoreanPromptPreviews } = require("../system/create/generation-prompt-ko.ts");
const { getKoreanPromptForShot } = require("../system/create/generation-prompt-ko.ts");
const { createGenerationShots } = require("../system/create/generation-shots.ts");
const { getCutCount } = require("../system/create/generation-options.ts");
const { normalizeProductPreservation, normalizeReferenceStrength } = require("../system/create/reference-controls.ts");
const { runGenerationQueue, FREE_GENERATION_CONCURRENCY } = require("../system/create/generation-runner.ts");

const base = {
  referenceImage: "reference-photo",
  contentSet: "free",
  angleVariationIds: [],
  freeCount: 8,
  aspectRatio: "4:5",
  useSetRatios: false,
  quality: "medium",
  editMode: "swap",
  productPreservation: 100,
  referenceStrength: 50,
  referenceRole: "space",
  light: "아침 햇살",
  mood: "모던 미니멀",
  props: ["식물"],
  prompt: "Keep a calm campaign look",
};

assert.deepEqual([0, 20, 40, 70, 100].map(normalizeProductPreservation), [0, 0, 50, 50, 100]);
assert.deepEqual([0, 10, 40, 70, 100].map(normalizeReferenceStrength), [0, 25, 50, 50, 100]);

let combinations = 0;
for (const role of ["space", "style", "material"]) {
  for (const strength of [0, 25, 50, 100]) {
    for (const preservation of [0, 50, 100]) {
      for (const mode of ["free", "detail", "sns", "ad", "lookbook", "angle"]) {
        const input = {
          ...base,
          referenceRole: role,
          referenceStrength: strength,
          productPreservation: preservation,
          contentSet: mode === "angle" ? null : mode,
          angleVariationIds: mode === "angle" ? ["closeup", "reverse", "wide"] : [],
        };
        const shots = createGenerationShots(input);
        const prompts = buildGenerationPrompts(input);
        const koreanPrompts = buildKoreanPromptPreviews(input);
        if (mode === "angle") assert.equal(shots.length, 1, "angle mode accepts only the first selected angle");
        assert.equal(prompts.length, shots.length, `${role}/${strength}/${preservation}/${mode} count`);
        assert.deepEqual(prompts.map(item => item.id), shots.map(item => item.id));
        assert.deepEqual(Object.keys(koreanPrompts), shots.map(item => item.id), "each API prompt has a matching read-only translation");
        assert.equal(new Set(prompts.map(item => item.prompt)).size, prompts.length, "each cut needs a distinct prompt");
        for (const [index, prompt] of prompts.entries()) {
          assert.match(prompt.prompt, /first image|Image 1/i, "product source must be named");
          assert.match(prompt.prompt, /Final output aspect ratio: 4:5/, "requested ratio must be in prompt");
          if (strength === 0) assert.doesNotMatch(prompt.prompt, /Image 2|second image/i);
          if (strength > 0) assert.match(prompt.prompt, /Image 2/);
          assert.equal(shots[index].ratio, "4:5");
          assert.match(koreanPrompts[prompt.id], /최종 출력 비율은 4:5/);
          assert.match(koreanPrompts[prompt.id], /첫 번째 이미지/);
          if (strength === 0) assert.doesNotMatch(koreanPrompts[prompt.id], /두 번째 이미지는 참고 자료/);
          if (strength > 0) assert.match(koreanPrompts[prompt.id], /두 번째 이미지는 참고 자료/);
          if (role !== "space") assert.doesNotMatch(prompt.prompt, /same room geometry|original room geometry/i);
        }
        combinations += 1;
      }
    }
  }
}

const setRatios = { ...base, contentSet: "sns", useSetRatios: true };
const setShots = createGenerationShots(setRatios);
const setPrompts = buildGenerationPrompts(setRatios);
for (const [index, shot] of setShots.entries()) {
  assert.ok(setPrompts[index].prompt.includes(`Final output aspect ratio: ${shot.ratio}`));
}
for (const ratio of ["9:16", "2:3", "3:4", "4:5", "1:1", "5:4", "4:3", "3:2", "16:9"]) {
  for (const mode of ["free", "detail", "sns", "ad", "lookbook", "angle"]) {
    const input = {
      ...base,
      aspectRatio: ratio,
      contentSet: mode === "angle" ? null : mode,
      angleVariationIds: mode === "angle" ? ["reverse", "wide"] : [],
    };
    for (const prompt of buildGenerationPrompts(input)) {
      assert.ok(prompt.prompt.includes(`Final output aspect ratio: ${ratio}`), `${mode}/${ratio}`);
    }
  }
}
const noReferenceAngle = buildGenerationPrompts({
  ...base,
  referenceImage: null,
  contentSet: null,
  angleVariationIds: ["reverse"],
})[0].prompt;
assert.match(noReferenceAngle, /Image 1 is the product, not a room/);
assert.doesNotMatch(noReferenceAngle, /same room geometry|original room geometry/i);
assert.equal(getCutCount(null, 8, ["closeup", "reverse"]), 1, "multi-angle legacy input has one output cut");
assert.match(buildGenerationPrompts({ ...base, referenceRole: "material", referenceStrength: 100, productPreservation: 100 })[0].prompt, /product's original material and color remain unchanged/);

(async () => {
  const shots = createGenerationShots(base);
  let active = 0;
  let peak = 0;
  const requests = [];
  await runGenerationQueue(shots, FREE_GENERATION_CONCURRENCY, async shot => {
    active += 1;
    peak = Math.max(peak, active);
    requests.push(shot.id);
    await new Promise(resolve => setTimeout(resolve, 2));
    active -= 1;
  });
  assert.equal(requests.length, shots.length, "one request per distinct cut");
  assert.equal(new Set(requests).size, shots.length, "no duplicate calls");
  assert.ok(peak <= FREE_GENERATION_CONCURRENCY, "respect concurrency cap");
  assert.ok(peak > 1, "actually run concurrently");
  const { useCreateStore } = require("../stores/useCreateStore.ts");
  global.window = { setTimeout };
  const apiCalls = [];
  const originalFetch = global.fetch;
  global.fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    apiCalls.push(body);
    return Response.json({ mock: true, prompt: body.prompt, images: ["data:image/png;base64,dGVzdA=="], note: "test" });
  };
  try {
    const store = useCreateStore.getState();
    assert.equal(store.contentSet, null, "no generation mode selected by default");
    assert.deepEqual(store.angleVariationIds, []);
    store.setContentSet("free");
    assert.equal(useCreateStore.getState().contentSet, "free");
    store.setContentSet("free");
    assert.equal(useCreateStore.getState().contentSet, null, "reselecting a content set clears it");
    store.setContentSet("sns");
    store.toggleAngleVariation("reverse");
    assert.equal(useCreateStore.getState().contentSet, null, "angle replaces content set");
    assert.deepEqual(useCreateStore.getState().angleVariationIds, ["reverse"]);
    store.toggleAngleVariation("closeup");
    assert.deepEqual(useCreateStore.getState().angleVariationIds, ["closeup"], "angle choice is singular");
    store.setContentSet("detail");
    assert.deepEqual(useCreateStore.getState().angleVariationIds, [], "content set replaces angle");
    store.toggleAngleVariation("closeup");
    store.toggleAngleVariation("closeup");
    assert.deepEqual(useCreateStore.getState().angleVariationIds, [], "reselecting an angle clears it");
    store.setContentSet("free");
    store.setProductImage("data:image/png;base64,cHJvZHVjdA==");
    store.setReferenceImage("data:image/png;base64,cmVmZXJlbmNl");
    store.setFreeCount(8);
    store.setQuality("high");
    store.setAspectRatio("4:5");
    store.setReferenceStrength(0);
    const firstRun = await useCreateStore.getState().requestGeneration(true);
    assert.equal(firstRun.completed, 8);
    const savedShot = useCreateStore.getState().generationHistory[0].shots[0];
    assert.match(savedShot.metadata.koreanPrompt, /한국어|첫 번째 이미지/);
    assert.equal(getKoreanPromptForShot({
      ...savedShot,
      metadata: { ...savedShot.metadata, koreanPrompt: undefined },
    }), savedShot.metadata.koreanPrompt, "saved settings reconstruct translation for older history");
    assert.equal(apiCalls.length, 8, "one API call per distinct free cut");
    assert.equal(new Set(apiCalls.map(call => call.prompt)).size, 8);
    assert.ok(apiCalls.every(call => call.ratio === "4:5"));
    assert.ok(apiCalls.every(call => call.quality === "high"), "selected quality reaches the API");
    assert.ok(apiCalls.every(call => !JSON.stringify(call).includes("한국어 번역")), "read-only translation is not sent to the API");
    assert.ok(apiCalls.every(call => call.referenceImages.length === 0), "disabled reference omitted from API");
    useCreateStore.getState().setFreeCount(2);
    useCreateStore.getState().setReferenceStrength(50);
    useCreateStore.getState().setReferenceRole("style");
    const secondRun = await useCreateStore.getState().requestGeneration(true);
    assert.equal(secondRun.completed, 2);
    assert.equal(apiCalls.length, 10);
    assert.ok(apiCalls.slice(8).every(call => call.referenceImages.length === 1));
    assert.ok(apiCalls.slice(8).every(call => call.prompt.includes("lighting and palette")));
  } finally {
    global.fetch = originalFetch;
    delete global.window;
  }
  console.log(`PASS ${combinations} role/strength/preservation/mode combinations, 54 ratio/mode mappings, exclusive mode toggles, cut uniqueness, ${requests.length} queued calls (peak ${peak}), and 10 store-to-API calls`);
})().catch(error => { console.error(error); process.exitCode = 1; });
