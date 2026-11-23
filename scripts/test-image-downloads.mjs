// Run: node scripts/test-image-downloads.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, { createRequire } from 'node:module';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const file = new URL('../system/create/download-images.ts', import.meta.url);
const filePath = fileURLToPath(file);
const compiled = new Module(filePath);
compiled.filename = filePath;
compiled.paths = require.resolve.paths('fflate');
compiled._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, esModuleInterop: true } }).outputText, filePath);
const { downloadGenerationSet } = compiled.exports;
const { unzipSync } = require('fflate');
const clicks = [];
let archive, revoke;
global.document = { createElement: () => ({ href: '', download: '', click() { clicks.push({ href: this.href, name: this.download }); }, remove() {} }), body: { appendChild() {} } };
global.window = { setTimeout: fn => { revoke = fn; } };
const originalCreate = URL.createObjectURL, originalRevoke = URL.revokeObjectURL;
URL.createObjectURL = blob => { archive = blob; return 'blob:archive'; };
URL.revokeObjectURL = url => assert.equal(url, 'blob:archive');
try {
  const shots = [1, 2].map(id => ({ id: String(id), label: '상세페이지_일반_기본', status: 'done', imageUrl: `data:image/png;base64,${Buffer.from('image-' + id).toString('base64')}` }));
  await downloadGenerationSet([], 'test'); assert.equal(clicks.length, 0);
  await downloadGenerationSet([shots[0]], 'test'); assert.ok(clicks[0].name.endsWith('.png'));
  await downloadGenerationSet(shots, 'test'); assert.equal(clicks.length, 2); assert.equal(clicks[1].name, 'test.zip');
  const files = unzipSync(new Uint8Array(await archive.arrayBuffer()));
  assert.deepEqual(Object.keys(files), ['01_상세페이지_일반_기본.png', '02_상세페이지_일반_기본.png']);
  assert.equal(Buffer.from(Object.values(files)[0]).toString(), 'image-1');
  assert.equal(Buffer.from(Object.values(files)[1]).toString(), 'image-2');
  revoke();
  await assert.rejects(downloadGenerationSet([shots[0], { ...shots[1], imageUrl: 'data:invalid' }], 'test'));
  assert.equal(clicks.length, 2);
  console.log('PASS single image, ZIP roundtrip, Unicode/duplicate names, empty selection, fetch failure and object URL cleanup');
} finally { URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; }
