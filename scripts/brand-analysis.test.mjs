import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import ts from "typescript";
const require = createRequire(import.meta.url);
function load(file, imports, globals = {}) {
 const { outputText } = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
 const compiled = { exports: {} };
 vm.runInNewContext(`(function(require,module,exports){${outputText}\n})`, { Error, crypto: webcrypto, process: { env: {} }, AbortSignal, setTimeout: callback => { callback(); return 0; }, ...globals })(name => { assert.ok(name in imports, name); return imports[name]; }, compiled, compiled.exports);
 return compiled.exports;
}
const model = load("system/brand/brand-analysis.ts", { zod: require("zod") });
const result = { description: "차분한 저채도 색상과 밝은 톤이 어우러진 팔레트", palette: [{ hex: "#BDBAB3", name: "웜 그레이", description: "웜 그레이 계열의 색상", rgb: [189, 186, 179] }], saturation: { value: .04273, q25: .03782, q75: .06272, method: "median-of-image-medians" }, brightness: { value: .8, q25: .73039, q75: .82794 }, analyzed_image_count: 20, negative_comparison: { status: "insufficient_data", image_count: 0 } };
test("validates the supplied Python response and keeps palette names/description and S/V values", () => {
 const data = model.brandAnalysisSchema.parse({ brand_id: "brand", status: "ready", result, error: null });
 assert.equal(data.result.description, result.description); assert.equal(data.result.palette[0].name, "웜 그레이");
 assert.equal(model.analysisMeasure(data.result.saturation), .04273); assert.equal(model.analysisMeasure(data.result.brightness), .8);
 assert.equal(model.brandAnalysisSchema.safeParse({ status: "ready", result: null }).success, false);
 assert.equal(model.brandAnalysisSchema.safeParse({ status: "ready", result: { ...result, palette: [{ hex: "not a color" }] } }).success, false);
});
const id = "11111111-1111-4111-a111-111111111111";
function server(fetch, brands = [{ id }]) {
 const api = load("system/server/brand-analysis.ts", { "server-only": {}, zod: require("zod"), "./cloud-db": { CloudError: class extends Error {}, list: async () => brands }, "@/system/brand/brand-analysis": model }, { fetch });
 return api;
}
test("forwards manual submission without writing analysis to the database", async () => {
 const calls = [];
 const api = server(async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => ({ status: "queued", result: null }) }; });
 const data = await api.callBrandAnalysis(id, "manual");
 assert.equal(data.status, "queued"); assert.equal(calls.length, 1);
 assert.ok(calls[0].url.endsWith(`/${id}/analyze`));
 assert.equal(calls[0].options.method, "POST");
 assert.equal(calls[0].options.body, JSON.stringify({ trigger: "manual", max_colors: 5 }));
});
test("reads the completed Python response without altering result metadata", async () => {
 const api = server(async (url, options) => {
   assert.ok(url.endsWith(`/${id}`)); assert.equal(options.method, "GET"); assert.equal(options.cache, "no-store");
   return { ok: true, json: async () => ({ status: "ready", result }) };
 });
 assert.equal((await api.callBrandAnalysis(id)).result.negative_comparison.status, "insufficient_data");
});
test("rejects a brand outside the current workspace before contacting Python", async () => {
 const api = server(async () => assert.fail("must not call Python"), []);
 await assert.rejects(() => api.callBrandAnalysis(id), /브랜드를 찾을 수 없습니다/);
});
test("rejects malformed completion and upstream errors", async () => {
 await assert.rejects(() => server(async () => ({ ok: true, json: async () => ({ status: "ready", result: null }) })).callBrandAnalysis(id), /응답 형식/);
 await assert.rejects(() => server(async () => ({ ok: false, status: 503 })).callBrandAnalysis(id), /503/);
});
