// Offline contract checks. No API credentials or external requests are used.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = new URL("../", import.meta.url);

function loadModule(path, { env = {}, fetch, imports = {} } = {}) {
  const filename = fileURLToPath(new URL(path, root));
  const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    fileName: filename,
  }).outputText;
  const loadedModule = { exports: {} };
  vm.runInNewContext(compiled, {
    module: loadedModule,
    exports: loadedModule.exports,
    require: id => id in imports ? imports[id] : require(id),
    process: { env },
    fetch: fetch ?? (() => { throw new Error("Unexpected network access"); }),
    URL,
    AbortSignal,
  }, { filename });
  return loadedModule.exports;
}

const shared = loadModule("system/usage/organization-usage.ts");
function server(options = {}) {
  return loadModule("system/server/openai-usage.ts", {
    ...options,
    imports: { "@/system/usage/organization-usage": shared, "server-only": {} },
  });
}

const adminEnv = { OPENAI_ADMIN_KEY: "test-admin-key-never-return-this" };
const instant = day => Date.UTC(2024, 1, day) / 1000;
const bucket = (day, results) => ({ start_time: instant(day), end_time: instant(day + 1), results });
const page = (data, cursor = null) => ({ data, has_more: cursor !== null, next_page: cursor });
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const cost = value => ({ object: "organization.costs.result", amount: { value, currency: "usd" } });
const image = (images, requests) => ({ object: "organization.usage.images.result", images, num_model_requests: requests, model: "image-test" });
const completion = requests => ({ object: "organization.usage.completions.result", num_model_requests: requests, model: "text-test" });

let passed = 0;
async function check(name, run) {
  await run();
  passed += 1;
  console.log(`PASS ${name}`);
}

await check("missing admin configuration makes no upstream requests", async () => {
  let calls = 0;
  const api = server({ fetch: () => { calls += 1; } });
  await assert.rejects(api.readOrganizationUsage("2024-02"), error => error.code === "NOT_CONFIGURED");
  assert.equal(calls, 0);
});

await check("UTC leap month boundaries and invalid/future months", async () => {
  const api = server();
  const range = api.resolveUsageRange("2024-02", new Date("2024-03-10T10:00:00Z"));
  assert.equal(range.startTime, instant(1));
  assert.equal(range.endTime, Date.UTC(2024, 2, 1) / 1000);
  const current = api.resolveUsageRange("2024-02", new Date("2024-02-10T09:12:34Z"));
  assert.equal(current.endTime, Date.parse("2024-02-10T09:12:34Z") / 1000);
  for (const month of ["2024-13", "2024-00", "2019-12", "2024-03", "2024-2", "../settings"]) {
    assert.throws(() => api.resolveUsageRange(month, new Date("2024-02-15")), error => error.code === "INVALID_RANGE");
  }
});

await check("all pages are summed, project filters retained, requests deduplicated and cached", async () => {
  const calls = [];
  const api = server({
    env: { ...adminEnv, OPENAI_USAGE_PROJECT_IDS: "proj_b, proj_a,proj_a" },
    fetch: async (url, options) => {
      calls.push(url.toString());
      assert.equal(url.origin, "https://api.openai.com");
      assert.equal(options.headers.Authorization, `Bearer ${adminEnv.OPENAI_ADMIN_KEY}`);
      assert.equal(options.redirect, "error");
      assert.equal(options.cache, "no-store");
      assert.deepEqual(url.searchParams.getAll("project_ids[]"), ["proj_a", "proj_b"]);
      assert.equal(url.searchParams.get("limit"), "31");
      const next = url.searchParams.get("page");
      if (url.pathname.endsWith("/costs")) {
        return response(next ? page([bucket(2, [cost(0.04), cost(-0.01)])]) : page([bucket(1, [cost(0.06)])], "cost-page-2"));
      }
      assert.equal(url.searchParams.get("group_by[]"), "model");
      if (url.pathname.endsWith("/images")) {
        return response(next ? page([bucket(2, [image(3, 1)])]) : page([bucket(1, [image(2, 1)])], "image-page-2"));
      }
      return response(page([bucket(1, [completion(7)])]));
    },
  });
  const [first, concurrent] = await Promise.all([api.readOrganizationUsage("2024-02"), api.readOrganizationUsage("2024-02")]);
  assert.equal(first, concurrent);
  assert.ok(Math.abs(first.costUsd - 0.09) < 1e-10);
  assert.equal(first.images, 5);
  assert.equal(first.imageRequests, 2);
  assert.equal(first.completionRequests, 7);
  assert.equal(first.dailyCosts.length, 2);
  assert.equal(first.models.find(model => model.model === "image-test").images, 5);
  assert.equal(first.scope, "projects");
  assert.equal(first.warnings.length, 0);
  assert.equal(calls.length, 5);
  await api.readOrganizationUsage("2024-02");
  assert.equal(calls.length, 5);
  assert.equal(JSON.stringify(first).includes(adminEnv.OPENAI_ADMIN_KEY), false);
  assert.equal(JSON.stringify(first).toLowerCase().includes("token"), false);
});

await check("partial failure is null, not fake zero, while other totals remain available", async () => {
  const api = server({ env: adminEnv, fetch: async url => {
    if (url.pathname.endsWith("/images")) return response({ error: "sensitive upstream error" }, 403);
    if (url.pathname.endsWith("/costs")) return response(page([bucket(1, [cost(1.25)])]));
    return response(page([bucket(1, [completion(3)])]));
  } });
  const data = await api.readOrganizationUsage("2024-02");
  assert.equal(data.scope, "organization");
  assert.equal(data.costUsd, 1.25);
  assert.equal(data.images, null);
  assert.equal(data.imageRequests, null);
  assert.equal(data.completionRequests, 3);
  assert.equal(data.warnings[0].source, "images");
  assert.equal(data.warnings[0].code, "FORBIDDEN");
  assert.equal(JSON.stringify(data).includes("sensitive upstream error"), false);
});

await check("401, 403 and 429 are actionable and never expose upstream messages", async () => {
  for (const [status, code] of [[401, "INVALID_KEY"], [403, "FORBIDDEN"], [429, "RATE_LIMITED"]]) {
    const api = server({ env: adminEnv, fetch: async () => response({ error: adminEnv.OPENAI_ADMIN_KEY }, status) });
    let failure;
    try { await api.readOrganizationUsage("2024-02"); } catch (error) { failure = error; }
    const result = api.usageApiError(failure);
    assert.equal(result.body.code, code);
    assert.equal(JSON.stringify(result).includes(adminEnv.OPENAI_ADMIN_KEY), false);
    if (status === 429) assert.equal(result.status, 429);
  }
});

await check("broken pagination and malformed currency fail instead of returning partial totals", async () => {
  for (const broken of [page([bucket(1, [cost(2)])], "same-cursor"), page([bucket(1, [{ ...cost(2), amount: { value: 2, currency: "eur" } }])])]) {
    const api = server({ env: adminEnv, fetch: async url => url.pathname.endsWith("/costs") ? response(broken) : response(page([])) });
    const data = await api.readOrganizationUsage("2024-02");
    assert.equal(data.costUsd, null);
    assert.equal(data.dailyCosts.length, 0);
    assert.equal(data.warnings[0].source, "costs");
    assert.equal(data.images, 0);
  }
});

await check("usage route rejects unauthenticated requests and prevents HTTP caching", async () => {
  let calls = 0;
  const route = loadModule("app/api/usage/route.ts", { imports: {
    "next/server": { NextResponse: { json: (body, options) => ({ body, ...options }) } },
    "@/system/auth/session": { SESSION_COOKIE_NAME: "session", verifySessionToken: async value => value === "valid" },
    "@/system/server/openai-usage": { readOrganizationUsage: async month => { calls += 1; return { month }; } },
    "@/system/usage/organization-usage": shared,
  } });
  const request = value => ({ cookies: { get: () => ({ value }) }, nextUrl: new URL("http://localhost/api/usage?month=2024-02") });
  const denied = await route.GET(request("invalid"));
  assert.equal(denied.status, 401);
  assert.equal(calls, 0);
  const allowed = await route.GET(request("valid"));
  assert.equal(allowed.body.month, "2024-02");
  assert.equal(allowed.headers["Cache-Control"], "private, no-store");
  assert.equal(calls, 1);
});

await check("account screen has no local token store or token estimate output", async () => {
  const panel = readFileSync(new URL("components/account/api-usage-panel.tsx", root), "utf8");
  const workspace = readFileSync(new URL("components/account/account-workspace.tsx", root), "utf8");
  assert.equal(panel.includes("useTokenUsageStore"), false);
  assert.equal(workspace.includes("TokenUsagePanel"), false);
  assert.equal(panel.includes("/api/usage?month="), true);
  assert.equal(panel.includes("토큰"), false);
  assert.equal(panel.includes("OPENAI_ADMIN_KEY="), false);
});

console.log(`\n${passed} offline usage checks passed.`);
