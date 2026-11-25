import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { webcrypto } from "node:crypto";
const source = readFileSync(new URL("../system/projects/duplicate-project.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const compiled = { exports: {} };
vm.runInNewContext(`(function(module,exports){${outputText}\n})`, { crypto: webcrypto })(compiled, compiled.exports);
const { copyProjectData, duplicateProjectData } = compiled.exports;
const project = { id: "original-project", projectName: "Original", workType: "studio_cut", stage: "final", manager: "Manager", company: "Company", email: "example@example.com", deliveryDueDate: null, sourceCase: null };
const histories = [{ id: "original-history", projectId: project.id, version: 7, title: "History", shots: [{ id: "original-shot", imageUrl: "/api/assets/shared-image", bookmarked: true, metadata: { finalPrompt: "original prompt" } }] }];
const workspaces = { studio_cut: { activeHistoryId: "original-history", selectedShotId: "original-shot", selectedShotIds: ["original-shot"], generationShots: histories[0].shots, brandSelection: { id: "brand-id", version: 2 } }, detail_page: { step: "draft", tiles: [{ id: "tile-id", description: "existing description" }], requestDocument: { __cloudFile: true, url: "/api/assets/shared-document" } } };
const plain = value => JSON.parse(JSON.stringify(value));
test("copies all work data with independent history/shot IDs and keeps files and brand references", () => {
 const before = JSON.stringify({ histories, workspaces });
 let sequence = 0;
 const copy = copyProjectData("new-project", histories, workspaces, () => `new-${++sequence}`);
 assert.equal(copy.histories[0].projectId, "new-project");
 assert.equal(copy.histories[0].version, 0);
 assert.equal(copy.workspaces.studio_cut.activeHistoryId, copy.histories[0].id);
 assert.equal(copy.workspaces.studio_cut.selectedShotId, copy.histories[0].shots[0].id);
 assert.equal(copy.workspaces.studio_cut.selectedShotIds[0], copy.histories[0].shots[0].id);
 assert.notEqual(copy.histories[0].id, histories[0].id);
 assert.notEqual(copy.histories[0].shots[0].id, histories[0].shots[0].id);
 assert.equal(copy.histories[0].shots[0].imageUrl, histories[0].shots[0].imageUrl);
 assert.equal(copy.workspaces.studio_cut.brandSelection.id, "brand-id");
 assert.equal(copy.workspaces.detail_page.requestDocument.url, "/api/assets/shared-document");
 copy.workspaces.detail_page.tiles[0].description = "changed copy";
 copy.histories[0].shots[0].metadata.finalPrompt = "changed copy";
 assert.equal(JSON.stringify({ histories, workspaces }), before);
});
test("persists histories before workspace selections, preserves project fields and creates a copy name", async () => {
 const events = [];
 const result = await duplicateProjectData(project, histories, workspaces, {
   create: async (input, sourceCase) => { assert.equal(input.projectName, "Original (복사본)"); assert.equal(input.company, project.company); assert.equal(input.stage, "final"); assert.equal(sourceCase, null); return { ...project, ...input, id: "copy-project" }; },
   saveHistory: async history => events.push(["history", history.projectId]),
   saveWorkspace: async (kind, id) => events.push([kind, id]),
   removeProject: async () => assert.fail("successful copy must not delete"),
 });
 assert.equal(result.id, "copy-project");
 assert.deepEqual(events, [["history", "copy-project"], ["studio_cut", "copy-project"], ["detail_page", "copy-project"]]);
});
test("a failed copy hides the incomplete project, never the original", async () => {
 const removed = [];
 await assert.rejects(duplicateProjectData(project, histories, workspaces, {
   create: async () => ({ ...project, id: "incomplete-copy" }),
   saveHistory: async () => { throw new Error("save failed"); },
   saveWorkspace: async () => assert.fail("workspace cannot save after failed history"),
   removeProject: async id => removed.push(id),
 }), /save failed/);
 assert.deepEqual(removed, ["incomplete-copy"]);
});
test("empty projects copy without manufacturing histories or workspaces", async () => {
 const copy = copyProjectData("copy", [], { studio_cut: null, detail_page: null });
 assert.deepEqual(plain(copy), { histories: [], workspaces: { studio_cut: null, detail_page: null } });
});
